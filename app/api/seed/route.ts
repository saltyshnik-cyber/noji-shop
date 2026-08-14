import { NextResponse } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { categories, products } from "@/lib/seed-data";

export async function POST(request: Request) {
  const token = request.headers.get("x-seed-token");
  if (!process.env.SEED_TOKEN || token !== process.env.SEED_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await ensureSchema();

  await sql`DELETE FROM order_items`;
  await sql`DELETE FROM orders`;
  await sql`DELETE FROM products`;
  await sql`DELETE FROM categories`;

  const categoryIds: Record<string, number> = {};
  for (const name of categories) {
    const [row] = await sql`INSERT INTO categories (name) VALUES (${name}) RETURNING id`;
    categoryIds[name] = row.id as number;
  }

  for (const p of products) {
    await sql`
      INSERT INTO products
        (name, description, price, photo_url, category_id, steel, blade_length_mm, handle_material, in_stock)
      VALUES
        (${p.name}, ${p.description}, ${p.price}, ${p.photo}, ${categoryIds[p.category]}, ${p.steel}, ${p.blade_length_mm}, ${p.handle_material}, ${p.in_stock})
    `;
  }

  return NextResponse.json({ ok: true, categories: categories.length, products: products.length });
}
