# Architecture

Kikiboard is a Next.js 16 App Router app. The browser talks to Route Handlers under `app/api`. Those handlers resolve the Clerk user to a Neon `User`, check board access, then mutate Prisma models. Outbound calls (email, chat webhooks, calendar, LLM providers) happen after the write.

![Kikiboard system](./diagrams/architecture.svg)

## Stack

| Layer | Choice |
|---|---|
| UI | Next.js 16 App Router, Tailwind v4, shadcn/ui, Zustand, dnd-kit, Tiptap |
| Auth | Clerk (`clerkMiddleware` + `auth.protect`) |
| Data | Prisma 7 → PostgreSQL on Neon |
| Files | Vercel Blob (`access: "private"`) |
| Email | Resend |
| Deploy | Vercel |
| Runtime | Node.js 24.22.1 (see below) |

## Node.js runtime

Production and CI must run a binary that includes the 21 Oct 2026 Node.js security release (CVE-2026-111497 Brotli decoder RCE, plus TLS hostname-check bypasses). Patched floors are 22.23.4, 24.22.1, and 26.12.1. Node.js 18 and 20 receive no fix.

How this repo pins it:

- `.node-version` is `24.22.1`. GitHub Actions reads that file in `ci.yml`, `docker.yml`, and `image.yml`.
- `package.json` `engines.node` is `24.x` so Vercel matches the project setting (`24.x`) and cannot stay on Node 20. Vercel rolls 24.x patches itself; do not pin a patch version there.
- `scripts/check-node-patch.mjs` fails the workflow if the installed binary is below those floors.
- Rebase feature branches onto `main` before merge so they do not replace `node-version-file` with a floating `node-version`.

A Vercel project still on Node 20 is exposed even with these files. Set the project to 22.x or 24.x and redeploy.

## Request path

Almost every mutating API follows the same sequence.

![Typical authenticated API request](./diagrams/request-path.svg)

1. **Clerk session.** `middleware.ts` protects everything except the public matcher (`/`, `/sign-in`, `/sign-up`, `/functions`, `/stats`, `/privacy`, `/share/task`, `/api/webhooks`, Google Calendar callback).
2. **App user.** Handlers call `auth()`, then `db.user.findUnique({ clerkId })` or `getOrCreateUser`.
3. **Board ACL.** `hasBoardAccess` (owner **or** `BoardMember`) or `getBoardRole` for finer checks. Failed access is usually **404**, not 403, so callers cannot probe board ids.
4. **Write + side effects.** Prisma mutation, then `createActivity`, `notification.create`, and (on complete) Slack/Discord.

## Data model

![Core data model](./diagrams/data-model.svg)

Ownership is **not** a `BoardMember` row. `Board.userId` is the owner. Members live in `BoardMember` with `role` `"admin"`, `"member"`, or `"viewer"`. Unknown stored roles normalize to `"viewer"`.

A task belongs to exactly one `List` on one `Board`. People on a task:

- `assigneeId` — owner of the work
- `qaId` — reviewer
- `completedById` — who marked it done
- `TaskCollaborator` — extra watchers (comment notifications)

### Tables

`prisma/schema.prisma` is the source of truth. The map names every model. The three diagrams under it draw the foreign keys: the arrowhead sits on the referenced row.

![Postgres tables by domain](./diagrams/db-schema-map.svg)

![Who can open a board](./diagrams/db-access.svg)

![How a task is stored](./diagrams/db-work.svg)

![Credentials, audit, and MCP](./diagrams/db-mcp.svg)

Deletes cascade. Six links use `SetNull`: `Organization.createdById`, `ExternalAccessToken.createdById`, and on a task `epicId`, `assigneeId`, `qaId`, and `completedById`.

`Notification.boardId` and `Notification.taskId` are stored strings with no foreign key. So are `McpChange.tokenId`, `McpChange.actorId`, and `McpChange.revertsChangeId`. `revertsChangeId` is unique. MCP secrets and calendar tokens are stored as hashes or ciphertext, not plaintext.

## App surfaces after sign-in

