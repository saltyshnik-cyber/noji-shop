"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { QuantityStepper } from "@/components/QuantityStepper";

export const dynamic = "force-dynamic";

export default function CartPage() {
  const { items, removeItem, setQuantity, totalPrice } = useCart();
  const [stockById, setStockById] = useState<Record<number, number>>({});
  const [adjustedNotice, setAdjustedNotice] = useState<string | null>(null);

  const idsKey = items.map((i) => i.productId).join(",");

  // При каждом заходе в корзину сверяем реальные остатки — они могли
  // измениться (в том числе закончиться) с момента добавления в корзину.
  useEffect(() => {
    if (!idsKey) return;
    fetch(`/api/products/stock?ids=${idsKey}`)
      .then((res) => res.json())
      .then((data: { stock?: Record<string, number> }) => {
        const stock = data.stock ?? {};
        setStockById(Object.fromEntries(Object.entries(stock).map(([id, qty]) => [Number(id), qty])));
      })
      .catch(() => {
        // не удалось проверить остатки — не блокируем показ корзины,
        // финальную проверку всё равно сделает сервер при оформлении заказа
      });
  }, [idsKey]);

  // Подгоняем количества в корзине под свежие остатки: если товара стало
  // меньше (или он закончился), уменьшаем/убираем позицию и сообщаем об этом.
  useEffect(() => {
    if (Object.keys(stockById).length === 0) return;

    const messages: string[] = [];
    for (const item of items) {
      const available = stockById[item.productId];
      if (available === undefined) continue;
      if (available <= 0) {
        removeItem(item.productId);
        messages.push(`«${item.name}» закончился и удалён из корзины`);
      } else if (item.quantity > available) {
        setQuantity(item.productId, available);
        messages.push(`«${item.name}»: в наличии только ${available} шт, количество уменьшено`);
      }
    }
    if (messages.length > 0) setAdjustedNotice(messages.join(". "));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockById]);

  if (items.length === 0) {
    return (
      <main className="min-w-0">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <Link href="/products" className="mb-6 inline-block text-sm text-red-900 transition hover:text-red-700">
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
        <Link href="/products" className="mb-6 inline-block text-sm text-red-900 transition hover:text-red-700">
          ← Назад в каталог
        </Link>
        <h1 className="mb-6 text-2xl font-bold">Корзина</h1>

        {adjustedNotice && (
          <p className="mb-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {adjustedNotice}
          </p>
        )}

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
                  max={stockById[item.productId]}
                  onDecrement={() => setQuantity(item.productId, item.quantity - 1)}
                  onIncrement={() => {
                    const max = stockById[item.productId];
                    if (max === undefined || item.quantity < max) {
                      setQuantity(item.productId, item.quantity + 1);
                    }
                  }}
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
