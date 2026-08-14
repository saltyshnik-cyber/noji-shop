export const categories = ["Туристические", "Охотничьи", "Финка НКВД", "Кухонные"] as const;

export type SeedProduct = {
  category: (typeof categories)[number];
  name: string;
  description: string;
  price: number;
  photo: string;
  steel: string;
  blade_length_mm: number | null;
  handle_material: string;
  in_stock: boolean;
};

const PHOTO_BASE = "https://h8pxe4fhemspu7gv.public.blob.vercel-storage.com/";

const photo = (fileName: string) => PHOTO_BASE + fileName;

export const products: SeedProduct[] = [
  {
    category: "Финка НКВД",
    name: "Финка НКВД мельхиор, рукоять граб",
    description:
      "Авторское литьё мельхиор, кованая сталь 110Х18, твёрдость 60 HRC. Ножны из натуральной кожи в комплекте.",
    price: 4000,
    photo: photo("noj%201%20%285%29-4Zr4mGpk2z69ArihfKwOwL9bynC0CF.PNG"),
    steel: "110Х18",
    blade_length_mm: null,
    handle_material: "Граб",
    in_stock: true,
  },
  {
    category: "Финка НКВД",
    name: "Финка НКВД мельхиор, рукоять венге",
    description:
      "Авторское литьё мельхиор, кованая сталь 110Х18, твёрдость 60 HRC. Ножны из натуральной кожи в комплекте.",
    price: 4000,
    photo: photo("noj%202%20%286%29-IveGPr2tJrlTexfPuaMhbWxZBLTNoO.PNG"),
    steel: "110Х18",
    blade_length_mm: null,
    handle_material: "Венге",
    in_stock: true,
  },
  {
    category: "Охотничьи",
    name: "Охотник",
    description:
      "Кованая сталь 110Х18, твёрдость 60 HRC, рукоять береста + граб, ножны кожа. Не является холодным оружием, сертифицирован. Ширина клинка 32 мм, обух 3.5 мм.",
    price: 3950,
    photo: photo("noj%203%20%282%29-5oXLXKxkxpEWDMMVc94XOhBEoSMJt1.PNG"),
    steel: "110Х18",
    blade_length_mm: 140,
    handle_material: "Береста + граб",
    in_stock: true,
  },
  {
    category: "Охотничьи",
    name: "Пуукко",
    description: "Кованая сталь 110Х18, твёрдость 60 HRC, рукоять граб, ножны кожа. Ширина клинка 28 мм, обух 3.5 мм.",
    price: 4100,
    photo: photo("noj%204%20%281%29-umrTgUBU5ArDDA1oAadod2nmJNHmNx.PNG"),
    steel: "110Х18",
    blade_length_mm: 135,
    handle_material: "Граб",
    in_stock: true,
  },
  {
    category: "Охотничьи",
    name: "Охотник, сталь Х12МФ венге",
    description: "Кованая сталь Х12МФ, твёрдость 61 HRC, финиш сатин, рукоять венге, ручная работа, ножны кожа.",
    price: 3750,
    photo: photo("noj%205%20%2816%29-g9gVkwtW9jDJ82IOPtpkH5LXP4pUeL.PNG"),
    steel: "Х12МФ",
    blade_length_mm: null,
    handle_material: "Венге",
    in_stock: true,
  },
  {
    category: "Охотничьи",
    name: "Охотник малый",
    description:
      "Кованая сталь Х12МФ, твёрдость 61-62 HRC, рукоять граб, ножны кожа, сертифицирован. Ширина клинка 34 мм, обух 3 мм.",
    price: 3750,
    photo: photo("noj%206%20%2815%29-PG5KKy2MqGblIGf9nwCnZ8chVOTA5O.PNG"),
    steel: "Х12МФ",
    blade_length_mm: 110,
    handle_material: "Граб",
    in_stock: true,
  },
  {
    category: "Финка НКВД",
    name: "Финка НКВД 95х18 со звездой",
    description:
      "Кованая сталь 95Х18, твёрдость 59 HRC, тыльник и гарда — латунь. Общая длина 255 мм, ножны кожа, сертифицирован.",
    price: 3950,
    photo: photo("noj%207%20%2814%29-b32j3c2b8T08yEjR2SEhe2frFJzysw.PNG"),
    steel: "95Х18",
    blade_length_mm: 135,
    handle_material: "",
    in_stock: true,
  },
  {
    category: "Охотничьи",
    name: "Охотник, карельская берёза",
    description: "Кованая сталь 110Х18, твёрдость 60 HRC, рукоять — стабилизированная карельская берёза, ножны кожа, ручная работа.",
    price: 4000,
    photo: photo("noj%208%20%288%29-l13Tsg2mYJYG74eeFo8RAbc8TBEKif.PNG"),
    steel: "110Х18",
    blade_length_mm: null,
    handle_material: "Стабилизированная карельская берёза",
    in_stock: true,
  },
  {
    category: "Охотничьи",
    name: "Охотник, рукоять граб",
    description: "Кованая сталь 110Х18, твёрдость 60 HRC, рукоять граб, ножны кожа. Ширина клинка 33 мм, обух 3.5 мм.",
    price: 3950,
    photo: photo("noj%209%20%289%29-VV1ZITehk6kzqunUN3LJugwZu0J4av.PNG"),
    steel: "110Х18",
    blade_length_mm: 140,
    handle_material: "Граб",
    in_stock: true,
  },
  {
    category: "Туристические",
    name: "Турист",
    description:
      "Цельнометаллический, кованая сталь 110Х18, твёрдость 60 HRC, рукоять G10, ножны кожа, сертифицирован. Ширина клинка 32 мм, обух 3 мм.",
    price: 4100,
    photo: photo("noj%2010%20%2810%29-2bqcT5LwuXbueirdY16RNFZaPRF9iZ.PNG"),
    steel: "110Х18",
    blade_length_mm: 110,
    handle_material: "G10",
    in_stock: true,
  },
  {
    category: "Кухонные",
    name: "Пчак",
    description: "Кухонный нож ручной работы. Длина лезвия 160 мм.",
    price: 4000,
    photo: photo("noj%2011%20%2811%29-BYYUtZ04w6PE7qMbtsPFh2NlWC9ZbQ.PNG"),
    steel: "",
    blade_length_mm: 160,
    handle_material: "",
    in_stock: true,
  },
  {
    category: "Охотничьи",
    name: "Охотник малый, эластрон",
    description:
      "Рукоять эластрон, хвостовик через всю рукоять, кованая сталь Х12МФ, твёрдость 61-62 HRC. Ширина клинка 33 мм, обух 3 мм. Ножны кожа.",
    price: 3200,
    photo: photo("noj%2012%20%2812%29-v9FGSWaippyxLF0HBSQ4HuYYaHykq9.PNG"),
    steel: "Х12МФ",
    blade_length_mm: 110,
    handle_material: "Эластрон",
    in_stock: true,
  },
  {
    category: "Кухонные",
    name: "Филейный Турист",
    description:
      "Кованая сталь 110Х18, твёрдость 60 HRC, рукоять чёрный граб, бритвенная заточка, ножны кожа. Ширина клинка 22 мм, обух 2 мм.",
    price: 3850,
    photo: photo("noj%2013%20%2813%29-w5v3iGZopIHPHj0iKxfGWfVgHBTQ35.PNG"),
    steel: "110Х18",
    blade_length_mm: 190,
    handle_material: "Чёрный граб",
    in_stock: true,
  },
  {
    category: "Охотничьи",
    name: "Охотник, карельская берёза №2",
    description: "Кованая сталь 110Х18, твёрдость 60 HRC, рукоять — стабилизированная карельская берёза, ножны кожа, ручная работа.",
    price: 4000,
    photo: photo("noj%2014%20%287%29-5zXICZIYn6Rz1XicRRJFTRWW7zrIby.PNG"),
    steel: "110Х18",
    blade_length_mm: null,
    handle_material: "Стабилизированная карельская берёза",
    in_stock: true,
  },
  {
    category: "Охотничьи",
    name: "Охотник, съёмная рукоять",
    description:
      "Кованая сталь 110Х18, твёрдость 60 HRC, хвостовик с темлячной трубкой, рукоять эластрон (съёмная), ножны из телячьей кожи, сертифицирован. Ширина клинка 32 мм, обух 3 мм.",
    price: 3250,
    photo: photo("noj%2015%20%283%29-WeY0CVuNkiY3nZkqMmn5cOYrvBOh3I.PNG"),
    steel: "110Х18",
    blade_length_mm: 140,
    handle_material: "Эластрон (съёмная)",
    in_stock: true,
  },
  {
    category: "Туристические",
    name: "Турист №2",
    description:
      "Цельнометаллический, кованая сталь 110Х18, твёрдость 60 HRC, рукоять G10, ножны кожа, сертифицирован. Ширина клинка 32 мм, обух 3 мм.",
    price: 4100,
    photo: photo("noj%2016%20%284%29-KjWEyVbKIvsiukzWzreWnGd67Kn9s7.PNG"),
    steel: "110Х18",
    blade_length_mm: 110,
    handle_material: "G10",
    in_stock: true,
  },
];
