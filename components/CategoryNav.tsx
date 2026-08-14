import { CATEGORY_SECTIONS } from "@/lib/categoryNav";

export function CategoryNav() {
  return (
    <nav className="sticky top-16 z-40 h-14 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-full max-w-6xl items-center gap-2 overflow-x-auto px-4">
        {CATEGORY_SECTIONS.map((c) => (
          <a
            key={c.slug}
            href={`#${c.slug}`}
            className="shrink-0 whitespace-nowrap rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:border-amber-800 hover:text-amber-800"
          >
            {c.name}
          </a>
        ))}
      </div>
    </nav>
  );
}
