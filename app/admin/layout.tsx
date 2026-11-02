import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Админка — Ножи для жизни",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-gray-50 text-gray-900 [color-scheme:light]">{children}</div>;
}
