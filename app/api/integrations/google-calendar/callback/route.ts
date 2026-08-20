import { NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/integrations/googleCalendar";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state");

  if (!code || !userId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || ""}/dashboard/settings?calendar=error`,
    );
  }

  try {
    await exchangeCodeForTokens(code, userId);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || ""}/dashboard/settings?calendar=connected`,
    );
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || ""}/dashboard/settings?calendar=error`,
    );
  }
}
