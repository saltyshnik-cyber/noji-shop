"use client";

import { useEffect, useState } from "react";

type RowInfo = {
  name: string;
  scrollWidth: number;
  clientWidth: number;
  overflow: boolean;
};

type ChainLink = {
  label: string;
  width: number | null;
};

type DebugState = {
  innerWidth: number;
  htmlScrollWidth: number;
  bodyScrollWidth: number;
  bodyOverflowX: string;
  categoryNav: RowInfo | null;
  carousels: RowInfo[];
  chain: ChainLink[];
};

function widthOf(el: Element | null): number | null {
  if (!el) return null;
  return Math.round(el.getBoundingClientRect().width);
}

function collect(): DebugState {
  const navRow = document.querySelector<HTMLElement>('[data-debug-row="category-nav"]');
  const carouselRows = [...document.querySelectorAll<HTMLElement>('[data-debug-row="carousel"]')];

  const header = document.querySelector("header");
  const nav = document.querySelector("nav");
  const main = document.querySelector("main");
  const sectionsWrapper = main?.querySelector(":scope > div") ?? null;
  const firstSection = document.querySelector("section");
  const firstCarousel = document.querySelector('[data-debug-row="carousel"]');
  const firstCard = firstCarousel?.querySelector(":scope > div") ?? null;

  const chain: ChainLink[] = [
    { label: "html", width: widthOf(document.documentElement) },
    { label: "body", width: widthOf(document.body) },
    { label: "header", width: widthOf(header) },
    { label: "nav (CategoryNav)", width: widthOf(nav) },
    { label: "main", width: widthOf(main) },
    { label: "main > div (секции, flex-col)", width: widthOf(sectionsWrapper) },
    { label: "section (первая)", width: widthOf(firstSection) },
    { label: "карусель (первая)", width: widthOf(firstCarousel) },
    { label: "карточка-обёртка (первая, w-64 ожидается)", width: widthOf(firstCard) },
  ];

  return {
    innerWidth: window.innerWidth,
    htmlScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    bodyOverflowX: getComputedStyle(document.body).overflowX,
    categoryNav: navRow
      ? {
          name: "CategoryNav",
          scrollWidth: navRow.scrollWidth,
          clientWidth: navRow.clientWidth,
          overflow: navRow.scrollWidth > navRow.clientWidth,
        }
      : null,
    carousels: carouselRows.map((el) => ({
      name: el.dataset.debugName ?? "?",
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      overflow: el.scrollWidth > el.clientWidth,
    })),
    chain,
  };
}

export function DebugOverlay() {
  const [state, setState] = useState<DebugState | null>(null);

  useEffect(() => {
    function update() {
      setState(collect());
    }

    update();
    const interval = setInterval(update, 250);
    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("scroll", update, { passive: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
    };
  }, []);

  if (!state) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] max-h-[60vh] overflow-y-auto border-t-2 border-red-500 bg-black/95 p-2 font-mono text-[10px] leading-tight text-lime-300">
      <div className="text-yellow-300">
        window.innerWidth: <b>{state.innerWidth}</b> | html.scrollWidth: <b>{state.htmlScrollWidth}</b> |
        body.scrollWidth: <b>{state.bodyScrollWidth}</b> | body overflow-x: <b>{state.bodyOverflowX}</b>
      </div>
      {state.htmlScrollWidth > state.innerWidth && (
        <div className="font-bold text-red-500">⚠ html.scrollWidth &gt; innerWidth — СТРАНИЦА ШИРЕ ЭКРАНА</div>
      )}

      <div className="mt-1 text-orange-300">— Ширина по цепочке предков (getBoundingClientRect) —</div>
      {state.chain.map((c, i) => {
        const suspicious = c.width != null && c.width > state.innerWidth;
        return (
          <div key={i} className={suspicious ? "font-bold text-red-500" : ""}>
            {c.label}: {c.width ?? "нет элемента"}px{suspicious ? " ⚠ ШИРЕ ЭКРАНА" : ""}
          </div>
        );
      })}

      <div className="mt-1 text-orange-300">— overflow-x-auto контейнеры —</div>
      {state.categoryNav && (
        <div className={state.categoryNav.overflow ? "text-cyan-300" : ""}>
          CategoryNav: scrollWidth={state.categoryNav.scrollWidth} clientWidth={state.categoryNav.clientWidth}{" "}
          {state.categoryNav.overflow ? "(есть переполнение)" : "(без переполнения)"}
        </div>
      )}
      {state.carousels.map((c, i) => (
        <div key={i} className={c.overflow ? "text-cyan-300" : ""}>
          Карусель «{c.name}»: scrollWidth={c.scrollWidth} clientWidth={c.clientWidth}{" "}
          {c.overflow ? "(есть переполнение)" : "(без переполнения)"}
        </div>
      ))}
    </div>
  );
}
