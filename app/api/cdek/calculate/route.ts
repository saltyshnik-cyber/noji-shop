import { NextResponse } from "next/server";
import { CdekApiError, CdekAuthError, cdekRequest } from "@/lib/cdek";

// TODO: уточнить у владельца магазина фактический город отправления и заменить заглушку
const DEFAULT_FROM_CITY = "Красноярск";

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

  const from_city = body.from_city || DEFAULT_FROM_CITY;

  try {
    const data = await cdekRequest<CdekTariffListResponse>("/calculator/tarifflist", {
      method: "POST",
      body: JSON.stringify({
        type: 1,
        from_location: { address: from_city },
        to_location: { address: to_city },
        packages: [{ weight, length, width, height }],
      }),
    });

    const tariffs = (data.tariff_codes ?? []).map((t) => ({
      tariffCode: t.tariff_code,
      name: t.tariff_name,
      description: t.tariff_description ?? null,
      price: t.delivery_sum,
      periodMinDays: t.period_min,
      periodMaxDays: t.period_max,
    }));

    if (tariffs.length === 0) {
      return NextResponse.json(
        { error: `Нет доступных тарифов СДЭК для маршрута «${from_city} → ${to_city}»` },
        { status: 400 },
      );
    }

    return NextResponse.json({ from_city, to_city, tariffs });
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
