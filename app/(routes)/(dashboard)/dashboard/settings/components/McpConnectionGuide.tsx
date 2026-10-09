"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { copyToClipboard } from "@/lib/copyText";

type Provider = "chatgpt" | "claude" | "grok" | "gemini";
type OAuthClient = { id: string; redirectUris: string[]; allowWrite: boolean };
const providers: Provider[] = ["chatgpt", "claude", "grok", "gemini"];
const names = { chatgpt: "ChatGPT", claude: "Claude", grok: "Grok", gemini: "Gemini" };
const docs = {
  chatgpt: "https://developers.openai.com/api/docs/guides/custom-mcp-server",
  claude: "https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp",
  grok: "https://docs.x.ai/build/features/mcp-servers",
  gemini: "https://geminicli.com/docs/tools/mcp-server/",
};

export function McpConnectionGuide({ endpoint }: { endpoint: string }) {
  const t = useTranslations("mcpGuide");
  const [provider, setProvider] = useState<Provider>("chatgpt");
  const [callback, setCallback] = useState("");
  const [allowWrite, setAllowWrite] = useState(false);
  const [clients, setClients] = useState<OAuthClient[]>([]);
  const [created, setCreated] = useState<(OAuthClient & { secret: string }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings/mcp/oauth-clients").then(async (response) => {
      if (!response.ok) throw new Error("load");
      const data = await response.json();
      if (!cancelled) setClients(data);
    }).catch(() => { if (!cancelled) toast.error(t("loadError")); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [t]);

  async function copy(value: string) {
    if (await copyToClipboard(value)) toast.success(t("copied"));
    else toast.error(t("copyError"));
  }

  async function createClient(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch("/api/settings/mcp/oauth-clients", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ redirectUri: callback.trim(), allowWrite }),
      });
      if (!response.ok) throw new Error("create");
      const client = await response.json();
      setCreated(client); setClients((current) => [client, ...current]);
    } catch { toast.error(t("createError")); }
    finally { setBusy(false); }
  }

  async function revoke(id: string) {
    setBusy(true);
    try {
      const response = await fetch("/api/settings/mcp/oauth-clients", {
        method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error("revoke");
      setClients((current) => current.filter((client) => client.id !== id));
      if (created?.id === id) setCreated(null);
      toast.success(t("revoked"));
    } catch { toast.error(t("revokeError")); }
    finally { setBusy(false); }
  }

  const snippet = provider === "grok"
    ? `grok mcp add --transport http kikiboard ${endpoint} --header "Authorization: Bearer \${KIKIBOARD_TOKEN}"`
    : provider === "gemini"
      ? JSON.stringify({ mcpServers: { kikiboard: { httpUrl: endpoint, headers: { Authorization: "Bearer kiki_YOUR_TOKEN" } } } }, null, 2)
      : `Authorization: Bearer kiki_YOUR_TOKEN`;

  return <section className="rounded-xl border bg-card p-5 space-y-4" aria-label={t("title")}>
    <div><h3 className="font-semibold">{t("title")}</h3><p className="text-sm text-muted-foreground">{t("intro")}</p></div>
    <div className="flex flex-wrap gap-2" role="group" aria-label={t("provider")}>
      {providers.map((item) => <Button key={item} type="button" size="sm" variant={provider === item ? "default" : "outline"} aria-pressed={provider === item} onClick={() => setProvider(item)}>{names[item]}</Button>)}
    </div>
    <p className="text-sm text-muted-foreground">{t(`${provider}.intro`)}</p>
    <details className="rounded-md border p-3 text-sm"><summary className="cursor-pointer font-medium">{t("troubleshootingTitle")}</summary><p className="mt-2 text-muted-foreground">{t("troubleshooting")}</p><a className="mt-2 inline-block text-primary hover:underline" href="https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation" target="_blank" rel="noreferrer">{t("vercelDocs")}</a></details>
    <ol className="list-decimal pl-5 text-sm space-y-2">
      {([1, 2, 3, 4] as const).map((step) => <li key={step}>{t(`${provider}.step${step}`)}</li>)}
    </ol>
    <div className="flex flex-wrap items-center gap-2 text-sm"><span>{t("endpoint")}</span><code className="break-all">{endpoint}</code><Button type="button" size="sm" variant="outline" onClick={() => copy(endpoint)}>{t("copy")}</Button></div>
    {provider === "chatgpt" ? <div className="space-y-4 border-t pt-4">
      <form onSubmit={createClient} className="space-y-3">
        <Label htmlFor="mcp-oauth-callback">{t("callback")}</Label>
        <Input id="mcp-oauth-callback" type="url" value={callback} onChange={(event) => setCallback(event.target.value)} placeholder="https://chatgpt.com/connector_platform_oauth_redirect" required />
        <p className="text-xs text-muted-foreground">{t("callbackHint")}</p>
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={allowWrite} onChange={(event) => setAllowWrite(event.target.checked)} />{t("allowWrite")}</label>
        <Button type="submit" disabled={busy || !callback.trim()}>{t("generate")}</Button>
      </form>
      {created && <div className="rounded-lg border border-amber-300 p-3 space-y-3">
        <p className="text-sm font-medium">{t("secretOnce")}</p>
        <Label htmlFor="mcp-oauth-client-id">{t("clientId")}</Label>
        <div className="flex gap-2"><Input id="mcp-oauth-client-id" readOnly value={created.id} className="font-mono text-xs" /><Button type="button" variant="outline" onClick={() => copy(created.id)}>{t("copy")}</Button></div>
        <Label htmlFor="mcp-oauth-client-secret">{t("clientSecret")}</Label>
        <div className="flex gap-2"><Input id="mcp-oauth-client-secret" type="password" readOnly value={created.secret} autoComplete="off" /><Button type="button" variant="outline" onClick={() => copy(created.secret)}>{t("copy")}</Button></div>
        <p className="text-xs text-muted-foreground">{t("credentialsHint")}</p>
      </div>}
      {loading && <p className="text-sm">{t("loading")}</p>}
      {clients.length > 0 && <div className="space-y-2"><h4 className="text-sm font-semibold">{t("clients")}</h4><p className="text-xs text-muted-foreground">{t("revokeHint")}</p>
        {clients.map((client) => <div key={client.id} className="flex items-start justify-between gap-2 rounded-md border p-2"><div className="min-w-0"><code className="block truncate text-xs">{client.id}</code><p className="break-all text-xs text-muted-foreground">{client.redirectUris[0]}</p></div><Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => revoke(client.id)}>{t("revoke")}</Button></div>)}
      </div>}
    </div> : <div className="space-y-2">
      <pre className="overflow-x-auto rounded-lg border bg-muted p-3 text-xs">{snippet}</pre>
      <Button type="button" size="sm" variant="outline" onClick={() => copy(snippet)}>{t("copy")}</Button>
      <p className="text-xs text-muted-foreground">{t("tokenHint")}</p>
    </div>}
    <p className="text-sm">{t("test")}</p>
    <a className="inline-block text-sm text-primary hover:underline" href={docs[provider]} target="_blank" rel="noreferrer">{t("officialDocs", { provider: names[provider] })}</a>
  </section>;
}
