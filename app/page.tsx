import Link from "next/link";
import { ensureSchema, sql } from "@/lib/db";
import { getSiteSettings, phoneToTelHref } from "@/lib/siteSettings";

export const dynamic = "force-dynamic";

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

type Review = { name: string; date: string; text: string; rating: number };

const REVIEWS: Review[] = [
  {
    name: "Роман",
    date: "22 июля",
    text: "Понравился дизайн, литьё оригинальное, неизбитое. Гарда тонковата на мой взгляд. В целом, хороший нож, острый.",
    rating: 5,
  },
  {
    name: "Покупатель",
    date: "13 июля",
    text: "Нож пришёл раньше времени хорошего качества, хорошо заточенный. Большое спасибо производителю.",
    rating: 5,
  },
  {
    name: "Роман",
    date: "7 июля",
    text: "Нож просто огонь, острый, аккуратно сделан. Продавцу большое спасибо. И мастеру особая благодарность",
    rating: 5,
  },
  {
    name: "Олег",
    date: "19 июня",
    text: "На днях получил нож охотник ручной работы, я просто в восторге, этот нож произведение искусства, сделан очень качественно и с душой, пользоваться одно удовольствие, всем советую!",
    rating: 5,
  },
  {
    name: "Покупатель",
    date: "23 мая",
    text: "На самом деле это суперский идеальный нож из отличной стали, годится даже для кухни. Ножны отличные. Хорош и для подарка",
    rating: 5,
  },
  {
    name: "Александр",
    date: "24 мая",
    text: "Форма лезвия понравилась, спуски ровные.",
    rating: 5,
  },
];

const AVERAGE_RATING = (REVIEWS.reduce((sum, r) => sum + r.rating, 0) / REVIEWS.length).toFixed(1);

type HeroIconName = "star" | "shield" | "clock" | "hammer";

function HeroIcon({ name }: { name: HeroIconName }) {
  const common = { viewBox: "0 0 24 24", className: "h-6 w-6 shrink-0 text-red-700" };
  switch (name) {
    case "star":
      return (
        <svg {...common} fill="currentColor">
          <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7L5.8 21l1.6-7L2 9.2l7.1-.6L12 2z" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </svg>
      );
    case "hammer":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 5.5l4 4-2 2-4-4 2-2z" />
          <path d="M12.5 7.5L4.8 15.2a2 2 0 000 2.8l1.2 1.2a2 2 0 002.8 0l7.7-7.7" />
        </svg>
      );
  }
}

const HERO_FEATURES: { icon: HeroIconName; label: string; sub: string }[] = [
  { icon: "star", label: `${AVERAGE_RATING} рейтинг`, sub: `${REVIEWS.length} отзывов` },
  { icon: "shield", label: "Не является ХО", sub: "Сертифицировано" },
  { icon: "clock", label: "Соблюдаем сроки", sub: "Точно в срок" },
  { icon: "hammer", label: "Ручная ковка", sub: "Натуральные материалы" },
];

