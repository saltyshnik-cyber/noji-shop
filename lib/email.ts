import { Resend } from "resend";

type OrderItemForEmail = {
  name: string;
  quantity: number;
  price: number;
};

type OrderForEmail = {
  id: number;
  customerName: string;
  phone: string;
  email: string | null;
  total: number;
  items: OrderItemForEmail[];
};

export async function sendNewOrderEmail(order: OrderForEmail): Promise<void> {
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
      <h2>Новый заказ №${order.id}</h2>
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
      <p style="font-weight:bold;font-size:16px;">Итого: ${order.total.toLocaleString("ru-RU")} ₽</p>
      <h3>Клиент</h3>
      <p>
        Имя: ${order.customerName}<br/>
        Телефон: ${order.phone}<br/>
        ${order.email ? `Email: ${order.email}<br/>` : ""}
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: "Knife Shop <onboarding@resend.dev>",
      to: adminEmail,
      subject: `Новый заказ №${order.id} — ${order.total.toLocaleString("ru-RU")} ₽`,
      html,
    });
  } catch (error) {
    console.error("Не удалось отправить письмо о заказе:", error);
  }
}
