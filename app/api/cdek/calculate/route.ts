import { NextResponse } from "next/server";
import { CdekApiError, CdekAuthError, cdekRequest } from "@/lib/cdek";

// Город отправления — Ворсма, Нижегородская область (код города СДЭК, надёжнее строки с названием).
// ПВЗ, с которого магазин сдаёт посылки: VRS1 (понадобится при создании заказа/накладной в СДЭК).
const FROM_CITY_CODE = 1215;

type CalculateRequestBody = {
  from_city?: string;
  to_city?: string;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
};

type CdekTariff = {
  tariff_code: number;
  tariff_name: string;
  tariff_description?: string;
  delivery_sum: number;
  period_min: number;
  period_max: number;
};

type CdekTariffListResponse = {
  tariff_codes?: CdekTariff[];
  errors?: { code: string; message: string }[];
};

type Tariff = {
  tariffCode: number;
  name: string;
  description: string | null;
  price: number;
  periodMinDays: number;
  periodMaxDays: number;
  kind: "door" | "pvz";
};

// Исключаем дорогие быстрые тарифы (экспресс/магистральный экспресс/супер-экспресс)
// и постаматы — покупателю нужен только курьер до двери и самовывоз из ПВЗ.
const EXCLUDED_TARIFF_PATTERN = /экспресс|магистральный|постамат/i;

type RawTariff = Omit<Tariff, "kind">;

/**
 * Сводит десятки технических тарифов СДЭК к двум понятным вариантам:
 * самый дешёвый "до двери" и самый дешёвый "до ПВЗ" (склад как конечная точка).
 * Если какого-то варианта для города нет — просто не включаем его, без ошибки.
 */
function pickFriendlyTariffs(tariffs: RawTariff[]): Tariff[] {
  const eligible = tariffs.filter((t) => !EXCLUDED_TARIFF_PATTERN.test(t.name));

  const cheapest = (candidates: RawTariff[]) =>
    candidates.reduce<RawTariff | null>((best, t) => (best === null || t.price < best.price ? t : best), null);

  const result: Tariff[] = [];

  const doorTariff = cheapest(eligible.filter((t) => /дверь$/i.test(t.name.trim())));
  if (doorTariff) {
    result.push({ ...doorTariff, name: "Курьером до двери", kind: "door" });
  }

  const pvzTariff = cheapest(eligible.filter((t) => /склад$/i.test(t.name.trim())));
  if (pvzTariff) {
    result.push({ ...pvzTariff, name: "Самовывоз из пункта выдачи", kind: "pvz" });
  }

  return result;
}

export async function POST(request: Request) {
  let body: CalculateRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса, ожидается JSON" }, { status: 400 });
  }

  const { to_city, weight, length, width, height } = body;

  if (!to_city) {
    return NextResponse.json({ error: "Не передан город получателя (to_city)" }, { status: 400 });
  }
  if (!weight || weight <= 0) {
    return NextResponse.json({ error: "Не передан или некорректен вес (weight, в граммах)" }, { status: 400 });
  }
  if (!length || !width || !height) {
    return NextResponse.json(
      { error: "Не переданы габариты упаковки (length/width/height, в см)" },
      { status: 400 },
    );
  }

  // from_city в теле запроса — необязательный ручной override строкой (например, для отладки);
  // по умолчанию используется надёжный code, а не строка с названием города.
  const from_location = body.from_city ? { address: body.from_city } : { code: FROM_CITY_CODE };

  try {
    const data = await cdekRequest<CdekTariffListResponse>("/calculator/tarifflist", {
      method: "POST",
      body: JSON.stringify({
        type: 1,
        from_location,
        to_location: { address: to_city },
        packages: [{ weight, length, width, height }],
      }),
    });

    const allTariffs: RawTariff[] = (data.tariff_codes ?? []).map((t) => ({
      tariffCode: t.tariff_code,
      name: t.tariff_name,
      description: t.tariff_description ?? null,
      price: t.delivery_sum,
      periodMinDays: t.period_min,
      periodMaxDays: t.period_max,
    }));

    const tariffs = pickFriendlyTariffs(allTariffs);

    if (tariffs.length === 0) {
      return NextResponse.json(
        { error: `Нет доступных тарифов СДЭК для маршрута «Ворсма → ${to_city}»` },
        { status: 400 },
      );
    }

    return NextResponse.json({ from_city: body.from_city ?? "Ворсма", to_city, tariffs });
  } catch (err) {
    if (err instanceof CdekAuthError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    if (err instanceof CdekApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status >= 400 && err.status < 500 ? 400 : 502 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Неизвестная ошибка при расчёте доставки" },
      { status: 500 },
    );
  }
}
