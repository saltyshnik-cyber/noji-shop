import Link from "next/link";
import { notFound } from "next/navigation";
import { ensureSchema, sql } from "@/lib/db";

export const dynamic = "force-dynamic";

type OrderRow = {
  id: number;
  customer_name: string;
  phone: string;
  email: string | null;
  status: string;
  created_at: string;
  total: string;
};

type OrderItemRow = {
  product_name: string;
  quantity: number;
  price: string;
};

async function getOrder(id: string) {
  if (!/^\d+$/.test(id)) return null;

  await ensureSchema();
  const orders = await sql`SELECT * FROM orders WHERE id = ${id}`;
  const order = orders[0] as OrderRow | undefined;
  if (!order) return null;

  const items = (await sql`
    SELECT products.name AS product_name, order_items.quantity, order_items.price
    FROM order_items
    JOIN products ON products.id = order_items.product_id
    WHERE order_items.order_id = ${id}
  `) as OrderItemRow[];

  return { order, items };
}

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getOrder(id);

  if (!data) {
    notFound();
  }

  const { order, items } = data;

  return (
    <main className="min-w-0">
      <div className="mx-auto max-w-xl px-4 py-10">
        <h1 className="mb-2 text-2xl font-bold">Заказ №{order.id} принят</h1>
        <p className="mb-6 text-gray-500">Статус: {order.status}</p>

        <div className="mb-6 rounded border border-gray-200 p-4">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between py-1 text-sm">
              <span>
                {item.product_name} × {item.quantity}
              </span>
              <span>{(Number(item.price) * item.quantity).toLocaleString("ru-RU")} ₽</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 font-bold">
            <span>Итого</span>
            <span>{Number(order.total).toLocaleString("ru-RU")} ₽</span>
          </div>
        </div>

        <dl className="mb-6 space-y-1 text-sm text-gray-600">
          <div>
            <dt className="inline font-medium">Имя: </dt>
            <dd className="inline">{order.customer_name}</dd>
          </div>
          <div>
            <dt className="inline font-medium">Телефон: </dt>
            <dd className="inline">{order.phone}</dd>
          </div>
          {order.email && (
            <div>
              <dt className="inline font-medium">Email: </dt>
              <dd className="inline">{order.email}</dd>
            </div>
          )}
        </dl>

        <Link href="/products" className="text-amber-800 hover:underline">
          ← Продолжить покупки
        </Link>
      </div>
    </main>
  );
}
