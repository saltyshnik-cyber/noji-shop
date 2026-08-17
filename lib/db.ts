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

let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL
        )
      `;
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
          in_stock BOOLEAN NOT NULL DEFAULT TRUE
        )
      `;
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
          delivery_pvz_code TEXT NOT NULL DEFAULT ''
        )
      `;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_city TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_method TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_price NUMERIC(10, 2) NOT NULL DEFAULT 0`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_pvz_address TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_pvz_code TEXT NOT NULL DEFAULT ''`;
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
