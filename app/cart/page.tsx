"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { QuantityStepper } from "@/components/QuantityStepper";

export default function CartPage() {
  const { items, removeItem, setQuantity, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-4 text-2xl font-bold">Корзина</h1>
        <p className="text-gray-500">
          Корзина пуста.{" "}
          <Link href="/products" className="text-amber-800 hover:underline">
            Перейти в каталог
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Корзина</h1>

      <div className="flex flex-col divide-y divide-gray-200 border-y border-gray-200">
        {items.map((item) => (
          <div key={item.productId} className="flex items-center gap-4 py-4">
            <img src={item.photoUrl} alt={item.name} className="h-20 w-20 rounded object-cover" />
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-gray-500">{item.price.toLocaleString("ru-RU")} ₽</p>
            </div>
            <QuantityStepper
              quantity={item.quantity}
              onDecrement={() => setQuantity(item.productId, item.quantity - 1)}
              onIncrement={() => setQuantity(item.productId, item.quantity + 1)}
            />
            <p className="w-24 text-right font-semibold">
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
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-xl font-bold">Итого: {totalPrice.toLocaleString("ru-RU")} ₽</p>
        <Link
          href="/checkout"
          className="rounded bg-amber-800 px-6 py-2 font-medium text-white transition hover:bg-amber-900"
        >
          Оформить заказ
        </Link>
      </div>
    </main>
  );
}
