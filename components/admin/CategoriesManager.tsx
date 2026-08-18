"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Category = { id: number; name: string; slug: string; sort_order: number; product_count: number };

function slugifyClient(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\wа-яё-]/gi, "");
}

export default function CategoriesManager({ initialCategories }: { initialCategories: Category[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editSlugTouched, setEditSlugTouched] = useState(false);

  const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) {
      setError("Введите название категории");
      return;
    }
    setError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, slug: newSlug || undefined }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Не удалось создать категорию");
        return;
      }
      setCategories((prev) => [...prev, { ...json.category, product_count: 0 }]);
      setNewName("");
      setNewSlug("");
      setSlugTouched(false);
      router.refresh();
    } catch {
      setError("Не удалось создать категорию. Проверьте соединение.");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(c: Category) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditSlug(c.slug);
    setEditSlugTouched(true);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: number) {
    if (!editName.trim()) {
      setError("Введите название категории");
      return;
    }
    setError(null);
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, slug: editSlug }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Не удалось сохранить категорию");
        return;
      }
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...json.category } : c)));
      setEditingId(null);
      router.refresh();
    } catch {
      setError("Не удалось сохранить категорию. Проверьте соединение.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleMove(id: number, direction: "up" | "down") {
    setError(null);
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Не удалось изменить порядок");
        return;
      }
      setCategories((prev) => {
        const list = [...prev].sort((a, b) => a.sort_order - b.sort_order);
        const index = list.findIndex((c) => c.id === id);
        const swapIndex = direction === "up" ? index - 1 : index + 1;
        if (index === -1 || swapIndex < 0 || swapIndex >= list.length) return prev;
        const a = list[index];
        const b = list[swapIndex];
        return prev.map((c) => {
          if (c.id === a.id) return { ...c, sort_order: b.sort_order };
          if (c.id === b.id) return { ...c, sort_order: a.sort_order };
          return c;
        });
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(c: Category) {
    if (c.product_count > 0) {
      setError(
        `В категории «${c.name}» ${c.product_count} товар(ов). Сначала перенесите их в другую категорию или удалите товары.`,
      );
      return;
    }
    if (!window.confirm(`Удалить категорию «${c.name}»?`)) return;

    setError(null);
    setBusyId(c.id);
    try {
      const res = await fetch(`/api/admin/categories/${c.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Не удалось удалить категорию");
        return;
      }
      setCategories((prev) => prev.filter((cat) => cat.id !== c.id));
      router.refresh();
    } catch {
      setError("Не удалось удалить категорию. Проверьте соединение.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        {sorted.map((c, i) => (
          <div key={c.id} className="rounded-lg border border-gray-200 bg-white p-3">
            {editingId === c.id ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    if (!editSlugTouched) setEditSlug(slugifyClient(e.target.value));
                  }}
                  placeholder="Название"
                  className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm"
                />
                <input
                  value={editSlug}
                  onChange={(e) => {
                    setEditSlugTouched(true);
                    setEditSlug(e.target.value);
                  }}
                  placeholder="slug"
                  className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm sm:w-40"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => saveEdit(c.id)}
                    disabled={busyId === c.id}
                    className="rounded bg-red-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Сохранить
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={busyId === c.id}
                    className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-gray-400">
                    /{c.slug} · {c.product_count} товар(ов)
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex flex-col leading-none">
                    <button
                      type="button"
                      onClick={() => handleMove(c.id, "up")}
                      disabled={busyId === c.id || i === 0}
                      className="text-gray-400 hover:text-red-600 disabled:opacity-30"
                      aria-label="Выше"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(c.id, "down")}
                      disabled={busyId === c.id || i === sorted.length - 1}
                      className="text-gray-400 hover:text-red-600 disabled:opacity-30"
                      aria-label="Ниже"
                    >
                      ▼
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => startEdit(c)}
                    disabled={busyId === c.id}
                    className="text-gray-500 hover:text-red-600 disabled:opacity-40"
                  >
                    Изменить
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c)}
                    disabled={busyId === c.id}
                    className="text-gray-500 hover:text-red-600 disabled:opacity-40"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {sorted.length === 0 && <p className="text-sm text-gray-500">Категорий пока нет.</p>}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <form onSubmit={handleCreate} className="rounded-lg border border-dashed border-gray-300 p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Добавить категорию</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              if (!slugTouched) setNewSlug(slugifyClient(e.target.value));
            }}
            placeholder="Название"
            className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            value={newSlug}
            onChange={(e) => {
              setSlugTouched(true);
              setNewSlug(e.target.value);
            }}
            placeholder="slug (необязательно)"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm sm:w-48"
          />
          <button
            type="submit"
            disabled={creating}
            className="rounded bg-red-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? "Добавление…" : "Добавить"}
          </button>
        </div>
      </form>
    </div>
  );
}
