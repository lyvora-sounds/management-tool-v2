# Kikiboard MCP

Kikiboard exposes a stateless Streamable HTTP MCP server at:

```text
https://YOUR_KIKIBOARD_HOST/api/mcp
https://YOUR_KIKIBOARD_HOST/api/mcp/org/ORGANIZATION_ID
https://YOUR_KIKIBOARD_HOST/api/mcp/board/BOARD_ID
```

Bearer-header clients can use it directly. ChatGPT requires the OAuth setup
below; it cannot import the bearer-header JSON configuration. Groq is a model provider rather than an
MCP host; use it through an agent framework or client that can call MCP tools. DeepSeek is also a model
provider, not an MCP host. When a model runs inside Cursor or another MCP host, that host's server list
holds the Kikiboard connections.

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

Settings → MCP lists every token the signed-in user created (`GET /api/settings/mcp/tokens`)
and can revoke one (`DELETE /api/settings/mcp/tokens` with `{ "id" }`). The list
shows name, prefix, scope, and last use. The plaintext token is never stored and
is not returned after creation. List organization credentials with
`GET /api/organizations/ORGANIZATION_ID/external-access` and revoke one with
`DELETE /api/organizations/ORGANIZATION_ID/external-access/TOKEN_ID`. That list
contains organization tokens only. List board credentials with
`GET /api/boards/BOARD_ID/external-access` and revoke one with
`DELETE /api/boards/BOARD_ID/external-access/TOKEN_ID`.

## Connect a client

Configure the MCP URL and send the token as an HTTP bearer credential:

```text
URL: https://YOUR_KIKIBOARD_HOST/api/mcp/org/ORGANIZATION_ID
Authorization: Bearer kiki_YOUR_ONE_TIME_TOKEN
```

Use the organization URL for an organization token and the board URL for a board token. `POST /api/mcp` remains valid for a connection that was already configured there.

## Connect more than one organization or board

One token still opens one organization, or one board. A second scope is a second connection with its own token. Clients that keep one connector per URL, including Claude and ChatGPT, need a different URL for each connection:

```text
https://YOUR_KIKIBOARD_HOST/api/mcp/org/ORGANIZATION_ID
https://YOUR_KIKIBOARD_HOST/api/mcp/board/BOARD_ID
```

An organization URL accepts only an organization token for that organization. A board URL accepts only a token bound to that board. A token presented on the wrong URL is rejected. Bearer clients add one named server entry per URL. OAuth clients add one connector per URL. Consent for a scoped URL can approve only that organization or board, and the issued access token works only on that URL. An access token issued for `/api/mcp` continues to work only on `/api/mcp`.

Give each connection a distinct name, such as `kikiboard-lyvora` or `kikiboard-checkout`, so the assistant can tell the tools apart. Settings → MCP shows the URL and a copyable entry for the organization or board selected there.

Every connection exposes these read-only tools:

- `get_project` — the organization and its boards, or the single bound board,
  including accessible people (IDs, names and emails), labels, epics, lists and
  all custom-field definitions, options and enabled state;
- `list_tickets` — ticket summaries with assignee and QA identities; filter by
  `assigneeId`, `qaId` or assignee name/email (`person`). Use the final ticket ID
  as `cursor` for the next page (maximum 100 tickets per call);
- `get_ticket` — all ticket details inside the credential's scope, including
  people, collaborators, labels, epic, checklist, comments with authors,
  attachment metadata, sharing state, timestamps and every custom field
  (unset values are null);
- `get_attachment` — a scoped attachment's file contents as base64, up to 5 MiB;
- `get_change_history` — the latest 50 MCP operations and their revert status.

Do not place tokens in source control, chat prompts, logs, or client-visible
configuration files. Use the secret/environment facility provided by the MCP
host and revoke a token immediately if it is disclosed.

## Connect ChatGPT with OAuth

Deploy the OAuth, OAuth-client and MCP change-history migrations and set `NEXT_PUBLIC_APP_URL` to
the canonical HTTPS origin (for example `https://kikiboard.xyz`). End users
create their own OAuth client in **Settings → MCP → ChatGPT**:

1. In ChatGPT on the web, open Plugins → + → Add custom MCP server. Enter the MCP URL for that organization or board and choose OAuth. Add another connector, with the other scope's URL, for each additional organization or board.
2. Copy the exact callback URL displayed by ChatGPT into Kikiboard's ChatGPT callback field.
3. Select Generate ChatGPT credentials. Kikiboard shows the client ID and a cryptographically random secret once; only the secret hash is stored.
4. Paste those values into ChatGPT's OAuth configuration. Create and install the plugin, then select it with `@` in a Work chat.
5. Sign in to Kikiboard with the same account that generated the client. Choose an organization or board you administer and approve access.

