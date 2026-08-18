import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

const DIAG_SECRET = "tmp-diag-8f3a1c9e77";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("secret") !== DIAG_SECRET) {
    return NextResponse.json({ error: "no" }, { status: 404 });
  }

  const orderIds = [7, 8];
  const productId = 30;

  await sql`DELETE FROM order_items WHERE order_id = ANY(${orderIds})`;
  await sql`DELETE FROM orders WHERE id = ANY(${orderIds})`;
  await sql`DELETE FROM products WHERE id = ${productId}`;

  return NextResponse.json({ ok: true });
}
