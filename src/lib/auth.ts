/**
 * Prototype accounts for the login screen. Username = email; password meets the
 * policy (≥8 chars, ≥1 letter, ≥1 number, ≥1 special). Each account has a TOTP
 * secret for Google Authenticator 2FA. PRODUCTION: Supabase Auth (passwords
 * hashed, TOTP enrolled server-side) — this is demo-only, credentials are not
 * secrets.
 */

export type Role = "operator" | "tenant";

export type Account = {
  id: string;
  label: string; // shown in the demo dropdown
  role: Role;
  email: string; // username
  password: string;
  totpSecret: string; // base32, for Google Authenticator
  tenantId?: string; // which portal session to activate (tenant accounts)
};

export const ACCOUNTS: Account[] = [
  { id: "operator", label: "Operator — Tyler (admin)", role: "operator", email: "tyler@rabornmedia.com", password: "Operator#1", totpSecret: "JBSWY3DPEHPK3PXP" },
  { id: "caldwell", label: "Tenant — Caldwell & Associates", role: "tenant", email: "jane@caldwellpllc.com", password: "Caldwell#1", totpSecret: "KRSXG5CTMVRXEZLU", tenantId: "caldwell" },
  { id: "magnolia", label: "Tenant — Magnolia Wealth", role: "tenant", email: "spike@magnoliawealth.com", password: "Magnolia#1", totpSecret: "MFRGGZDFMZTWQ2LK", tenantId: "magnolia" },
];

export function findAccount(email: string): Account | undefined {
  const e = email.trim().toLowerCase();
  return ACCOUNTS.find((a) => a.email.toLowerCase() === e);
}

/** Individual password-policy checks (for live hints). */
export function passwordChecks(pw: string) {
  return {
    length: pw.length >= 8,
    letter: /[A-Za-z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
}

export function passwordValid(pw: string): boolean {
  const c = passwordChecks(pw);
  return c.length && c.letter && c.number && c.special;
}
