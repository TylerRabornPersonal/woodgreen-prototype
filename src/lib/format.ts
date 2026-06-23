/** Shared input formatting + validation helpers. */

export const phoneDigits = (v: string) => v.replace(/\D/g, "").slice(0, 10);

/** Auto-format to (XXX) XXX-XXXX as the user types digits. */
export function formatPhone(v: string): string {
  const d = phoneDigits(v);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export const isValidPhone = (v: string) => phoneDigits(v).length === 10;

export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
