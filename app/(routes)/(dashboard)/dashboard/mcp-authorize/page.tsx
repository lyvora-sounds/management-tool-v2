import { validateAuthorizationRequest } from "@/lib/mcp/oauthClients";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import db from "@/lib/db";
import { isBoardAdmin, readableBoardWhere } from "@/lib/boardAccess";
import { issueAuthorizationCode } from "@/lib/mcp/oauth";
import { authorizationCallback } from "@/lib/mcp/oauthConfig";

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
  let authorization;
  try { authorization = await validateAuthorizationRequest(query); }
  catch { return <p className="p-6">{t("invalidRequest")}</p>; }
  const serialized = query.toString();
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const user = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) redirect("/dashboard");

  const organizations = await db.organizationMember.findMany({
    where: { userId: user.id, role: { in: ["owner", "admin"] } },
    select: { organization: { select: { id: true, name: true } } },
  });
  const readableBoards = await db.board.findMany({
    where: readableBoardWhere(user.id),
    select: { id: true, title: true, organization: { select: { name: true } } },
  });
  const boards = (await Promise.all(readableBoards.map(async (board) =>
    await isBoardAdmin(user.id, board.id) ? board : null))).filter((board) => board !== null);

  async function consent(form: FormData) {
    "use server";
    // Next.js server actions enforce same-origin POSTs. Revalidate the bound
    // OAuth request and current Clerk identity; never trust posted privileges.
    const validated = await validateAuthorizationRequest(new URLSearchParams(serialized));
    const { userId: clerkId } = await auth();
    if (!clerkId) redirect("/sign-in");
    const actor = await db.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!actor) redirect("/sign-in");
    if (validated.ownerId && validated.ownerId !== actor.id) redirect(authorizationCallback(validated, { error: "access_denied" }));
    if (form.get("decision") === "deny") redirect(authorizationCallback(validated, { error: "access_denied" }));
    if (form.get("decision") !== "allow") throw new Error("Invalid consent");
    const selection = form.get("selection");
    if (typeof selection !== "string") throw new Error("Select a scope");
    const code = await issueAuthorizationCode(actor.id, validated, selection, form.get("writeAccess") === "on");
    redirect(authorizationCallback(validated, { code }));
  }

  const hasOptions = organizations.length > 0 || boards.length > 0;
  return (
    <div className="mx-auto max-w-xl p-6 sm:p-10">
      <div className="space-y-5 rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
        <p className="text-sm">{t("permissions")}</p>
        <form action={consent} className="space-y-5">
          {hasOptions ? <>
            <label className="block text-sm font-medium" htmlFor="mcp-oauth-selection">{t("selection")}</label>
            <select required id="mcp-oauth-selection" name="selection" defaultValue="" className="w-full rounded-md border bg-background p-2">
              <option value="" disabled>{t("choose")}</option>
              {organizations.map(({ organization }) => <option key={organization.id} value={`organization:${organization.id}`}>
                {t("organization", { name: organization.name })}
              </option>)}
              {boards.map((board) => <option key={board.id} value={`board:${board.id}`}>
                {t("board", { name: board.title, organization: board.organization.name })}
              </option>)}
            </select>
          </> : <p className="text-sm">{t("noScopes")}</p>}
          <p className="text-sm text-muted-foreground">{t("revoke")}</p>
          {authorization.writeRequested && <label className="flex gap-2 text-sm"><input type="checkbox" name="writeAccess" />{t("writeAccess")}</label>}
          <div className="flex gap-3">
            <button name="decision" value="allow" disabled={!hasOptions} className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">{t("allow")}</button>
            <button name="decision" value="deny" formNoValidate className="rounded-md border px-4 py-2">{t("deny")}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
