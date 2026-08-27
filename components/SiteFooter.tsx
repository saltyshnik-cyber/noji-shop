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
      <div className="mx-auto max-w-6xl px-4 pt-8">
        <div className="flex justify-center sm:justify-start">
          <Link
            href="/track"
            className="inline-flex items-center gap-2 rounded-lg border-2 border-red-800 bg-red-950/30 px-6 py-3 text-base font-semibold text-white transition hover:border-red-600 hover:bg-red-900/40"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 shrink-0"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Отследить заказ
          </Link>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 pb-8 pt-6 text-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <img
            src="/strizhov-logo-white.png"
            alt="Мастерская Стрижова А.С."
            width={140}
            height={80}
            className="h-9 w-auto self-start sm:h-12"
          />
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
