import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getYookassaPayment } from "@/lib/yookassa";
import { isYookassaIp } from "@/lib/yookassaIpAllowlist";
import { sendPaidOrderEmail } from "@/lib/email";
import { restockOrder, getOrderForEmail } from "@/lib/orders";

function getClientIp(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip");
}

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  if (!isYookassaIp(clientIp)) {
    console.warn(`Отклонено уведомление ЮKassa с недоверенного IP: ${clientIp ?? "неизвестен"}`);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { object?: { id?: string } };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса" }, { status: 400 });
  }

  const paymentId = body.object?.id;
  if (!paymentId) {
    return NextResponse.json({ error: "Нет id платежа в уведомлении" }, { status: 400 });
  }

  // Никогда не доверяем статусу платежа из тела самого уведомления — оно
  // могло быть подделано. Перепроверяем платёж напрямую через API ЮKassa
  // по своим учётным данным: это единственный источник, который нельзя
  // подделать без доступа к секретному ключу магазина.
  let payment;
  try {
    payment = await getYookassaPayment(paymentId);
  } catch (err) {
    console.error(`Не удалось проверить платёж ЮKassa ${paymentId}:`, err);
    return NextResponse.json({ error: "Не удалось проверить платёж" }, { status: 502 });
  }

  const orderId = Number(payment.metadata?.orderId);
  if (!Number.isInteger(orderId)) {
    console.error(`У платежа ${paymentId} нет валидного orderId в metadata`);
    return NextResponse.json({ ok: true });
  }

  const [order] = (await sql`
    SELECT id, payment_status FROM orders WHERE id = ${orderId} AND yookassa_payment_id = ${paymentId}
  `) as { id: number; payment_status: string }[];

  if (!order) {
    console.error(`Заказ №${orderId} не найден или не соответствует платежу ${paymentId}`);
    return NextResponse.json({ ok: true });
  }

  // Идемпотентность: если статус уже применён (например, ЮKassa повторно
  // прислала то же уведомление), повторно ничего не делаем — иначе можно
  // задвоить письмо владельцу или вернуть остаток дважды.
  if (payment.status === "succeeded" && order.payment_status !== "оплачен") {
    await sql`UPDATE orders SET payment_status = 'оплачен' WHERE id = ${orderId}`;

    const orderForEmail = await getOrderForEmail(orderId);
    if (orderForEmail) {
      await sendPaidOrderEmail(orderForEmail);
    }
  } else if (payment.status === "canceled" && order.payment_status !== "отменён") {
    await restockOrder(orderId);
    await sql`UPDATE orders SET payment_status = 'отменён', status = 'отменён' WHERE id = ${orderId}`;
  }

  return NextResponse.json({ ok: true });
}
