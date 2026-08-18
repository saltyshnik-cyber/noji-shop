import AdminNav from "@/components/admin/AdminNav";
import CategoriesManager from "@/components/admin/CategoriesManager";
import { getCategoriesWithProductCounts } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await getCategoriesWithProductCounts();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <AdminNav />
      <h1 className="mt-6 mb-2 text-2xl font-bold">Категории</h1>
      <p className="mb-6 text-sm text-gray-500">
        Разделы каталога на публичном сайте. Порядок здесь совпадает с порядком отображения на странице «Каталог».
      </p>
      <CategoriesManager initialCategories={categories} />
    </div>
  );
}
