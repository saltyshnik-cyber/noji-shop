import { ensureSchema, sql } from "@/lib/db";

export type SiteSettings = {
  shopName: string;
  shopSubtitle: string;
  aboutText: string;
  aboutAuthorName: string;
  aboutAuthorTitle: string;
  contactPhone: string;
  contactAddress: string;
  contactDelivery: string;
  heroImageUrl: string;
  galleryImages: string[];
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  shopName: "Ножи для жизни",
  shopSubtitle: "Мастерская Стрижова А.С.",
  aboutText:
    "Каждый нож куётся вручную из инструментального стиля и собирается из натуральных материалов — дерева, кожи и металла. Мы не делаем массовых партий: клинок, рукоять и ножны на каждом изделии подгоняются индивидуально, с вниманием к балансу и деталям.",
  aboutAuthorName: "Алексей Стрижов",
  aboutAuthorTitle: "мастер-кузнец",
  contactPhone: "8 (960) 165-01-23",
  contactAddress: "г. Москва, ул. Примерная, 1",
  contactDelivery: "По России, 3–7 рабочих дней",
  heroImageUrl: "https://h8pxe4fhemspu7gv.public.blob.vercel-storage.com/IMG_0555-MesK0AHcQXR24RMzch5QVZU7RllU0a.JPG",
  galleryImages: [
    "https://h8pxe4fhemspu7gv.public.blob.vercel-storage.com/IMG_0554-H2zczzFItYrvFDJ40mxTnZ2eFLdJIh.JPG",
    "https://h8pxe4fhemspu7gv.public.blob.vercel-storage.com/IMG_0555-MesK0AHcQXR24RMzch5QVZU7RllU0a.JPG",
    "https://h8pxe4fhemspu7gv.public.blob.vercel-storage.com/IMG_0556-y6FlkA4AoKHlWet8XGGY3cUpvLTdhl.JPG",
    "https://h8pxe4fhemspu7gv.public.blob.vercel-storage.com/IMG_0557-ITrd5MNNZDC6Pd8YgcboBQ2lsbtCOy.JPG",
  ],
};

// Ключи хранения в site_settings(key, value) — galleryImages сериализуется в JSON.
const KEY_MAP: Record<keyof SiteSettings, string> = {
  shopName: "shop_name",
  shopSubtitle: "shop_subtitle",
  aboutText: "about_text",
  aboutAuthorName: "about_author_name",
  aboutAuthorTitle: "about_author_title",
  contactPhone: "contact_phone",
  contactAddress: "contact_address",
  contactDelivery: "contact_delivery",
  heroImageUrl: "hero_image_url",
  galleryImages: "gallery_images",
};

export async function getSiteSettings(): Promise<SiteSettings> {
  await ensureSchema();
  const rows = (await sql`SELECT key, value FROM site_settings`) as { key: string; value: string }[];
  const byKey = new Map(rows.map((r) => [r.key, r.value]));

  const settings = { ...DEFAULT_SITE_SETTINGS };
  for (const field of Object.keys(KEY_MAP) as (keyof SiteSettings)[]) {
    const raw = byKey.get(KEY_MAP[field]);
    if (raw === undefined) continue;
    if (field === "galleryImages") {
      try {
        settings.galleryImages = JSON.parse(raw);
      } catch {
        // повреждённый JSON — оставляем дефолт
      }
    } else {
      (settings as Record<string, unknown>)[field] = raw;
    }
  }
  return settings;
}

export async function saveSiteSettings(partial: Partial<SiteSettings>): Promise<void> {
  await ensureSchema();
  for (const field of Object.keys(partial) as (keyof SiteSettings)[]) {
    const key = KEY_MAP[field];
    const value = field === "galleryImages" ? JSON.stringify(partial.galleryImages) : String(partial[field]);
    await sql`
      INSERT INTO site_settings (key, value) VALUES (${key}, ${value})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `;
  }
}

export function phoneToTelHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("8") ? "7" + digits.slice(1) : digits;
  return `tel:+${normalized}`;
}
