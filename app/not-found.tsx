import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <main className="min-w-0">
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Страница не найдена</h1>
        <p className="mt-2 text-gray-500">Такой страницы не существует или она была удалена.</p>
        <Link href="/" className="mt-6 inline-block text-red-600 hover:underline">
          ← На главную
        </Link>
      </div>
    </main>
  );
}
