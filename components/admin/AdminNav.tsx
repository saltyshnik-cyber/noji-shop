"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminNav() {
  const router = useRouter();
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
    <nav className="flex items-center justify-between border-b border-gray-200 pb-4">
      <span className="text-lg font-bold">Админка «Ножи для жизни»</span>
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
