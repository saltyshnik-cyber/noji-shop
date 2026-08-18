import { ensureSchema, sql, slugify } from "@/lib/db";

export { slugify };

export type Category = { id: number; name: string; slug: string; sort_order: number };

export async function getCategories(): Promise<Category[]> {
  await ensureSchema();
  return (await sql`
    SELECT id, name, slug, sort_order FROM categories ORDER BY sort_order, id
  `) as Category[];
}

export async function getCategoriesWithProductCounts(): Promise<(Category & { product_count: number })[]> {
  await ensureSchema();
  return (await sql`
    SELECT
      categories.id, categories.name, categories.slug, categories.sort_order,
      COUNT(products.id)::int AS product_count
    FROM categories
    LEFT JOIN products ON products.category_id = categories.id
    GROUP BY categories.id
    ORDER BY categories.sort_order, categories.id
  `) as (Category & { product_count: number })[];
}
