# Kikiboard MCP

Kikiboard exposes a stateless Streamable HTTP MCP server at:

```text
https://YOUR_KIKIBOARD_HOST/api/mcp
```

It can be used by ChatGPT, Claude, or any other host that supports Streamable
HTTP MCP with bearer authentication. Groq is a model provider rather than an
MCP host; use it through an agent framework or client that can call MCP tools.

## Security boundary

An external-access token belongs to exactly one board (the current project
boundary). The client cannot supply or switch a board id. A token also contains:

- scope: currently `tickets:read` only;
- `allEnvironments: true`, or a list of environment names;
- optional expiration and revocation timestamps;
- last-used timestamp, written after a successful MCP call.

When an allowlist is used, tickets without an environment are not returned.
This fail-closed behavior prevents unclassified tickets from leaking into a
restricted client connection.

## Create a connection token

Board owners and admins can create and revoke tokens in the board's
**Integrations** dialog. The same operations are available through the
authenticated application API; the request uses the normal Clerk browser
session:

```http
POST /api/boards/BOARD_ID/external-access
Content-Type: application/json

{
  "name": "Claude for checkout repository",
  "environments": ["dev", "integration"],
  "expiresAt": "2027-01-01T00:00:00.000Z"
}
```

Set `"allEnvironments": true` only when the client should see every environment
and unclassified tickets. Do not send environment names together with that
flag. Named values are validated against the board's `environment` custom-field
options after the default fields are ensured. The API rejects a request that
chooses neither `allEnvironments` nor a name list.

The response contains a `kiki_...` token once. Store it in the client's secret
configuration. Kikiboard stores only its hash and cannot show it again.

List credentials with `GET /api/boards/BOARD_ID/external-access` and revoke one
with `DELETE /api/boards/BOARD_ID/external-access/TOKEN_ID`.

## Connect a client

Configure the MCP URL and send the token as an HTTP bearer credential:

```text
URL: https://YOUR_KIKIBOARD_HOST/api/mcp
Authorization: Bearer kiki_YOUR_ONE_TIME_TOKEN
```

The connection exposes three read-only tools:

- `get_project` — board metadata and lists;
- `list_tickets` — filtered ticket summaries;
- `get_ticket` — details for one permitted ticket.

Do not place tokens in source control, chat prompts, logs, or client-visible
configuration files. Use the secret/environment facility provided by the MCP
host and revoke a token immediately if it is disclosed.
