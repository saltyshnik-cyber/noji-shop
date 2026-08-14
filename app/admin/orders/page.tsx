import { ensureSchema, sql } from "@/lib/db";
import AdminNav from "@/components/admin/AdminNav";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import type { OrderStatus } from "@/lib/orderLabels";

export const dynamic = "force-dynamic";

type OrderRow = {
  id: number;
  customer_name: string;
  phone: string;
  email: string | null;
  status: OrderStatus;
  created_at: string;
  total: string;
};

type OrderItemRow = {
  order_id: number;
  product_name: string;
  quantity: number;
  price: string;
};

async function getOrdersWithItems() {
  await ensureSchema();

  const orders = (await sql`
    SELECT id, customer_name, phone, email, status, created_at, total
    FROM orders
    ORDER BY created_at DESC
  `) as OrderRow[];

  const items = (await sql`
    SELECT order_items.order_id, products.name AS product_name, order_items.quantity, order_items.price
    FROM order_items
    JOIN products ON products.id = order_items.product_id
    ORDER BY order_items.id
  `) as OrderItemRow[];

  const itemsByOrder = new Map<number, OrderItemRow[]>();
  for (const item of items) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  }

  return orders.map((order) => ({ order, items: itemsByOrder.get(order.id) ?? [] }));
}

export default async function AdminOrdersPage() {
  const ordersWithItems = await getOrdersWithItems();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <AdminNav />
      <h1 className="mt-6 text-2xl font-bold">Заказы</h1>

      {ordersWithItems.length === 0 ? (
        <p className="mt-6 text-gray-500">Заказов пока нет.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {ordersWithItems.map(({ order, items }) => (
            <div key={order.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">Заказ №{order.id}</div>
                  <div className="text-sm text-gray-400">
                    {new Date(order.created_at).toLocaleString("ru-RU")}
                  </div>
                </div>
                <OrderStatusSelect orderId={order.id} status={order.status} />
              </div>

              <div className="mt-3 grid gap-1 text-sm text-gray-600 sm:grid-cols-2">
                <div>
                  {order.customer_name} · {order.phone}
                </div>
                {order.email && <div>{order.email}</div>}
              </div>

              <ul className="mt-3 space-y-1 text-sm text-gray-600">
                {items.map((item, i) => (
                  <li key={i}>
                    {item.product_name} × {item.quantity} — {(Number(item.price) * item.quantity).toLocaleString("ru-RU")} ₽
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex items-center justify-end border-t border-gray-100 pt-3 text-sm">
                <span className="font-semibold">{Number(order.total).toLocaleString("ru-RU")} ₽</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
