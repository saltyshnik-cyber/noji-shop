"use client";

export function QuantityStepper({
  quantity,
  onDecrement,
  onIncrement,
  compact = false,
  max,
}: {
  quantity: number;
  onDecrement: () => void;
  onIncrement: () => void;
  compact?: boolean;
  max?: number;
}) {
  const atMax = max !== undefined && quantity >= max;

  return (
    <div className="flex items-center rounded border border-neutral-600">
      <button
        type="button"
        onClick={onDecrement}
        className={`${compact ? "px-2 py-1 text-sm" : "px-3 py-2"} text-gray-200 hover:bg-neutral-800`}
        aria-label="Уменьшить количество"
      >
        −
      </button>
      <span className={`${compact ? "min-w-6 px-1 text-sm" : "min-w-8 px-2"} text-center text-white`}>
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={atMax}
        className={`${compact ? "px-2 py-1 text-sm" : "px-3 py-2"} text-gray-200 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent`}
        aria-label="Увеличить количество"
        title={atMax ? "Больше нет в наличии" : undefined}
      >
        +
      </button>
    </div>
  );
}
