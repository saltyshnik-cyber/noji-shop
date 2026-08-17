"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SiteSettings } from "@/lib/siteSettings";
import { uploadPhoto as uploadFile } from "@/lib/uploadPhoto";

export default function SettingsForm({ initial }: { initial: SiteSettings }) {
  const router = useRouter();
  const [data, setData] = useState<SiteSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setData((d) => ({ ...d, [key]: value }));
    setSaved(false);
  }

  async function handleHeroUpload(file: File) {
    setUploadingHero(true);
    setError(null);
    try {
      const url = await uploadFile(file);
      update("heroImageUrl", url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить фото");
    } finally {
      setUploadingHero(false);
    }
  }

  async function handleGalleryAdd(file: File) {
    setUploadingGallery(true);
    setError(null);
    try {
      const url = await uploadFile(file);
      update("galleryImages", [...data.galleryImages, url]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить фото");
    } finally {
      setUploadingGallery(false);
    }
  }

  function handleGalleryRemove(index: number) {
    update(
      "galleryImages",
      data.galleryImages.filter((_, i) => i !== index),
    );
  }

  async function handleGalleryReplace(index: number, file: File) {
    setUploadingGallery(true);
    setError(null);
    try {
      const url = await uploadFile(file);
      const next = [...data.galleryImages];
      next[index] = url;
      update("galleryImages", next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить фото");
    } finally {
      setUploadingGallery(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Не удалось сохранить настройки");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Не удалось сохранить настройки. Проверьте соединение.");
    } finally {
      setSaving(false);
    }
  }

  const busy = saving || uploadingHero || uploadingGallery;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Название магазина</h2>
        <div>
          <label className="mb-1 block text-sm font-medium">Название</label>
          <input
            value={data.shopName}
            onChange={(e) => update("shopName", e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Подзаголовок</label>
          <input
            value={data.shopSubtitle}
            onChange={(e) => update("shopSubtitle", e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
      </section>

      <section className="flex flex-col gap-4 border-t border-gray-200 pt-6">
        <h2 className="text-lg font-semibold">О мастерской</h2>
        <div>
          <label className="mb-1 block text-sm font-medium">Текст блока</label>
          <textarea
            value={data.aboutText}
            onChange={(e) => update("aboutText", e.target.value)}
            rows={4}
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Имя автора</label>
            <input
              value={data.aboutAuthorName}
              onChange={(e) => update("aboutAuthorName", e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Подпись/титул</label>
            <input
              value={data.aboutAuthorTitle}
              onChange={(e) => update("aboutAuthorTitle", e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 border-t border-gray-200 pt-6">
        <h2 className="text-lg font-semibold">Контакты и доставка</h2>
        <div>
          <label className="mb-1 block text-sm font-medium">Телефон</label>
          <input
            value={data.contactPhone}
            onChange={(e) => update("contactPhone", e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Адрес мастерской</label>
          <input
            value={data.contactAddress}
            onChange={(e) => update("contactAddress", e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Условия доставки</label>
          <input
            value={data.contactDelivery}
            onChange={(e) => update("contactDelivery", e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            value={data.contactEmail}
            onChange={(e) => update("contactEmail", e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
      </section>

      <section className="flex flex-col gap-4 border-t border-gray-200 pt-6">
        <h2 className="text-lg font-semibold">Реквизиты продавца</h2>
        <p className="text-sm text-gray-500">
          Показываются на странице «Реквизиты» и в публичной оферте — обязательны для приёма платежей.
        </p>
        <div>
          <label className="mb-1 block text-sm font-medium">Наименование продавца</label>
          <input
            placeholder="ИП Иванов Иван Иванович"
            value={data.legalName}
            onChange={(e) => update("legalName", e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">ИНН</label>
            <input
              value={data.legalInn}
              onChange={(e) => update("legalInn", e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">ОГРН/ОГРНИП</label>
            <input
              value={data.legalOgrn}
              onChange={(e) => update("legalOgrn", e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Юридический адрес</label>
          <input
            value={data.legalAddress}
            onChange={(e) => update("legalAddress", e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
      </section>

      <section className="flex flex-col gap-4 border-t border-gray-200 pt-6">
        <h2 className="text-lg font-semibold">Фото в hero-блоке</h2>
        {data.heroImageUrl && (
          <img src={data.heroImageUrl} alt="" className="h-40 w-64 rounded border border-gray-200 object-cover" />
        )}
        <input
          type="file"
          accept="image/*"
          disabled={uploadingHero}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleHeroUpload(file);
          }}
          className="block text-sm"
        />
        {uploadingHero && <p className="text-sm text-gray-500">Загрузка…</p>}
      </section>

      <section className="flex flex-col gap-4 border-t border-gray-200 pt-6">
        <h2 className="text-lg font-semibold">Галерея «Эксклюзивные авторские работы»</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {data.galleryImages.map((src, i) => (
            <div key={i} className="flex flex-col gap-1">
              <img src={src} alt="" className="aspect-[4/5] w-full rounded border border-gray-200 object-cover" />
              <label className="cursor-pointer text-center text-xs text-gray-500 hover:text-red-600">
                Заменить
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingGallery}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleGalleryReplace(i, file);
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => handleGalleryRemove(i)}
                className="text-xs text-gray-500 hover:text-red-600"
              >
                Удалить
              </button>
            </div>
          ))}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Добавить фото</label>
          <input
            type="file"
            accept="image/*"
            disabled={uploadingGallery}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleGalleryAdd(file);
              e.target.value = "";
            }}
            className="block text-sm"
          />
          {uploadingGallery && <p className="mt-1 text-sm text-gray-500">Загрузка…</p>}
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && !busy && <p className="text-sm text-green-700">Сохранено.</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-fit rounded bg-red-800 px-6 py-2 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Сохранение…" : "Сохранить настройки"}
      </button>
    </form>
  );
}
