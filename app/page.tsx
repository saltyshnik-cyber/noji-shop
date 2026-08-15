import Link from "next/link";
import { ensureSchema, sql } from "@/lib/db";

export const dynamic = "force-dynamic";

const HERO_IMAGE =
  "https://h8pxe4fhemspu7gv.public.blob.vercel-storage.com/noj%203%20%282%29-5oXLXKxkxpEWDMMVc94XOhBEoSMJt1.PNG";

const FEATURED_PRODUCT_NAMES = [
  "Турист №2",
  "Охотник, съёмная рукоять",
  "Охотник, карельская берёза №2",
  "Охотник, карельская берёза",
  "Охотник",
];

type FeaturedProduct = {
  id: number;
  name: string;
  price: string;
  photo_url: string;
  steel: string;
  blade_length_mm: number | null;
  handle_material: string;
};

async function getFeaturedProducts(): Promise<FeaturedProduct[]> {
  await ensureSchema();
  const rows = (await sql`
    SELECT id, name, price, photo_url, steel, blade_length_mm, handle_material
    FROM products
    WHERE name = ANY(${FEATURED_PRODUCT_NAMES})
  `) as FeaturedProduct[];

  const byName = new Map(rows.map((r) => [r.name, r]));
  return FEATURED_PRODUCT_NAMES.map((name) => byName.get(name)).filter(
    (p): p is FeaturedProduct => p !== undefined,
  );
}

type Review = { name: string; date: string; text: string };

const REVIEWS: Review[] = [
  {
    name: "Роман",
    date: "22 июля",
    text: "Понравился дизайн, литьё оригинальное, неизбитое. Гарда тонковата на мой взгляд. В целом, хороший нож, острый.",
  },
  {
    name: "Покупатель",
    date: "13 июля",
    text: "Нож пришёл раньше времени хорошего качества, хорошо заточенный. Большое спасибо производителю.",
  },
  {
    name: "Роман",
    date: "7 июля",
    text: "Нож просто огонь, острый, аккуратно сделан. Продавцу большое спасибо. И мастеру особая благодарность",
  },
  {
    name: "Олег",
    date: "19 июня",
    text: "На днях получил нож охотник ручной работы, я просто в восторге, этот нож произведение искусства, сделан очень качественно и с душой, пользоваться одно удовольствие, всем советую!",
  },
  {
    name: "Покупатель",
    date: "23 мая",
    text: "На самом деле это суперский идеальный нож из отличной стали, годится даже для кухни. Ножны отличные. Хорош и для подарка",
  },
  {
    name: "Александр",
    date: "24 мая",
    text: "Форма лезвия понравилась, спуски ровные.",
  },
];

