"use client";

import { useState } from "react";

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const safeActive = Math.min(active, Math.max(images.length - 1, 0));

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-[4/5] w-full overflow-hidden rounded-lg border border-gray-200">
        <img src={images[safeActive]} alt={alt} className="h-full w-full object-cover object-center" />
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded border-2 transition ${
                i === safeActive ? "border-red-800" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img src={src} alt="" className="h-full w-full object-cover object-center" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
