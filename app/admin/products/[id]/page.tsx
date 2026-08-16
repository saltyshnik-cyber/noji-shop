import { notFound } from "next/navigation";
import { ensureSchema, sql } from "@/lib/db";
import AdminNav from "@/components/admin/AdminNav";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

type ProductRow = {
  id: number;
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

async function getCategories() {
  return (await sql`SELECT id, name FROM categories ORDER BY name`) as { id: number; name: string }[];
}

async function getProduct(id: string): Promise<ProductRow | null> {
  if (!/^\d+$/.test(id)) return null;
  const rows = await sql`SELECT * FROM products WHERE id = ${id}`;
  return (rows[0] as ProductRow | undefined) ?? null;
}

async function getProductImages(id: string) {
  return (await sql`
    SELECT id, url, sort_order, type FROM product_images WHERE product_id = ${id} ORDER BY sort_order
  `) as { id: number; url: string; sort_order: number; type: "image" | "video" }[];
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await ensureSchema();

  const [product, categories, images] = await Promise.all([getProduct(id), getCategories(), getProductImages(id)]);

  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <AdminNav />
      <h1 className="mt-6 mb-6 text-2xl font-bold">Редактировать товар</h1>
      <ProductForm
        mode="edit"
        productId={product.id}
        categories={categories}
        initial={{
          name: product.name,
          description: product.description,
          price: String(product.price),
          photo_url: product.photo_url,
          category_id: product.category_id,
          steel: product.steel,
          blade_length_mm: product.blade_length_mm,
          handle_material: product.handle_material,
          in_stock: product.in_stock,
        }}
        initialImages={images}
      />
    </div>
  );
}