function HeroSection() {
  return (
    <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden border-b border-neutral-800">
      <img src={HERO_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />
      <div className="relative z-10 mx-auto max-w-2xl px-4 text-center">
        <h1 className="text-4xl font-black uppercase tracking-wide text-white sm:text-6xl">Ножи для жизни</h1>
        <p className="mt-4 text-lg text-slate-300 sm:text-xl">Кованые ножи ручной работы</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/products"
            className="rounded bg-red-800 px-8 py-3 text-lg font-semibold text-white transition hover:bg-red-700"
          >
            Перейти в каталог
          </Link>
          <a
            href="#reviews"
            className="rounded border border-slate-400 px-8 py-3 text-lg font-semibold text-slate-200 transition hover:border-white hover:text-white"
          >
            Отзывы
          </a>
          <a
            href="#contacts"
            className="rounded border border-slate-400 px-8 py-3 text-lg font-semibold text-slate-200 transition hover:border-white hover:text-white"
          >
            Контакты
          </a>
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section className="border-b border-neutral-800 bg-neutral-900">
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">О мастерской</h2>
        <p className="mt-4 text-slate-300">
          Каждый нож куётся вручную из инструментальной стали и собирается из натуральных материалов — дерева, кожи
          и металла. Мы не делаем массовых партий: клинок, рукоять и ножны на каждом изделии подгоняются
          индивидуально, с вниманием к балансу и деталям.
        </p>
      </div>
    </section>
  );
}

function FeaturedProductCard({ p }: { p: FeaturedProduct }) {
  return (
    <Link
      href={`/products/${p.id}`}
      className="flex w-64 shrink-0 snap-start flex-col overflow-hidden rounded-lg bg-neutral-900 transition hover:brightness-110 sm:w-auto"
    >
      <div className="aspect-[4/5] w-full">
        <img src={p.photo_url} alt={p.name} className="h-full w-full object-cover object-center" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 min-h-[3.5rem] text-lg font-semibold text-white">{p.name}</h3>
        <dl className="space-y-1 text-xs text-slate-400">
          {p.steel && (
            <div>
              <dt className="inline font-medium">Сталь: </dt>
              <dd className="inline">{p.steel}</dd>
            </div>
          )}
          {p.blade_length_mm != null && (
            <div>
              <dt className="inline font-medium">Длина клинка: </dt>
              <dd className="inline">{p.blade_length_mm} мм</dd>
            </div>
          )}
          {p.handle_material && (
            <div>
              <dt className="inline font-medium">Рукоять: </dt>
              <dd className="inline">{p.handle_material}</dd>
            </div>
          )}
        </dl>
        <p className="mt-auto pt-2 text-xl font-bold text-white">{Number(p.price).toLocaleString("ru-RU")} ₽</p>
      </div>
    </Link>
  );
}

function FeaturedProductsSection({ products }: { products: FeaturedProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section className="border-b border-neutral-800">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-8 text-center text-2xl font-bold text-white sm:text-3xl">Популярные модели</h2>
        <div className="flex flex-nowrap gap-4 overflow-x-auto overscroll-x-contain snap-x snap-mandatory pb-2 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:pb-0 lg:grid-cols-5">
          {products.map((p) => (
            <FeaturedProductCard key={p.id} p={p} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/products"
            className="inline-block rounded border border-slate-500 px-6 py-2 font-medium text-slate-200 transition hover:border-red-700 hover:bg-red-800 hover:text-white"
          >
            Смотреть весь каталог
          </Link>
        </div>
      </div>
    </section>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="flex w-72 shrink-0 snap-start flex-col gap-2 rounded-lg border border-neutral-700 bg-neutral-900 p-5 sm:w-auto">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-white">{review.name}</span>
        <span className="shrink-0 text-xs text-slate-400">{review.date}</span>
      </div>
      <div className="text-slate-300" aria-label="Оценка: 5 из 5 звёзд">
        ★★★★★
      </div>
      <p className="line-clamp-5 min-h-[6.25rem] text-sm text-slate-300">{review.text}</p>
    </div>
  );
}

function ReviewsSection() {
  return (
    <section id="reviews" className="scroll-mt-16 border-b border-neutral-800 bg-neutral-900">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-8 text-center text-2xl font-bold text-white sm:text-3xl">Отзывы</h2>
        <div className="flex flex-nowrap gap-4 overflow-x-auto overscroll-x-contain snap-x snap-mandatory pb-2 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:pb-0 lg:grid-cols-3">
          {REVIEWS.map((review, i) => (
            <ReviewCard key={i} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactsSection() {
  return (
    <section id="contacts" className="scroll-mt-16">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="mb-8 text-center text-2xl font-bold text-white sm:text-3xl">Контакты и доставка</h2>
        <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-3">
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Телефон</h3>
            <p className="text-lg text-white">+7 (000) 000-00-00</p>
          </div>
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Мастерская</h3>
            <p className="text-lg text-white">г. Москва, ул. Примерная, 1</p>
          </div>
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Доставка</h3>
            <p className="text-lg text-white">По России, 3–7 рабочих дней</p>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-slate-500">Контактные данные временные — уточним и заменим позже.</p>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <main className="min-w-0 bg-neutral-950">
      <HeroSection />
      <AboutSection />
      <FeaturedProductsSection products={featuredProducts} />
      <ReviewsSection />
      <ContactsSection />
    </main>
  );
}
