import { NextResponse } from "next/server";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { Readable } from "node:stream";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Только для scripts/upload-photos.mjs — массовая заливка локальной папки с
// фото. Скрипт фильтрует файлы по расширению сам и загружает только
// изображения, поэтому resource_type здесь всегда "image".
function uploadBuffer(buffer: Buffer): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ resource_type: "image" }, (error, result) => {
      if (error || !result) reject(error ?? new Error("Cloudinary вернул пустой результат"));
      else resolve(result);
    });
    Readable.from(buffer).pipe(stream);
  });
}

export async function POST(request: Request) {
  const token = request.headers.get("x-upload-token");
  if (!process.env.UPLOAD_TOKEN || token !== process.env.UPLOAD_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const fileName = request.headers.get("x-file-name");
  if (!fileName) {
    return NextResponse.json({ error: "x-file-name header required" }, { status: 400 });
  }

  const buffer = Buffer.from(await request.arrayBuffer());
  if (buffer.length === 0) {
    return NextResponse.json({ error: "empty file" }, { status: 400 });
  }

  try {
    const result = await uploadBuffer(buffer);
    return NextResponse.json({ url: result.secure_url });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Не удалось загрузить в Cloudinary: ${detail}` }, { status: 500 });
  }
}
