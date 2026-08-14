"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/orderLabels";

export default function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: number;
  status: OrderStatus;
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  async function handleChange(next: OrderStatus) {
    setIsSaving(true);
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <select
      value={status}
      disabled={isSaving}
      onChange={(e) => handleChange(e.target.value as OrderStatus)}
      className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-amber-800 disabled:opacity-50"
    >
      {ORDER_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
