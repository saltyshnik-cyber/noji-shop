import { NextResponse } from "next/server";
import { sql, slugify } from "@/lib/db";

async function ensureUniqueSlug(baseSlug: string, excludeId: string): Promise<string> {
  let candidate = baseSlug || "category";
  let suffix = 2;
  while (true) {
    const rows = await sql`SELECT id FROM categories WHERE slug = ${candidate} AND id != ${excludeId}`;
    if (rows.length === 0) return candidate;
    candidate = `${baseSlug || "category"}-${suffix}`;
    suffix += 1;
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Некорректный ID категории" }, { status: 400 });
  }

  const body = (await request.json()) as { direction?: "up" | "down"; name?: string; slug?: string };

  const current = (await sql`SELECT id, name, slug, sort_order FROM categories WHERE id = ${id}`)[0];
  if (!current) {
    return NextResponse.json({ error: "Категория не найдена" }, { status: 404 });
  }

  if (body.direction) {
    if (body.direction !== "up" && body.direction !== "down") {
      return NextResponse.json({ error: "direction должен быть 'up' или 'down'" }, { status: 400 });
    }

    const neighborRows =
      body.direction === "up"
        ? await sql`
            SELECT id, sort_order FROM categories
            WHERE sort_order < ${current.sort_order}
            ORDER BY sort_order DESC LIMIT 1
          `
        : await sql`
            SELECT id, sort_order FROM categories
            WHERE sort_order > ${current.sort_order}
            ORDER BY sort_order ASC LIMIT 1
          `;

    const neighbor = neighborRows[0];
    if (!neighbor) {
      return NextResponse.json({ ok: true });
    }

    await sql`UPDATE categories SET sort_order = ${neighbor.sort_order} WHERE id = ${current.id}`;
    await sql`UPDATE categories SET sort_order = ${current.sort_order} WHERE id = ${neighbor.id}`;

    return NextResponse.json({ ok: true });
  }

  const nextName = body.name?.trim() ?? current.name;
  if (!nextName) {
    return NextResponse.json({ error: "Введите название категории" }, { status: 400 });
  }

  const baseSlug = slugify(body.slug?.trim() || nextName);
  const uniqueSlug = await ensureUniqueSlug(baseSlug, id);

  const [category] = await sql`
    UPDATE categories SET name = ${nextName}, slug = ${uniqueSlug} WHERE id = ${id}
    RETURNING id, name, slug, sort_order
  `;

  return NextResponse.json({ category });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Некорректный ID категории" }, { status: 400 });
  }

  const category = (await sql`SELECT id, name FROM categories WHERE id = ${id}`)[0];
  if (!category) {
    return NextResponse.json({ error: "Категория не найдена" }, { status: 404 });
  }

  const [{ count }] = await sql`SELECT COUNT(*) FROM products WHERE category_id = ${id}`;
  const productCount = Number(count);
  if (productCount > 0) {
    return NextResponse.json(
      {
        error: `В категории «${category.name}» ${productCount} товар(ов). Сначала перенесите их в другую категорию или удалите товары.`,
        productCount,
      },
      { status: 400 },
    );
  }

  await sql`DELETE FROM categories WHERE id = ${id}`;

  return NextResponse.json({ ok: true });
}
