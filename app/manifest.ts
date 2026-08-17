import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ножи для жизни — Админка",
    short_name: "Админка",
    description: "Панель управления интернет-магазином «Ножи для жизни»",
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#991b1b",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
