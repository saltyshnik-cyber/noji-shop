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
