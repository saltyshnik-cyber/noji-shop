export {};

declare global {
  interface YmapsGeoObject {
    geometry: { getCoordinates: () => [number, number] };
  }

  interface YmapsGeocodeResult {
    geoObjects: {
      get: (index: number) => YmapsGeoObject | undefined;
      getLength: () => number;
    };
  }

  interface YmapsPlacemark {
    events: { add: (event: string, handler: (e: unknown) => void) => void };
  }

  interface YmapsMap {
    geoObjects: {
      add: (obj: YmapsPlacemark) => void;
      removeAll: () => void;
    };
    setBounds: (bounds: [[number, number], [number, number]], options?: Record<string, unknown>) => void;
    setCenter: (coords: [number, number], zoom?: number) => void;
    destroy: () => void;
  }

  interface YmapsNamespace {
    ready: (cb: () => void) => void;
    Map: new (container: HTMLElement, state: Record<string, unknown>) => YmapsMap;
    Placemark: new (
      coordinates: [number, number],
      properties?: Record<string, unknown>,
      options?: Record<string, unknown>,
    ) => YmapsPlacemark;
    geocode: (request: string, options?: Record<string, unknown>) => Promise<YmapsGeocodeResult>;
  }

  interface Window {
    ymaps: YmapsNamespace;
  }
}
