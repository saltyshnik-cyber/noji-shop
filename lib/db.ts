import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let sqlClient: NeonQueryFunction<false, false> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  if (!sqlClient) {
    const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error(
        "Не задана строка подключения к базе данных: заполните DATABASE_URL в .env.local",
      );
    }
    sqlClient = neon(connectionString);
  }
  return sqlClient;
}

export const sql: NeonQueryFunction<false, false> = ((...args: Parameters<NeonQueryFunction<false, false>>) =>
  getSql()(...args)) as NeonQueryFunction<false, false>;

export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\wа-яё-]/gi, "");
}

// Слаги для категорий, существовавших до перевода каталога на БД
// (были захардкожены в lib/categoryNav.ts) — сохраняем их при миграции,
// чтобы не сломать уже проиндексированные ссылки #hunting и т.п.
const LEGACY_CATEGORY_SLUGS: Record<string, string> = {
  "Финка НКВД": "finka-nkvd",
  "Охотничьи": "hunting",
  "Туристические": "tourist",
  "Кухонные": "kitchen",
};

// Одноразовая (по факту) миграция: проставляет slug и sort_order категориям,
// у которых их ещё нет. Каждая часть идемпотентна и безопасна при повторных
// вызовах — slug бэкфилится только пока пустой, sort_order — только пока
// вообще ни у одной категории не задан вручную (т.е. каталог ещё не
// настраивали через новую админку).
async function migrateCategoryDefaults(): Promise<void> {
  const rowsNeedingSlug = (await sql`SELECT id, name FROM categories WHERE slug = ''`) as {
    id: number;
    name: string;
  }[];
  for (const row of rowsNeedingSlug) {
    const slug = LEGACY_CATEGORY_SLUGS[row.name] ?? slugify(row.name) ?? `category-${row.id}`;
    await sql`UPDATE categories SET slug = ${slug} WHERE id = ${row.id}`;
  }

  const [{ count }] = (await sql`SELECT COUNT(*) FROM categories WHERE sort_order != 0`) as {
    count: string;
  }[];
  if (Number(count) === 0) {
    const allCategories = (await sql`SELECT id, name FROM categories ORDER BY id`) as {
      id: number;
      name: string;
    }[];
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

// Одноразовый (по факту) бэкфилл stock_quantity для товаров, заведённых до
// появления этого поля. Раньше наличие было просто галочкой in_stock —
// трактуем "была галочка" как "есть хотя бы 1 шт", чтобы уже опубликованные
// товары не пропали с сайта и не заблокировались для покупки сразу после
// миграции. Идемпотентно: как только у товара появляется реальное
// stock_quantity > 0, условие WHERE stock_quantity = 0 для него больше не
// совпадает, и повторные запуски его не трогают.
async function migrateProductStockDefaults(): Promise<void> {
  await sql`UPDATE products SET stock_quantity = 1 WHERE stock_quantity = 0 AND in_stock = TRUE`;
}

// Одноразовый бэкфилл first_name/last_name для заказов, оформленных до
// разделения поля "Имя" на имя и фамилию (нужно для накладных СДЭК).
// customer_name остаётся в таблице для обратной совместимости и продолжает
// заполняться при вставке, но для отображения везде используются уже
// first_name/last_name. Разбиваем по первому пробелу — это best-effort для
// старых записей, где имя и фамилия были одной строкой; если пробела нет,
// всё уходит в first_name. Идемпотентно: как только first_name у заказа
// становится непустым, WHERE first_name = '' для него больше не совпадает.
async function migrateOrderNameSplit(): Promise<void> {
  const rows = (await sql`
    SELECT id, customer_name FROM orders WHERE first_name = '' AND last_name = '' AND customer_name != ''
  `) as { id: number; customer_name: string }[];
  for (const row of rows) {
    const trimmed = row.customer_name.trim();
    const spaceIdx = trimmed.indexOf(" ");
    const firstName = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
    const lastName = spaceIdx === -1 ? "" : trimmed.slice(spaceIdx + 1).trim();
    await sql`UPDATE orders SET first_name = ${firstName}, last_name = ${lastName} WHERE id = ${row.id}`;
  }
}

let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
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
      await sql`
        CREATE TABLE IF NOT EXISTS order_items (
          id SERIAL PRIMARY KEY,
          order_id INTEGER NOT NULL REFERENCES orders(id),
          product_id INTEGER NOT NULL REFERENCES products(id),
          quantity INTEGER NOT NULL DEFAULT 1,
          price NUMERIC(10, 2) NOT NULL
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS site_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `;
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
    })();
  }
  return schemaReady;
}
