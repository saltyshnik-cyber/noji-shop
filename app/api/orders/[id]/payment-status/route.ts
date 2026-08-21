import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Некорректный ID заказа" }, { status: 400 });
  }

  const [order] = await sql`SELECT payment_status FROM orders WHERE id = ${id}`;
  if (!order) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  return NextResponse.json({ paymentStatus: order.payment_status });
}
