"use client";

import { useEffect, useRef, useState } from "react";
import { loadYandexMaps } from "@/lib/yandexMapsLoader";
import { geocodeAddress } from "@/lib/yandexGeocoder";
import { haversineKm } from "@/lib/geo";
import type { CdekPvz } from "@/lib/cdekTypes";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const SELECTED_COLOR = "#991b1b";
const DEFAULT_COLOR = "#9ca3af";

export function PvzSelector({
  city,
  points,
  selectedCode,
  onSelect,
}: {
  city: string;
  points: CdekPvz[];
  selectedCode: string | null;
  onSelect: (pvz: CdekPvz) => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<YmapsMap | null>(null);
  const pointsRef = useRef(points);
  const selectedCodeRef = useRef(selectedCode);
  const onSelectRef = useRef(onSelect);
  pointsRef.current = points;
  selectedCodeRef.current = selectedCode;
  onSelectRef.current = onSelect;

  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const [addressQuery, setAddressQuery] = useState("");
  const [geocodedCenter, setGeocodedCenter] = useState<{ lat: number; lon: number } | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  // Инициализация карты один раз при монтировании.
  useEffect(() => {
    let cancelled = false;
    const container = mapContainerRef.current;

    function handleContainerClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const btn = target.closest("[data-pvz-code]") as HTMLElement | null;
      if (!btn) return;
      const code = btn.getAttribute("data-pvz-code");
      const pvz = pointsRef.current.find((p) => p.code === code);
      if (pvz) onSelectRef.current(pvz);
    }

    loadYandexMaps()
      .then((ymaps) => {
        if (cancelled || !container) return;
        const map = new ymaps.Map(container, {
          center: [55.751244, 37.618423],
          zoom: 10,
          controls: ["zoomControl"],
        });
        mapRef.current = map;
        container.addEventListener("click", handleContainerClick);
        setMapReady(true);
      })
      .catch((err) => {
        setMapError(err instanceof Error ? err.message : "Не удалось загрузить карту");
      });

    return () => {
      cancelled = true;
      container?.removeEventListener("click", handleContainerClick);
      mapRef.current?.destroy();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Перерисовка меток при смене списка ПВЗ или выбранного пункта.
  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.ymaps) return;
    const ymaps = window.ymaps;
    const map = mapRef.current;
    map.geoObjects.removeAll();

    const withCoords = points.filter((p): p is CdekPvz & { coordinates: { lat: number; lon: number } } =>
      Boolean(p.coordinates),
    );

    for (const p of withCoords) {
      const isSelected = p.code === selectedCode;
      const placemark = new ymaps.Placemark(
        [p.coordinates.lat, p.coordinates.lon],
        {
          balloonContentBody: `
            <div style="max-width:220px;">
              <div style="font-weight:600;margin-bottom:4px;">${escapeHtml(p.address ?? "Пункт выдачи")}</div>
              ${
                p.workTime
                  ? `<div style="font-size:12px;color:#666;margin-bottom:8px;">${escapeHtml(p.workTime)}</div>`
                  : ""
              }
              <button type="button" data-pvz-code="${escapeHtml(p.code)}" style="background:${SELECTED_COLOR};color:#fff;border:none;border-radius:4px;padding:6px 10px;font-size:13px;cursor:pointer;">Выбрать этот пункт</button>
            </div>
          `,
        },
        {
          preset: "islands#dotIcon",
          iconColor: isSelected ? SELECTED_COLOR : DEFAULT_COLOR,
        },
      );
      map.geoObjects.add(placemark);
    }

    if (withCoords.length > 0) {
      const lats = withCoords.map((p) => p.coordinates.lat);
      const lons = withCoords.map((p) => p.coordinates.lon);
      map.setBounds(
        [
          [Math.min(...lats), Math.min(...lons)],
          [Math.max(...lats), Math.max(...lons)],
        ],
        { checkZoomRange: true, zoomMargin: 30 },
      );
    }
  }, [mapReady, points, selectedCode]);

  async function handleGeocodeBlur() {
    const query = addressQuery.trim();
    if (!query) {
      setGeocodedCenter(null);
      setGeocodeError(null);
      return;
    }
    setGeocoding(true);
    setGeocodeError(null);
    try {
      const coords = await geocodeAddress(`${city}, ${query}`);
      if (!coords) {
        setGeocodeError("Не удалось найти этот адрес");
        setGeocodedCenter(null);
        return;
      }
      setGeocodedCenter(coords);
    } catch {
      setGeocodeError("Не удалось определить координаты адреса");
      setGeocodedCenter(null);
    } finally {
      setGeocoding(false);
    }
  }

  const distanceByCode = new Map<string, number>();
  if (geocodedCenter) {
    for (const p of points) {
      if (p.coordinates) distanceByCode.set(p.code, haversineKm(geocodedCenter, p.coordinates));
    }
  }

  const sortedPoints = geocodedCenter
    ? [...points].sort((a, b) => {
        const da = distanceByCode.get(a.code) ?? Infinity;
        const db = distanceByCode.get(b.code) ?? Infinity;
        return da - db;
      })
    : points;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600" htmlFor="pvzAddress">
          Ваш адрес или ориентир (необязательно — покажем ближайшие пункты выше)
        </label>
        <input
          id="pvzAddress"
          placeholder="Улица, район, ориентир"
          value={addressQuery}
          onChange={(e) => setAddressQuery(e.target.value)}
          onBlur={handleGeocodeBlur}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />
        {geocoding && <p className="mt-1 text-xs text-gray-500">Ищем координаты адреса…</p>}
        {geocodeError && <p className="mt-1 text-xs text-red-600">{geocodeError}</p>}
      </div>

      <div
        ref={mapContainerRef}
        className="h-64 w-full overflow-hidden rounded border border-gray-300 sm:h-80"
      />
      {mapError && <p className="text-xs text-red-600">{mapError}</p>}

      <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
        {sortedPoints.map((p) => {
          const distance = distanceByCode.get(p.code);
          return (
            <label
              key={p.code}
              className="flex cursor-pointer items-start gap-2 rounded border border-gray-300 px-3 py-2 text-sm transition has-[:checked]:border-red-600 has-[:checked]:bg-red-50"
            >
              <input
                type="radio"
                name="pvz"
                className="mt-1"
                checked={selectedCode === p.code}
                onChange={() => onSelect(p)}
              />
              <span>
                <span className="block">
                  {p.address}
                  {distance != null && <span className="text-gray-500"> · ≈{distance.toFixed(1)} км</span>}
                </span>
                {p.workTime && <span className="block text-xs text-gray-500">{p.workTime}</span>}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
