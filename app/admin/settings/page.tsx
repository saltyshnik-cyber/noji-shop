import { getSiteSettings } from "@/lib/siteSettings";
import AdminNav from "@/components/admin/AdminNav";
import SettingsForm from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <AdminNav />
      <h1 className="mt-6 mb-6 text-2xl font-bold">Настройки сайта</h1>
      <SettingsForm initial={settings} />
    </div>
  );
}
