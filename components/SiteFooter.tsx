"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { phoneToTelHref } from "@/lib/siteSettings";

export function SiteFooter() {
  const [shopName, setShopName] = useState("Ножи для жизни");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.shopName) setShopName(data.shopName);
        if (data.contactPhone) setContactPhone(data.contactPhone);
        if (data.contactEmail) setContactEmail(data.contactEmail);
      })
      .catch(() => {
        // не удалось получить настройки — просто не покажем контакты в футере
      });
  }, []);

  return (
    <footer className="border-t border-neutral-800 bg-neutral-950 text-slate-400">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-slate-200">{shopName}</span>
          {contactPhone && (
            <a href={phoneToTelHref(contactPhone)} className="hover:text-white hover:underline">
              {contactPhone}
            </a>
          )}
          {contactEmail && (
            <a href={`mailto:${contactEmail}`} className="hover:text-white hover:underline">
              {contactEmail}
            </a>
          )}
        </div>

        <nav className="flex flex-col gap-1 sm:items-end">
          <Link href="/oferta" className="hover:text-white hover:underline">
            Публичная оферта
          </Link>
          <Link href="/privacy" className="hover:text-white hover:underline">
            Политика конфиденциальности
          </Link>
          <Link href="/requisites" className="hover:text-white hover:underline">
            Реквизиты продавца
          </Link>
        </nav>
      </div>
    </footer>
  );
}
