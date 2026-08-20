import { NextResponse } from "next/server";
import { ensureSchema, sql } from "@/lib/db";

// Публичный эндпоинт: отдаёт только текущий остаток по списку id товаров.
// Используется корзиной, чтобы пересчитать лимиты количества, если остаток
// изменился после того, как товар положили в корзину.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids");
  if (!idsParam) {
    return NextResponse.json({ error: "Не переданы ids" }, { status: 400 });
  }

  const ids = idsParam
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n));

  if (ids.length === 0) {
    return NextResponse.json({ stock: {} });
  }

  await ensureSchema();
  const rows = (await sql`
    SELECT id, stock_quantity FROM products WHERE id = ANY(${ids})
  `) as { id: number; stock_quantity: number }[];

  const stock: Record<number, number> = {};
  for (const row of rows) stock[row.id] = row.stock_quantity;

  return NextResponse.json({ stock });
}
