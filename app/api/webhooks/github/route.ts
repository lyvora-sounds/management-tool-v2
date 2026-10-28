import { NextResponse } from "next/server";
import { applyGithubWebhookEffect } from "@/lib/integrations/githubConnection";
import { githubWebhookEffect, readGithubAppConfig, verifyGithubWebhookSignature } from "@/lib/integrations/githubApp";

const MAX_WEBHOOK_BYTES = 1_000_000;

export async function POST(request: Request) {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_WEBHOOK_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const body = await request.text();
  if (body.length > MAX_WEBHOOK_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const config = readGithubAppConfig();
  const signature = request.headers.get("x-hub-signature-256");
  const secret = config?.webhookSecret ?? "unconfigured-placeholder";
  if (!config || !verifyGithubWebhookSignature(secret, body, signature)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const event = request.headers.get("x-github-event") ?? "";
  await applyGithubWebhookEffect(githubWebhookEffect(event, payload));
  return NextResponse.json({ received: true });
}