Only exact ChatGPT callbacks on `https://chatgpt.com` are accepted (Claude has its own fixed callbacks; see below). Each client
belongs to its creator. List or revoke your clients in the ChatGPT guide;
revoking one invalidates its connections and refresh tokens. Authenticated
settings routes `/api/settings/mcp/oauth-clients` expose creation, metadata-only
listing and revocation. Secret responses are not cached.

## Connect Claude with OAuth

Claude's custom connectors (Customize → Connectors → Add custom connector) probe
the MCP URL without credentials, see the `401` with OAuth metadata and switch to
OAuth on their own, so the bearer-header setup is not reliable there. Use an
account-owned OAuth client instead:

1. In **Settings → MCP → Claude**, choose read-only or read/write and select
   Generate Claude credentials. The client ID and secret are shown once; only the
   secret hash is stored.
2. In Claude, add a custom connector with the MCP URL, open the advanced
   settings and paste the OAuth client ID and secret.
3. Select Connect, sign in to Kikiboard with the same account, choose an
   organization or board you administer and approve access.

Claude always returns to `https://claude.ai/api/mcp/auth_callback` or
`https://claude.com/api/mcp/auth_callback`. Those two URLs are fixed on the
server (`CLAUDE_CALLBACKS`), so the browser cannot choose a callback for a Claude
client, and every other callback is still rejected by exact match. The security
model is the same as ChatGPT: client owned by its creator, PKCE S256, hashed
secret, explicit consent, and revocation that also revokes its connections. The
connection is named after the client (`Claude` or `ChatGPT`). Dynamic client
registration is still not exposed.

Claude Code and other bearer-header clients keep using a token from
**Settings → MCP**.

The original `MCP_OAUTH_CLIENT_ID`, `MCP_OAUTH_CLIENT_SECRET` and
`MCP_OAUTH_REDIRECT_URIS` environment variables are optional compatibility for
existing predefined deployment clients. Those secrets are never shown by the
settings API. In-app setup does not require them. No dynamic registration is
exposed; clients use `client_secret_post` or `client_secret_basic` and PKCE S256.

The connection uses the same organization/board boundary as bearer credentials.
Add one connector per organization or board, using that scope's URL. Consent for a scoped URL can approve only that scope.
Read access is always granted; write access requires a write-enabled client and
explicit approval on the consent page.
Authorization codes expire after five minutes and can be exchanged once.
Access tokens last up to one hour; refresh tokens rotate on every exchange.
The connection expires after 30 days without renewal. All token and code
values are stored as SHA-256 hashes. Select the granted scope in Settings → MCP
and revoke its ChatGPT credential to stop access and refresh immediately.
A board transfer invalidates the board connection.

Discovery is public at `/.well-known/oauth-protected-resource` and
`/.well-known/oauth-authorization-server`. A scoped URL advertises itself at
`/.well-known/oauth-protected-resource/api/mcp/org/{organizationId}` or
`/.well-known/oauth-protected-resource/api/mcp/board/{boardId}`. Authorization starts at
`/api/mcp/oauth/authorize`, redirects to a Clerk-protected consent page, and
exchanges codes at `/api/mcp/oauth/token`. Tokens are bound to the resource URL
the client requested. Tool metadata distinguishes read tools from mutation tools.

Deployment validation: inspect both discovery documents, complete authorization
in ChatGPT, call each tool, then revoke the connection and verify subsequent
calls and refresh fail. Local unit tests cover protocol validation, scopes,
PKCE, expiry, revocation and single-use token rotation; they do not prove the
live ChatGPT linking flow.

