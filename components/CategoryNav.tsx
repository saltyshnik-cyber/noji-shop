"use client";

import { useEffect, useState } from "react";
import { CATEGORY_SECTIONS } from "@/lib/categoryNav";

const STICKY_OFFSET = 130;

export function CategoryNav() {
  const [active, setActive] = useState<string>(CATEGORY_SECTIONS[0].slug);

  useEffect(() => {
    const sections = CATEGORY_SECTIONS.map((c) => ({ slug: c.slug, el: document.getElementById(c.slug) })).filter(
      (s) => s.el !== null,
    ) as { slug: string; el: HTMLElement }[];

    if (sections.length === 0) return;

    let ticking = false;

    function updateActive() {
      ticking = false;

      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom) {
        setActive(sections[sections.length - 1].slug);
        return;
      }

      let current = sections[0].slug;
      for (const s of sections) {
        if (s.el.getBoundingClientRect().top <= STICKY_OFFSET) {
          current = s.slug;
        }
      }
      setActive(current);
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateActive);
    }

    updateActive();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="sticky top-16 z-40 h-14 min-w-0 border-b border-neutral-800 bg-neutral-950">
      <div
        data-debug-row="category-nav"
        className="mx-auto flex h-full max-w-6xl items-center gap-2 overflow-x-auto px-4"
      >
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
