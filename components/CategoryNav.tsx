"use client";

import { useEffect, useState } from "react";
import { CATEGORY_SECTIONS } from "@/lib/categoryNav";

export function CategoryNav() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const elements = CATEGORY_SECTIONS.map((c) => document.getElementById(c.slug)).filter(
      (el): el is HTMLElement => el !== null,
    );

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-120px 0px -70% 0px", threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="sticky top-16 z-40 h-14 border-b border-neutral-800 bg-neutral-950">
      <div className="mx-auto flex h-full max-w-6xl items-center gap-2 overflow-x-auto px-4">
        {CATEGORY_SECTIONS.map((c) => {
          const isActive = active === c.slug;
          return (
            <a
              key={c.slug}
              href={`#${c.slug}`}
              className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                isActive
                  ? "border-amber-800 bg-amber-800 text-white"
                  : "border-neutral-600 text-neutral-200 hover:border-amber-800 hover:bg-amber-800 hover:text-white"
              }`}
            >
              {c.name}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
