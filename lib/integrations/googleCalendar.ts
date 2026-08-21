import db from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";

export function getGoogleOAuthUrl(userId: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/integrations/google-calendar/callback`;

  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID no está configurado en las variables de entorno.");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.events",
    access_type: "offline",
    prompt: "consent",
    state: userId,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string, userId: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/integrations/google-calendar/callback`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId || "",
      client_secret: clientSecret || "",
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error exchanging Google OAuth code: ${errText}`);
  }

  const data = await res.json();
  const { access_token, refresh_token, expires_in } = data;

  const expiryDate = new Date(Date.now() + (expires_in || 3600) * 1000);

  await db.userCalendarSync.upsert({
    where: { userId },
    create: {
      userId,
      accessToken: encrypt(access_token),
      refreshToken: refresh_token ? encrypt(refresh_token) : null,
      expiryDate,
      enabled: true,
    },
    update: {
      accessToken: encrypt(access_token),
      ...(refresh_token && { refreshToken: encrypt(refresh_token) }),
      expiryDate,
      enabled: true,
    },
  });
}

async function getValidAccessToken(userId: string): Promise<string | null> {
  const sync = await db.userCalendarSync.findUnique({ where: { userId } });
  if (!sync || !sync.enabled) return null;

  let accessToken = decrypt(sync.accessToken);
  const isExpired = sync.expiryDate && new Date() >= sync.expiryDate;

  if (isExpired && sync.refreshToken) {
    const refreshToken = decrypt(sync.refreshToken);
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId || "",
        client_secret: clientSecret || "",
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (res.ok) {
      const data = await res.json();
      accessToken = data.access_token;
      const expiryDate = new Date(Date.now() + (data.expires_in || 3600) * 1000);

      await db.userCalendarSync.update({
        where: { userId },
        data: {
          accessToken: encrypt(accessToken),
          expiryDate,
        },
      });
    }
  }

  return accessToken;
}

export async function syncTaskToGoogleCalendar(
  userId: string,
  taskId: string,
  title: string,
  description?: string | null,
  dueDate?: Date | null,
) {
  if (!dueDate) return;

  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) return;

  try {
    const startStr = dueDate.toISOString().split("T")[0];
    const eventBody = {
      summary: `[Kikiboard] ${title}`,
      description: description || "",
      start: { date: startStr },
      end: { date: startStr },
    };

    const res = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
      },
    );

    if (res.ok) {
      const data = await res.json();
      await db.task.update({
        where: { id: taskId },
        data: { googleEventId: data.id },
      });
    }
  } catch (err) {
    console.error("Failed to sync to Google Calendar:", err);
  }
}
