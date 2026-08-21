export const ORDER_STATUSES = ["новый", "в обработке", "отправлен", "выполнен", "отменён"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["ожидает оплаты", "оплачен", "отменён"] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
