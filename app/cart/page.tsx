"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { QuantityStepper } from "@/components/QuantityStepper";

export default function CartPage() {
  const { items, removeItem, setQuantity, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <main className="min-w-0">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <Link href="/products" className="mb-6 inline-block text-sm text-neutral-400 transition hover:text-white">
            ← Назад в каталог
          </Link>
          <h1 className="mb-4 text-2xl font-bold">Корзина</h1>
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

  return (
    <main className="min-w-0">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link href="/products" className="mb-6 inline-block text-sm text-neutral-400 transition hover:text-white">
          ← Назад в каталог
        </Link>
        <h1 className="mb-6 text-2xl font-bold">Корзина</h1>

        <div className="flex flex-col divide-y divide-gray-200 border-y border-gray-200">
          {items.map((item) => (
            <div key={item.productId} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex items-center gap-4">
                <img src={item.photoUrl} alt={item.name} className="h-20 w-20 shrink-0 rounded object-cover" />
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.price.toLocaleString("ru-RU")} ₽</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 sm:ml-auto">
                <QuantityStepper
                  quantity={item.quantity}
                  onDecrement={() => setQuantity(item.productId, item.quantity - 1)}
                  onIncrement={() => setQuantity(item.productId, item.quantity + 1)}
                />
                <p className="text-right font-semibold sm:w-24">
                  {(item.price * item.quantity).toLocaleString("ru-RU")} ₽
                </p>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="text-sm text-gray-400 hover:text-red-600"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-xl font-bold">Итого: {totalPrice.toLocaleString("ru-RU")} ₽</p>
          <Link
            href="/checkout"
            className="rounded bg-red-800 px-6 py-2 font-medium text-white transition hover:bg-red-700"
          >
            Оформить заказ
          </Link>
        </div>
      </div>
    </main>
  );
}
