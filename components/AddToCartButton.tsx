"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";

export function AddToCartButton({
  productId,
  name,
  price,
  photoUrl,
  inStock,
  compact = false,
}: {
  productId: number;
  name: string;
  price: number;
  photoUrl: string;
  inStock: boolean;
  compact?: boolean;
}) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!inStock) {
    return (
      <button
        type="button"
        disabled
        className="mt-2 w-fit cursor-not-allowed rounded bg-gray-300 px-6 py-2 font-medium text-white"
      >
        Нет в наличии
      </button>
    );
  }

  function changeQuantity(e: React.MouseEvent, delta: number) {
    e.preventDefault();
    e.stopPropagation();
    setQuantity((q) => Math.max(1, q + delta));
  }

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem({ productId, name, price, photoUrl }, quantity);
    setAdded(true);
    setQuantity(1);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className={`mt-2 flex items-center ${compact ? "gap-1.5" : "gap-2"}`}>
      <div className="flex items-center rounded border border-gray-300">
        <button
          type="button"
          onClick={(e) => changeQuantity(e, -1)}
          className={`${compact ? "px-2 py-1 text-sm" : "px-3 py-2"} text-gray-600 hover:bg-gray-100`}
          aria-label="Уменьшить количество"
        >
          −
        </button>
        <span className={`${compact ? "min-w-6 px-1 text-sm" : "min-w-8 px-2"} text-center`}>{quantity}</span>
        <button
          type="button"
          onClick={(e) => changeQuantity(e, 1)}
          className={`${compact ? "px-2 py-1 text-sm" : "px-3 py-2"} text-gray-600 hover:bg-gray-100`}
          aria-label="Увеличить количество"
        >
          +
        </button>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className={`rounded bg-amber-800 font-medium text-white transition hover:bg-amber-900 ${
          compact ? "px-4 py-1.5 text-sm" : "px-6 py-2"
        }`}
      >
        {added ? "Добавлено ✓" : "В корзину"}
      </button>
    </div>
  );
}
