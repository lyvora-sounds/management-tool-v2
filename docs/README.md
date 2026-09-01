# Kikiboard application flows

Kikiboard is a collaborative project board (Kanban + list) built with Next.js 16, Clerk, Prisma, and Neon. These notes describe **how work moves through the product**, not every file.

Each page has an SVG diagram plus the route, permission, and side-effect details taken from the current code.

## Map

| Document | What it covers |
|---|---|
| [Architecture](./architecture.md) | Layers, public vs protected routes, request path, data model |
| [Auth and identity](./auth.md) | Sign-in, `getOrCreateUser`, Clerk webhooks |
| [Boards and roles](./boards-and-roles.md) | Create board, lists, owner / admin / member |
| [Invitations](./invitations.md) | Email invite, token, accept, membership |
| [Tasks](./tasks.md) | Create, move, complete, archive, custom fields, files |
| [Collaboration](./collaboration.md) | Assignee, QA, comments, in-app notifications |
| [AI](./ai.md) | BYO key, transcribe, parse, improve, batch create |
| [Integrations](./integrations.md) | Slack, Discord, Google Calendar, public share, MCP |

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
