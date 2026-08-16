import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, createSessionToken } from "@/lib/adminAuth";
import { put } from "@vercel/blob/client";
import { del } from "@vercel/blob";

const DIAG_SECRET = "tmp-diag-8f3a1c9e77";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("secret") !== DIAG_SECRET) {
    return NextResponse.json({ error: "no" }, { status: 404 });
  }

  const origin = url.origin;
  const result: Record<string, unknown> = {};

  // 1. Unauthenticated request should surface a clear "Не авторизован" body.
  const unauthRes = await fetch(`${origin}/api/admin/upload`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ type: "blob.generate-client-token", payload: { pathname: "diag.jpg" } }),
  });
  result.unauth = { status: unauthRes.status, body: await unauthRes.json().catch(() => null) };

  // 2. Authenticated request should return a clientToken.
  const sessionToken = await createSessionToken();
  const authRes = await fetch(`${origin}/api/admin/upload`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: `${ADMIN_SESSION_COOKIE}=${sessionToken}`,
    },
    body: JSON.stringify({ type: "blob.generate-client-token", payload: { pathname: "diag.jpg" } }),
  });
  const authJson = await authRes.json().catch(() => null);
  result.auth = { status: authRes.status, hasClientToken: Boolean(authJson?.clientToken) };

  // 3. Use the client token to actually PUT a tiny file straight to Blob storage.
  if (authJson?.clientToken) {
    try {
      const blob = await put("diag.jpg", Buffer.from("diagnostic-upload-test"), {
        access: "public",
        token: authJson.clientToken,
        contentType: "image/jpeg",
      });
      result.blobUpload = { ok: true, url: blob.url };
      await del(blob.url);
      result.cleanedUp = true;
    } catch (err) {
      result.blobUpload = { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  return NextResponse.json(result);
}
