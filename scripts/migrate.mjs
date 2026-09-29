// Создаёт/обновляет схему БД и гоняет одноразовые бэкфиллы. Раньше это
// (ensureSchema()) вызывалось на каждый заход на сайт из ~19 разных мест —
// то есть ~20 SQL-запросов на КАЖДЫЙ page load, даже когда схема уже год как
// не менялась. Это держало Neon-compute постоянно активным и съедало
// бесплатный лимит CU-часов. Теперь схема применяется один раз, руками,
// после деплоя, который её меняет:
//
//   npm run db:migrate
//
// Все операторы идемпотентны (IF NOT EXISTS / WHERE ...) — безопасно гонять
// повторно.

import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!connectionString) {
  throw new Error("Не задана строка подключения: заполните DATABASE_URL в .env.local");
}

const sql = neon(connectionString);

function slugify(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\wа-яё-]/gi, "");
}

// Слаги для категорий, существовавших до перевода каталога на БД — сохраняем
// их при миграции, чтобы не сломать уже проиндексированные ссылки #hunting.
const LEGACY_CATEGORY_SLUGS = {
  "Финка НКВД": "finka-nkvd",
  "Охотничьи": "hunting",
  "Туристические": "tourist",
  "Кухонные": "kitchen",
};

async function migrateCategoryDefaults() {
  const rowsNeedingSlug = await sql`SELECT id, name FROM categories WHERE slug = ''`;
  for (const row of rowsNeedingSlug) {
    const slug = LEGACY_CATEGORY_SLUGS[row.name] ?? slugify(row.name) ?? `category-${row.id}`;
    await sql`UPDATE categories SET slug = ${slug} WHERE id = ${row.id}`;
  }

  const [{ count }] = await sql`SELECT COUNT(*) FROM categories WHERE sort_order != 0`;
  if (Number(count) === 0) {
    const allCategories = await sql`SELECT id, name FROM categories ORDER BY id`;
    const knownOrder = Object.keys(LEGACY_CATEGORY_SLUGS);
    const sorted = [...allCategories].sort((a, b) => {
      const ai = knownOrder.indexOf(a.name);
      const bi = knownOrder.indexOf(b.name);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.id - b.id;
    });
    for (let i = 0; i < sorted.length; i++) {
      await sql`UPDATE categories SET sort_order = ${i} WHERE id = ${sorted[i].id}`;
    }
  }
}

// Бэкфилл stock_quantity для товаров, заведённых до появления этого поля.
async function migrateProductStockDefaults() {
  await sql`UPDATE products SET stock_quantity = 1 WHERE stock_quantity = 0 AND in_stock = TRUE`;
}

// Бэкфилл first_name/last_name для заказов, оформленных до разделения поля
// "Имя" на имя и фамилию.
async function migrateOrderNameSplit() {
  const rows = await sql`
    SELECT id, customer_name FROM orders WHERE first_name = '' AND last_name = '' AND customer_name != ''
  `;
  for (const row of rows) {
    const trimmed = row.customer_name.trim();
    const spaceIdx = trimmed.indexOf(" ");
    const firstName = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
    const lastName = spaceIdx === -1 ? "" : trimmed.slice(spaceIdx + 1).trim();
    await sql`UPDATE orders SET first_name = ${firstName}, last_name = ${lastName} WHERE id = ${row.id}`;
  }
}

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now()`;
  await migrateCategoryDefaults();
  console.log("✓ categories");

  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price NUMERIC(10, 2) NOT NULL,
      photo_url TEXT NOT NULL DEFAULT '',
      category_id INTEGER REFERENCES categories(id),
      steel TEXT NOT NULL DEFAULT '',
      blade_length_mm INTEGER,
      handle_material TEXT NOT NULL DEFAULT '',
      in_stock BOOLEAN NOT NULL DEFAULT TRUE,
      stock_quantity INTEGER NOT NULL DEFAULT 0
    )
  `;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0`;
  await migrateProductStockDefaults();
  console.log("✓ products");

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      status TEXT NOT NULL DEFAULT 'новый',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      total NUMERIC(10, 2) NOT NULL DEFAULT 0,
      delivery_city TEXT NOT NULL DEFAULT '',
      delivery_method TEXT NOT NULL DEFAULT '',
      delivery_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
      delivery_pvz_address TEXT NOT NULL DEFAULT '',
      delivery_pvz_code TEXT NOT NULL DEFAULT '',
      payment_status TEXT NOT NULL DEFAULT 'ожидает оплаты',
      yookassa_payment_id TEXT NOT NULL DEFAULT '',
      first_name TEXT NOT NULL DEFAULT '',
      last_name TEXT NOT NULL DEFAULT ''
    )
  `;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_city TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_method TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_price NUMERIC(10, 2) NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_pvz_address TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_pvz_code TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'ожидает оплаты'`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS yookassa_payment_id TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS first_name TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_name TEXT NOT NULL DEFAULT ''`;
  await migrateOrderNameSplit();
  console.log("✓ orders");

  await sql`
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL DEFAULT 1,
      price NUMERIC(10, 2) NOT NULL
    )
  `;
  console.log("✓ order_items");

  await sql`
    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `;
  console.log("✓ site_settings");

  await sql`
    CREATE TABLE IF NOT EXISTS product_images (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      type TEXT NOT NULL DEFAULT 'image' CHECK (type IN ('image', 'video'))
    )
  `;
  await sql`
    ALTER TABLE product_images
    ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'image' CHECK (type IN ('image', 'video'))
  `;
  console.log("✓ product_images");
}

main()
  .then(() => {
    console.log("\nСхема БД в актуальном состоянии.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Ошибка миграции:", err);
    process.exit(1);
  });
