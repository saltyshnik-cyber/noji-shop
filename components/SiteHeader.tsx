"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export function SiteHeader() {
  const { totalCount } = useCart();

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-neutral-800 bg-neutral-950">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex flex-col leading-none">
          <span className="text-xl font-black uppercase tracking-wide text-white">Ножи</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">для жизни</span>
        </Link>
        <Link href="/cart" className="text-sm font-medium text-neutral-300 hover:text-white hover:underline">
          Корзина{totalCount > 0 ? ` (${totalCount})` : ""}
        </Link>
      </div>
    </header>
  );
}
