import { randomUUID } from "node:crypto";

const YOOKASSA_API_BASE = "https://api.yookassa.ru/v3";

export class YookassaApiError extends Error {}

function getAuthHeader(): string {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secretKey) {
    throw new YookassaApiError("Не заданы YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY в .env.local");
  }
  return "Basic " + Buffer.from(`${shopId}:${secretKey}`).toString("base64");
}

export type YookassaPayment = {
  id: string;
  status: "pending" | "waiting_for_capture" | "succeeded" | "canceled";
  paid: boolean;
  amount: { value: string; currency: string };
  confirmation?: { type: string; confirmation_url?: string };
  metadata?: Record<string, string>;
};

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function createYookassaPayment(params: {
  amount: number;
  orderId: number;
  returnUrl: string;
  description: string;
}): Promise<YookassaPayment> {
  let res: Response;
  try {
    res = await fetch(`${YOOKASSA_API_BASE}/payments`, {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(),
        "Idempotence-Key": randomUUID(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: { value: params.amount.toFixed(2), currency: "RUB" },
        capture: true,
        confirmation: { type: "redirect", return_url: params.returnUrl },
        description: params.description,
        metadata: { orderId: String(params.orderId) },
      }),
    });
  } catch (err) {
    throw new YookassaApiError(
      `Не удалось связаться с ЮKassa: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const json = (await parseJson(res)) as { description?: string; error?: { description?: string } } | null;
  if (!res.ok) {
    const message = json?.description ?? json?.error?.description ?? `ЮKassa вернула ошибку (HTTP ${res.status})`;
    throw new YookassaApiError(message);
  }

  return json as unknown as YookassaPayment;
}

export async function getYookassaPayment(paymentId: string): Promise<YookassaPayment> {
  let res: Response;
  try {
    res = await fetch(`${YOOKASSA_API_BASE}/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: getAuthHeader() },
    });
  } catch (err) {
    throw new YookassaApiError(
      `Не удалось связаться с ЮKassa: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const json = (await parseJson(res)) as { description?: string } | null;
  if (!res.ok) {
    throw new YookassaApiError(json?.description ?? `ЮKassa вернула ошибку при проверке платежа (HTTP ${res.status})`);
  }

  return json as unknown as YookassaPayment;
}
