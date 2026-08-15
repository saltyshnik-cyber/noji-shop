import Link from "next/link";
import { notFound } from "next/navigation";
import { ensureSchema, sql } from "@/lib/db";
import { AddToCartButton } from "@/components/AddToCartButton";

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
  in_stock: boolean;
};

async function getProduct(id: string): Promise<ProductRow | null> {
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
      products.in_stock
    FROM products
    LEFT JOIN categories ON categories.id = products.category_id
    WHERE products.id = ${id}
  `;
  return (rows[0] as ProductRow | undefined) ?? null;
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-w-0">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link href="/products" className="mb-6 inline-block text-sm text-red-900 transition hover:text-red-700">
          ← Назад к каталогу
        </Link>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="aspect-[4/5] w-full overflow-hidden rounded-lg border border-gray-200">
            <img src={product.photo_url} alt={product.name} className="h-full w-full object-cover object-center" />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-2xl font-bold">{product.name}</h1>
              {!product.in_stock && (
                <span className="whitespace-nowrap rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                  Нет в наличии
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
              inStock={product.in_stock}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
