import { getResend } from "@/lib/resend";
import db from "@/lib/db";
import { decrypt, encrypt } from "@/lib/crypto";
import {
  codeExpiry,
  createNumericCode,
  createTotpSecret,
  hashMfaCode,
  recentlySent,
  totpUri,
} from "@/lib/mfa";


type CodeDelivery =
  | { ok: true }
  | { ok: false; error: "too_soon" | "send_failed" };

export async function loadAccount(clerkId: string) {
  return db.user.findUnique({
    where: { clerkId },
    include: { mfa: true },
  });
}

export async function ensureMfa(userId: string) {
  return db.userMfa.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

async function sendCode(to: string, text: string) {
  if (!process.env.RESEND_API_KEY) return false;
  const { error } = await getResend().emails.send({
    from: "Kiki <no-reply@kikiboard.xyz>",
    to,
    subject: "Your Kiki security code",
    text,
  });
  return !error;
}

export async function sendEmailCode(userId: string, email: string, existingExpiresAt: Date | null): Promise<CodeDelivery> {
  if (recentlySent(existingExpiresAt)) return { ok: false, error: "too_soon" };
  const code = createNumericCode();
  const sent = await sendCode(
    email,
    `Your Kiki security code is ${code}. It expires in 10 minutes.`,
  );
  if (!sent) return { ok: false, error: "send_failed" };
  await db.userMfa.update({
    where: { userId },
    data: {
      emailCodeHash: hashMfaCode(code, userId),
      emailCodeExpiresAt: codeExpiry(),
      emailCodeAttempts: 0,
    },
  });
  return { ok: true as const };
}

export async function sendPhoneCode(userId: string, email: string, phone: string, existingExpiresAt: Date | null): Promise<CodeDelivery> {
  if (recentlySent(existingExpiresAt)) return { ok: false, error: "too_soon" };
  const code = createNumericCode();
  const sent = await sendCode(
    email,
    `Use ${code} to confirm ${phone} on your Kiki account. It expires in 10 minutes.`,
  );
  if (!sent) return { ok: false, error: "send_failed" };
  await db.userMfa.update({
    where: { userId },
    data: {
      phonePending: phone,
      phoneCodeHash: hashMfaCode(code, userId),
      phoneCodeExpiresAt: codeExpiry(),
      phoneCodeAttempts: 0,
    },
  });
  return { ok: true as const };
}

export async function startTotp(userId: string, email: string) {
  const secret = createTotpSecret();
  await db.userMfa.update({
    where: { userId },
    data: { totpPending: encrypt(secret) },
  });
  const uri = totpUri(secret, email);
  const QRCode = (await import("qrcode")).default;
  const qr = await QRCode.toDataURL(uri, { margin: 1, width: 220 });
  return { secret, qr };
}

export function pendingTotpSecret(encrypted: string | null): string {
  if (!encrypted) return "";
  return decrypt(encrypted);
}

export function publicMfa(email: string, mfa: {
  emailEnabled: boolean;
  phone: string | null;
  phoneEnabled: boolean;
  totpEnabled: boolean;
} | null) {
  return {
    email,
    emailEnabled: mfa?.emailEnabled ?? false,
    phone: mfa?.phoneEnabled ? mfa.phone : null,
    phoneEnabled: mfa?.phoneEnabled ?? false,
    totpEnabled: mfa?.totpEnabled ?? false,
  };
}
