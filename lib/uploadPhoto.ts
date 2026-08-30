const MAX_DIMENSION = 1800;
const COMPRESS_QUALITY = 0.78;
const SKIP_COMPRESSION_UNDER_BYTES = 300 * 1024; // уже компактный файл — не трогаем

/**
 * Сжимает фото в браузере перед загрузкой: уменьшает до разумного разрешения
 * и перекодирует в JPEG. Оставлено и при переходе на Cloudinary: меньше байт
 * летит по сети на телефонных тарифах, и меньше расходуется бесплатный лимит
 * Cloudinary (25 credits/мес считают в том числе исходящий трафик и объём
 * хранилища) — трансформации Cloudinary (f_auto,q_auto) сжимают дополнительно
 * уже при отдаче, а не заменяют сжатие при загрузке.
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

function resourceTypeFor(file: File): "image" | "video" {
  return file.type.startsWith("video/") ? "video" : "image";
}

type CloudinarySignature = {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
};

async function getUploadSignature(): Promise<CloudinarySignature> {
  let res: Response;
  try {
    res = await fetch("/api/admin/upload", { method: "POST" });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Нет соединения с сервером (${detail}). Проверьте интернет и повторите попытку.`);
  }

  if (!res.ok) {
    let detail = "";
    try {
      const json = await res.json();
      detail = typeof json?.error === "string" ? json.error : "";
    } catch {
      try {
        detail = await res.text();
      } catch {
        detail = "";
      }
    }
    throw new Error(`Сервер отклонил запрос на загрузку, код ${res.status}${detail ? `: ${detail}` : ""}`);
  }

  try {
    const json = await res.json();
    if (!json?.signature || !json?.timestamp || !json?.apiKey || !json?.cloudName) throw new Error("empty");
    return json;
  } catch {
    throw new Error("Сервер вернул некорректный ответ при подготовке загрузки.");
  }
}

/**
 * Uploads a file straight from the browser to Cloudinary.
 *
 * Only a small "give me a signature" request goes through our serverless
 * function (`/api/admin/upload`) — the actual file bytes go directly to
 * Cloudinary. This avoids Vercel's hard 4.5 MB request-body limit on
 * serverless functions, which real phone photos and video files can easily
 * exceed.
 *
 * Errors are surfaced with as much real detail as possible (HTTP status,
 * server error text) instead of a generic "check your connection" message,
 * so different failure causes (auth, network, file too large, etc.) are
 * distinguishable in the UI.
 */
export async function uploadPhoto(file: File): Promise<string> {
  file = await compressImage(file);

  const { timestamp, signature, apiKey, cloudName } = await getUploadSignature();
  const resourceType = resourceTypeFor(file);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);

  let uploadRes: Response;
  try {
    uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
      method: "POST",
      body: formData,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Не удалось соединиться с Cloudinary (${detail}). Проверьте интернет и повторите попытку.`);
  }

  const json = await uploadRes.json().catch(() => null);

  if (!uploadRes.ok) {
    const detail = json?.error?.message ?? `код ${uploadRes.status}`;
    throw new Error(`Cloudinary отклонил загрузку: ${detail}`);
  }

  if (!json?.secure_url) {
    throw new Error("Cloudinary вернул некорректный ответ при загрузке файла.");
  }

  return json.secure_url as string;
}
