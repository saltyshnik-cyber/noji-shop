import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/siteSettings";

export async function GET() {
  const { shopName, shopSubtitle, contactPhone, contactEmail } = await getSiteSettings();
  return NextResponse.json({ shopName, shopSubtitle, contactPhone, contactEmail });
}