References: [OpenAI custom MCP setup](https://developers.openai.com/api/docs/guides/custom-mcp-server)
and [OAuth requirements](https://developers.openai.com/plugins/build/auth).

## Other AI assistants

Settings → MCP includes separate guides for:

- **Claude custom connectors:** use the OAuth guide above. Claude keeps one connector per URL, so each organization or board uses its own MCP URL. See [Claude instructions](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp).
- **Grok CLI / xAI API:** use a scoped bearer token. Run `grok mcp add` once per organization or board, with a distinct server name, that scope's URL, and that scope's token. See [Grok MCP instructions](https://docs.x.ai/build/features/mcp-servers).
- **Gemini CLI:** use a scoped bearer token and an `httpUrl` Streamable HTTP entry in private Gemini CLI settings. Each organization or board is its own key under `mcpServers`, with its own URL and token. See [Gemini MCP instructions](https://geminicli.com/docs/tools/mcp-server/).

Guides include a test prompt, copyable endpoint/configuration and official documentation links. OAuth client secrets and scoped bearer tokens are separate credentials.

## Write access and change history

In Settings → MCP, enable read/write when creating a bearer token. Existing
read-only tokens keep their permissions. For ChatGPT, enable write access when
generating the OAuth client, then approve write access when connecting. A
read-only connection must be replaced or reauthorized to grant writes. Refresh
preserves the granted permissions and cannot change scopes.

Writable connections also expose `create_ticket`, `create_epic`, `update_tickets`, and
`revert_change`. Ticket creation and updates support title, description, priority,
list, completion, archive, start/due dates, order, quarter, epic, assignee, QA,
collaborators, labels, custom values, checklist, comments, attachments and public
sharing. Server-generated IDs, timestamps, completion attribution and calendar
integration IDs are read-only; sharing uses `shared: true/false` and the server
generates its token. `create_epic` takes a title and optional description, color
(`#RRGGBB`), and quarter (`YYYY-Qn`). A board-scoped token creates the epic on
that board. An organization token must pass `boardId` from `get_project`. Epic
creation is not stored in `McpChange` and cannot be reverted; attach tickets
afterward with `update_tickets` and `epicId`. List, label, custom-field
definition management and permanent task deletion stay outside these tools.

A batch contains at most 50 explicit tickets on one board and commits atomically.
Every write rechecks token expiry/revocation and the creator's current board edit
permission. Assignments additionally honor `memberCanAssign` and require board
access for every recipient. Assignment operations set the requested person
idempotently; null clears assignee/QA. `collaboratorIds` and `labelIds` replace
those sets. Epics, labels, custom fields and referenced tickets must belong to
the same board. Custom SELECT values must match an option; NUMBER values must
be finite numbers. Disabled fields cannot be changed.

`customFields` patches are `{ customFieldId, value: string | null }` entries.
Parent/child fields use the app's relationship synchronization; every related
ticket touched by that synchronization is included in the same journal and
conflict checks. `subtasks` replaces the checklist; retain existing IDs to edit
entries, omit IDs to create, and omit entries to remove them. `comments` contains
add/edit/delete operations; editing or deleting requires authorship or board
admin permission. New comments and assignments send the existing in-app
notifications inside the transaction.

`attachments` uploads use `{ filename, contentBase64 }`, renames use
`{ id, filename }`, and removals use `{ id, delete: true }`. Total uploaded bytes
are limited to 5 MiB per operation. Files use private Vercel Blob storage; MCP
never accepts arbitrary file URLs or exposes storage credentials. Failed writes
attempt to clean up new uploads. Removed files and uploads undone by revert are
retained in storage so journaled operations remain recoverable; storage cleanup
is not automatic. Public sharing is enabled or revoked via `shared`.

Example: use IDs returned by `get_project` to set Mario's QA assignment and the
Environment field in one `update_tickets` entry:

```json
{
  "updates": [{
    "ticketId": "TICKET_ID",
    "changes": {
      "qaId": "MARIO_USER_ID",
      "customFields": [{ "customFieldId": "ENVIRONMENT_FIELD_ID", "value": "production" }]
    }
  }]
}
```

Task writes, before/after snapshots, and board activity are saved in one
serializable transaction. Completion sends the existing board integration
notifications after commit. Settings → MCP shows the latest 50 operations and
lets an administrator inspect and confirm a revert. The session-protected
`/api/settings/mcp/history` route checks organization management or board admin
access; MCP history remains bounded to its credential's organization/board.

`revert_change` previews by default; use `confirm: true` only after approval.
The Settings history preview shows current and restored values for every
journaled field, including assignments, custom values, comments, checklist,
attachments and sharing. It resolves names where available and counts entries
that will be removed, restored or changed. Created tickets are explicitly shown
as being archived while retaining their content. Legacy journals retain their
original scalar previews. Assignment permissions are checked during revert only
when assignee, QA or collaborator membership changes; scalar-only reverts do
not require assignment permission or revalidate unchanged recipients.
The entire revert is rejected if any affected task changed afterward or its
original list disappeared. Relation snapshots also detect later comment,
attachment, checklist and custom-value edits, even when the task timestamp did
not change. Revert rechecks assignment and comment permissions. Legacy scalar
journals remain readable and revert only their original scalar fields. Undoing creation archives the task and preserves
its content. Reverts are themselves journaled. History covers MCP task writes,
not all app edits; sent Slack/Discord messages cannot be recalled. Records
survive credential revocation, but deleting the board/organization cascades
its history. No retention expiry is currently applied.

For protected Vercel deployments, use the canonical public endpoint or a
Vercel automation bypass header in clients that support custom headers. A
Vercel authentication error occurs before Kikiboard token validation. See
[Vercel's automation bypass instructions](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation).

## Updating an installed connector

Deploy the changed server at the existing `/api/mcp` endpoint, then refresh the
MCP tool definitions in the client (or reconnect if the client caches schemas).
Existing write-enabled credentials keep their scopes; this expansion needs no
database migration. Local tests do not deploy the endpoint or refresh a remote
plugin. Verify `tools/list`, QA assignment, custom values and person search in
the deployed connector before relying on the new contract.

## Markdown and SVG information responses

`get_project`, `list_tickets`, `get_ticket` and `get_change_history` can return
Markdown by default, with complete original data in `structuredContent.data`.
Ticket tables group by board, put pending tickets first, and distinguish workflow
with colored emoji plus readable labels: ⚪ Draft, 🔵 In progress, 🟣 In review,
🟡 Pending and 🟢 Done. Priorities use 🔴 Urgent, 🟠 High, 🟡 Medium,
🔵 Low and ⚪ Not set. Completed tickets always show Done regardless of list.
Markdown escapes untrusted content and uses canonical ticket links. Colors come
from emoji, because Markdown hosts do not reliably allow custom CSS or HTML.
The ticket-list tool description asks clients to preserve this table, its columns,
links and emoji when presenting results. After deploying changes, refresh the MCP
connection so clients reload the tool schema. A client connected to an older
deployment may still receive raw JSON.
Each response offers the optional SVG format.

Use `presentation.format: "markdown"` explicitly, or omit presentation for the
default. Use `presentation.format: "text"` for the previous raw JSON text format.
SVG is opt-in through `presentation.format: "svg"`, even for SVG-capable clients;
capabilities alone never change the default. SVG responses use an embedded MCP
resource with MIME type `image/svg+xml`. SVG support is never inferred from a
client name, HTTP Accept header or generic MCP resource support.

A compatible client can explicitly request a presentation on each tool call:

```json
{
  "name": "list_tickets",
  "arguments": {
    "person": "Daniel Alvarez",
    "presentation": { "format": "svg", "interactive": true }
  }
}
```

Request SVG only when the client renders embedded SVG resources. Set
`interactive: true` only when it supports SVG hyperlinks. Clients may declare
the custom capability below under client `capabilities.experimental` during
initialization. Because the HTTP endpoint creates a fresh server per request,
repeat capabilities in tool-call `_meta["io.modelcontextprotocol/clientCapabilities"]`
and explicitly request SVG with `presentation.format: "svg"` on every call. Initialization alone
does not persist preferences across HTTP requests.

```json
{ "experimental": { "xyz.kikiboard/svg": { "supported": true, "links": true } } }
```

Markdown remains the default regardless of capabilities, and
`presentation.interactive: false` disables links. The server advertises the same
custom capability. This is a Kikiboard extension, not a standard MCP SVG
capability. Clients supporting only static SVG receive the same complete data
without links. Every SVG response also includes the original JSON text block,
so requested fields and IDs remain available to agents and accessible text
renderers. Attachments remain base64 file responses; mutations and errors retain
their existing text contract.

SVG uses escaped, wrapped text, without scripts, event handlers, embedded HTML
or external assets. When SVG links are supported and `NEXT_PUBLIC_APP_URL` is a
valid HTTP(S) origin, ticket and board links open the normal authenticated app;
no public share is created and no mutation runs from the SVG. A client that
renders SVG as an image may disable links and should request static SVG.
No database migration is required. Deploy the endpoint and refresh cached tool
definitions to use the new argument; live rendering depends on the host client.

Ticket-list SVGs use a table grouped by board, list and completion, with ticket
links, status badges, priority, assignee, QA and due date. Completed tickets are
classified as done even when their board list is Draft or To Review. Rows sort
by priority and title within each group. The table represents the current
filtered page (up to 100 tickets), not the entire organization automatically;
use cursor pagination for further results. All original summary fields remain
in the accompanying JSON text block.
