import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Некорректный ID фото" }, { status: 400 });
  }

  const { direction } = (await request.json()) as { direction?: "up" | "down" };
  if (direction !== "up" && direction !== "down") {
    return NextResponse.json({ error: "direction должен быть 'up' или 'down'" }, { status: 400 });
  }

  const rows = await sql`SELECT id, product_id, sort_order FROM product_images WHERE id = ${id}`;
  const current = rows[0];
  if (!current) {
    return NextResponse.json({ error: "Фото не найдено" }, { status: 404 });
  }

  const neighborRows = direction === "up"
    ? await sql`
        SELECT id, sort_order FROM product_images
        WHERE product_id = ${current.product_id} AND sort_order < ${current.sort_order}
        ORDER BY sort_order DESC LIMIT 1
      `
    : await sql`
        SELECT id, sort_order FROM product_images
        WHERE product_id = ${current.product_id} AND sort_order > ${current.sort_order}
        ORDER BY sort_order ASC LIMIT 1
      `;

  const neighbor = neighborRows[0];
  if (!neighbor) {
    return NextResponse.json({ ok: true });
  }

  await sql`UPDATE product_images SET sort_order = ${neighbor.sort_order} WHERE id = ${current.id}`;
  await sql`UPDATE product_images SET sort_order = ${current.sort_order} WHERE id = ${neighbor.id}`;

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Некорректный ID фото" }, { status: 400 });
  }

  await sql`DELETE FROM product_images WHERE id = ${id}`;

  return NextResponse.json({ ok: true });
}
