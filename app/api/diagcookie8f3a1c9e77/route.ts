import { NextResponse } from "next/server";

const DIAG_SECRET = "tmp-diag-8f3a1c9e77";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("secret") !== DIAG_SECRET) {
    return NextResponse.json({ error: "no" }, { status: 404 });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json({ error: "ADMIN_PASSWORD not set" }, { status: 500 });
  }

  const loginRes = await fetch(`${url.origin}/api/admin/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password: adminPassword }),
  });

  const setCookieHeader = loginRes.headers.get("set-cookie");

  return NextResponse.json({
    loginStatus: loginRes.status,
    setCookieHeader,
  });
}
