"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ProductImage = { id: number; url: string; sort_order: number };

export default function ProductImagesManager({
  productId,
  initialImages,
}: {
  productId: number;
  initialImages: ProductImage[];
}) {
  const router = useRouter();
  const [images, setImages] = useState<ProductImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(file: File) {
    setUploading(true);
    setError(null);
    try {
      const uploadRes = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "x-file-name": file.name, "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) {
        setError(uploadJson.error ?? "Не удалось загрузить фото");
        return;
      }

      const res = await fetch(`/api/admin/products/${productId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: uploadJson.url }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Не удалось добавить фото");
        return;
      }
      setImages((prev) => [...prev, json.image]);
      router.refresh();
    } catch {
      setError("Не удалось загрузить фото. Проверьте соединение.");
    } finally {
      setUploading(false);
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
    <div className="flex flex-col gap-3">
      {sorted.length > 0 && (
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

      <div>
        <label className="mb-1 block text-sm font-medium">Добавить фото</label>
        <input
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleAdd(file);
            e.target.value = "";
          }}
          className="block text-sm"
        />
        {uploading && <p className="mt-1 text-sm text-gray-500">Загрузка…</p>}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
