"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export function SiteHeader() {
  const { totalCount } = useCart();

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
        <Link href="/products" className="text-lg font-bold">
          Knife Shop
        </Link>
        <Link href="/cart" className="text-sm font-medium hover:underline">
          Корзина{totalCount > 0 ? ` (${totalCount})` : ""}
        </Link>
      </div>
    </header>
  );
}
