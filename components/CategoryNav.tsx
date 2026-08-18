"use client";

import { useEffect, useState } from "react";

const STICKY_OFFSET = 130;

type CategorySection = { name: string; slug: string };

export function CategoryNav({ sections }: { sections: CategorySection[] }) {
  const [active, setActive] = useState<string>(sections[0]?.slug ?? "");

  useEffect(() => {
    const visibleSections = sections
      .map((c) => ({ slug: c.slug, el: document.getElementById(c.slug) }))
      .filter((s) => s.el !== null) as { slug: string; el: HTMLElement }[];

    if (visibleSections.length === 0) return;

    let ticking = false;

    function updateActive() {
      ticking = false;

      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom) {
        setActive(visibleSections[visibleSections.length - 1].slug);
        return;
      }

      let current = visibleSections[0].slug;
      for (const s of visibleSections) {
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
  }, [sections]);

  if (sections.length === 0) return null;

  return (
    <nav className="sticky top-16 z-40 h-14 min-w-0 border-b border-neutral-800 bg-neutral-950">
      <div className="mx-auto flex h-full max-w-6xl items-center gap-2 overflow-x-auto px-4">
        {sections.map((c) => {
          const isActive = active === c.slug;
          return (
            <a
              key={c.slug}
              href={`#${c.slug}`}
              className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                isActive
                  ? "border-red-800 bg-red-800 text-white"
                  : "border-neutral-600 text-neutral-200 hover:border-red-800 hover:bg-red-800 hover:text-white"
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
