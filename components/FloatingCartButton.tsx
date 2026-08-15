"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export function FloatingCartButton() {
  const { totalCount } = useCart();

  if (totalCount === 0) return null;

  return (
    <Link
      href="/cart"
      aria-label={`Корзина, товаров: ${totalCount}`}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-red-800 text-white shadow-lg shadow-black/40 transition hover:bg-red-700"
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="20" r="1.4" />
        <circle cx="17" cy="20" r="1.4" />
        <path d="M2.5 3h2l2.2 11.2a2 2 0 002 1.6h7.6a2 2 0 002-1.6L20 7H5.2" />
      </svg>
      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1 text-xs font-bold text-neutral-900">
        {totalCount}
      </span>
    </Link>
  );
}
