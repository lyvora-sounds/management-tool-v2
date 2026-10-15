import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import {
  attemptsLeft,
  codeIsCurrent,
  codesMatch,
  normalizePhone,
  verifyTotp,
} from "@/lib/mfa";
import {
  ensureMfa,
  loadAccount,
  pendingTotpSecret,
  publicMfa,
  sendEmailCode,
  sendPhoneCode,
  startTotp,
} from "@/lib/mfaAccount";

async function context() {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await loadAccount(userId);
  if (!user) return null;
  return user;
}

function failure(error: string) {
  const status = error === "too_soon" ? 429 : error === "send_failed" ? 502 : 400;
  return NextResponse.json({ error }, { status });
}

export async function GET() {
  const user = await context();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(publicMfa(user.email, user.mfa));
}

export async function POST(req: Request) {
  const user = await context();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const action = typeof body?.action === "string" ? body.action : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const mfa = await ensureMfa(user.id);

  if (action === "email-send") {
    const result = await sendEmailCode(user.id, user.email, mfa.emailCodeExpiresAt);
    if ("error" in result) return failure(result.error);
    return NextResponse.json({ ok: true, email: user.email });
  }

  if (action === "email-verify") {
    if (!attemptsLeft(mfa.emailCodeAttempts)) return failure("too_many");
    if (!codeIsCurrent(mfa.emailCodeExpiresAt) || !codesMatch(mfa.emailCodeHash, code, user.id)) {
      await db.userMfa.update({ where: { userId: user.id }, data: { emailCodeAttempts: { increment: 1 } } });
      return failure("invalid_code");
    }
    const next = await db.userMfa.update({
      where: { userId: user.id },
      data: { emailEnabled: true, emailCodeHash: null, emailCodeExpiresAt: null, emailCodeAttempts: 0 },
    });
    return NextResponse.json(publicMfa(user.email, next));
  }

  if (action === "email-disable") {
    const next = await db.userMfa.update({
      where: { userId: user.id },
      data: { emailEnabled: false, emailCodeHash: null, emailCodeExpiresAt: null, emailCodeAttempts: 0 },
    });
    return NextResponse.json(publicMfa(user.email, next));
  }

  if (action === "phone-send") {
    const phone = normalizePhone(typeof body?.phone === "string" ? body.phone : "");
    if (!phone) return failure("invalid_phone");
    const result = await sendPhoneCode(user.id, user.email, phone, mfa.phoneCodeExpiresAt);
    if ("error" in result) return failure(result.error);
    return NextResponse.json({ ok: true, email: user.email, phone });
  }

  if (action === "phone-verify") {
    if (!attemptsLeft(mfa.phoneCodeAttempts)) return failure("too_many");
    if (!mfa.phonePending || !codeIsCurrent(mfa.phoneCodeExpiresAt) || !codesMatch(mfa.phoneCodeHash, code, user.id)) {
      await db.userMfa.update({ where: { userId: user.id }, data: { phoneCodeAttempts: { increment: 1 } } });
      return failure("invalid_code");
    }
    const next = await db.userMfa.update({
      where: { userId: user.id },
      data: {
        phone: mfa.phonePending,
        phoneEnabled: true,
        phonePending: null,
        phoneCodeHash: null,
        phoneCodeExpiresAt: null,
        phoneCodeAttempts: 0,
      },
    });
    return NextResponse.json(publicMfa(user.email, next));
  }

  if (action === "phone-disable") {
    const next = await db.userMfa.update({
      where: { userId: user.id },
      data: {
        phone: null,
        phoneEnabled: false,
        phonePending: null,
        phoneCodeHash: null,
        phoneCodeExpiresAt: null,
        phoneCodeAttempts: 0,
      },
    });
    return NextResponse.json(publicMfa(user.email, next));
  }

  if (action === "totp-start") {
    if (mfa.totpEnabled) return failure("already_on");
    return NextResponse.json(await startTotp(user.id, user.email));
  }

  if (action === "totp-verify") {
    const secret = pendingTotpSecret(mfa.totpPending);
    if (!secret || !verifyTotp(secret, code)) return failure("invalid_code");
    const next = await db.userMfa.update({
      where: { userId: user.id },
      data: { totpSecret: encrypt(secret), totpPending: null, totpEnabled: true },
    });
    return NextResponse.json(publicMfa(user.email, next));
  }

  if (action === "totp-disable") {
    const next = await db.userMfa.update({
      where: { userId: user.id },
      data: { totpEnabled: false, totpSecret: null, totpPending: null },
    });
    return NextResponse.json(publicMfa(user.email, next));
  }

  return failure("unknown_action");
}
