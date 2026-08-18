import Link from "next/link";
import type { Metadata } from "next";
import { ensureSchema, sql, slugify } from "@/lib/db";
import { AddToCartButton } from "@/components/AddToCartButton";
import { CategoryNav } from "@/components/CategoryNav";
import { getCategories } from "@/lib/categories";
import { FloatingCartButton } from "@/components/FloatingCartButton";
import { isVideoUrl } from "@/lib/mediaType";
import { getSiteSettings } from "@/lib/siteSettings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: `Каталог ножей — купить с доставкой | ${settings.shopName}`,
    description:
      "Кованые ножи ручной работы: охотничьи, туристические, кухонные, финки НКВД. Доставка по России курьером СДЭК или в пункт выдачи.",
    alternates: { canonical: "/products" },
  };
}

type ProductRow = {
  id: number;
  name: string;
  description: string;
  price: string;
  photo_url: string;
  fallback_image_url: string | null;
  category_name: string | null;
  steel: string;
  blade_length_mm: number | null;
  handle_material: string;
  in_stock: boolean;
};

async function getProducts(): Promise<ProductRow[]> {
  await ensureSchema();
  const rows = await sql`
    SELECT
      products.id,
      products.name,
      products.description,
      products.price,
      products.photo_url,
      (
        SELECT pi.url FROM product_images pi
        WHERE pi.product_id = products.id AND pi.type = 'image'
        ORDER BY pi.sort_order LIMIT 1
      ) AS fallback_image_url,
      categories.name AS category_name,
      products.steel,
      products.blade_length_mm,
      products.handle_material,
      products.in_stock
    FROM products
    LEFT JOIN categories ON categories.id = products.category_id
    ORDER BY products.id
  `;
  return rows as ProductRow[];
}

function ProductCard({ p }: { p: ProductRow }) {
  const cardImage = isVideoUrl(p.photo_url) ? (p.fallback_image_url ?? p.photo_url) : p.photo_url;

  return (
    <div className="flex flex-col overflow-hidden rounded-lg bg-neutral-900 transition hover:shadow-lg hover:shadow-red-900/40">
      <Link href={`/products/${p.id}`} className="flex flex-1 flex-col">
        <div className="aspect-[4/5] w-full">
          <img src={cardImage} alt={p.name} className="h-full w-full object-cover object-center" />
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 min-h-[3.5rem] text-lg font-semibold text-white">{p.name}</h3>
            {!p.in_stock && (
              <span className="whitespace-nowrap rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                Нет в наличии
              </span>
            )}
          </div>
          <p className="line-clamp-2 min-h-[2.5rem] text-sm text-gray-300">{p.description}</p>
          <dl className="mt-1 min-h-[3.75rem] space-y-1 overflow-hidden text-xs text-gray-400">
            {p.steel && (
              <div>
                <dt className="inline font-medium">Сталь: </dt>
                <dd className="inline">{p.steel}</dd>
              </div>
            )}
            {p.blade_length_mm != null && (
              <div>
                <dt className="inline font-medium">Длина клинка: </dt>
                <dd className="inline">{p.blade_length_mm} мм</dd>
              </div>
            )}
            {p.handle_material && (
              <div>
                <dt className="inline font-medium">Рукоять: </dt>
                <dd className="inline">{p.handle_material}</dd>
              </div>
            )}
          </dl>
          <p className="mt-auto pt-2 text-xl font-bold text-white">{Number(p.price).toLocaleString("ru-RU")} ₽</p>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <AddToCartButton
          productId={p.id}
          name={p.name}
          price={Number(p.price)}
          photoUrl={p.photo_url}
          inStock={p.in_stock}
          compact
        />
      </div>
    </div>
  );
}

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  const byCategory = new Map<string, ProductRow[]>();
  for (const p of products) {
    const key = p.category_name ?? "Без категории";
    const list = byCategory.get(key) ?? [];
    list.push(p);
    byCategory.set(key, list);
  }

  const sections = categories.map((c) => ({ name: c.name, slug: c.slug }));
  if (byCategory.has("Без категории") && !categories.some((c) => c.name === "Без категории")) {
    sections.push({ name: "Без категории", slug: slugify("Без категории") });
  }

  return (
    <>
      <CategoryNav sections={sections} />
      <FloatingCartButton />
      <main className="min-w-0">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <Link href="/" className="mb-6 inline-block text-sm text-red-900 transition hover:text-red-700">
            ← На главную
          </Link>
          <h1 className="mb-8 text-3xl font-bold">Каталог ножей</h1>

          {products.length === 0 ? (
            <p className="text-gray-500">Товары не найдены. Запустите seed-скрипт.</p>
          ) : (
            <div className="flex flex-col gap-12">
              {sections.map(({ name, slug }) => {
                const items = byCategory.get(name);
                if (!items?.length) return null;

                return (
                  <section key={slug} id={slug} className="min-w-0 scroll-mt-[120px]">
                    <h2 className="mb-4 text-2xl font-bold">{name}</h2>
                    <div className="flex flex-nowrap snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:pb-0 lg:grid-cols-3">
                      {items.map((p) => (
                        <div key={p.id} className="w-64 shrink-0 snap-start sm:w-auto">
                          <ProductCard p={p} />
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
