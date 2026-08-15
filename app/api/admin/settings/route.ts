import { NextResponse } from "next/server";
import { saveSiteSettings, type SiteSettings } from "@/lib/siteSettings";

export async function PATCH(request: Request) {
  const body = (await request.json()) as Partial<SiteSettings>;

  if (body.galleryImages !== undefined && !Array.isArray(body.galleryImages)) {
    return NextResponse.json({ error: "galleryImages должен быть массивом" }, { status: 400 });
  }

  await saveSiteSettings(body);

  return NextResponse.json({ ok: true });
}
