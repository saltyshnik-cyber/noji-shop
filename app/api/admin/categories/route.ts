import { NextResponse } from "next/server";
import { ensureSchema, sql, slugify } from "@/lib/db";
import { getCategoriesWithProductCounts } from "@/lib/categories";

async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let candidate = baseSlug || "category";
  let suffix = 2;
  while (true) {
    const rows = await sql`SELECT id FROM categories WHERE slug = ${candidate}`;
    if (rows.length === 0) return candidate;
    candidate = `${baseSlug || "category"}-${suffix}`;
    suffix += 1;
  }
}

export async function GET() {
  const categories = await getCategoriesWithProductCounts();
  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const { name, slug } = (await request.json()) as { name?: string; slug?: string };

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Введите название категории" }, { status: 400 });
  }

  await ensureSchema();

  const baseSlug = slugify(slug?.trim() || name);
  const uniqueSlug = await ensureUniqueSlug(baseSlug);

  const [{ next_order }] = await sql`
    SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM categories
  `;

  const [category] = await sql`
    INSERT INTO categories (name, slug, sort_order)
    VALUES (${name.trim()}, ${uniqueSlug}, ${next_order})
    RETURNING id, name, slug, sort_order
  `;

  return NextResponse.json({ category });
}
