export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://knife-shop-five.vercel.app";

export function truncateForMeta(text: string, maxLength = 160): string {
  const clean = text.trim().replace(/\s+/g, " ");
  if (clean.length <= maxLength) return clean;
  const cut = clean.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : maxLength)}…`;
}
