"use client";

import { useCart } from "@/lib/cart-context";
import { QuantityStepper } from "@/components/QuantityStepper";

export function AddToCartButton({
  productId,
  name,
  price,
  photoUrl,
  stockQuantity,
  compact = false,
}: {
  productId: number;
  name: string;
  price: number;
  photoUrl: string;
  stockQuantity: number;
  compact?: boolean;
}) {
  const { items, addItem, setQuantity } = useCart();
  const quantity = items.find((i) => i.productId === productId)?.quantity ?? 0;

  if (stockQuantity <= 0) {
    return (
      <button
        type="button"
        disabled
        className="mt-2 w-fit cursor-not-allowed rounded bg-neutral-700 px-6 py-2 font-medium text-gray-300"
      >
        Нет в наличии
      </button>
    );
  }

  if (quantity === 0) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          addItem({ productId, name, price, photoUrl }, 1);
        }}
        className={`mt-2 w-fit rounded bg-red-800 font-medium text-white transition hover:bg-red-700 ${
          compact ? "px-4 py-1.5 text-sm" : "px-6 py-2"
        }`}
      >
        В корзину
      </button>
    );
  }

  return (
    <div
      className="mt-2 w-fit"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <QuantityStepper
        quantity={quantity}
        max={stockQuantity}
        onDecrement={() => setQuantity(productId, quantity - 1)}
        onIncrement={() => {
          if (quantity < stockQuantity) setQuantity(productId, quantity + 1);
        }}
        compact={compact}
      />
    </div>
  );
}
