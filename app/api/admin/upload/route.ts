import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Выдаёт подписанные параметры для прямой загрузки файла из браузера в
 * Cloudinary — сами байты файла через наш сервер не идут. Это важно для
 * видео: без прямой загрузки пришлось бы прогонять их через тело
 * serverless-функции, у которого жёсткий лимит ~4.5 МБ (видео до 100 МБ его
 * легко превышают).
 *
 * Маршрут уже защищён проверкой админ-сессии в proxy.ts
 * (matcher включает /api/admin/:path*).
 */
export async function POST() {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return NextResponse.json({ error: "Cloudinary не настроен на сервере" }, { status: 500 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request({ timestamp }, process.env.CLOUDINARY_API_SECRET);

  return NextResponse.json({
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  });
}
