import Link from "next/link";
import { ensureSchema, sql } from "@/lib/db";
import AdminNav from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

type ProductRow = {
  id: number;
  name: string;
  price: string;
  photo_url: string;
  category_name: string | null;
  in_stock: boolean;
};

async function getProducts(): Promise<ProductRow[]> {
  await ensureSchema();
  return (await sql`
    SELECT products.id, products.name, products.price, products.photo_url, categories.name AS category_name, products.in_stock
    FROM products
    LEFT JOIN categories ON categories.id = products.category_id
    ORDER BY products.id DESC
  `) as ProductRow[];
}

export default async function AdminProductsPage() {
  const products = await getProducts();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <AdminNav />

      <div className="mt-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Товары</h1>
        <Link
          href="/admin/products/new"
          className="rounded bg-red-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
        >
          Добавить новый товар
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="mt-6 text-gray-500">Товаров пока нет.</p>
      ) : (
        <div className="mt-6 space-y-2">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/admin/products/${p.id}`}
              className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-3 transition hover:border-red-800"
            >
              <img src={p.photo_url} alt="" className="h-16 w-16 shrink-0 rounded object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{p.name}</p>
                  {!p.in_stock && (
                    <span className="shrink-0 whitespace-nowrap rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                      Нет в наличии
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{p.category_name ?? "Без категории"}</p>
              </div>
              <p className="shrink-0 font-semibold">{Number(p.price).toLocaleString("ru-RU")} ₽</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
