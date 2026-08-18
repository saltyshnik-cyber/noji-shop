import AdminNav from "@/components/admin/AdminNav";
import ProductForm from "@/components/admin/ProductForm";
import { getCategories } from "@/lib/categories";

export const dynamic = "force-dynamic";

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
