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
          total NUMERIC(10, 2) NOT NULL DEFAULT 0
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS order_items (
          id SERIAL PRIMARY KEY,
          order_id INTEGER NOT NULL REFERENCES orders(id),
          product_id INTEGER NOT NULL REFERENCES products(id),
          quantity INTEGER NOT NULL DEFAULT 1,
          price NUMERIC(10, 2) NOT NULL
        )
      `;
    })();
  }
  return schemaReady;
}
