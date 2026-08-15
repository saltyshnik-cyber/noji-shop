"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { isBlank, isValidEmail, isValidPhone } from "@/lib/validation";

export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clear } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ customerName?: string; phone?: string; email?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (items.length === 0) {
    return (
      <main className="min-w-0">
        <div className="mx-auto max-w-xl px-4 py-10">
          <h1 className="mb-4 text-2xl font-bold">Оформление заказа</h1>
          <p className="text-gray-500">
            Корзина пуста.{" "}
            <Link href="/products" className="text-red-600 hover:underline">
              Перейти в каталог
            </Link>
          </p>
        </div>
      </main>
    );
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (isBlank(customerName)) next.customerName = "Введите имя";
    if (!isValidPhone(phone)) next.phone = "Формат: +7XXXXXXXXXX";
    if (email && !isValidEmail(email)) next.email = "Некорректный email";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          phone,
          email: email || undefined,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Не удалось оформить заказ");
        return;
      }
      clear();
      router.push(`/order/${data.orderId}`);
    } catch {
      setSubmitError("Не удалось оформить заказ. Проверьте соединение и попробуйте ещё раз.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-w-0">
      <div className="mx-auto max-w-xl px-4 py-10">
        <h1 className="mb-6 text-2xl font-bold">Оформление заказа</h1>

        <div className="mb-6 rounded border border-gray-200 p-4">
          {items.map((item) => (
            <div key={item.productId} className="flex justify-between py-1 text-sm">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span>{(item.price * item.quantity).toLocaleString("ru-RU")} ₽</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 font-bold">
            <span>Итого</span>
            <span>{totalPrice.toLocaleString("ru-RU")} ₽</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="customerName">
              Имя
            </label>
            <input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
            {errors.customerName && <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="phone">
              Телефон
            </label>
            <input
              id="phone"
              placeholder="+79991234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="email">
              Email (необязательно)
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded bg-red-800 px-6 py-2 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {submitting ? "Отправка…" : "Подтвердить заказ"}
          </button>
        </form>
      </div>
    </main>
  );
}
