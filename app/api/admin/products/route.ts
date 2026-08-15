import { NextResponse } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { isBlank } from "@/lib/validation";

type ProductPayload = {
  name: string;
  description: string;
  price: number;
  photo_url: string;
  category_id: number | null;
  steel: string;
  blade_length_mm: number | null;
  handle_material: string;
  in_stock: boolean;
};

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<ProductPayload>;

  if (isBlank(body.name)) {
    return NextResponse.json({ error: "Введите название" }, { status: 400 });
  }
  if (typeof body.price !== "number" || !(body.price > 0)) {
    return NextResponse.json({ error: "Некорректная цена" }, { status: 400 });
  }

  await ensureSchema();

  const [product] = await sql`
    INSERT INTO products
      (name, description, price, photo_url, category_id, steel, blade_length_mm, handle_material, in_stock)
    VALUES
      (${body.name}, ${body.description ?? ""}, ${body.price}, ${body.photo_url ?? ""}, ${body.category_id ?? null},
       ${body.steel ?? ""}, ${body.blade_length_mm ?? null}, ${body.handle_material ?? ""}, ${body.in_stock ?? true})
    RETURNING id
  `;

  return NextResponse.json({ id: product.id });
}
