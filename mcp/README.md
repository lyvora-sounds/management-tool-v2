# Kikiboard MCP

Kikiboard exposes a stateless Streamable HTTP MCP server at:

```text
https://YOUR_KIKIBOARD_HOST/api/mcp
```

It can be used by ChatGPT, Claude, or any other host that supports Streamable
HTTP MCP with bearer authentication. Groq is a model provider rather than an
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
