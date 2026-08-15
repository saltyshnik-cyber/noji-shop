import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(request: Request) {
  const fileName = request.headers.get("x-file-name");
  if (!fileName) {
    return NextResponse.json({ error: "x-file-name header required" }, { status: 400 });
  }

  const buffer = Buffer.from(await request.arrayBuffer());
  if (buffer.length === 0) {
    return NextResponse.json({ error: "empty file" }, { status: 400 });
  }

  const blob = await put(fileName, buffer, {
    access: "public",
    addRandomSuffix: true,
  });

  return NextResponse.json({ url: blob.url });
}
