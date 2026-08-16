import { NextResponse } from "next/server";
import { ensureSchema, sql } from "@/lib/db";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Некорректный ID товара" }, { status: 400 });
  }

  const { url, type } = (await request.json()) as { url?: string; type?: string };
  if (!url) {
    return NextResponse.json({ error: "Не передан url" }, { status: 400 });
  }
  if (type !== undefined && type !== "image" && type !== "video") {
    return NextResponse.json({ error: "type должен быть 'image' или 'video'" }, { status: 400 });
  }

  await ensureSchema();

  const [{ next_order }] = await sql`
    SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM product_images WHERE product_id = ${id}
  `;

  const [image] = await sql`
    INSERT INTO product_images (product_id, url, sort_order, type)
    VALUES (${id}, ${url}, ${next_order}, ${type ?? "image"})
    RETURNING id, url, sort_order, type
  `;

  return NextResponse.json({ image });
}
