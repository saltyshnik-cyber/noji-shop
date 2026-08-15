import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Некорректный ID товара" }, { status: 400 });
  }

  const body = (await request.json()) as Partial<ProductPayload>;

  if (isBlank(body.name)) {
    return NextResponse.json({ error: "Введите название" }, { status: 400 });
  }
  if (typeof body.price !== "number" || !(body.price > 0)) {
    return NextResponse.json({ error: "Некорректная цена" }, { status: 400 });
  }

  await sql`
    UPDATE products SET
      name = ${body.name},
      description = ${body.description ?? ""},
      price = ${body.price},
      photo_url = ${body.photo_url ?? ""},
      category_id = ${body.category_id ?? null},
      steel = ${body.steel ?? ""},
      blade_length_mm = ${body.blade_length_mm ?? null},
      handle_material = ${body.handle_material ?? ""},
      in_stock = ${body.in_stock ?? true}
    WHERE id = ${id}
  `;

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Некорректный ID товара" }, { status: 400 });
  }

  try {
    await sql`DELETE FROM products WHERE id = ${id}`;
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "23503") {
      return NextResponse.json(
        { error: "Нельзя удалить товар — он уже есть в оформленных заказах" },
        { status: 409 },
      );
    }
    throw error;
  }

  return NextResponse.json({ ok: true });
}
