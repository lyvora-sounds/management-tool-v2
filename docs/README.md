# Kikiboard application flows

Kikiboard is a collaborative project board (Kanban + list) built with Next.js 16, Clerk, Prisma, and Neon. These notes describe **how work moves through the product**, not every file.

Each page has an SVG diagram plus the route, permission, and side-effect details taken from the current code.

## Context map

Use this page as a router. Read only the documents relevant to the change instead of loading the entire documentation set.

| Read when changing | Document | Primary code areas |
|---|---|---|
| Service boundaries, request flow, route protection, data relationships | [Architecture](./architecture.md) | `middleware.ts`, `app/`, `lib/`, `prisma/schema.prisma` |
| Sign-in, identity linking, Clerk webhooks | [Auth and identity](./auth.md) | `app/(auth)`, `app/api/webhooks`, `lib/getOrCreateUser.ts` |
| Boards, lists, ownership, roles, permissions | [Boards and roles](./boards-and-roles.md) | `app/api/boards`, `app/api/lists`, `lib/boardAccess.ts`, `lib/boardRoles.ts` |
| Invite delivery, tokens, acceptance, membership | [Invitations](./invitations.md) | `app/api/invite`, `app/api/boards/*/invitations`, `app/invite` |
| Task CRUD, moves, completion, files, fields, archive, epics | [Tasks](./tasks.md) | `app/api/tasks`, board task components, `lib/statusTheme.ts` |
| Assignment, QA, comments, activity, notifications | [Collaboration](./collaboration.md) | task people/comment routes, `app/api/notifications`, `lib/createActivity.ts` |
| Provider credentials, transcription, parse/improve, brain dump, MCP | [AI](./ai.md) | `app/api/ai`, `app/api/mcp`, `lib/ai`, `lib/externalAccess.ts`, `lib/mcp` |
| Slack, Discord, Google Calendar, sharing, email, MCP | [Integrations](./integrations.md) | integration routes and `lib/integrations` |
| Security controls or certification planning | [ISO 27001 Compliance](./iso-27001-compliance-plan.md) | Cross-cutting; verify claims against current code and CI |

The code and Prisma schema are authoritative. When behavior changes, update the matching flow document in the same change.

## System at a glance

![Kikiboard system](./diagrams/architecture.svg)

## Surfaces

| Route | Auth | Purpose |
|---|---|---|
| `/` `/functions` `/stats` `/privacy` | Public | Marketing site |
| `/sign-in` `/sign-up` | Public | Clerk |
| `/dashboard` | Signed in | Personal stats, upcoming work, recent boards |
| `/dashboard/boards` | Signed in | Board list |
| `/dashboard/calendar` | Signed in | Month view of due dates |
| `/dashboard/tasks` | Signed in | My tasks |
| `/dashboard/settings` | Signed in | AI key, custom fields, calendar connect |
| `/board/[boardId]` | Board member | Kanban / list, activity, invites |
| `/invite/[token]` | Clerk-protected | Join a board (sign-in required before the page) |
| `/share/task/[token]` | Public | Read-only task |

## Side-effect cheat sheet

| Event | Activity log | In-app notification | Slack / Discord |
|---|---|---|---|
| Task created | `task_created` | — | Dispatcher supports it; not called from create yet |
| Task moved across lists | `task_moved` | — | Dispatcher supports it; not called from move yet |
| Task completed | `task_completed` | — | Yes, if `notifyOnTaskCompleted` |
| Assigned / QA / collaborator | yes | yes (not self) | — |
| Comment | — | assignee, QA, collaborators | — |
| Brain dump batch | `activity.brainDump` | — | — |
