"use client";

export function QuantityStepper({
  quantity,
  onDecrement,
  onIncrement,
  compact = false,
}: {
  quantity: number;
  onDecrement: () => void;
  onIncrement: () => void;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center rounded border border-gray-300">
      <button
        type="button"
        onClick={onDecrement}
        className={`${compact ? "px-2 py-1 text-sm" : "px-3 py-2"} text-gray-600 hover:bg-gray-100`}
        aria-label="Уменьшить количество"
      >
        −
      </button>
      <span className={`${compact ? "min-w-6 px-1 text-sm" : "min-w-8 px-2"} text-center`}>{quantity}</span>
      <button
        type="button"
        onClick={onIncrement}
        className={`${compact ? "px-2 py-1 text-sm" : "px-3 py-2"} text-gray-600 hover:bg-gray-100`}
        aria-label="Увеличить количество"
      >
        +
      </button>
    </div>
  );
}
