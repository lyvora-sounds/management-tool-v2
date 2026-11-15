"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/apiClient";
import type { ApiSchemas } from "@/lib/api/types";

type Options = ApiSchemas["McpConsentOptions"];

/**
 * The consent screen of the MCP OAuth flow. What the person may connect, and what the answer grants, is decided
 * by kiki-api; this only shows it and sends the person back to the client with the address the API returns.
 * `params` is the query string of the authorization request, exactly as the client sent it.
 */
export function McpAuthorizeForm({ params }: { params: string }) {
  const t = useTranslations("mcpOAuth");
  const [options, setOptions] = useState<Options | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "invalid" | "failed">("loading");
  const [selection, setSelection] = useState("");
  const [writeAccess, setWriteAccess] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    apiFetch(`/api/mcp/oauth/consent?${params}`)
      .then(async (response) => {
        if (cancelled) return;
        if (response.status === 400) return setState("invalid");
        if (!response.ok) return setState("failed");
        setOptions((await response.json()) as Options);
        setState("ready");
      })
      .catch(() => !cancelled && setState("failed"));
    return () => {
      cancelled = true;
    };
  }, [params]);

  async function answer(decision: "allow" | "deny") {
    setSending(true);
    setError("");
    try {
      const response = await apiFetch("/api/mcp/oauth/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          params,
          decision,
          ...(decision === "allow" ? { selection: options?.lockedSelection ?? selection, writeAccess } : {}),
        }),
      });
      const body = (await response.json().catch(() => null)) as { redirectTo?: string; message?: string } | null;
      if (!response.ok || !body?.redirectTo) {
        setError(body?.message ?? t("failed"));
        setSending(false);
        return;
      }
      // The API builds this address from the callbacks registered for the client; it is not taken from the page.
      window.location.assign(body.redirectTo);
    } catch {
      setError(t("failed"));
      setSending(false);
    }
  }

  if (state === "invalid") return <p className="p-6">{t("invalidRequest")}</p>;
  if (state === "failed") return <p className="p-6">{t("failed")}</p>;
  if (state === "loading" || !options) return <p className="p-6 text-muted-foreground">{t("loading")}</p>;

  const client = options.client;
  const hasOptions = options.organizations.length > 0 || options.boards.length > 0;
  const lockedOrganization = options.lockedSelection?.startsWith("organization:")
    ? options.organizations.find((organization) => `organization:${organization.id}` === options.lockedSelection)
    : undefined;
  const lockedBoard = options.lockedSelection?.startsWith("board:")
    ? options.boards.find((board) => `board:${board.id}` === options.lockedSelection)
    : undefined;

  return (
    <div className="mx-auto max-w-xl p-6 sm:p-10">
      <div className="space-y-5 rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">{t("title", { client })}</h1>
        <p className="text-sm text-muted-foreground">{t("description", { client })}</p>
        <p className="text-sm">{t("permissions")}</p>
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            void answer("allow");
          }}
        >
          {hasOptions ? (
            <>
              <label className="block text-sm font-medium" htmlFor="mcp-oauth-selection">{t("selection")}</label>
              {lockedOrganization || lockedBoard ? (
                <p id="mcp-oauth-selection" className="rounded-md border bg-background p-2 text-sm">
                  {lockedOrganization
                    ? t("organization", { name: lockedOrganization.name })
                    : t("board", { name: lockedBoard!.title, organization: lockedBoard!.organizationName })}
                </p>
              ) : (
                <select
                  required
                  id="mcp-oauth-selection"
                  value={selection}
                  onChange={(event) => setSelection(event.target.value)}
                  className="w-full rounded-md border bg-background p-2"
                >
                  <option value="" disabled>{t("choose")}</option>
                  {options.organizations.map((organization) => (
                    <option key={organization.id} value={`organization:${organization.id}`}>
                      {t("organization", { name: organization.name })}
                    </option>
                  ))}
                  {options.boards.map((board) => (
                    <option key={board.id} value={`board:${board.id}`}>
                      {t("board", { name: board.title, organization: board.organizationName })}
                    </option>
                  ))}
                </select>
              )}
            </>
          ) : (
            <p className="text-sm">{t("noScopes")}</p>
          )}
          <p className="text-sm text-muted-foreground">{t("revoke", { client })}</p>
          {options.writeRequested && (
            <label className="flex gap-2 text-sm">
              <input type="checkbox" checked={writeAccess} onChange={(event) => setWriteAccess(event.target.checked)} />
              {t("writeAccess")}
            </label>
          )}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={!hasOptions || sending} className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">{t("allow")}</button>
            <button type="button" disabled={sending} onClick={() => void answer("deny")} className="rounded-md border px-4 py-2 disabled:opacity-50">{t("deny")}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
