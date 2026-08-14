import { readdir, readFile } from "node:fs/promises";
import { join, extname } from "node:path";

const PHOTOS_DIR = "C:\\Users\\пк\\Downloads\\ножи фото";
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

const SITE_URL = process.env.SITE_URL ?? "https://knife-shop-five.vercel.app";
const UPLOAD_TOKEN = process.env.UPLOAD_TOKEN;

async function main() {
  if (!UPLOAD_TOKEN) {
    throw new Error("Не задан UPLOAD_TOKEN в .env.local");
  }

  const entries = await readdir(PHOTOS_DIR, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && IMAGE_EXTENSIONS.has(extname(e.name).toLowerCase()))
    .map((e) => e.name)
    .sort();

  if (files.length === 0) {
    console.log("Фото не найдены в папке:", PHOTOS_DIR);
    return;
  }

  const results = [];

  for (const fileName of files) {
    const filePath = join(PHOTOS_DIR, fileName);
    const buffer = await readFile(filePath);

    const res = await fetch(`${SITE_URL}/api/upload`, {
      method: "POST",
      headers: {
        "x-upload-token": UPLOAD_TOKEN,
        "x-file-name": fileName,
        "Content-Type": "application/octet-stream",
      },
      body: buffer,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Не удалось загрузить ${fileName}: ${res.status} ${text}`);
    }

    const { url } = await res.json();
    results.push({ fileName, url });
    console.log(`Загружено: ${fileName} → ${url}`);
  }

  console.log("\nИтоговый список:");
  for (const { fileName, url } of results) {
    console.log(`${fileName} → ${url}`);
  }
}

main().catch((err) => {
  console.error("Ошибка загрузки:", err);
  process.exit(1);
});
