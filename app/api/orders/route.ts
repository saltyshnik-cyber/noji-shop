import { NextResponse } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { isBlank, isValidEmail, isValidPhone } from "@/lib/validation";
import { restockItems } from "@/lib/orders";
import { buildOrderReceipt, createYookassaPayment, YookassaApiError } from "@/lib/yookassa";

type OrderItemInput = {
  productId: number;
  quantity: number;
};

type OrderPayload = {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  items: OrderItemInput[];
  city: string;
  deliveryMethod: string;
  deliveryPrice: number;
  deliveryType: "door" | "pvz";
  pvzAddress?: string;
  pvzCode?: string;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as OrderPayload;

  if (isBlank(payload.firstName)) {
    return NextResponse.json({ error: "Введите имя" }, { status: 400 });
  }

  if (isBlank(payload.lastName)) {
    return NextResponse.json({ error: "Введите фамилию" }, { status: 400 });
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

  if (payload.deliveryType === "pvz" && (isBlank(payload.pvzAddress) || isBlank(payload.pvzCode))) {
    return NextResponse.json({ error: "Выберите пункт выдачи" }, { status: 400 });
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
    SELECT id, name, price, stock_quantity FROM products WHERE id = ANY(${productIds})
  `;

  const productById = new Map(products.map((p) => [p.id as number, p]));

  for (const item of payload.items) {
    const product = productById.get(item.productId);
    if (!product) {
      return NextResponse.json({ error: "Товар не найден" }, { status: 400 });
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      return NextResponse.json({ error: "Некорректное количество" }, { status: 400 });
    }
  }

  // Резервируем товар атомарно построчно: WHERE stock_quantity >= qty гарантирует,
  // что при двух одновременных заказах на один и тот же товар решение "хватает
  // ли остатка" принимает сама БД на уровне блокировки строки, а не наш код —
  // выигрывает только тот запрос, который правда успевает первым списать остаток.
  // Если какой-то товар в заказе не резервируется — откатываем то, что уже
  // списали в рамках этого же запроса, и не создаём заказ вообще.
  const reserved: { productId: number; quantity: number }[] = [];
  for (const item of payload.items) {
    const product = productById.get(item.productId)!;
    const [updated] = await sql`
      UPDATE products
      SET stock_quantity = stock_quantity - ${item.quantity},
          in_stock = (stock_quantity - ${item.quantity}) > 0
      WHERE id = ${item.productId} AND stock_quantity >= ${item.quantity}
      RETURNING id
    `;

    if (!updated) {
      await restockItems(reserved);

      const [{ stock_quantity: available }] = await sql`
        SELECT stock_quantity FROM products WHERE id = ${item.productId}
      `;
      return NextResponse.json(
        {
          error:
            Number(available) > 0
              ? `Товара «${product.name}» осталось только ${available} шт — уменьшите количество в заказе`
              : `Товар «${product.name}» только что закончился`,
        },
        { status: 409 },
      );
    }

    reserved.push({ productId: item.productId, quantity: item.quantity });
  }

  const itemsTotal = payload.items.reduce((sum, item) => {
    const product = productById.get(item.productId)!;
    return sum + Number(product.price) * item.quantity;
  }, 0);
  const deliveryPrice = Number(payload.deliveryPrice);
  const total = itemsTotal + deliveryPrice;

  // Остаток уже зарезервирован (списан) выше. Если создание самого заказа
  // не удастся — возвращаем остаток обратно и не оставляем в БД ни заказ,
  // ни его позиции, чтобы не "терять" товар со склада без реального заказа.
  let order: { id: number };
  try {
    // customer_name сохраняется и дальше — только ради обратной совместимости
    // со старыми записями/отчётами, которые могли бы на него полагаться.
    // Для отображения везде используются first_name/last_name.
    const customerName = `${payload.firstName.trim()} ${payload.lastName.trim()}`.trim();
    [order] = (await sql`
      INSERT INTO orders (
        customer_name, first_name, last_name, phone, email, status, total,
        delivery_city, delivery_method, delivery_price, delivery_pvz_address, delivery_pvz_code,
        payment_status
      )
      VALUES (
        ${customerName}, ${payload.firstName.trim()}, ${payload.lastName.trim()},
        ${payload.phone}, ${payload.email ?? null}, 'новый', ${total},
        ${payload.city}, ${payload.deliveryMethod}, ${deliveryPrice},
        ${payload.pvzAddress ?? ""}, ${payload.pvzCode ?? ""},
        'ожидает оплаты'
      )
      RETURNING id
    `) as { id: number }[];

    for (const item of payload.items) {
      const product = productById.get(item.productId)!;
      await sql`
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES (${order.id}, ${item.productId}, ${item.quantity}, ${product.price})
      `;
    }
  } catch (err) {
    await restockItems(reserved);
    console.error("Не удалось создать заказ после резервирования остатка:", err);
    return NextResponse.json({ error: "Не удалось оформить заказ, попробуйте ещё раз" }, { status: 500 });
  }

  // Заказ и его позиции уже в базе, остаток зарезервирован. Дальше пытаемся
  // создать платёж в ЮKassa — если это не получится, полностью откатываем
  // и заказ, и резерв: без платежа заказ не имеет смысла оставлять висеть.
  try {
    const returnUrl = new URL(`/order/${order.id}`, request.url).toString();
    const receipt = buildOrderReceipt({
      customerEmail: payload.email,
      customerPhone: payload.phone,
      items: payload.items.map((item) => ({
        name: productById.get(item.productId)!.name,
        price: Number(productById.get(item.productId)!.price),
        quantity: item.quantity,
      })),
      deliveryMethod: payload.deliveryMethod,
      deliveryPrice,
    });
    const payment = await createYookassaPayment({
      amount: total,
      orderId: order.id,
      returnUrl,
      description: `Заказ №${order.id}`,
      receipt,
    });

    if (!payment.confirmation?.confirmation_url) {
      throw new YookassaApiError("ЮKassa не вернула ссылку на оплату");
    }

    await sql`UPDATE orders SET yookassa_payment_id = ${payment.id} WHERE id = ${order.id}`;

    return NextResponse.json({ orderId: order.id, confirmationUrl: payment.confirmation.confirmation_url });
  } catch (err) {
    await sql`DELETE FROM order_items WHERE order_id = ${order.id}`;
    await sql`DELETE FROM orders WHERE id = ${order.id}`;
    await restockItems(reserved);
    console.error("Не удалось создать платёж ЮKassa:", err);
    return NextResponse.json(
      { error: "Не удалось создать платёж. Попробуйте оформить заказ ещё раз." },
      { status: 502 },
    );
  }
}
