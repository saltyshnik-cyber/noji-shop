"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart-context";

export function SiteHeader() {
  const { totalCount } = useCart();
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-neutral-800 bg-neutral-950">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex flex-col leading-none">
          <span className="text-2xl font-black uppercase tracking-wider text-white">Ножи</span>
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">для жизни</span>
        </Link>
        {isHome ? (
          <a
            href="#contacts"
            className="rounded border border-slate-500 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:border-white hover:text-white"
          >
            Контакты
          </a>
        ) : (
          <Link href="/cart" className="text-sm font-medium text-neutral-300 hover:text-white hover:underline">
            Корзина{totalCount > 0 ? ` (${totalCount})` : ""}
          </Link>
        )}
      </div>
    </header>
  );
}
