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

- scope: `tickets:read`, plus optional `tickets:write`;
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

Every connection exposes four read-only tools:

- `get_project` — the organization and its boards, or the single bound board;
- `list_tickets` — ticket summaries, including the board each ticket is on;
- `get_ticket` — details for one ticket inside the credential's scope;
- `get_change_history` — the latest 50 MCP operations and their revert status.

Do not place tokens in source control, chat prompts, logs, or client-visible
configuration files. Use the secret/environment facility provided by the MCP
host and revoke a token immediately if it is disclosed.

## Connect ChatGPT with OAuth

Deploy the OAuth, OAuth-client and MCP change-history migrations and set `NEXT_PUBLIC_APP_URL` to
the canonical HTTPS origin (for example `https://kikiboard.xyz`). End users
create their own OAuth client in **Settings → MCP → ChatGPT**:

1. In ChatGPT on the web, open Plugins → + → Add custom MCP server. Enter the MCP URL and choose OAuth.
2. Copy the exact callback URL displayed by ChatGPT into Kikiboard's ChatGPT callback field.
3. Select Generate ChatGPT credentials. Kikiboard shows the client ID and a cryptographically random secret once; only the secret hash is stored.
4. Paste those values into ChatGPT's OAuth configuration. Create and install the plugin, then select it with `@` in a Work chat.
5. Sign in to Kikiboard with the same account that generated the client. Choose an organization or board you administer and approve access.

Only exact ChatGPT callbacks on `https://chatgpt.com` are accepted. Each client
belongs to its creator. List or revoke your clients in the ChatGPT guide;
revoking one invalidates its connections and refresh tokens. Authenticated
settings routes `/api/settings/mcp/oauth-clients` expose creation, metadata-only
listing and revocation. Secret responses are not cached.

The original `MCP_OAUTH_CLIENT_ID`, `MCP_OAUTH_CLIENT_SECRET` and
`MCP_OAUTH_REDIRECT_URIS` environment variables are optional compatibility for
existing predefined deployment clients. Those secrets are never shown by the
settings API. In-app setup does not require them. No dynamic registration is
exposed; clients use `client_secret_post` or `client_secret_basic` and PKCE S256.

The connection uses the same organization/board boundary as bearer credentials.
Read access is always granted; write access requires a write-enabled client and
explicit approval on the consent page.
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
`/api/mcp` resource. Tool metadata distinguishes read tools from mutation tools.

Deployment validation: inspect both discovery documents, complete authorization
in ChatGPT, call each tool, then revoke the connection and verify subsequent
calls and refresh fail. Local unit tests cover protocol validation, scopes,
PKCE, expiry, revocation and single-use token rotation; they do not prove the
live ChatGPT linking flow.

References: [OpenAI custom MCP setup](https://developers.openai.com/api/docs/guides/custom-mcp-server)
and [OAuth requirements](https://developers.openai.com/plugins/build/auth).

## Other AI assistants

Settings → MCP includes separate guides for:

- **Claude custom connectors:** use No sign in and a fixed Authorization bearer request header. Create a scoped token in Kikiboard first, then enable the connector in the conversation. See [Claude instructions](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp).
- **Grok CLI / xAI API:** use a scoped bearer token. The guide supplies the Grok CLI add command, connection diagnostics and an API alternative. See [Grok MCP instructions](https://docs.x.ai/build/features/mcp-servers).
- **Gemini CLI:** use a scoped bearer token and an `httpUrl` Streamable HTTP entry in private Gemini CLI settings. The guide supplies the JSON and `/mcp` verification step. These instructions target Gemini CLI. See [Gemini MCP instructions](https://geminicli.com/docs/tools/mcp-server/).

Guides include a test prompt, copyable endpoint/configuration and official documentation links. OAuth client secrets and scoped bearer tokens are separate credentials.

## Write access and change history

In Settings → MCP, enable read/write when creating a bearer token. Existing
read-only tokens keep their permissions. For ChatGPT, enable write access when
generating the OAuth client, then approve write access when connecting. A
read-only connection must be replaced or reauthorized to grant writes. Refresh
preserves the granted permissions and cannot change scopes.

Writable connections also expose `create_ticket`, `update_tickets`, and
`revert_change`. Updates support title, description, priority, list, completion,
archive, and start/due dates. A batch contains at most 50 tickets on one board
and commits atomically. Board/list management, assignment, comments, custom
fields, and permanent deletion are outside this first version. Every write
rechecks token expiry/revocation and the creator's current board edit permission.

Task writes, before/after snapshots, and board activity are saved in one
serializable transaction. Completion sends the existing board integration
notifications after commit. Settings → MCP shows the latest 50 operations and
lets an administrator inspect and confirm a revert. The session-protected
`/api/settings/mcp/history` route checks organization management or board admin
access; MCP history remains bounded to its credential's organization/board.

`revert_change` previews by default; use `confirm: true` only after approval.
The entire revert is rejected if any affected task changed afterward or its
original list disappeared. Undoing creation archives the task and preserves
its content. Reverts are themselves journaled. History covers MCP task writes,
not all app edits; sent Slack/Discord messages cannot be recalled. Records
survive credential revocation, but deleting the board/organization cascades
its history. No retention expiry is currently applied.

For protected Vercel deployments, use the canonical public endpoint or a
Vercel automation bypass header in clients that support custom headers. A
Vercel authentication error occurs before Kikiboard token validation. See
[Vercel's automation bypass instructions](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation).
