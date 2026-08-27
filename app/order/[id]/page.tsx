import Link from "next/link";
import { notFound } from "next/navigation";
import { ensureSchema, sql } from "@/lib/db";
import { OrderPaymentStatus } from "@/components/OrderPaymentStatus";
import { ORDER_STATUS_LABELS, type OrderStatus, type PaymentStatus } from "@/lib/orderLabels";

export const dynamic = "force-dynamic";

type OrderRow = {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  status: OrderStatus;
  created_at: string;
  total: string;
  delivery_city: string;
  delivery_method: string;
  delivery_price: string;
  delivery_pvz_address: string;
  payment_status: PaymentStatus;
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
        <p className="mb-1 text-sm font-medium uppercase tracking-wide text-gray-500">Заказ оформлен</p>
        <h1 className="mb-2 text-4xl font-black sm:text-5xl">№{order.id}</h1>
        <p className="mb-4 text-gray-500">Статус: {ORDER_STATUS_LABELS[order.status] ?? order.status}</p>

        <Link
          href={`/order/${order.id}`}
          className="mb-6 inline-flex items-center gap-2 rounded-lg border-2 border-red-800 bg-red-950/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-red-600 hover:bg-red-900/40"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 shrink-0"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          Отследить заказ
        </Link>

        <OrderPaymentStatus orderId={order.id} initialStatus={order.payment_status} />

        <div className="mb-6 rounded border border-gray-200 p-4">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between py-1 text-sm">
              <span>
                {item.product_name} × {item.quantity}
              </span>
              <span>{(Number(item.price) * item.quantity).toLocaleString("ru-RU")} ₽</span>
            </div>
          ))}
          {order.delivery_method && (
            <div className="flex justify-between py-1 text-sm">
              <span>Доставка: {order.delivery_method}</span>
              <span>{Number(order.delivery_price).toLocaleString("ru-RU")} ₽</span>
            </div>
          )}
          <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 font-bold">
            <span>Итого</span>
            <span>{Number(order.total).toLocaleString("ru-RU")} ₽</span>
          </div>
        </div>

        <dl className="mb-6 space-y-1 text-sm text-gray-600">
          <div>
            <dt className="inline font-medium">Имя: </dt>
            <dd className="inline">
              {order.first_name} {order.last_name}
            </dd>
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
          {order.delivery_city && (
            <div>
              <dt className="inline font-medium">Город доставки: </dt>
              <dd className="inline">{order.delivery_city}</dd>
            </div>
          )}
          {order.delivery_pvz_address && (
            <div>
              <dt className="inline font-medium">Пункт выдачи: </dt>
              <dd className="inline">{order.delivery_pvz_address}</dd>
            </div>
          )}
        </dl>

        <Link href="/products" className="text-red-600 hover:underline">
          ← Продолжить покупки
        </Link>
      </div>
    </main>
  );
}
