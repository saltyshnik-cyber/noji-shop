import { NextResponse } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { isBlank, isValidEmail, isValidPhone } from "@/lib/validation";
import { sendNewOrderEmail } from "@/lib/email";

type OrderItemInput = {
  productId: number;
  quantity: number;
};

type OrderPayload = {
  customerName: string;
  phone: string;
  email?: string;
  items: OrderItemInput[];
  city: string;
  deliveryMethod: string;
  deliveryPrice: number;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as OrderPayload;

  if (isBlank(payload.customerName)) {
    return NextResponse.json({ error: "Введите имя" }, { status: 400 });
  }

  if (isBlank(payload.phone) || !isValidPhone(payload.phone)) {
    return NextResponse.json(
      { error: "Введите телефон в формате +7XXXXXXXXXX" },
      { status: 400 },
    );
  }

  if (payload.email && !isValidEmail(payload.email)) {
    return NextResponse.json({ error: "Некорректный email" }, { status: 400 });
  }

  if (isBlank(payload.city)) {
    return NextResponse.json({ error: "Введите город доставки" }, { status: 400 });
  }

  if (isBlank(payload.deliveryMethod) || !(Number(payload.deliveryPrice) >= 0)) {
    return NextResponse.json({ error: "Выберите способ доставки" }, { status: 400 });
  }

  if (!payload.items?.length) {
    return NextResponse.json({ error: "Корзина пуста" }, { status: 400 });
  }

  const productIds = payload.items.map((i) => i.productId);
  if (productIds.some((id) => !Number.isInteger(id))) {
    return NextResponse.json({ error: "Некорректный товар в корзине" }, { status: 400 });
  }

  await ensureSchema();

  const products = await sql`
    SELECT id, name, price, in_stock FROM products WHERE id = ANY(${productIds})
  `;

  const productById = new Map(products.map((p) => [p.id as number, p]));

  for (const item of payload.items) {
    const product = productById.get(item.productId);
    if (!product) {
      return NextResponse.json({ error: "Товар не найден" }, { status: 400 });
    }
    if (!product.in_stock) {
      return NextResponse.json(
        { error: `Товар «${product.name}» больше не в наличии` },
        { status: 400 },
      );
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      return NextResponse.json({ error: "Некорректное количество" }, { status: 400 });
    }
  }

  const itemsTotal = payload.items.reduce((sum, item) => {
    const product = productById.get(item.productId)!;
    return sum + Number(product.price) * item.quantity;
  }, 0);
  const deliveryPrice = Number(payload.deliveryPrice);
  const total = itemsTotal + deliveryPrice;

  const [order] = await sql`
    INSERT INTO orders (customer_name, phone, email, status, total, delivery_city, delivery_method, delivery_price)
    VALUES (
      ${payload.customerName}, ${payload.phone}, ${payload.email ?? null}, 'новый', ${total},
      ${payload.city}, ${payload.deliveryMethod}, ${deliveryPrice}
    )
    RETURNING id
  `;

  for (const item of payload.items) {
    const product = productById.get(item.productId)!;
    await sql`
      INSERT INTO order_items (order_id, product_id, quantity, price)
      VALUES (${order.id}, ${item.productId}, ${item.quantity}, ${product.price})
    `;
  }

  await sendNewOrderEmail({
    id: order.id,
    customerName: payload.customerName,
    phone: payload.phone,
    email: payload.email ?? null,
    total,
    deliveryCity: payload.city,
    deliveryMethod: payload.deliveryMethod,
    deliveryPrice,
    items: payload.items.map((item) => ({
      name: productById.get(item.productId)!.name,
      quantity: item.quantity,
      price: Number(productById.get(item.productId)!.price),
    })),
  });

  return NextResponse.json({ orderId: order.id });
}
