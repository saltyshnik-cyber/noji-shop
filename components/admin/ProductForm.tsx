"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Category = { id: number; name: string };

type ProductData = {
  name: string;
  description: string;
  price: string;
  photo_url: string;
  category_id: number | null;
  steel: string;
  blade_length_mm: number | null;
  handle_material: string;
  in_stock: boolean;
};

const EMPTY: ProductData = {
  name: "",
  description: "",
  price: "",
  photo_url: "",
  category_id: null,
  steel: "",
  blade_length_mm: null,
  handle_material: "",
  in_stock: true,
};

export default function ProductForm({
  mode,
  productId,
  categories,
  initial,
}: {
  mode: "create" | "edit";
  productId?: number;
  categories: Category[];
  initial?: Partial<ProductData>;
}) {
  const router = useRouter();
  const [data, setData] = useState<ProductData>({ ...EMPTY, ...initial });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof ProductData>(key: K, value: ProductData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  async function handlePhotoUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "x-file-name": file.name, "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Не удалось загрузить фото");
        return;
      }
      update("photo_url", json.url);
    } catch {
      setError("Не удалось загрузить фото. Проверьте соединение.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const price = Number(data.price);
    if (!data.name.trim()) {
      setError("Введите название");
      return;
    }
    if (!(price > 0)) {
      setError("Введите корректную цену");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: data.name,
        description: data.description,
        price,
        photo_url: data.photo_url,
        category_id: data.category_id,
        steel: data.steel,
        blade_length_mm: data.blade_length_mm,
        handle_material: data.handle_material,
        in_stock: data.in_stock,
      };

      const res = await fetch(mode === "create" ? "/api/admin/products" : `/api/admin/products/${productId}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Не удалось сохранить товар");
        return;
      }

      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Не удалось сохранить товар. Проверьте соединение.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!productId) return;
    if (!window.confirm(`Удалить товар «${data.name}»? Это действие необратимо.`)) return;

    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Не удалось удалить товар");
        return;
      }
      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Не удалось удалить товар. Проверьте соединение.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Фото</label>
        {data.photo_url && (
          <img src={data.photo_url} alt="" className="mb-2 h-40 w-32 rounded border border-gray-200 object-cover" />
        )}
        <input
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handlePhotoUpload(file);
          }}
          className="block text-sm"
        />
        {uploading && <p className="mt-1 text-sm text-gray-500">Загрузка фото…</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="name">
          Название
        </label>
        <input
          id="name"
          value={data.name}
          onChange={(e) => update("name", e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="description">
          Описание
        </label>
        <textarea
          id="description"
          value={data.description}
          onChange={(e) => update("description", e.target.value)}
          rows={3}
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="price">
            Цена, ₽
          </label>
          <input
            id="price"
            type="number"
            min={0}
            value={data.price}
            onChange={(e) => update("price", e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="category">
            Категория
          </label>
          <select
            id="category"
            value={data.category_id ?? ""}
            onChange={(e) => update("category_id", e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded border border-gray-300 bg-white px-3 py-2"
          >
            <option value="">— не выбрана —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="steel">
            Сталь
          </label>
          <input
            id="steel"
            value={data.steel}
            onChange={(e) => update("steel", e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="blade">
            Длина клинка, мм
          </label>
          <input
            id="blade"
            type="number"
            min={0}
            value={data.blade_length_mm ?? ""}
            onChange={(e) => update("blade_length_mm", e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="handle">
            Материал рукояти
          </label>
          <input
            id="handle"
            value={data.handle_material}
            onChange={(e) => update("handle_material", e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
      </div>

      <label className="flex w-fit items-center gap-2 text-sm">
        <input type="checkbox" checked={data.in_stock} onChange={(e) => update("in_stock", e.target.checked)} />
        В наличии
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="mt-2 flex items-center gap-4">
        <button
          type="submit"
          disabled={saving || uploading}
          className="rounded bg-red-800 px-6 py-2 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Сохранение…" : "Сохранить"}
        </button>
        {mode === "edit" && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm text-gray-500 hover:text-red-600 disabled:opacity-40"
          >
            {deleting ? "Удаление…" : "Удалить товар"}
          </button>
        )}
      </div>
    </form>
  );
}
