# Kikiboard MCP

Kikiboard exposes a stateless Streamable HTTP MCP server at:

```text
https://YOUR_KIKIBOARD_HOST/api/mcp
```

Bearer-header clients can use it directly. ChatGPT requires the OAuth setup
below; it cannot import the bearer-header JSON configuration. Groq is a model provider rather than an
MCP host; use it through an agent framework or client that can call MCP tools.

The same instructions are shown in the app at **Settings → MCP**
(`/dashboard/settings?tab=mcp`). That screen creates a connection for one
organization, or for one board inside that organization.

## Security boundary

An external-access token belongs to exactly one organization. Leave the board
unset and the token reads every board in that organization. Set a board and the
token reads only that board. If the board later moves to another organization,
the token stops working. The client cannot supply or switch a board id, and the
same token cannot read a second organization.

A token also contains:

- scope: currently `tickets:read` only;
- optional expiration and revocation timestamps;
- last-used timestamp, written after a successful MCP call.

Tickets are not filtered by environment. A custom field that happens to store
an environment is ordinary ticket data, not an access rule.

## Create a connection token

Organization owners and admins create an organization token. Board owners and
admins, including organization owners and admins, create a board token. Both
can be created from **Settings → MCP**. The board token can also be created in
that board's **Integrations** dialog. Settings shows the new token in a text
field so it can be selected or copied; it is not shown again.

Organization token:

```http
POST /api/organizations/ORGANIZATION_ID/external-access
Content-Type: application/json

{
  "name": "Claude for the organization",
  "expiresAt": "2027-01-01T00:00:00.000Z"
}
```

Board token:

```http
POST /api/boards/BOARD_ID/external-access
Content-Type: application/json

{
  "name": "Claude for checkout",
  "expiresAt": "2027-01-01T00:00:00.000Z"
}
```

`expiresAt` is optional. Environment fields in the body are ignored. The caller
uses the normal Clerk browser session.

The response contains a `kiki_...` token once. Store it in the client's secret
configuration. Kikiboard stores only its hash and cannot show it again.

List organization credentials with
`GET /api/organizations/ORGANIZATION_ID/external-access` and revoke one with
`DELETE /api/organizations/ORGANIZATION_ID/external-access/TOKEN_ID`. That list
contains organization tokens only. List board credentials with
`GET /api/boards/BOARD_ID/external-access` and revoke one with
`DELETE /api/boards/BOARD_ID/external-access/TOKEN_ID`.

## Connect a client

Configure the MCP URL and send the token as an HTTP bearer credential:

```text
URL: https://YOUR_KIKIBOARD_HOST/api/mcp
Authorization: Bearer kiki_YOUR_ONE_TIME_TOKEN
```

The connection exposes three read-only tools:

- `get_project` — the organization and its boards, or the single bound board;
- `list_tickets` — ticket summaries, including the board each ticket is on;
- `get_ticket` — details for one ticket inside the credential's scope.

Do not place tokens in source control, chat prompts, logs, or client-visible
configuration files. Use the secret/environment facility provided by the MCP
host and revoke a token immediately if it is disclosed.

## Connect ChatGPT with OAuth

Deploy the OAuth migration and configure these server environment variables:

- `NEXT_PUBLIC_APP_URL`: the canonical HTTPS origin, for example `https://kikiboard.xyz`.
- `MCP_OAUTH_CLIENT_ID`: a predefined client ID, for example `kikiboard-chatgpt`.
- `MCP_OAUTH_CLIENT_SECRET`: a cryptographically random secret of at least 32 characters. Keep it in the deployment secret store and ChatGPT's OAuth client-secret field.
- `MCP_OAUTH_REDIRECT_URIS`: comma-separated exact callback URLs from ChatGPT's MCP management screen. Do not use wildcards. With issuer identification enabled, ChatGPT normally uses `https://chatgpt.com/connector_platform_oauth_redirect`; use the exact value displayed for your connection.

OAuth remains disabled until all settings are configured. The existing bearer
tokens continue to work independently. No dynamic registration is exposed:
this connection uses a predefined confidential client with `client_secret_post`
or `client_secret_basic`, authorization codes, and mandatory PKCE S256.

In ChatGPT on the web:

1. Open Plugins → + → Add custom MCP server.
2. Name it Kikiboard and enter `https://kikiboard.xyz/api/mcp`.
3. Choose OAuth and enter the predefined client ID and secret in the OAuth configuration.
4. Create and install the plugin. Start a Work chat and select it with `@`.
5. Sign in to Kikiboard when prompted. Choose one organization or board and approve read-only access. Organization connections require organization owner/admin; board connections require effective board owner/admin.

The connection uses the same `tickets:read` boundary as bearer credentials.
Authorization codes expire after five minutes and can be exchanged once.
Access tokens last up to one hour; refresh tokens rotate on every exchange.
The connection expires after 30 days without renewal. All token and code
values are stored as SHA-256 hashes. Select the granted scope in Settings → MCP
and revoke its ChatGPT credential to stop access and refresh immediately.
A board transfer invalidates the board connection.

Discovery is public at `/.well-known/oauth-protected-resource` and
`/.well-known/oauth-authorization-server`. Authorization starts at
`/api/mcp/oauth/authorize`, redirects to a Clerk-protected consent page, and
exchanges codes at `/api/mcp/oauth/token`. Tokens are bound to the canonical
`/api/mcp` resource. Tool metadata marks all three tools as read-only.

Deployment validation: inspect both discovery documents, complete authorization
in ChatGPT, call each tool, then revoke the connection and verify subsequent
calls and refresh fail. Local unit tests cover protocol validation, scopes,
PKCE, expiry, revocation and single-use token rotation; they do not prove the
live ChatGPT linking flow.

References: [OpenAI custom MCP setup](https://developers.openai.com/api/docs/guides/custom-mcp-server)
and [OAuth requirements](https://developers.openai.com/plugins/build/auth).
