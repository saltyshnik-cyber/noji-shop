"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isBlank, isValidPhone } from "@/lib/validation";

export default function TrackOrderPage() {
  const router = useRouter();

  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ orderId?: string; phone?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const phoneInputRef = useRef<HTMLInputElement>(null);

  function handlePhoneFocus() {
    if (phone !== "") return;
    setPhone("+7");
    // Курсор нужно проставить после того, как React применит новое value.
    requestAnimationFrame(() => {
      phoneInputRef.current?.setSelectionRange(2, 2);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const next: typeof errors = {};
    if (isBlank(orderId) || !/^\d+$/.test(orderId.trim())) next.orderId = "Введите номер заказа";
    if (!isValidPhone(phone)) next.phone = "Формат: +7XXXXXXXXXX";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderId.trim(), phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Заказ не найден, проверьте номер и телефон");
        return;
      }
      router.push(`/order/${data.orderId}`);
    } catch {
      setSubmitError("Не удалось выполнить поиск. Проверьте соединение и попробуйте ещё раз.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-w-0">
      <div className="mx-auto max-w-md px-4 py-10">
        <h1 className="mb-2 text-2xl font-bold">Отследить заказ</h1>
        <p className="mb-6 text-gray-500">Введите номер заказа и телефон, указанный при оформлении.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="orderId">
              Номер заказа
            </label>
            <input
              id="orderId"
              placeholder="Например, 42"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
            {errors.orderId && <p className="mt-1 text-sm text-red-600">{errors.orderId}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="phone">
              Телефон
            </label>
            <input
              id="phone"
              ref={phoneInputRef}
              placeholder="+79991234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onFocus={handlePhoneFocus}
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
          </div>

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded bg-red-800 px-6 py-2 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {submitting ? "Поиск…" : "Найти заказ"}
          </button>
        </form>
      </div>
    </main>
  );
}
