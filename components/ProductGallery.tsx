"use client";

import { useState } from "react";

type GalleryItem = { url: string; type: "image" | "video" };

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export function ProductGallery({ images, alt }: { images: GalleryItem[]; alt: string }) {
  const [active, setActive] = useState(0);
  const safeActive = Math.min(active, Math.max(images.length - 1, 0));
  const activeItem = images[safeActive];

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-[4/5] w-full overflow-hidden rounded-lg border border-gray-200">
        {activeItem?.type === "video" ? (
          <video
            key={activeItem.url}
            src={activeItem.url}
            controls
            playsInline
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <img src={activeItem?.url} alt={alt} className="h-full w-full object-cover object-center" />
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded border-2 transition ${
                i === safeActive ? "border-red-800" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {item.type === "video" ? (
                <>
                  <video src={item.url} muted playsInline preload="metadata" className="h-full w-full object-cover object-center" />
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20 text-white">
                    <PlayIcon />
                  </span>
                </>
              ) : (
                <img src={item.url} alt="" className="h-full w-full object-cover object-center" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
