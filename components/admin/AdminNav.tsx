"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/admin/orders", label: "Заказы" },
  { href: "/admin/products", label: "Товары" },
  { href: "/admin/settings", label: "Настройки" },
];

export default function AdminNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <nav className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-lg font-bold">Админка «Ножи для жизни»</span>
        <div className="flex gap-1">
          {LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded px-3 py-1.5 text-sm font-medium transition ${
                  active ? "bg-red-800 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className="text-sm text-gray-500 hover:text-red-600 disabled:opacity-40"
      >
        {loggingOut ? "Выходим…" : "Выйти"}
      </button>
    </nav>
  );
}
