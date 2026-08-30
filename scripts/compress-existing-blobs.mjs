// Одноразовый скрипт: сжимает уже загруженные (до появления клиентского сжатия
// в lib/uploadPhoto.ts) фото в Vercel Blob store "knife-shop-photos".
//
// Запуск: npm run blob:compress -- --dry-run   (посмотреть, что будет сжато)
//         npm run blob:compress                (реально сжать и перезаписать)
//
// Параметры сжатия намеренно совпадают с клиентским lib/uploadPhoto.ts:
// макс. сторона 1800px, JPEG качество 78%, пропуск файлов ≤300 КБ.
//
// Перед каждой реальной перезаписью оригинал бэкапится в тот же стор под
// префиксом _originals-backup/<исходный pathname> (доступ "private" — не
// предназначен для публичного показа, только как страховка). У Vercel Blob
// нет версионирования файлов: allowOverwrite необратимо стирает старые байты,
// поэтому без этого бэкапа откатиться после реального прогона было бы нельзя.

import { list, put } from "@vercel/blob";
import sharp from "sharp";

const MAX_DIMENSION = 1800;
const JPEG_QUALITY = 78;
const SKIP_UNDER_BYTES = 300 * 1024;
const BACKUP_PREFIX = "_originals-backup/";

const DRY_RUN = process.argv.includes("--dry-run");

function isVideoPath(pathname) {
  const clean = pathname.split("?")[0].toLowerCase();
  return clean.endsWith(".mp4") || clean.endsWith(".webm");
}

function isGifPath(pathname) {
  return pathname.split("?")[0].toLowerCase().endsWith(".gif");
}

function fmtKB(bytes) {
  return `${(bytes / 1024).toFixed(1)} КБ`;
}

