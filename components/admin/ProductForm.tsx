"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProductPhotoSection, { type ProductImage } from "@/components/admin/ProductPhotoSection";

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
  stock_quantity: number;
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
  stock_quantity: 0,
};

export default function ProductForm({
  mode,
  productId,
  categories,
  initial,
  initialImages,
}: {
  mode: "create" | "edit";
  productId?: number;
  categories: Category[];
  initial?: Partial<ProductData>;
  initialImages?: ProductImage[];
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
    if (!Number.isInteger(data.stock_quantity) || data.stock_quantity < 0) {
      setError("Введите корректное количество в наличии");
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
        stock_quantity: data.stock_quantity,
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
      <ProductPhotoSection
        productId={productId}
        photoUrl={data.photo_url}
        onPhotoUrlChange={(url) => update("photo_url", url)}
        initialImages={initialImages ?? []}
        onUploadingChange={setUploading}
      />

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

      <div className="w-fit">
        <label className="mb-1 block text-sm font-medium" htmlFor="stock_quantity">
          Количество в наличии
        </label>
        <input
          id="stock_quantity"
          type="number"
          min={0}
          step={1}
          value={data.stock_quantity}
          onChange={(e) => update("stock_quantity", e.target.value ? Math.max(0, Math.trunc(Number(e.target.value))) : 0)}
          className="w-32 rounded border border-gray-300 px-3 py-2"
        />
      </div>

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
