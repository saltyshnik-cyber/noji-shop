"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart-context";

export function SiteHeader() {
  const { totalCount } = useCart();
  const pathname = usePathname();
  const isHome = pathname === "/";

  const [shopName, setShopName] = useState("Ножи для жизни");
  const [shopSubtitle, setShopSubtitle] = useState("Мастерская Стрижова А.С.");

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.shopName) setShopName(data.shopName);
        if (data.shopSubtitle) setShopSubtitle(data.shopSubtitle);
      })
      .catch(() => {
        // не удалось получить настройки — остаёмся с дефолтными значениями
      });
  }, []);

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-neutral-800 bg-neutral-950">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex flex-col leading-none">
          <span className="text-lg font-black uppercase tracking-wide text-white sm:text-2xl sm:tracking-wider">
            {shopName}
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400 sm:text-xs sm:tracking-[0.3em]">
            {shopSubtitle}
          </span>
        </Link>
        {isHome ? (
          <a
            href="#contacts"
            className="rounded border border-slate-500 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:border-white hover:text-white"
          >
            Контакты
          </a>
        ) : (
          <Link
            href="/cart"
            className="rounded border border-slate-500 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:border-white hover:text-white"
          >
            Корзина{totalCount > 0 ? ` (${totalCount})` : ""}
          </Link>
        )}
      </div>
    </header>
  );
}
