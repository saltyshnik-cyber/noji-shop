import { Resend } from "resend";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/orderLabels";

export type OrderItemForEmail = {
  name: string;
  quantity: number;
  price: number;
};

export type OrderForEmail = {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  total: number;
  deliveryCity: string;
  deliveryMethod: string;
  deliveryPrice: number;
  deliveryPvzAddress: string | null;
  items: OrderItemForEmail[];
};

export async function sendPaidOrderEmail(order: OrderForEmail): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!apiKey || !adminEmail) {
    console.warn("RESEND_API_KEY или ADMIN_EMAIL не заданы — письмо о заказе не отправлено");
    return;
  }

  const resend = new Resend(apiKey);

  const itemsHtml = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:4px 8px;border-bottom:1px solid #eee;">${item.name}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right;">${(item.price * item.quantity).toLocaleString("ru-RU")} ₽</td>
        </tr>`,
    )
    .join("");

  const html = `
    <div style="font-family:sans-serif;max-width:480px;">
      <h2>Оплачен заказ №${order.id}</h2>
      <table style="width:100%;border-collapse:collapse;margin:12px 0;">
        <thead>
          <tr>
            <th style="text-align:left;padding:4px 8px;border-bottom:2px solid #333;">Товар</th>
            <th style="text-align:center;padding:4px 8px;border-bottom:2px solid #333;">Кол-во</th>
            <th style="text-align:right;padding:4px 8px;border-bottom:2px solid #333;">Сумма</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p>Доставка (${order.deliveryMethod}): ${order.deliveryPrice.toLocaleString("ru-RU")} ₽</p>
      <p style="font-weight:bold;font-size:16px;">Итого: ${order.total.toLocaleString("ru-RU")} ₽</p>
      <h3>Клиент</h3>
      <p>
        Имя: ${order.firstName} ${order.lastName}<br/>
        Телефон: ${order.phone}<br/>
        ${order.email ? `Email: ${order.email}<br/>` : ""}
        Город доставки: ${order.deliveryCity}<br/>
        ${order.deliveryPvzAddress ? `Пункт выдачи: ${order.deliveryPvzAddress}<br/>` : ""}
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: "Ножи для жизни <onboarding@resend.dev>",
      to: adminEmail,
      subject: `Оплачен заказ №${order.id} — ${order.total.toLocaleString("ru-RU")} ₽`,
      html,
    });
  } catch (error) {
    console.error("Не удалось отправить письмо о заказе:", error);
  }
}

// Уведомление покупателю о смене статуса заказа. Если у заказа нет email —
// вызывающий код просто не должен звать эту функцию (см. PATCH-роут смены
// статуса) — здесь на всякий случай тоже нет ошибки, просто ничего не шлём.
export async function sendOrderStatusEmail(params: {
  orderId: number;
  email: string;
  status: OrderStatus;
  trackingUrl: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY не задан — письмо о смене статуса заказа не отправлено");
    return;
  }
  if (!params.email) return;

  const resend = new Resend(apiKey);
  const statusLabel = ORDER_STATUS_LABELS[params.status] ?? params.status;

  const html = `
    <div style="font-family:sans-serif;max-width:480px;">
      <h2>Заказ №${params.orderId}: ${statusLabel}</h2>
      <p>Статус вашего заказа изменился на «${statusLabel}».</p>
      <p>
        <a href="${params.trackingUrl}" style="color:#991b1b;">Отследить заказ</a>
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: "Ножи для жизни <onboarding@resend.dev>",
      to: params.email,
      subject: `Заказ №${params.orderId}: ${statusLabel}`,
      html,
    });
  } catch (error) {
    console.error("Не удалось отправить письмо о смене статуса заказа:", error);
  }
}
