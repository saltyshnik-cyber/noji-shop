export const categories = ["Туристические", "Охотничьи", "Финка НКВД", "Кухонные"] as const;

export type SeedProduct = {
  category: (typeof categories)[number];
  name: string;
  description: string;
  price: number;
  steel: string;
  blade_length_mm: number;
  handle_material: string;
  in_stock: boolean;
};

export const products: SeedProduct[] = [
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
