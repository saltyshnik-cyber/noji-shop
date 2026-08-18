import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ensureSchema, sql } from "@/lib/db";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ProductGallery } from "@/components/ProductGallery";
import { getSiteSettings } from "@/lib/siteSettings";
import { truncateForMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";

type ProductRow = {
  id: number;
  name: string;
  description: string;
  price: string;
  photo_url: string;
  category_name: string | null;
  steel: string;
  blade_length_mm: number | null;
  handle_material: string;
  stock_quantity: number;
};

const getProduct = cache(async (id: string): Promise<ProductRow | null> => {
  if (!/^\d+$/.test(id)) return null;

  await ensureSchema();
  const rows = await sql`
    SELECT
      products.id,
      products.name,
      products.description,
      products.price,
      products.photo_url,
      categories.name AS category_name,
      products.steel,
      products.blade_length_mm,
      products.handle_material,
      products.stock_quantity
    FROM products
    LEFT JOIN categories ON categories.id = products.category_id
    WHERE products.id = ${id}
  `;
  return (rows[0] as ProductRow | undefined) ?? null;
});

type GalleryItem = { url: string; type: "image" | "video" };

async function getExtraImages(id: string): Promise<GalleryItem[]> {
  const rows = (await sql`
    SELECT url, type FROM product_images WHERE product_id = ${id} ORDER BY sort_order
  `) as GalleryItem[];
  return rows;
}

function buildProductDescription(product: ProductRow): string {
  if (product.description.trim()) {
    return truncateForMeta(product.description);
  }

  const parts = [
    `${product.name}${product.category_name ? ` — ${product.category_name.toLowerCase()}` : ""} ручной работы`,
  ];
  if (product.steel) parts.push(`сталь ${product.steel}`);
  if (product.handle_material) parts.push(`рукоять — ${product.handle_material}`);
  return truncateForMeta(`${parts.join(", ")}. Доставка по России курьером или в пункт выдачи СДЭК.`);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const [product, settings] = await Promise.all([getProduct(id), getSiteSettings()]);

  if (!product) {
    return { title: `Товар не найден | ${settings.shopName}` };
  }

  const title = `${product.name} — купить с доставкой | ${settings.shopName}`;
  const description = buildProductDescription(product);

  return {
    title,
    description,
    alternates: { canonical: `/products/${id}` },
    openGraph: {
      title,
      description,
      images: product.photo_url ? [{ url: product.photo_url, alt: product.name }] : [],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const extraImages = await getExtraImages(id);
  const galleryImages: GalleryItem[] = [
    ...(product.photo_url ? [{ url: product.photo_url, type: "image" as const }] : []),
    ...extraImages,
  ];

  return (
    <main className="min-w-0">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link href="/products" className="mb-6 inline-block text-sm text-red-900 transition hover:text-red-700">
          ← Назад к каталогу
        </Link>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <ProductGallery images={galleryImages} alt={product.name} />

          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-2xl font-bold">{product.name}</h1>
              {product.stock_quantity === 0 ? (
                <span className="whitespace-nowrap rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                  Нет в наличии
                </span>
              ) : (
                <span className="whitespace-nowrap rounded bg-red-50 px-2 py-0.5 text-xs text-red-800">
                  Осталось {product.stock_quantity} шт
                </span>
              )}
            </div>

            {product.category_name && (
              <span className="w-fit rounded bg-red-100 px-2 py-0.5 text-xs text-red-800">
                {product.category_name}
              </span>
            )}

            <p className="text-gray-600">{product.description}</p>

            <dl className="mt-2 space-y-1 text-sm text-gray-600">
              {product.steel && (
                <div>
                  <dt className="inline font-medium">Сталь: </dt>
                  <dd className="inline">{product.steel}</dd>
                </div>
              )}
              {product.blade_length_mm != null && (
                <div>
                  <dt className="inline font-medium">Длина клинка: </dt>
                  <dd className="inline">{product.blade_length_mm} мм</dd>
                </div>
              )}
              {product.handle_material && (
                <div>
                  <dt className="inline font-medium">Материал рукояти: </dt>
                  <dd className="inline">{product.handle_material}</dd>
                </div>
              )}
            </dl>

            <p className="mt-4 text-3xl font-bold">{Number(product.price).toLocaleString("ru-RU")} ₽</p>

            <AddToCartButton
              productId={product.id}
              name={product.name}
              price={Number(product.price)}
              photoUrl={product.photo_url}
              inStock={product.stock_quantity > 0}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
