import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("Не задана строка подключения: заполните DATABASE_URL в .env.local");
}

const sql = neon(connectionString);

const categories = ["Туристические", "Охотничьи", "Финка НКВД", "Кухонные"];

const products = [
  {
    category: "Туристические",
    name: "Турист-1",
    description: "Складной туристический нож с клинком из нержавеющей стали, удобен в походе.",
    price: 2490,
    steel: "440C",
    blade_length_mm: 95,
    handle_material: "G10",
    in_stock: true,
  },
  {
    category: "Туристические",
    name: "Скаут",
    description: "Компактный нож для похода и рыбалки, фиксированный клинок.",
    price: 3190,
    steel: "AUS-8",
    blade_length_mm: 110,
    handle_material: "Резина",
    in_stock: true,
  },
  {
    category: "Охотничьи",
    name: "Медведь",
    description: "Охотничий нож с широким клинком для разделки крупной дичи.",
    price: 4590,
    steel: "95Х18",
    blade_length_mm: 145,
    handle_material: "Орех",
    in_stock: true,
  },
  {
    category: "Охотничьи",
    name: "Соболь",
    description: "Лёгкий охотничий нож для снятия шкур, удобный хват.",
    price: 3990,
    steel: "65Х13",
    blade_length_mm: 120,
    handle_material: "Кожа",
    in_stock: false,
  },
  {
    category: "Охотничьи",
    name: "Клык",
    description: "Универсальный охотничий нож с долом, ножны в комплекте.",
    price: 5290,
    steel: "N690",
    blade_length_mm: 135,
    handle_material: "Стабилизированная древесина",
    in_stock: true,
  },
  {
    category: "Финка НКВД",
    name: "Финка НКВД классическая",
    description: "Реплика легендарного ножа образца НКВД, наборная рукоять.",
    price: 3790,
    steel: "У8",
    blade_length_mm: 128,
    handle_material: "Наборная кожа",
    in_stock: true,
  },
  {
    category: "Финка НКВД",
    name: "Финка НКВД люкс",
    description: "Финка НКВД с рукоятью из наборного оргстекла и латунным долом.",
    price: 4990,
    steel: "95Х18",
    blade_length_mm: 130,
    handle_material: "Оргстекло",
    in_stock: true,
  },
  {
    category: "Кухонные",
    name: "Шеф-нож 20 см",
    description: "Профессиональный шеф-нож для нарезки овощей и мяса.",
    price: 2990,
    steel: "X50CrMoV15",
    blade_length_mm: 200,
    handle_material: "Пластик",
    in_stock: true,
  },
  {
    category: "Кухонные",
    name: "Универсальный кухонный",
    description: "Небольшой универсальный нож для кухни на каждый день.",
    price: 1490,
    steel: "440A",
    blade_length_mm: 130,
    handle_material: "Пластик",
    in_stock: true,
  },
  {
    category: "Кухонные",
    name: "Нож для хлеба",
    description: "Нож с волнистым лезвием для нарезки хлеба и выпечки.",
    price: 1690,
    steel: "420",
    blade_length_mm: 190,
    handle_material: "Дерево",
    in_stock: false,
  },
];

async function main() {
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

  console.log("Схема готова. Очищаю старые данные...");
  await sql`DELETE FROM order_items`;
  await sql`DELETE FROM orders`;
  await sql`DELETE FROM products`;
  await sql`DELETE FROM categories`;

  const categoryIds = {};
  for (const name of categories) {
    const [row] = await sql`INSERT INTO categories (name) VALUES (${name}) RETURNING id`;
    categoryIds[name] = row.id;
  }
  console.log(`Добавлено категорий: ${categories.length}`);

  for (const p of products) {
    const photoUrl = `https://placehold.co/400x300?text=${encodeURIComponent(p.name)}`;
    await sql`
      INSERT INTO products
        (name, description, price, photo_url, category_id, steel, blade_length_mm, handle_material, in_stock)
      VALUES
        (${p.name}, ${p.description}, ${p.price}, ${photoUrl}, ${categoryIds[p.category]}, ${p.steel}, ${p.blade_length_mm}, ${p.handle_material}, ${p.in_stock})
    `;
  }
  console.log(`Добавлено товаров: ${products.length}`);
}

main()
  .then(() => {
    console.log("Готово.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Ошибка при заполнении базы:", err);
    process.exit(1);
  });
