"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";

export function AddToCartButton({
  productId,
  name,
  price,
  photoUrl,
  inStock,
}: {
  productId: number;
  name: string;
  price: number;
  photoUrl: string;
  inStock: boolean;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      disabled={!inStock}
      onClick={() => {
        addItem({ productId, name, price, photoUrl });
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
      }}
      className="mt-2 w-fit rounded bg-amber-800 px-6 py-2 font-medium text-white transition hover:bg-amber-900 disabled:cursor-not-allowed disabled:bg-gray-300"
    >
      {!inStock ? "Нет в наличии" : added ? "Добавлено ✓" : "В корзину"}
    </button>
  );
}
