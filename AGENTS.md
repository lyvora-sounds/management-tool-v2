# Kikiboard agent guide

This file is the always-on repository contract. Keep it short. Load detailed context only when the current task needs it; `docs/README.md` is the context index.

## Repository snapshot

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4.
- Clerk authentication, Prisma 7, PostgreSQL on Neon.
- Product code lives in `app/`, shared UI in `components/`, domain helpers in `lib/`, client state in `store/`, and the data model in `prisma/schema.prisma`.
- `mcp/` is a separate MCP sidecar that calls the application over HTTP.
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

## Working rules

- Preserve the existing authorization model. Board ownership is `Board.userId`; it is not a `BoardMember` row. Use the helpers in `lib/boardAccess.ts` and `lib/boardRoles.ts` instead of recreating role logic.
- Mutating API work should account for authentication, board access, validation, the database write, and documented side effects such as activity, notifications, and integrations.
- Keep server-only credentials and decrypted provider keys out of client components, logs, fixtures, and committed files.
- Do not edit generated Prisma client files under `lib/generated/prisma/`. Change `prisma/schema.prisma`, then regenerate.
- Add user-facing copy to every locale in `messages/` and run the locale check.
- Follow nearby component and route conventions; avoid broad refactors unless the task requires one.

## Verification

Run the smallest relevant checks first, then broaden when warranted:

- Unit tests: `pnpm test`
- Lint: `pnpm lint`
- Locale parity: `pnpm i18n:check`
- Production build: `pnpm build` (runs database migrations, so use only with an intentionally configured database)

## Long-running task state

For investigations that produce large logs or span multiple phases, offload working state to `.agent-state/<task-slug>/` instead of growing prompts or committing scratch files. Keep a concise `summary.md` with the current objective, decisions, changed files, verification, and next step; put raw command output beside it and retrieve it only when needed. This directory is ignored by Git. Never place secrets or production data there.
