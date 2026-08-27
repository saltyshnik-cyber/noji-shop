"use client";

import { useEffect, useState } from "react";
import type { PaymentStatus } from "@/lib/orderLabels";

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 20; // ~1 минута опроса, дальше просто оставляем текущий статус

export function OrderPaymentStatus({
  orderId,
  initialStatus,
}: {
  orderId: number;
  initialStatus: PaymentStatus;
}) {
  const [status, setStatus] = useState<PaymentStatus>(initialStatus);
  const [pollsLeft, setPollsLeft] = useState(MAX_POLLS);

  useEffect(() => {
    if (status !== "ожидает оплаты" || pollsLeft <= 0) return;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/payment-status`);
        if (res.ok) {
          const data = await res.json();
          setStatus(data.paymentStatus);
        }
      } catch {
        // сеть недоступна — просто попробуем ещё раз на следующем тике
      }
      setPollsLeft((n) => n - 1);
    }, POLL_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [status, pollsLeft, orderId]);

  if (status === "оплачен") {
    return (
      <div className="mb-6 rounded border border-green-800 bg-green-950/30 px-4 py-3 text-sm text-green-300">
        ✓ Оплата подтверждена
      </div>
    );
  }

  if (status === "отменён") {
    return (
      <div className="mb-6 rounded border border-red-800 bg-red-950/30 px-4 py-3 text-sm text-red-300">
        Оплата отменена. Если это ошибка — свяжитесь с нами.
      </div>
    );
  }

  return (
    <div className="mb-6 rounded border border-amber-800 bg-amber-950/30 px-4 py-3 text-sm text-amber-300">
      Спасибо за заказ! Оплата обрабатывается — статус обновится автоматически через несколько секунд.
    </div>
  );
}
