import Link from "next/link";
import { ensureSchema, sql } from "@/lib/db";

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

async function getProducts(): Promise<ProductRow[]> {
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
    ORDER BY products.id
  `;
  return rows as ProductRow[];
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold">Каталог ножей</h1>

      {products.length === 0 ? (
        <p className="text-gray-500">Товары не найдены. Запустите seed-скрипт.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/products/${p.id}`}
              className="flex flex-col overflow-hidden rounded-lg border border-gray-200 shadow-sm transition hover:shadow-md"
            >
              <img src={p.photo_url} alt={p.name} className="h-48 w-full object-cover" />
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-semibold">{p.name}</h2>
                  {!p.in_stock && (
                    <span className="whitespace-nowrap rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                      Нет в наличии
                    </span>
                  )}
                </div>
                {p.category_name && (
                  <span className="w-fit rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                    {p.category_name}
                  </span>
                )}
                <p className="text-sm text-gray-600">{p.description}</p>
                <dl className="mt-1 space-y-1 text-xs text-gray-500">
                  <div>
                    <dt className="inline font-medium">Сталь: </dt>
                    <dd className="inline">{p.steel}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium">Длина клинка: </dt>
                    <dd className="inline">{p.blade_length_mm} мм</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium">Рукоять: </dt>
                    <dd className="inline">{p.handle_material}</dd>
                  </div>
                </dl>
                <p className="mt-auto pt-2 text-xl font-bold">{Number(p.price).toLocaleString("ru-RU")} ₽</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
