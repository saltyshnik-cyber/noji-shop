import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Админка — Ножи для жизни",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Админка",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  other: {
    // Next.js сам добавляет современный mobile-web-app-capable; старые версии
    // iOS Safari понимают только этот, префиксный вариант — держим оба.
    "apple-mobile-web-app-capable": "yes",
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-gray-50 text-gray-900">{children}</div>;
}
