// Диапазоны IP, с которых ЮKassa отправляет уведомления о платежах.
// Источник: https://yookassa.ru/developers/using-api/webhooks
const IPV4_CIDR_RANGES = [
  "185.71.76.0/27",
  "185.71.77.0/27",
  "77.75.153.0/25",
  "77.75.156.11/32",
  "77.75.156.35/32",
  "77.75.154.128/25",
];

// 2a02:5180::/32 — единственный разрешённый IPv6-диапазон, /32 означает
// совпадение первых двух блоков адреса.
const IPV6_PREFIXES = ["2a02:5180"];

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function isIpv4InCidr(ip: string, cidr: string): boolean {
  const [range, bitsStr] = cidr.split("/");
  const bits = Number(bitsStr);
  const ipInt = ipv4ToInt(ip);
  const rangeInt = ipv4ToInt(range);
  if (ipInt === null || rangeInt === null) return false;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (ipInt & mask) === (rangeInt & mask);
}

export function isYookassaIp(rawIp: string | null): boolean {
  if (!rawIp) return false;
  const ip = rawIp.trim();
  if (!ip) return false;

  if (ip.includes(":")) {
    const normalized = ip.toLowerCase();
    return IPV6_PREFIXES.some((prefix) => normalized.startsWith(prefix));
  }

  return IPV4_CIDR_RANGES.some((cidr) => isIpv4InCidr(ip, cidr));
}
