import crypto from "crypto";

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function pepper(): string {
  return (
    process.env.ENCRYPTION_SECRET ||
    process.env.CLERK_SECRET_KEY ||
    "kikiboard-fallback-secret-key-32-chars-min!!"
  );
}

export function normalizePhone(input: string): string | null {
  const compact = input.replace(/[\s()-]/g, "");
  if (!/^\+[1-9]\d{7,14}$/.test(compact)) return null;
  return compact;
}

export function createNumericCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashMfaCode(code: string, userId: string): string {
  return crypto.createHash("sha256").update(`${userId}:${code}:${pepper()}`).digest("hex");
}

export function codesMatch(hash: string | null | undefined, code: string, userId: string): boolean {
  if (!hash) return false;
  const next = hashMfaCode(code.replace(/\s/g, ""), userId);
  const left = Buffer.from(hash);
  const right = Buffer.from(next);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function codeExpiry(now = Date.now()): Date {
  return new Date(now + CODE_TTL_MS);
}

export function codeIsCurrent(expiresAt: Date | null | undefined, now = Date.now()): boolean {
  return !!expiresAt && expiresAt.getTime() > now;
}

export function recentlySent(expiresAt: Date | null | undefined, now = Date.now()): boolean {
  if (!expiresAt) return false;
  return expiresAt.getTime() - now > CODE_TTL_MS - 30_000;
}

export function attemptsLeft(attempts: number): boolean {
  return attempts < MAX_ATTEMPTS;
}

export function base32Encode(bytes: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32[(value << (5 - bits)) & 31];
  return output;
}

export function base32Decode(input: string): Buffer {
  const clean = input.replace(/=+$/g, "").toUpperCase().replace(/\s/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const char of clean) {
    const idx = BASE32.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export function createTotpSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

export function totpUri(secret: string, account: string): string {
  const label = encodeURIComponent(`Kiki:${account}`);
  const issuer = encodeURIComponent("Kiki");
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

function hotp(secret: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const digest = crypto.createHmac("sha1", secret).update(buf).digest();
  const offset = digest[digest.length - 1] & 0xf;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    (digest[offset + 1] << 16) |
    (digest[offset + 2] << 8) |
    digest[offset + 3];
  return String(binary % 1_000_000).padStart(6, "0");
}

export function totpCode(secret: string, at = Date.now()): string {
  const counter = Math.floor(at / 30_000);
  return hotp(base32Decode(secret), counter);
}

export function verifyTotp(secret: string, code: string, at = Date.now()): boolean {
  const normalized = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(normalized)) return false;
  const counter = Math.floor(at / 30_000);
  const key = base32Decode(secret);
  for (let skew = -1; skew <= 1; skew++) {
    if (hotp(key, counter + skew) === normalized) return true;
  }
  return false;
}
