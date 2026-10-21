# Production security review checklist

Source: [Mark Ajzenstadt (@mardehaym), 15 Oct 2026](https://x.com/mardehaym/status/2110705357492203564).

The post is a production checklist for an app before it takes a paying customer. This document extracts the **security, privacy, and access-control measures** so they can be reviewed against Kikiboard, and it starts with **observability**: what is running, where it lives, what it costs, and what it is doing right now. That comes before the security rows. A control you cannot find, a bill you cannot attribute, and a failure you only notice tomorrow are the same gap.

Reliability, customer billing, UX, and staffing items from the same post stay out of scope. They are listed at the end.

Nothing in this file is a finding. Every row starts as **Not reviewed**. A review records evidence in this repository, in a vendor console, or as a gap. Vendor controls (Clerk, Neon, Vercel) count only when this app actually uses them as described.

Related, separate document: [ISO 27001 compliance plan](./iso-27001-compliance-plan.md). Do not copy its status into this checklist without rechecking the code.

## How to review

1. Start at section 1. Fill the service map from invoices and consoles, then confirm the live view, before any security row.
2. Take one row.
3. Read the cited starting point, then the code it points at.
4. Set **Status** to `Met`, `Partial`, `Gap`, or `Not applicable`, and write the evidence in **Notes**.
5. If the control lives outside the repo (Clerk dashboard, Neon backups, DNS), name the system and what still has to be confirmed there.

| Status | Meaning |
|---|---|
| Not reviewed | No one has checked this row yet |
| Met | The control exists and matches the measure |
| Partial | Some of the measure exists |
| Gap | The measure is missing or not effective |
| Not applicable | The product does not have this obligation |

---

## 1. Observability: spend, location, and the live system

Review this section first. The service map is the inventory: which account, which region, and what last month cost. Real-time observability is the other half: requests, errors, database load, and spend as they happen. A monthly invoice is not that view.

Fill both from vendor consoles, then from the repo. The code names dependencies. It does not say which account is live, which region holds data, or what last month cost.

`package.json` includes Resend and no error-tracking, analytics, or log-drain SDK. Vercel, Neon, and Clerk are the documented hosts (`docs/architecture.md`). Anything enabled only in a dashboard still belongs on the map.

### Service map

One row per thing that can run, hold data, or send a bill. Add a row when a console shows a project this table does not name. `$0` is a recorded cost, not a blank.

| Service | Role | Where the repo points | Account / project | Region | Environments | Last monthly cost | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| Vercel | App hosting, serverless functions, CDN, deployment previews | `docs/architecture.md` | | | | | Not reviewed | |
| Neon | PostgreSQL. Dev branch id is `EXPECTED_NEON_BRANCH_ID` | `.env.example`, `prisma/schema.prisma` | | | | | Not reviewed | |
| Vercel Blob | Private task attachments | `BLOB_READ_WRITE_TOKEN`, `app/api/tasks/[taskId]/attachments/route.ts` | | | | | Not reviewed | |
| Clerk | Sign-in, sessions, user webhooks | `.env.example`, `docs/auth.md` | | | | | Not reviewed | |
| Resend | Invitation email | `docs/integrations.md`, `docs/invitations.md` | | | | | Not reviewed | |
| GitHub | Source and Actions CI | `.github/workflows/ci.yml` | | | | | Not reviewed | |
| DNS, domain, TLS | Public hostname and certificate renewal | `NEXT_PUBLIC_APP_URL` | | | | | Not reviewed | |
| Google Cloud | Calendar OAuth app. Product sync is documented as dormant | `docs/integrations.md` | | | | | Not reviewed | |
| AI providers | User-supplied keys (OpenAI, Anthropic, Gemini, xAI, DeepSeek, Kimi, custom). Kikiboard does not resell model usage | `docs/ai.md` | | | | | Not reviewed | Confirm no platform key is set on the host |
| Slack / Discord | Customer webhook URLs stored on a board. Not a Kikiboard subscription | `docs/integrations.md` | | | | | Not reviewed | |
| Logs, metrics, traces | Live and retained telemetry. No SDK and no `instrumentation.ts` in the repo | Vercel runtime logs, Neon monitoring, and any drain enabled only in a dashboard | | | | | Not reviewed | Live checks are OBS-08 through OBS-13 |

### What the map has to answer

| ID | Measure | Done when | Where to start | Status | Notes |
|---|---|---|---|---|---|
| OBS-01 | A complete list of what is up | Every running, dormant, and preview resource is a row, including projects that still exist after an experiment. | Service map above, then each vendor’s project list | Not reviewed | |
| OBS-02 | A place for each service | Account, project, and region are written down. “Production” names a console, not a person. | Same map | Not reviewed | |
| OBS-03 | A cost for each service | Last month’s invoice is split by service. The rows sum to the invoices. Zero-dollar services are explicit. | Vercel, Neon, Clerk, Resend, GitHub, registrar, and any AI org key | Not reviewed | |
| OBS-04 | Spend separated by environment | Production, preview, and development are not one number. A leftover preview database is visible. | Vercel usage, Neon branches | Not reviewed | |
| OBS-05 | The usage behind the bill | Function invocations, bandwidth, database compute and storage, blob storage, emails sent, and Clerk MAU can be read for the same month as the invoice. | Each vendor’s usage page | Not reviewed | |
| OBS-06 | An alert the day spend runs away | A threshold pages a person on Vercel, Neon, Clerk, Resend, and any platform model key. The original post records learning this from a $1,382.59 agent loop. | Vendor billing alerts | Not reviewed | |
| OBS-07 | The map stays current | An owner and a cadence (at least monthly) keep account, region, and cost from going stale. | This document | Not reviewed | |

### Real-time

This is the view of production while it is happening. Kikiboard does not push updates over a socket. An open board refreshes every 25 seconds (`hooks/use-board-polling.ts`). The notification bell polls `/api/notifications` every 30 seconds and ignores a failed response (`NotificationBell.tsx`). Both paths discard the error, so a client-only failure never becomes a log line. Server failures that do get logged are `console.error` calls on AI, Blob, Resend, and the Google callback. Nothing in the repo ships those lines to a tracker, and there is no `instrumentation.ts`.

| ID | Measure | Done when | Where to start | Status | Notes |
|---|---|---|---|---|---|
| OBS-08 | Requests visible as they arrive | Route, status, and duration for production traffic, including board refresh and `/api/notifications`, show up within about a minute. | Vercel runtime logs. No telemetry SDK in `package.json` | Not reviewed | |
| OBS-09 | Errors visible while they continue | A new failure groups, counts, and stays on screen as it repeats. Client polling failures are included, not only the `console.error` paths. | `hooks/use-board-polling.ts`, `NotificationBell.tsx`, `app/api/ai`, Blob and Resend routes | Not reviewed | |
| OBS-10 | Dependencies visible now | Neon compute, connections, and slow queries; function concurrency; Blob, Resend, and Clerk errors. The numbers are current to the minute. | Neon monitoring, Vercel, Resend, Clerk | Not reviewed | |
| OBS-11 | Today's spend, not last month's invoice | Function time, bandwidth, database compute, blob storage, and email volume can be read for today. A runaway loop is obvious the same hour. | Each vendor's usage page, filtered to today. Distinct from OBS-03 and from the alert in OBS-06 | Not reviewed | |
| OBS-12 | One slow request can be followed now | A board load, an AI call, or an MCP write can be traced from the route to Neon and to the outbound provider during the incident. | Confirm whether the host adds tracing. The repo does not | Not reviewed | |
| OBS-13 | Those live signals page a person | Error rate, latency, downtime, and same-day spend each notify someone. A real failure pages. A quiet hour does not. | Vendor alert settings, checked against a recent real event | Not reviewed | |

AI model spend on a user’s own key is their bill (`docs/ai.md`). OBS-03 still checks that the deployment has no shared provider key. Per-customer caps, if a platform key ever exists, stay in SEC-53.

## 2. Identity and sessions

| ID | Measure | Done when | Where to start | Status | Notes |
|---|---|---|---|---|---|
| SEC-01 | Login accepts real-world email addresses, including a `+` in the local part | Plus-addressed emails sign in, sign up, and match the same account. No truncation or rejection. | `docs/auth.md`, `lib/getOrCreateUser.ts`, Clerk sign-in | Not reviewed | |
| SEC-02 | Password reset links expire and work once | A reset token cannot be reused and stops working after its lifetime. | Clerk password reset (identity is offloaded; confirm the Clerk instance settings) | Not reviewed | |
| SEC-03 | MFA, plus a recovery path if the phone or authenticator is lost | Users can enroll a second factor, and a lost factor has a documented recovery path that an attacker cannot use alone. | `docs/auth.md`, `lib/mfa.ts` | Not reviewed | |
| SEC-04 | Sessions time out, and every session for one user can be revoked | Idle or absolute session lifetime is enforced, and support or the user can kill all sessions. | Clerk session settings, `middleware.ts` | Not reviewed | |
| SEC-05 | Enterprise SSO | A customer can require their own identity provider instead of a local password. | Clerk enterprise / SSO configuration | Not reviewed | |
| SEC-06 | SAML | That SSO path supports SAML, not only magic links or social login. | Clerk SAML connection | Not reviewed | |
| SEC-07 | SCIM offboarding | When the customer’s IdP deprovisions a user, Kikiboard access ends with that event. | Clerk directory sync; `app/api/webhooks/clerk/route.ts` for the local user-delete path | Not reviewed | |
| SEC-08 | Rate limits on login | Password guessing is throttled before it becomes practical. | Clerk attack protection; this repo has no app-level login limiter | Not reviewed | |
| SEC-09 | Lockouts that stop attackers without locking out a legitimate user | Failed-login lockout has a recovery path and does not depend on a single shared account. | Clerk attack protection | Not reviewed | |

## 3. Authorization and tenancy

| ID | Measure | Done when | Where to start | Status | Notes |
|---|---|---|---|---|---|
| SEC-10 | Roles deeper than “admin” and “everyone else” | Permissions distinguish owner, admin, member, and any narrower actions (invite, billing, destructive deletes). | `docs/boards-and-roles.md`, `lib/boardRoles.ts`, `lib/boardAccess.ts` | Not reviewed | |
| SEC-11 | Object-level checks on every id in a URL | Changing an id never returns another user’s board, task, file, or comment. Denied access does not reveal that the object exists. | `lib/boardAccess.ts`, `app/api/tasks`, `app/api/boards` | Not reviewed | |
| SEC-12 | Tenant isolation | One customer’s bug, query, or export cannot return another customer’s rows. | `prisma/schema.prisma` (`userId`, `boardId`), board access helpers | Not reviewed | |
| SEC-13 | Support “log in as this user” has an audit trail on every use | Impersonation is explicit, time-bounded, and every use is logged with who, whom, and when. | Search for impersonation / actor overrides. None is documented in `docs/auth.md`. | Not reviewed | |
| SEC-14 | Least privilege, including any AI agent that can reach production | Human roles and machine credentials (MCP, CI, deployment) can do only the actions they need. Production credentials are not shared with a general agent. | `docs/ai.md`, `lib/externalAccess.ts`, `lib/mcp`, `mcp/README.md` | Not reviewed | |

## 4. Application security

| ID | Measure | Done when | Where to start | Status | Notes |
|---|---|---|---|---|---|
| SEC-15 | Validation on the server, not only in the form | Every mutating route checks types, bounds, and permissions again after the client. | `app/api/**/route.ts` | Not reviewed | |
| SEC-16 | Input sanitization on every field a user can type | Stored text cannot change into HTML, Markdown, or a query that the app will execute. | Task titles, descriptions, comments, custom fields | Not reviewed | |
| SEC-17 | Protection against SQL injection, XSS, CSRF, and the rest of OWASP | Queries are parameterized, rendered text is encoded, state-changing browser requests require a session the attacker cannot forge, and file/redirect/SSRF cases are covered. | Prisma query usage, React rendering, `middleware.ts` | Not reviewed | |
| SEC-18 | File uploads are scanned, size-limited, and stored where they cannot execute | Limits are enforced on the server. Objects are private. Content is not served from a path the app executes. Malware scanning is a separate decision, recorded either way. | `app/api/tasks/[taskId]/attachments/route.ts`, `lib/mcp/ticketRelations.ts` (`@vercel/blob`, `access: "private"`) | Not reviewed | |
| SEC-19 | CORS is not “allow everything” | Browser origins that may call credentialed APIs are an explicit list. | `middleware.ts`, `next.config.ts`, route handlers | Not reviewed | |
| SEC-20 | Security headers on every response | Responses send a Content-Security-Policy, HSTS, `X-Frame-Options` or frame-ancestors, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`. | `next.config.ts`, `middleware.ts` | Not reviewed | |
| SEC-21 | Webhooks verify signatures | Inbound webhooks reject missing or invalid signatures before any write. | `app/api/webhooks/clerk/route.ts`; outbound board webhooks in `docs/integrations.md` | Not reviewed | |
| SEC-22 | API keys can be created and revoked | A customer can mint a credential, see it once, and revoke it so later calls fail. | `docs/auth.md` MCP client credentials, `mcp/README.md` | Not reviewed | |
| SEC-23 | API rate limits protect the app without blocking real integrations | Authenticated and public routes have limits. Share links and OAuth callbacks are included. | `app/api`, `/share/task/[token]`, `/api/mcp` | Not reviewed | |
| SEC-24 | OAuth tokens refresh, and expiry does not silently break the integration | Stored provider tokens are refreshed or the user is asked to reconnect. Refresh tokens are encrypted. | `docs/integrations.md`, `lib/crypto.ts`, Google Calendar routes | Not reviewed | |

## 5. Secrets, cryptography, and logging

| ID | Measure | Done when | Where to start | Status | Notes |
|---|---|---|---|---|---|
| SEC-25 | Secrets stay out of the code, the repo, and AI chat history | No production key is committed, logged, or pasted into a prompt that leaves the network. `.env.example` has names only. | `.env.example`, `lib/crypto.ts`, `docs/ai.md` | Not reviewed | |
| SEC-26 | Keys that were ever pasted into config or chat are rotated | There is a rotation procedure, and any known pasted key has been rotated. | Deployment env vars, `ENCRYPTION_SECRET`, Clerk, blob, and AI provider keys | Not reviewed | |
| SEC-27 | Encryption at rest and in transit | TLS terminates every public route. Sensitive columns (AI keys, OAuth tokens) use application encryption with a secret that fails startup when missing. Database disks are encrypted by the host. | `lib/crypto.ts`, Neon and Vercel project settings | Not reviewed | |
| SEC-28 | Logs say who did what, and never record passwords, tokens, or card numbers | Activity logs are useful for investigation and are scrubbed of secrets. | `lib/createActivity.ts`, `docs/collaboration.md`, MCP `McpChange` history | Not reviewed | |
| SEC-29 | Email authentication so password resets and invites are not spoofed | SPF, DKIM, and DMARC pass for the sending domain, and bounces/complaints are handled. | Transactional email provider, `docs/invitations.md` | Not reviewed | |

## 6. Supply chain and change

| ID | Measure | Done when | Where to start | Status | Notes |
|---|---|---|---|---|---|
| SEC-30 | Every package the AI installed is the package that was intended | Lockfile entries resolve to real, expected packages. No hallucinated or typosquatted names. | `pnpm-lock.yaml`, `package.json` | Not reviewed | |
| SEC-31 | Dependency scanning | Known vulnerabilities in dependencies fail or get triaged in CI. | `.github/workflows/ci.yml` | Not reviewed | |
| SEC-32 | Dependencies are upgraded on a schedule | The tree is not stuck multiple majors behind, and abandoned packages are visible. | `package.json` | Not reviewed | |
| SEC-33 | Framework upgrades happen before security patches stop | Next.js, React, Prisma, and Clerk SDK versions are still in a supported window. | `package.json` | Not reviewed | |
| SEC-34 | The deploy pipeline runs tests before customers see the change | A failing test or a failing security check blocks production. | `.github/workflows/ci.yml` | Not reviewed | |
| SEC-35 | A human reviews every change, including lines an AI wrote | Nothing reaches the default branch without review. | GitHub branch protection | Not reviewed | |

## 7. Privacy, compliance, and data lifecycle

| ID | Measure | Done when | Where to start | Status | Notes |
|---|---|---|---|---|---|
| SEC-36 | Retention rules, and code that deletes what the contract says to delete | Stored data has an owner, a lifetime, and a delete path that matches the privacy policy. | `app/(routes)/(home)/privacy/page.tsx`, Prisma models, attachment deletion | Not reviewed | |
| SEC-37 | A deletion request reaches every table, backup, and log | Account deletion removes or anonymizes rows, files, activity, notifications, and copies in backups/logs within the stated window. | `app/api/webhooks/clerk/route.ts` (`user.deleted`), blob attachments | Not reviewed | |
| SEC-38 | Audit trails show who viewed a record, not only who changed it | Reads of sensitive records are attributable. | Activity log in `docs/collaboration.md` | Not reviewed | |
| SEC-39 | Data residency can be limited to a contracted region | Customer data, backups, and model calls stay in the region the contract names. | Neon region, Vercel region, AI provider region | Not reviewed | |
| SEC-40 | Quarterly access reviews that someone signs | Production, database, and admin access is reviewed on a calendar, and the review is kept. | Org process, not application code | Not reviewed | |
| SEC-41 | Card numbers stay out of this database, and PCI scope is known | Payments, if any, are tokenized by a provider. This schema does not store PAN, CVV, or magnetic data. | `prisma/schema.prisma` | Not reviewed | |
| SEC-42 | SOC 2 is evidence and an auditor, not a badge | If a customer requires it, policies, control owners, and an audit report exist. | `docs/iso-27001-compliance-plan.md` (different standard; do not treat it as SOC 2) | Not reviewed | |
| SEC-43 | HIPAA and a BAA the moment patient data is possible | If a single patient record can be stored in a task, comment, or prompt, every vendor that touches it — including the model provider — has a BAA, or that data is prohibited. | `docs/ai.md`, privacy policy | Not reviewed | |
| SEC-44 | A security questionnaire can be answered with evidence | Each claim a buyer will ask (encryption, access, subprocessors, backups, incident response) maps to a control and a proof. | This checklist plus the ISO plan | Not reviewed | |
| SEC-45 | A penetration test before an enterprise customer runs their own | An external test has been done against production or a production-like environment, and findings are tracked. | Org process | Not reviewed | |
| SEC-46 | A vulnerability disclosure process | A stranger can report a bug, the report reaches a person, and there is a clock for triage. | Public security contact; not currently a route in `docs/README.md` | Not reviewed | |
| SEC-47 | A plan for a stolen laptop that has production access | Sessions and credentials can be revoked the same day, and production does not rely on long-lived keys sitting on a laptop. | Clerk session revocation, deployment access | Not reviewed | |
| SEC-48 | Privacy policy and terms match what the code does | The public policy names the data the app actually stores, the subprocessors it actually calls, and the retention it actually implements. | `app/(routes)/(home)/privacy/page.tsx` | Not reviewed | |

## 8. AI-specific controls

| ID | Measure | Done when | Where to start | Status | Notes |
|---|---|---|---|---|---|
| SEC-49 | Prompt injection is handled in every field that reaches a model | Task text, comments, attachments, and MCP input cannot override tool policy or exfiltrate other tenants’ data. | `docs/ai.md`, `app/api/ai`, `lib/mcp` | Not reviewed | |
| SEC-50 | Customer data stays out of prompts that leave the network | What is sent to a model provider is explicit. Patient or customer content is redacted or covered by a no-train / BAA agreement. | `docs/ai.md`, AI provider calls | Not reviewed | |
| SEC-51 | A human approves anything the AI does that cannot be undone | Destructive or externally visible agent actions require confirmation. Reversible MCP edits have a history and a revert path. | `docs/auth.md` (MCP history and revert), `lib/mcp/writes.ts` | Not reviewed | |
| SEC-52 | Prompt and output logs keep what debugging needs and drop what policy forbids | Debug logs do not retain secrets, tokens, or data the privacy policy says is not kept. | AI route logging | Not reviewed | |
| SEC-53 | A per-customer cap on model spend | One user or one agent loop cannot run unbounded provider cost. | AI routes, provider budgets | Not reviewed | |

## 9. Resilience that protects data

These are availability controls from the post. They are in this review because a missing backup or an untested restore is how a security incident becomes data loss.

| ID | Measure | Done when | Where to start | Status | Notes |
|---|---|---|---|---|---|
| SEC-54 | Backups run on a schedule | Database and file storage have an automatic backup whose frequency is written down. | Neon backups, Vercel Blob | Not reviewed | |
| SEC-55 | A restore from those backups has been tested | Someone has restored into a non-production target and checked the data. | Neon restore drill | Not reviewed | |
| SEC-56 | Point-in-time recovery | A bad delete can be recovered to a moment before the statement. | Neon PITR | Not reviewed | |
| SEC-57 | Soft deletes for accidental user deletion | Ordinary “I deleted it” is reversible by support without a database restore. | Task archive in `docs/tasks.md`; confirm which deletes are hard | Not reviewed | |
| SEC-58 | A written disaster-recovery plan, tested yearly | RPO, RTO, who decides, and the last test date exist outside one person’s memory. | Org process | Not reviewed | |
| SEC-59 | Dev, staging, and production match where security depends on it | Auth, headers, encryption, and migrations behave the same in each environment that can hold customer data. | Deployment config, `prisma` migrations | Not reviewed | |
| SEC-60 | Infrastructure is written down as code | The setup is not only a dashboard memory. | `.github/workflows`, hosting config | Not reviewed | |

---

## Suggested review order

1. Section 1 first: fill the service map (OBS-01 through OBS-07) from invoices and consoles, then the live view (OBS-08 through OBS-13). Later rows depend on knowing which account and region they live in, and on being able to see a failure while it is happening.
2. SEC-20 security headers, SEC-23 rate limits, SEC-27 encryption startup behavior, SEC-31 dependency scanning, SEC-34 CI gates.
3. SEC-10 through SEC-14 authorization, tenancy, and agent privilege.
4. SEC-18 uploads, SEC-21 webhooks, SEC-22 API credentials.
5. SEC-36 through SEC-38 deletion and audit.
6. SEC-49 through SEC-53 AI controls.
7. Vendor and org rows (SSO, SAML, SCIM, SOC 2, pen test, disclosure, backups).

## Left out of this extract

The same post also asks for schema design, migrations, indexes, pooling, time zones, Unicode, money and tax, idempotency, pagination, imports and exports, background jobs, caching, CDN, autoscaling, feature flags, on-call, tests, accessibility, customer billing, and product UX. Those matter before charging a customer. They are not rows above.

Cost alerts from that post are OBS-06 and OBS-13. Logs, error tracking, uptime, dashboards, and tracing are the real-time rows OBS-08 through OBS-13. The service map is the inventory; those rows are the live view.
