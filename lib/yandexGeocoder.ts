export async function geocodeAddress(query: string): Promise<{ lat: number; lon: number } | null> {
  const apiKey = process.env.NEXT_PUBLIC_YANDEX_GEOCODER_API_KEY;
  if (!apiKey) {
    throw new Error("Не задан NEXT_PUBLIC_YANDEX_GEOCODER_API_KEY");
  }

  const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${encodeURIComponent(apiKey)}&geocode=${encodeURIComponent(query)}&format=json&results=1`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Геокодер Яндекса вернул ошибку (HTTP ${res.status})`);
  }

  const json = await res.json();
  const members = json?.response?.GeoObjectCollection?.featureMember as
    | { GeoObject?: { Point?: { pos?: string } } }[]
    | undefined;
  const pos = members?.[0]?.GeoObject?.Point?.pos;
  if (!pos) return null;

  // Геокодер отдаёт координаты в порядке "долгота широта", в отличие от JS API карты.
  const [lonStr, latStr] = pos.split(" ");
  const lon = Number(lonStr);
  const lat = Number(latStr);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  return { lat, lon };
}
