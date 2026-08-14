export const PHONE_PATTERN = /^\+7\d{10}$/;

export function normalizePhone(value: string): string {
  return value.replace(/[\s()-]/g, "");
}

export function isBlank(value: string | undefined | null): boolean {
  return !value || value.trim().length === 0;
}

export function isValidPhone(value: string | undefined | null): boolean {
  if (!value) return false;
  return PHONE_PATTERN.test(normalizePhone(value));
}

export function isValidEmail(value: string | undefined | null): boolean {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
