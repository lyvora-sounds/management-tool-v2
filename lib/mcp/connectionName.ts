export function mcpConnectionName(label: string) {
  const slug = label
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `kikiboard-${slug || "connection"}`;
}

export function mcpScopeEndpoint(origin: string, scope: "organization" | "board", organizationId?: string, boardId?: string) {
  if (!origin) return "/api/mcp";
  if (scope === "board" && boardId) return `${origin}/api/mcp/board/${boardId}`;
  if (organizationId) return `${origin}/api/mcp/org/${organizationId}`;
  return `${origin}/api/mcp`;
}

export function mcpConnectionSnippet(provider: "grok" | "gemini" | "header", endpoint: string, connectionName: string) {
  if (provider === "grok") {
    return `grok mcp add --transport http ${connectionName} ${endpoint} --header "Authorization: Bearer \${KIKIBOARD_TOKEN}"`;
  }
  if (provider === "gemini") {
    return JSON.stringify({ mcpServers: { [connectionName]: { url: endpoint, headers: { Authorization: "Bearer kiki_YOUR_TOKEN" } } } }, null, 2);
  }
  return "Authorization: Bearer kiki_YOUR_TOKEN";
}
