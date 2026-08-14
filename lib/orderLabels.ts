export const ORDER_STATUSES = ["новый", "в обработке", "отправлен", "выполнен", "отменён"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