- **Dashboard** — greeting, weekly activity, assigned work, upcoming due dates, recent boards.
- **Board** — Kanban or list, live-ish polling (`use-board-polling`), activity drawer.
- **Calendar** — `/api/calendar` tasks with due dates.
- **My tasks** — `/dashboard/tasks`.
- **Settings** — per-user AI credentials, custom fields, Google Calendar OAuth.
- **Cmd+K search** — `/api/search` over boards and tasks the user can see.

## Container image

Besides Vercel, the app builds as a container for Cloud Run (`Dockerfile`, infrastructure in the `kiki-infra` repo).

- **Standalone output.** The image build sets `BUILD_STANDALONE=1`, which turns on `output: "standalone"` in `next.config.ts`. Vercel builds do not set it and are unchanged.
- **No secrets at build.** `next build` must succeed with none of the runtime secrets. Anything that needs a key at import time breaks that (the Resend client used to; it is now created on first use in `lib/resend.ts`). Only the two `NEXT_PUBLIC_*` values are build arguments, because Next inlines them into the browser bundle: `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`. Neither is secret.
- **Migrations are not in the image.** They run as a release step against `DATABASE_URL_UNPOOLED`, never inside the container start or the build.
- **Health check.** `GET /api/health` returns `{"status":"ok"}` without a session and without touching the database. It is excluded from the Clerk middleware matcher in `middleware.ts` so a Clerk outage or a development-instance handshake redirect cannot make the platform restart a healthy container.
- **CI.** `.github/workflows/image.yml` builds the image on pull requests that touch it and starts it with no secrets, calling the health check.
- **Registry.** On a push to `dev` the same workflow pushes the image to Artifact Registry as `<sha>` and `dev`, authenticating with GitHub OIDC as the `kikiboard-image-push` identity from `kiki-infra` (no stored keys; only `dev` can use it). It needs the repository variables `GCP_PROJECT_ID`, `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_IMAGE_PUSH_SERVICE_ACCOUNT`, `STAGING_APP_URL` and `STAGING_CLERK_PUBLISHABLE_KEY`, and is skipped until they exist.
- **Deploy.** After the push, a second job rolls the image out to the staging Cloud Run service (`kikiboard`, europe-west1) with `gcloud run services update --image`, by commit SHA, then calls `/api/health` on the service URL. Only the image changes: secrets, the runtime identity and scaling stay as Terraform set them.
- **Migrations.** Before the deploy, a `migrate` job runs `scripts/ci-migrate.sh`, which applies pending Prisma migrations against the direct Neon URL (`DATABASE_URL_UNPOOLED`, read from Secret Manager, masked in the logs). If it fails, nothing is deployed. It reads the migration status first and fails if it cannot (it never assumes there is nothing to do), and it blocks a pending migration with a destructive statement (`DROP TABLE/COLUMN/SCHEMA`, `TRUNCATE`, `DELETE FROM`, a column type change) because old instances keep running against the new schema while a deploy rolls out: split it into two releases, or add `[allow-destructive-migration]` to the commit message. `prisma migrate deploy` is idempotent, so it coexists with the migration Vercel still runs in its own build. Migrations never run inside `next build` or when the container starts.

## Routes served by kiki-api

The backend is moving route by route to `kiki-api` (a separate Fastify service on Google Cloud). While it moves, the browser calls the API through one helper, `apiFetch` in `lib/apiClient.ts`:

- `lib/apiRoutes.ts` lists the routes already served by `kiki-api`, by method and path. Everything else still goes to this app's own `/api` routes. Moving a route is one line there, plus the route in `kiki-api`.
- A migrated route is sent to `NEXT_PUBLIC_API_URL` with the Clerk session token as `Authorization: Bearer`, and `/api/...` becomes `/v1/...`.
- **`NEXT_PUBLIC_API_URL` unset means nothing changes**: every call is the plain same-origin fetch. Local development and Vercel previews do not need it. It is a build-time value (inlined into the browser bundle) and not a secret.
- If Clerk has no session token yet, the call falls back to the same-origin route, which still exists here.
- A **read** that the API cannot serve (unreachable, blocked by CORS, a 401, a 5xx) is answered by the route this app still has. A 404 is a real answer and is kept. A write is never repeated. Remove the fallback when the route is deleted from this app.
- The API accepts the token only from the frontend origins listed in its `CORS_ORIGINS`.

Migrated so far: `GET /api/labels/[boardId]`.

