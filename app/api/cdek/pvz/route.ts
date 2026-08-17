import { NextResponse } from "next/server";
import { CdekApiError, CdekAuthError, cdekRequest } from "@/lib/cdek";

type CdekCity = { code: number; city: string; region?: string };

type CdekDeliveryPoint = {
  code: string;
  name?: string;
  location?: {
    city?: string;
    address?: string;
    address_full?: string;
    longitude?: number;
    latitude?: number;
  };
  phones?: { number: string }[];
  work_time?: string;
};

async function resolveCityCode(cityParam: string): Promise<number | null> {
  if (/^\d+$/.test(cityParam)) {
    return Number(cityParam);
  }

  const cities = await cdekRequest<CdekCity[]>(`/location/cities?city=${encodeURIComponent(cityParam)}&size=1`);
  return cities?.[0]?.code ?? null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");

  if (!city) {
    return NextResponse.json({ error: "Не передан параметр city" }, { status: 400 });
  }

  try {
    const cityCode = await resolveCityCode(city);
    if (!cityCode) {
      return NextResponse.json({ error: `Город «${city}» не найден в базе СДЭК` }, { status: 404 });
    }

    const points = await cdekRequest<CdekDeliveryPoint[]>(`/deliverypoints?city_code=${cityCode}`);

    const result = points.map((p) => ({
      code: p.code,
      name: p.name ?? null,
      address: p.location?.address_full ?? p.location?.address ?? null,
      phone: p.phones?.[0]?.number ?? null,
      workTime: p.work_time ?? null,
      coordinates:
        p.location?.latitude != null && p.location?.longitude != null
          ? { lat: p.location.latitude, lon: p.location.longitude }
          : null,
    }));

    return NextResponse.json({ cityCode, points: result });
  } catch (err) {
    if (err instanceof CdekAuthError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    if (err instanceof CdekApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status >= 400 && err.status < 500 ? 400 : 502 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Неизвестная ошибка при получении пунктов выдачи" },
      { status: 500 },
    );
  }
}
