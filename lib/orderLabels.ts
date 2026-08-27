export const ORDER_STATUSES = ["новый", "в обработке", "отправлен", "выполнен", "отменён"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Отображаемые названия статусов для покупателя (страница отслеживания) и
// админки — хранимое значение в БД (ORDER_STATUSES) не меняем, чтобы не
// трогать уже существующую логику фильтрации/вебхука оплаты.
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  "новый": "Принят",
  "в обработке": "В обработке",
  "отправлен": "Отправлен",
  "выполнен": "Доставлен",
  "отменён": "Отменён",
};

export const PAYMENT_STATUSES = ["ожидает оплаты", "оплачен", "отменён"] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
