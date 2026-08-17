const CDEK_API_BASE = "https://api.cdek.ru/v2";

export class CdekAuthError extends Error {}

export class CdekApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type CdekTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

let cachedToken: { value: string; expiresAt: number } | null = null;

export async function getCdekToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const clientId = process.env.CDEK_CLIENT_ID;
  const clientSecret = process.env.CDEK_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new CdekAuthError("Не заданы переменные окружения CDEK_CLIENT_ID / CDEK_CLIENT_SECRET");
  }

  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  let res: Response;
  try {
    res = await fetch(`${CDEK_API_BASE}/oauth/token?${params.toString()}`, { method: "POST" });
  } catch (err) {
    throw new CdekAuthError(
      `Не удалось подключиться к СДЭК для получения токена: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (!res.ok) {
    let detail = "";
    try {
      const json = await res.json();
      detail = json?.error_description || json?.error || "";
    } catch {
      detail = await res.text().catch(() => "");
    }
    if (res.status === 400 || res.status === 401) {
      throw new CdekAuthError(
        `Неверный CDEK_CLIENT_ID или CDEK_CLIENT_SECRET (HTTP ${res.status})${detail ? `: ${detail}` : ""}`,
      );
    }
    throw new CdekAuthError(`СДЭК не выдал токен (HTTP ${res.status})${detail ? `: ${detail}` : ""}`);
  }

  const json = (await res.json()) as CdekTokenResponse;
  if (!json.access_token) {
    throw new CdekAuthError("Ответ СДЭК не содержит access_token");
  }

  // небольшой запас, чтобы обновлять токен чуть раньше фактического истечения
  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000 - 60_000,
  };

  return cachedToken.value;
}

/**
 * Выполняет запрос к API СДЭК с автоматической подстановкой Bearer-токена.
 * При 401 один раз принудительно обновляет токен и повторяет запрос
 * (на случай, если СДЭК инвалидировал токен раньше заявленного expires_in).
 */
export async function cdekRequest<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const token = await getCdekToken();

  let res: Response;
  try {
    res = await fetch(`${CDEK_API_BASE}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    throw new CdekApiError(`Не удалось связаться с API СДЭК: ${err instanceof Error ? err.message : String(err)}`, 0);
  }

  if (res.status === 401 && retry) {
    await getCdekToken(true);
    return cdekRequest<T>(path, init, false);
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    if (!res.ok) {
      throw new CdekApiError(`Ошибка СДЭК (HTTP ${res.status})`, res.status);
    }
    throw new CdekApiError("СДЭК вернул некорректный (не-JSON) ответ", res.status);
  }

  if (!res.ok) {
    const errors = (json as { errors?: { message: string }[] } | null)?.errors;
    const message = errors?.length ? errors.map((e) => e.message).join("; ") : `Ошибка СДЭК (HTTP ${res.status})`;
    throw new CdekApiError(message, res.status);
  }

  return json as T;
}
