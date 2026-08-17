import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /order — страницы конкретных заказов с ФИО/телефоном/адресом покупателя,
      // /api — служебные JSON-эндпоинты, индексировать нечего.
      disallow: ["/admin", "/checkout", "/cart", "/order", "/api"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
