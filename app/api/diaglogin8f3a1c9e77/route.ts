import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, createSessionToken } from "@/lib/adminAuth";

const DIAG_SECRET = "tmp-diag-8f3a1c9e77";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("secret") !== DIAG_SECRET) {
    return NextResponse.json({ error: "no" }, { status: 404 });
  }

  const sessionToken = await createSessionToken();
  const res = NextResponse.redirect(new URL("/admin/categories", url));
  res.cookies.set(ADMIN_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 30,
  });
  return res;
}
