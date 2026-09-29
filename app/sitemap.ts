import type { MetadataRoute } from "next";
import { sql } from "@/lib/db";
import { SITE_URL } from "@/lib/seo";

// Список товаров меняется редко, а sitemap регулярно дёргают поисковые боты —
// час устаревания не имеет значения для SEO, зато убирает лишнюю нагрузку на БД.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = (await sql`SELECT id FROM products ORDER BY id`) as { id: number }[];

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/products`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/oferta`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/requisites`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/products/${p.id}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...productPages];
}
