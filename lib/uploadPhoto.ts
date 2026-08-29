import { put } from "@vercel/blob/client";

const MAX_DIMENSION = 1800;
const COMPRESS_QUALITY = 0.78;
const SKIP_COMPRESSION_UNDER_BYTES = 300 * 1024; // уже компактный файл — не трогаем

/**
 * Сжимает фото в браузере перед загрузкой: уменьшает до разумного разрешения
 * и перекодирует в JPEG. Телефонные фото (6-7 МБ) после этого обычно
 * укладываются в 200-500 КБ — это резко снижает расход общего лимита Blob
 * Data Transfer на аккаунте (его делят все проекты, не только этот).
 *
 * Видео не трогаем — сжимаем только image/*. Анимированные GIF тоже не
 * трогаем: canvas умеет рисовать только первый кадр, пережатие убило бы
 * анимацию.
 */
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.size <= SKIP_COMPRESSION_UNDER_BYTES) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    // Белая подложка — на случай прозрачных PNG, при конвертации в JPEG
    // прозрачность всё равно теряется.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", COMPRESS_QUALITY),
    );

    if (!blob || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.\w+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    // Не удалось прочитать/сжать (повреждённый файл, неподдерживаемый формат
    // в этом браузере и т.п.) — отправляем как есть, сервер сам отбракует.
    return file;
  }
}

/**
 * Uploads a file straight from the browser to Vercel Blob storage.
 *
 * Only a small JSON "give me a token" request goes through our serverless
 * function (`/api/admin/upload`) — the actual file bytes go directly to
 * Blob storage. This avoids Vercel's hard 4.5 MB request-body limit on
 * serverless functions, which real phone photos can easily exceed.
 *
 * Errors are surfaced with as much real detail as possible (HTTP status,
 * server error text) instead of a generic "check your connection" message,
 * so different failure causes (auth, network, file too large, etc.) are
 * distinguishable in the UI.
 */
export async function uploadPhoto(file: File): Promise<string> {
  file = await compressImage(file);

  let tokenRes: Response;
  try {
    tokenRes = await fetch("/api/admin/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "blob.generate-client-token",
        payload: { pathname: file.name, clientPayload: null, multipart: false },
      }),
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Нет соединения с сервером (${detail}). Проверьте интернет и повторите попытку.`);
  }

  if (!tokenRes.ok) {
    let detail = "";
    try {
      const json = await tokenRes.json();
      detail = typeof json?.error === "string" ? json.error : "";
    } catch {
      try {
        detail = await tokenRes.text();
      } catch {
        detail = "";
      }
    }
    throw new Error(`Сервер отклонил запрос на загрузку, код ${tokenRes.status}${detail ? `: ${detail}` : ""}`);
  }

  let clientToken: string;
  try {
    const json = await tokenRes.json();
    if (!json?.clientToken) throw new Error("empty");
    clientToken = json.clientToken;
  } catch {
    throw new Error("Сервер вернул некорректный ответ при подготовке загрузки.");
  }

  try {
    const blob = await put(file.name, file, {
      access: "public",
      token: clientToken,
      contentType: file.type || "application/octet-stream",
    });
    return blob.url;
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Не удалось загрузить файл в хранилище: ${detail}`);
  }
}