function HeroSection({ heroImageUrl, shopName, shopSubtitle }: { heroImageUrl: string; shopName: string; shopSubtitle: string }) {
  return (
    <section className="relative flex min-h-[80vh] items-end justify-center overflow-hidden border-b border-neutral-800">
      <img src={heroImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 text-left sm:px-8 sm:pb-20">
        <div className="max-w-xl">
          <div className="mb-6 leading-none">
            <p className="text-2xl font-black uppercase tracking-wide text-white sm:text-3xl sm:tracking-wider">
              {shopName}
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              {shopSubtitle}
            </p>
          </div>

          <a
            href="#reviews"
            className="inline-flex items-center gap-2 rounded-full border border-slate-500 bg-black/40 px-4 py-1.5 text-sm text-slate-200 transition hover:border-white hover:text-white"
          >
            <span className="text-slate-300">★★★★★</span>
            <span>
              {AVERAGE_RATING} · {REVIEWS.length} отзывов
            </span>
          </a>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Сталь · Точность · Надёжность каждой детали
          </p>

          <h1 className="mt-3 text-4xl font-black uppercase leading-tight text-white sm:text-6xl">
            Нож с <span className="text-red-600">характером</span>,
            <br />
            кован вручную
          </h1>

          <p className="mt-4 max-w-md text-lg text-slate-300">
            Кованые ножи ручной работы — финки, охотничьи, туристические, кухонные.
          </p>

          <Link
            href="/products"
            className="mt-8 inline-block rounded bg-red-800 px-10 py-4 text-lg font-semibold text-white transition hover:bg-red-700"
          >
            Перейти в каталог
          </Link>
        </div>
      </div>
    </section>
  );
}

function TrustFeaturesSection() {
  return (
    <section className="border-b border-neutral-800">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 sm:gap-6">
          {HERO_FEATURES.map((f) => (
            <div key={f.label} className="flex items-start gap-2">
              <HeroIcon name={f.icon} />
              <div>
                <p className="text-sm font-semibold text-white">{f.label}</p>
                <p className="text-xs text-slate-400">{f.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutSection({
  aboutText,
  authorName,
  authorTitle,
}: {
  aboutText: string;
  authorName: string;
  authorTitle: string;
}) {
  return (
    <section className="border-b border-neutral-800 bg-neutral-900">
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">О мастерской</h2>
        <p className="mt-4 whitespace-pre-line text-slate-300">{aboutText}</p>
        <p className="mt-4 text-sm text-slate-500">
          — {authorName}, {authorTitle}
        </p>
      </div>
    </section>
  );
}

function ExclusiveGallerySection({ images }: { images: string[] }) {
  if (images.length === 0) return null;

  return (
    <section className="border-b border-neutral-800">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-8 text-center text-2xl font-bold text-white sm:text-3xl">Эксклюзивные авторские работы</h2>
        <div className="flex flex-nowrap gap-4 overflow-x-auto overscroll-x-contain snap-x snap-mandatory pb-2 sm:grid sm:grid-cols-4 sm:gap-6 sm:overflow-visible sm:pb-0">
          {images.map((src, i) => (
            <div key={i} className="w-64 shrink-0 snap-start sm:w-auto">
              <div className="aspect-[4/5] overflow-hidden rounded-lg bg-neutral-900">
                <img
                  src={src}
                  alt=""
                  className="h-full w-full object-cover object-center transition hover:scale-105"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedProductCard({ p }: { p: FeaturedProduct }) {
  return (
    <Link
      href={`/products/${p.id}`}
      className="flex w-64 shrink-0 snap-start flex-col overflow-hidden rounded-lg bg-neutral-900 transition hover:shadow-lg hover:shadow-red-900/40 sm:w-auto"
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
            className="inline-block rounded bg-red-800 px-6 py-2 font-medium text-white transition hover:bg-red-700"
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

function ContactsSection({ phone, address, delivery }: { phone: string; address: string; delivery: string }) {
  return (
    <section id="contacts" className="scroll-mt-16">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="mb-8 text-center text-2xl font-bold text-white sm:text-3xl">Контакты и доставка</h2>
        <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-3">
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Телефон</h3>
            <a href={phoneToTelHref(phone)} className="text-lg text-white hover:text-red-500 hover:underline">
              {phone}
            </a>
          </div>
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Мастерская</h3>
            <p className="text-lg text-white">{address}</p>
          </div>
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Доставка</h3>
            <p className="text-lg text-white">{delivery}</p>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-slate-500">Контактные данные временные — уточним и заменим позже.</p>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const [featuredProducts, settings] = await Promise.all([getFeaturedProducts(), getSiteSettings()]);

  return (
    <main className="min-w-0 bg-neutral-950">
      <HeroSection heroImageUrl={settings.heroImageUrl} shopName={settings.shopName} shopSubtitle={settings.shopSubtitle} />
      <TrustFeaturesSection />
      <AboutSection
        aboutText={settings.aboutText}
        authorName={settings.aboutAuthorName}
        authorTitle={settings.aboutAuthorTitle}
      />
      <FeaturedProductsSection products={featuredProducts} />
      <ReviewsSection />
      <ExclusiveGallerySection images={settings.galleryImages} />
      <ContactsSection phone={settings.contactPhone} address={settings.contactAddress} delivery={settings.contactDelivery} />
    </main>
  );
}
