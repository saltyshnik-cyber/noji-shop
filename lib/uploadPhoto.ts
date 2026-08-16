import { put } from "@vercel/blob/client";

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
