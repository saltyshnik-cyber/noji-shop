"use client";

let loadPromise: Promise<YmapsNamespace> | null = null;

export function loadYandexMaps(): Promise<YmapsNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Яндекс.Карты доступны только в браузере"));
  }
  if (window.ymaps?.Map) {
    return Promise.resolve(window.ymaps);
  }
  if (loadPromise) return loadPromise;

  const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;
  if (!apiKey) {
    loadPromise = null;
    return Promise.reject(new Error("Не задан NEXT_PUBLIC_YANDEX_MAPS_API_KEY"));
  }

  loadPromise = new Promise<YmapsNamespace>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`;
    script.async = true;
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Не удалось загрузить Яндекс.Карты"));
    };
    script.onload = () => {
      window.ymaps.ready(() => resolve(window.ymaps));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
