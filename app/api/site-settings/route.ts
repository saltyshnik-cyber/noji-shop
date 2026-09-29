import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/siteSettings";

// Дёргается клиентским JS из SiteHeader и SiteFooter на каждой странице сайта.
// Настройки меняются только вручную из админки — без этого кэша каждый заход
// на любую страницу означал ещё 2 похода в БД сверх основного запроса страницы.
export const revalidate = 300;

export async function GET() {
  const { shopName, shopSubtitle, contactPhone, contactEmail } = await getSiteSettings();
  return NextResponse.json({ shopName, shopSubtitle, contactPhone, contactEmail });
}
