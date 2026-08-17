import Link from "next/link";
import type { Metadata } from "next";
import { getSiteSettings, phoneToTelHref } from "@/lib/siteSettings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: `Реквизиты продавца | ${settings.shopName}`,
    description: `Юридические реквизиты и контакты продавца интернет-магазина «${settings.shopName}».`,
    alternates: { canonical: "/requisites" },
  };
}

export default async function RequisitesPage() {
  const settings = await getSiteSettings();

  return (
    <main className="min-w-0">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link href="/" className="mb-6 inline-block text-sm text-red-900 transition hover:text-red-700">
          ← На главную
        </Link>

        <h1 className="mb-8 text-2xl font-bold">Реквизиты продавца</h1>

        <dl className="flex flex-col gap-4 text-sm text-gray-700">
          <div>
            <dt className="font-medium text-gray-900">Наименование продавца</dt>
            <dd className="mt-0.5">{settings.legalName}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-900">ИНН</dt>
            <dd className="mt-0.5">{settings.legalInn}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-900">ОГРН/ОГРНИП</dt>
            <dd className="mt-0.5">{settings.legalOgrn}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-900">Юридический адрес</dt>
            <dd className="mt-0.5">{settings.legalAddress}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-900">Фактический адрес / адрес мастерской</dt>
            <dd className="mt-0.5">{settings.contactAddress}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-900">Телефон</dt>
            <dd className="mt-0.5">
              <a href={phoneToTelHref(settings.contactPhone)} className="text-red-700 hover:underline">
                {settings.contactPhone}
              </a>
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-900">Email</dt>
            <dd className="mt-0.5">
              <a href={`mailto:${settings.contactEmail}`} className="text-red-700 hover:underline">
                {settings.contactEmail}
              </a>
            </dd>
          </div>
        </dl>

        <p className="mt-8 text-xs text-gray-400">
          См. также{" "}
          <Link href="/oferta" className="text-red-700 hover:underline">
            публичную оферту
          </Link>{" "}
          и{" "}
          <Link href="/privacy" className="text-red-700 hover:underline">
            политику конфиденциальности
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
