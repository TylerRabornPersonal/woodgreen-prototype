/**
 * TOTP (RFC 6238) — real two-factor that works with Google Authenticator.
 * Runs in the browser via Web Crypto (HMAC-SHA1). Verifies a 6-digit code with
 * a ±1 step window (30s steps). In production the secret lives server-side and
 * Supabase/your backend verifies; here it's client-side for the prototype demo.
 */

const B32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(b32: string): Uint8Array {
  const clean = b32.replace(/=+$/, "").replace(/\s/g, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = B32_ALPHABET.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

async function hotp(key: Uint8Array, counter: number): Promise<string> {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setUint32(0, Math.floor(counter / 2 ** 32)); // high 32 (big-endian)
  view.setUint32(4, counter >>> 0); // low 32
  const cryptoKey = await crypto.subtle.importKey("raw", key as unknown as BufferSource, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, buf));
  const offset = sig[sig.length - 1] & 0x0f;
  const bin =
    ((sig[offset] & 0x7f) << 24) |
    ((sig[offset + 1] & 0xff) << 16) |
    ((sig[offset + 2] & 0xff) << 8) |
    (sig[offset + 3] & 0xff);
  return (bin % 1_000_000).toString().padStart(6, "0");
}

const STEP = 30;

/** The valid 6-digit code right now (used for the demo "fill code" helper). */
export async function totpNow(secret: string, time: number = Date.now()): Promise<string> {
  return hotp(base32Decode(secret), Math.floor(time / 1000 / STEP));
}

/** Verify a submitted code against the secret (±1 step tolerance). */
export async function verifyTotp(secret: string, code: string, time: number = Date.now(), window = 1): Promise<boolean> {
  const c = code.replace(/\D/g, "");
  if (c.length !== 6) return false;
  const key = base32Decode(secret);
  const counter = Math.floor(time / 1000 / STEP);
  for (let w = -window; w <= window; w++) {
    if ((await hotp(key, counter + w)) === c) return true;
  }
  return false;
}

/** otpauth:// URI to scan/enter into Google Authenticator. */
export function otpauthUri(secret: string, account: string, issuer = "25 Woodgreen"): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

/** Group the base32 secret into 4-char blocks for manual entry. */
export function formatSecret(secret: string): string {
  return secret.replace(/(.{4})/g, "$1 ").trim();
}
