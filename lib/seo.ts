// new URL(...).origin normalizes non-ASCII hostnames (e.g. Cyrillic .рф domains) to
// punycode — sitemap.xml/robots.txt require plain-ASCII URLs, so a raw Cyrillic
// domain in the env var would otherwise get emitted verbatim into <loc> and be
// rejected by Search Console as an invalid sitemap URL.
export const SITE_URL = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://knife-shop-five.vercel.app").origin;

export function truncateForMeta(text: string, maxLength = 160): string {
  const clean = text.trim().replace(/\s+/g, " ");
  if (clean.length <= maxLength) return clean;
  const cut = clean.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : maxLength)}…`;
}
