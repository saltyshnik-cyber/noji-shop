import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, createSessionToken } from "@/lib/adminAuth";
import { put } from "@vercel/blob/client";
import { del } from "@vercel/blob";
import { ensureSchema, sql } from "@/lib/db";

const DIAG_SECRET = "tmp-diag-8f3a1c9e77";
const TEST_PRODUCT_ID = 24;

async function getClientToken(origin: string, cookie: string, pathname: string) {
  const res = await fetch(`${origin}/api/admin/upload`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ type: "blob.generate-client-token", payload: { pathname } }),
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("secret") !== DIAG_SECRET) {
    return NextResponse.json({ error: "no" }, { status: 404 });
  }

  await ensureSchema();
  const origin = url.origin;
  const sessionToken = await createSessionToken();
  const cookie = `${ADMIN_SESSION_COOKIE}=${sessionToken}`;
  const result: Record<string, unknown> = {};

  const deleteId = url.searchParams.get("deleteId");
  if (deleteId) {
    const rows = await sql`SELECT url FROM product_images WHERE id = ${deleteId}`;
    await fetch(`${origin}/api/admin/product-images/${deleteId}`, { method: "DELETE", headers: { cookie } });
    if (rows[0]?.url) await del(rows[0].url as string);
    return NextResponse.json({ deleted: deleteId });
  }

  // 1. Disallowed video content type should be rejected.
  const badToken = await getClientToken(origin, cookie, "diag-bad.mov");
  if (badToken.json?.clientToken) {
    try {
      await put("diag-bad.mov", Buffer.from("fake"), {
        access: "public",
        token: badToken.json.clientToken,
        contentType: "video/quicktime",
      });
      result.rejectBadContentType = { ok: false, note: "upload unexpectedly succeeded" };
    } catch (err) {
      result.rejectBadContentType = { ok: true, message: err instanceof Error ? err.message : String(err) };
    }
  } else {
    result.rejectBadContentType = { ok: false, note: "could not get client token", badToken };
  }

  // 2. Valid mp4 upload + attach to a real product + verify stored type + cleanup.
  const goodToken = await getClientToken(origin, cookie, "diag-test.mp4");
  if (goodToken.json?.clientToken) {
    try {
      const blob = await put("diag-test.mp4", Buffer.from("fake-mp4-bytes"), {
        access: "public",
        token: goodToken.json.clientToken,
        contentType: "video/mp4",
      });

      const attachRes = await fetch(`${origin}/api/admin/products/${TEST_PRODUCT_ID}/images`, {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({ url: blob.url, type: "video" }),
      });
      const attachJson = await attachRes.json();
      result.videoUpload = { ok: attachRes.ok, image: attachJson.image };

      const leave = url.searchParams.get("leave") === "1";

      if (attachJson?.image?.id) {
        const rows = await sql`SELECT id, url, type FROM product_images WHERE id = ${attachJson.image.id}`;
        result.storedRow = rows[0];

        if (!leave) {
          await fetch(`${origin}/api/admin/product-images/${attachJson.image.id}`, {
            method: "DELETE",
            headers: { cookie },
          });
          result.cleanedUpRow = true;
        }
      }

      if (!leave) {
        await del(blob.url);
        result.cleanedUpBlob = true;
      }
    } catch (err) {
      result.videoUpload = { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  } else {
    result.videoUpload = { ok: false, note: "could not get client token", goodToken };
  }

  return NextResponse.json(result);
}