function fmtMB(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

async function listAllBlobs(prefix) {
  const blobs = [];
  let cursor;
  do {
    const page = await list({ cursor, limit: 1000, prefix });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return blobs;
}

async function downloadOriginal(blob) {
  const res = await fetch(blob.url);
  if (!res.ok) throw new Error(`не удалось скачать (HTTP ${res.status})`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") || "application/octet-stream";
  return { buffer, contentType };
}

async function compressBuffer(input) {
  // .rotate() без аргументов — применяет поворот по EXIF-ориентации из
  // телефона перед ресайзом. Без этого шага фото, снятые вертикально,
  // после пережатия оказались бы повёрнуты боком (sharp, в отличие от
  // createImageBitmap в браузере, сам EXIF не применяет).
  return sharp(input)
    .rotate()
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN не задан. Возьмите его в Vercel Dashboard → Storage → " +
        "knife-shop-photos → вкладка .env.local, и добавьте строкой в .env.local проекта.",
    );
  }

  console.log(DRY_RUN ? "=== РЕЖИМ: DRY RUN (без перезаписи файлов) ===\n" : "=== РЕЖИМ: РЕАЛЬНОЕ СЖАТИЕ (файлы будут перезаписаны) ===\n");

  const [blobs, backedUpBlobs] = await Promise.all([listAllBlobs(), listAllBlobs(BACKUP_PREFIX)]);
  const alreadyBackedUp = new Set(backedUpBlobs.map((b) => b.pathname.slice(BACKUP_PREFIX.length)));

  console.log(`Всего файлов в сторе: ${blobs.length}`);
  if (alreadyBackedUp.size > 0) {
    console.log(`Уже есть бэкап оригинала (обработаны в предыдущем запуске): ${alreadyBackedUp.size}`);
  }
  console.log("");

  let compressed = 0;
  let skipped = 0;
  let errored = 0;
  let bytesBefore = 0;
  let bytesAfter = 0;

  for (let i = 0; i < blobs.length; i++) {
    const blob = blobs[i];
    const prefix = `[${i + 1}/${blobs.length}]`;

    if (blob.pathname.startsWith(BACKUP_PREFIX)) {
      // сам бэкап предыдущего запуска — не трогаем
      skipped++;
      continue;
    }
    if (isVideoPath(blob.pathname)) {
      console.log(`${prefix} ПРОПУСК (видео): ${blob.pathname}`);
      skipped++;
      continue;
    }
    if (isGifPath(blob.pathname)) {
      console.log(`${prefix} ПРОПУСК (gif): ${blob.pathname}`);
      skipped++;
      continue;
    }
    if (blob.size <= SKIP_UNDER_BYTES) {
      console.log(`${prefix} ПРОПУСК (уже ${fmtKB(blob.size)}): ${blob.pathname}`);
      skipped++;
      continue;
    }
    if (alreadyBackedUp.has(blob.pathname)) {
      console.log(`${prefix} ПРОПУСК (уже обработан в предыдущем запуске, есть бэкап): ${blob.pathname}`);
      skipped++;
      continue;
    }

    try {
      const { buffer: input, contentType } = await downloadOriginal(blob);
      const output = await compressBuffer(input);

      if (output.length >= blob.size) {
        console.log(
          `${prefix} ПРОПУСК (сжатие не дало выигрыша, ${fmtKB(blob.size)} → ${fmtKB(output.length)}): ${blob.pathname}`,
        );
        skipped++;
        continue;
      }

      bytesBefore += blob.size;
      bytesAfter += output.length;
      compressed++;

      if (DRY_RUN) {
        console.log(`${prefix} [БУДЕТ СЖАТО] ${blob.pathname}: ${fmtKB(blob.size)} → ${fmtKB(output.length)}`);
      } else {
        // Сначала бэкап оригинала — и только если он успешно загрузился,
        // переходим к перезаписи. Если бэкап не удался, catch ниже прервёт
        // обработку этого файла до перезаписи, и оригинал останется цел.
        await put(`${BACKUP_PREFIX}${blob.pathname}`, input, {
          access: "private",
          contentType,
          allowOverwrite: true,
        });

        // allowOverwrite обязателен: по умолчанию put() бросает ошибку, если
        // blob с таким pathname уже существует. pathname оставляем тем же
        // самым — по нему на этот файл ссылаются записи в БД (products,
        // product_images, site settings), менять его нельзя.
        await put(blob.pathname, output, {
          access: "public",
          contentType: "image/jpeg",
          allowOverwrite: true,
        });
        console.log(`${prefix} OK ${blob.pathname}: ${fmtKB(blob.size)} → ${fmtKB(output.length)} (бэкап: ${BACKUP_PREFIX}${blob.pathname})`);
      }
    } catch (err) {
      errored++;
      const detail = err instanceof Error ? err.message : String(err);
      console.error(`${prefix} ОШИБКА (${blob.pathname}): ${detail}`);
    }
  }

  console.log("\n--- Итог ---");
  console.log(`Сжато${DRY_RUN ? " (было бы)" : ""}: ${compressed}`);
  console.log(`Пропущено: ${skipped}`);
  console.log(`Ошибок: ${errored}`);
  console.log(
    `Освобождено места${DRY_RUN ? " (оценка)" : ""}: ${fmtMB(bytesBefore - bytesAfter)} ` +
      `(${fmtMB(bytesBefore)} → ${fmtMB(bytesAfter)})`,
  );

  if (DRY_RUN) {
    console.log("\nЭто был dry-run — ни один файл не изменён. Запустите без --dry-run, чтобы сжать реально.");
  } else if (compressed > 0) {
    console.log(`\nОригиналы сохранены в ${BACKUP_PREFIX} (private). Чтобы вернуть файл — скачайте его оттуда`);
    console.log("и загрузите обратно тем же put(pathname, bytes, { allowOverwrite: true }) на исходный pathname.");
  }
}

main().catch((err) => {
  console.error("\nСкрипт остановлен из-за ошибки:", err);
  process.exit(1);
});
