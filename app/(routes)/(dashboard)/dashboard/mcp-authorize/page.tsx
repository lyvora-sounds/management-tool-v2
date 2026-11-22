import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { McpAuthorizeForm } from "./McpAuthorizeForm";

export const dynamic = "force-dynamic";
export const metadata = { referrer: "no-referrer" as const, robots: { index: false, follow: false } };

export default async function McpAuthorizePage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("mcpOAuth");
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (Array.isArray(value)) return <p className="p-6">{t("invalidRequest")}</p>;
    if (value !== undefined) query.set(key, value);
  }
  // kiki-api validates the request, decides what the person may connect and issues the code; this page only
  // shows the form that asks it.
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return <McpAuthorizeForm params={query.toString()} />;
}
