import { sql } from "@/lib/db";
import type { OrderForEmail } from "@/lib/email";

export async function restockItems(items: { productId: number; quantity: number }[]): Promise<void> {
  for (const item of items) {
    await sql`
      UPDATE products
      SET stock_quantity = stock_quantity + ${item.quantity}, in_stock = (stock_quantity + ${item.quantity}) > 0
      WHERE id = ${item.productId}
    `;
  }
}

export async function restockOrder(orderId: number): Promise<void> {
  const items = (await sql`
    SELECT product_id, quantity FROM order_items WHERE order_id = ${orderId}
  `) as { product_id: number; quantity: number }[];

  await restockItems(items.map((i) => ({ productId: i.product_id, quantity: i.quantity })));
}

export async function getOrderForEmail(orderId: number): Promise<OrderForEmail | null> {
  const orders = (await sql`SELECT * FROM orders WHERE id = ${orderId}`) as
    | {
        id: number;
        customer_name: string;
        phone: string;
        email: string | null;
        total: string;
        delivery_city: string;
        delivery_method: string;
        delivery_price: string;
        delivery_pvz_address: string;
      }[]
    | [];
  const order = orders[0];
  if (!order) return null;

  const items = (await sql`
    SELECT products.name AS product_name, order_items.quantity, order_items.price
    FROM order_items
    JOIN products ON products.id = order_items.product_id
    WHERE order_items.order_id = ${orderId}
  `) as { product_name: string; quantity: number; price: string }[];

  return {
    id: order.id,
    customerName: order.customer_name,
    phone: order.phone,
    email: order.email,
    total: Number(order.total),
    deliveryCity: order.delivery_city,
    deliveryMethod: order.delivery_method,
    deliveryPrice: Number(order.delivery_price),
    deliveryPvzAddress: order.delivery_pvz_address || null,
    items: items.map((i) => ({ name: i.product_name, quantity: i.quantity, price: Number(i.price) })),
  };
}
