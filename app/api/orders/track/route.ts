import { NextResponse } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { isBlank, isValidPhone, normalizePhone } from "@/lib/validation";

const NOT_FOUND_MESSAGE = "Заказ не найден, проверьте номер и телефон";

export async function POST(request: Request) {
  const { orderId, phone } = await request.json();

  if (isBlank(orderId) || !/^\d+$/.test(String(orderId).trim())) {
    return NextResponse.json({ error: "Введите корректный номер заказа" }, { status: 400 });
  }

  if (isBlank(phone) || !isValidPhone(phone)) {
    return NextResponse.json({ error: "Введите телефон в формате +7XXXXXXXXXX" }, { status: 400 });
  }

  await ensureSchema();

  const [order] = (await sql`
    SELECT id, phone FROM orders WHERE id = ${Number(orderId)}
  `) as { id: number; phone: string }[];

  // Одна и та же ошибка независимо от того, не нашёлся ли заказ вообще или
  // телефон не совпал — не даём подбором номеров узнать, какие id существуют.
  if (!order || normalizePhone(order.phone) !== normalizePhone(phone)) {
    return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
  }

  return NextResponse.json({ orderId: order.id });
}
