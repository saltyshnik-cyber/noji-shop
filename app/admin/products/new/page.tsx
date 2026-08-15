import { ensureSchema, sql } from "@/lib/db";
import AdminNav from "@/components/admin/AdminNav";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

async function getCategories() {
  await ensureSchema();
  return (await sql`SELECT id, name FROM categories ORDER BY name`) as { id: number; name: string }[];
}

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <AdminNav />
      <h1 className="mt-6 mb-6 text-2xl font-bold">Новый товар</h1>
      <ProductForm mode="create" categories={categories} />
    </div>
  );
}
