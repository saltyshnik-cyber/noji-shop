"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadPhoto } from "@/lib/uploadPhoto";

type ProductImage = { id: number; url: string; sort_order: number };

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function CustomFileButton({
  label,
  disabled,
  onFile,
}: {
  label: string;
  disabled: boolean;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="w-fit rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:border-red-400 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        disabled={disabled}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </>
  );
}

export default function ProductPhotoSection({
  productId,
  photoUrl,
  onPhotoUrlChange,
  initialImages,
  onUploadingChange,
}: {
  productId?: number;
  photoUrl: string;
  onPhotoUrlChange: (url: string) => void;
  initialImages: ProductImage[];
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const router = useRouter();
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingExtra, setUploadingExtra] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [images, setImages] = useState<ProductImage[]>(initialImages);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onUploadingChange?.(uploadingMain || uploadingExtra);
  }, [uploadingMain, uploadingExtra, onUploadingChange]);

  async function handleMainUpload(file: File) {
    setUploadingMain(true);
    setError(null);
    try {
      const url = await uploadPhoto(file);
      onPhotoUrlChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить фото");
    } finally {
      setUploadingMain(false);
    }
  }

  async function handleExtraAdd(file: File) {
    if (!productId) return;
    setUploadingExtra(true);
    setError(null);
    try {
      const url = await uploadPhoto(file);

      const res = await fetch(`/api/admin/products/${productId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Не удалось добавить фото");
        return;
      }
      setImages((prev) => [...prev, json.image]);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить фото");
    } finally {
      setUploadingExtra(false);
    }
  }

  async function handleMove(id: number, direction: "up" | "down") {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/product-images/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Не удалось изменить порядок");
        return;
      }
      setImages((prev) => {
        const sorted = [...prev].sort((a, b) => a.sort_order - b.sort_order);
        const index = sorted.findIndex((img) => img.id === id);
        const swapIndex = direction === "up" ? index - 1 : index + 1;
        if (index === -1 || swapIndex < 0 || swapIndex >= sorted.length) return prev;
        const a = sorted[index];
        const b = sorted[swapIndex];
        return prev.map((img) => {
          if (img.id === a.id) return { ...img, sort_order: b.sort_order };
          if (img.id === b.id) return { ...img, sort_order: a.sort_order };
          return img;
        });
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove(id: number) {
    if (!window.confirm("Удалить это фото?")) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/product-images/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Не удалось удалить фото");
        return;
      }
      setImages((prev) => prev.filter((img) => img.id !== id));
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex w-fit flex-col gap-2">
          <label className="block text-sm font-medium">Главное фото</label>
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded border border-gray-200 bg-gray-50 sm:h-40 sm:w-32">
            {photoUrl ? (
              <img src={photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="px-2 text-center text-xs text-gray-400">Нет фото</span>
            )}
          </div>
          <CustomFileButton
            label={uploadingMain ? "Загрузка…" : "Изменить фото"}
            disabled={uploadingMain}
            onFile={handleMainUpload}
          />
        </div>

        {productId && (
          <label
            className={`flex h-28 flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded border-2 border-dashed border-gray-300 text-center text-gray-500 transition hover:border-red-400 hover:text-red-600 sm:h-40 ${
              uploadingExtra ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <PlusIcon />
            <span className="text-sm font-medium">{uploadingExtra ? "Загрузка…" : "Добавить доп. фото"}</span>
            <input
              type="file"
              accept="image/*"
              disabled={uploadingExtra}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleExtraAdd(file);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>

      {productId && (
        <p className="-mt-2 text-xs text-gray-500">
          Доп. фото показываются в галерее товара вместе с главным фото. Не заменяют главное фото.
        </p>
      )}

      {productId && sorted.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {sorted.map((img, i) => (
            <div key={img.id} className="flex flex-col gap-1">
              <img src={img.url} alt="" className="aspect-[4/5] w-full rounded border border-gray-200 object-cover" />
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => handleMove(img.id, "up")}
                  disabled={busyId === img.id || i === 0}
                  className="text-gray-500 hover:text-red-600 disabled:opacity-30"
                >
                  ← Раньше
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(img.id, "down")}
                  disabled={busyId === img.id || i === sorted.length - 1}
                  className="text-gray-500 hover:text-red-600 disabled:opacity-30"
                >
                  Позже →
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(img.id)}
                disabled={busyId === img.id}
                className="text-xs text-gray-500 hover:text-red-600 disabled:opacity-30"
              >
                Удалить
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
