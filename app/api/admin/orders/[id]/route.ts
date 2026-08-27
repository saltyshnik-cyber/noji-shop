import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ORDER_STATUSES } from "@/lib/orderLabels";
import { sendOrderStatusEmail } from "@/lib/email";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = await request.json();

  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Некорректный ID заказа" }, { status: 400 });
  }

  if (!ORDER_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Некорректный статус" }, { status: 400 });
  }

  const [order] = (await sql`
    UPDATE orders SET status = ${status} WHERE id = ${id} RETURNING email
  `) as { email: string | null }[];

  if (order?.email) {
    const trackingUrl = new URL(`/order/${id}`, request.url).toString();
    await sendOrderStatusEmail({ orderId: Number(id), email: order.email, status, trackingUrl });
  }

  return NextResponse.json({ ok: true });
}
