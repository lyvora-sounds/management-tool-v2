# Kikiboard agent guide

This file is the always-on repository contract. Keep it short. Load detailed context only when the current task needs it; `docs/README.md` is the context index.

## Repository snapshot

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4.
- Clerk authentication. There is no database and no backend in this repo: everything is served by `kiki-api` (Fastify, Prisma 7, PostgreSQL on Neon), which owns the data model and the migrations.
- Product code lives in `app/`, shared UI in `components/`, domain helpers in `lib/`, client state in `store/`, and the shapes of the API's rows in `lib/modelTypes.ts` and `lib/api/schema.d.ts` (generated).
- MCP clients call `/api/mcp`, which `next.config.ts` forwards to `kiki-api`. Connection notes live in `mcp/README.md`.
- Use `pnpm`; the pinned package manager is in `package.json`.

## Load context on demand

Do not read every document before working. Start with the files named by the task, then use the matching guide:

| When the task touches | Read |
|---|---|
| Service boundaries, request flow, route protection, or data relationships | `docs/architecture.md` |
| Sign-in, Clerk identity sync, public routes, or webhooks | `docs/auth.md` |
| Board ownership, membership, roles, lists, or permission changes | `docs/boards-and-roles.md` |
| Invitation creation, delivery, acceptance, or revocation | `docs/invitations.md` |
| Task lifecycle, ordering, completion, attachments, custom fields, archive, or epics | `docs/tasks.md` |
| Assignment, QA, collaborators, comments, activity, or notifications | `docs/collaboration.md` |
| AI credentials, transcription, brain dump, task improvement, or MCP tools | `docs/ai.md` |
| Slack, Discord, Google Calendar, public shares, email, or MCP integration behavior | `docs/integrations.md` |
| Security controls or certification work | `docs/iso-27001-compliance-plan.md` |

Treat the implementation and schema as the source of truth when documentation disagrees. Update the relevant document when a change alters a documented flow, permission, side effect, route, or known limitation.

## Where code belongs (hard rule)

`kiki-api` is the backend. This repo is the frontend: UI, client state, and three small routes under `app/api` (`health`, and the two GitHub redirects that need the Clerk cookie and only relay to the API).

- **New HTTP API work goes in `kiki-api` first** (`/v1/...`), as a pull request against that repository. Do not add handlers to this app's `app/api/**`.
- **This app only:** UI, `apiFetch` / `lib/apiRoutes.ts` wiring, locales, and docs. After the API ships, add the route to `lib/apiRoutes.ts` and point the client at it (see `docs/architecture.md`).
- **Schema and migrations belong to `kiki-api`.** It applies them before each deploy. This app has no Prisma, no `prisma/` directory and no database access. Handlers, auth checks, and tests for the route live in `kiki-api`.
- **Order:** merge and deploy `kiki-api` first, then regenerate types here (`pnpm api:types`) and wire the UI.
- **Never push commits straight to `main`.** Always use a feature branch and a pull request.
- **MCP** (the Streamable HTTP endpoint, its OAuth server and token mint/list/revoke) is `kiki-api`'s. This app only forwards `/api/mcp*` and `/.well-known/oauth-*` to it. When unsure, put the handler in `kiki-api`.

## Preflight: sibling repositories (hard gate)

Kikiboard spans three repositories:

- `kiki-api` — backend HTTP routes (`/v1/...`), auth checks, Prisma migrations, and DB writes.
- `management-tool-v2` — frontend UI, `apiFetch` wiring, locales, and client state.
- `kiki-infra` — Terraform, Ansible, Cloud Run, DNS, and secret wiring.

Before creating tickets or writing code:

1. Identify every sibling repository the request touches (DB/API -> `kiki-api`, UI -> `management-tool-v2`, infra -> `kiki-infra`).
2. Check whether every required sibling repository is attached to the active workspace.
3. If a required sibling repository is missing (for example, `kiki-api` is missing for a task needing DB tables or HTTP endpoints), **STOP and alert the user immediately**, naming the missing repository and asking them to attach it before writing code, unless the user explicitly approves a single-repo scope.
4. Create separate, repo-prefixed tickets (`[kiki-api]`, `[management-tool-v2]`, `[kiki-infra]`) with explicit dependency order (`kiki-api` merge/deploy -> `management-tool-v2`) instead of bundling backend DB/API work inside a frontend ticket.

## Working rules

- Preserve the existing authorization model, which `kiki-api` enforces: board ownership is `Board.userId`, not a `BoardMember` row. The UI only hides what the API would refuse; never rely on it for access control.
- Mutating API work (in `kiki-api`) should account for authentication, board access, validation, the database write, and documented side effects such as activity, notifications, and integrations.
- Keep server-only credentials and decrypted provider keys out of client components, logs, fixtures, and committed files.
- Honor `.agentignore`. Do not read or search those paths. Use `package.json` for dependencies and `kiki-api`'s `prisma/schema.prisma` for the data model.
- Do not edit `lib/api/schema.d.ts` by hand: regenerate it with `pnpm api:types` after the API changes.
- Add user-facing copy to every locale in `messages/` and run the locale check.
- Follow nearby component and route conventions; avoid broad refactors unless the task requires one.

## Verification

Run the smallest relevant checks first, then broaden when warranted:

- Unit tests: `pnpm test`
- Lint: `pnpm lint`
- Locale parity: `pnpm i18n:check`
- Production build: `pnpm build` (`next build`; needs `NEXT_PUBLIC_API_URL`, no database)

## Long-running task state

For investigations that produce large logs or span multiple phases, offload working state to `.agent-state/<task-slug>/` instead of growing prompts or committing scratch files. Keep a concise `summary.md` with the current objective, decisions, changed files, verification, and next step; put raw command output beside it and retrieve it only when needed. This directory is ignored by Git. Never place secrets or production data there.
