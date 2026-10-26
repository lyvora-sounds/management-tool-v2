import { NextResponse } from "next/server";
import { applyGithubWebhookEffect } from "@/lib/integrations/githubConnection";
import { githubWebhookEffect, readGithubAppConfig, verifyGithubWebhookSignature } from "@/lib/integrations/githubApp";

export async function POST(request: Request) {
  const config = readGithubAppConfig();
  if (!config) return NextResponse.json({ error: "GitHub App is not configured" }, { status: 500 });

  const body = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  if (!verifyGithubWebhookSignature(config.webhookSecret, body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
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
