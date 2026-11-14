# Local-First architecture exploration (KI-00076)

Investigation of whether Kikiboard should adopt a Local-First (offline-capable, client-DB + bidirectional sync) model so navigation and mutations feel near-instant while a background engine reconciles with the server.

**Ticket:** [KI-00076](https://kikiboard.xyz/board/cmtb8wt1r000804l7lldm4hf5?taskId=cmwffh35k000008jm9x7cdra7)  
**Status of this doc:** Strategy A is implemented as a first slice (see §11).  
**Audience:** engineering team presentation / decision record.

---

## 1. Current architecture (baseline)

| Concern | Today |
|---|---|
| Board first paint | Next.js RSC loads the full board graph from Prisma on the server (`board/[boardId]/page.tsx`) |
| Client state | Zustand (`useBoardStore`) holds lists/tasks **in memory only** after hydrate |
| Cross-user freshness | `useBoardPolling` every **25s** + on tab focus (`hooks/use-board-polling.ts`) |
| Mutations | `apiFetch` → `kiki-api` `/v1/...` (or app `/api` fallback); some DnD paths update Zustand before the network returns |
| Live events | `kiki-api` already publishes domain events via `EventBus` after writes; **nothing listens yet** (no WebSocket) — see `kiki-api` `docs/events.md` |
| AuthZ | Clerk session + board/org/team ACL; failed access is usually 404 |
| Extra writers | MCP / external-access tokens mutate the same Postgres rows |

Implication: the UI is already “optimistic locally for the actor,” but every cold navigation and every other collaborator still depends on a full network round-trip (or a slow poll). There is no durable client database and no sync protocol.

---

## 2. What “Local-First” would mean for Kikiboard

Target properties:

1. **Reads** for board navigation (Kanban, list, ticket modal shell) come from a **local browser DB** (IndexedDB or SQLite WASM), not from waiting on `GET`.
2. **Writes** apply locally first (optimistic), then sync to `kiki-api` / Postgres.
3. **Other clients** receive changes without a 25s poll (push or pull-with-delta).
4. Offline / flaky network: queued mutations retry; conflicts are defined and visible.

Non-goals for a first phase (explicit):

- Replacing Postgres or Prisma as the system of record.
- Letting the browser bypass ACL / audit / MCP change history.
- Full CRDT merge of every ticket field (including rich text, attachments, custom fields).

---

## 3. Local database options (comparison)

At least two storage layers were evaluated against Kikiboard’s Next.js + TypeScript + Zustand stack.

### 3.1 IndexedDB (via Dexie or raw `idb`)

| | |
|---|---|
| **What it is** | Native browser key-value / object store; Dexie adds typed schemas, indexes, and queries |
| **Fit** | Natural home for JSON task/list documents we already ship over OpenAPI |
| **Pros** | Ubiquitous, small bundle, no WASM, works with existing Clerk SPA session; easy to cache one board’s payload |
| **Cons** | No SQL; multi-tab coordination is manual; large joins (board + labels + custom fields) are app-owned; quota ~varies by browser (often tens–hundreds of MB, evictable under pressure) |
| **Effort** | Low–medium for a board cache; medium if we rebuild query layers for search/calendar |

### 3.2 SQLite WASM (+ OPFS)

| | |
|---|---|
| **What it is** | SQLite compiled to WASM, often backed by Origin Private File System for durable ACID storage in a worker |
| **Fit** | Mirrors relational mental model closer to Prisma; used by PowerSync and some Electric + PGlite stacks |
| **Pros** | Real SQL, transactions, indexes; stronger consistency for multi-row moves (list order + task order) |
| **Cons** | Larger download; worker + OPFS complexity; Safari/OPFS edge cases historically; still need a sync story and a TS mapping layer; does not remove ACL (server remains authority) |
| **Effort** | Medium–high before any sync engine |

### 3.3 RxDB (document DB over IndexedDB / SQLite storage)

| | |
|---|---|
| **What it is** | Reactive NoSQL collections with pluggable storage and a built-in push/pull replication protocol |
| **Pros** | Observable queries replace ad-hoc Zustand + poll; multi-tab leader election; conflict hooks; mature offline replication plugins |
| **Cons** | New query model (Mango) vs Prisma; schema/migration dual-write with OpenAPI types; licensing/bundle size to verify; risk of fighting App Router SSR hydrate |
| **Effort** | Medium for POC on one collection; high to cover the full board graph |

### Verdict on storage

| Option | Recommend for Kikiboard POC? | Why |
|---|---|---|
| **IndexedDB (Dexie)** | **Yes — primary POC store** | Matches current JSON DTOs; lowest risk beside Zustand; enough for one-board cache + outbox |
| **SQLite WASM** | Secondary / if we pick PowerSync | Prefer only when the sync engine *requires* it |
| **RxDB** | Optional if we want replication batteries included without a hosted sync SaaS | Strong if we reject Electric/PowerSync and own HTTP sync |

---

## 4. Sync strategies (comparison)

At least two bidirectional / realtime strategies were evaluated. Writes that touch permissions, notifications, activity, Slack/Discord, or MCP history **must remain server-validated**.

### 4.1 Strategy A — Read-path sync + API-authoritative writes (Electric-style / EventBus shapes)

**Model**

- Client keeps a local replica of allowed rows (or a board “shape”).
- Server → client: stream or push deltas (ElectricSQL shapes, or our own WebSocket fed by `EventBus`).
- Client → server: existing `apiFetch` mutations (optimistic UI + outbox retry). Conflicts = last server response wins / rebase local draft.

**Pros for Kikiboard**

- Aligns with `kiki-api` EventBus design (“Adding realtime later touches no route”).
- Preserves ACL, audit, activity, MCP undo, ISO change history.
- Does not require CRDT expertise for ticket fields.
- Can replace 25s polling with seconds or sub-second invalidation.

**Cons**

- Offline *writes* need an app-owned outbox (not free from the sync product if using Electric read-only).
- ElectricSQL is Postgres-shaped and ecosystem-shifting (cloud hosting / org changes); prefer treating it as *pattern reference* or evaluate carefully before depending on it.
- Client still must know which shape/filter matches `readableBoardWhere`.

### 4.2 Strategy B — Full bidirectional sync engine (PowerSync / RxDB replication / Zero)

**Model**

- Local DB is the UI’s source of truth.
- Engine downloads buckets/rules into SQLite or documents.
- Local mutations enqueue; engine uploads through **our** write API (or a sync gateway that still calls our validators).
- Conflict policy implemented in backend or pluggable handlers.

**Pros**

- True offline-first UX; fewer custom sync bugs if the product is healthy.
- SQL on device (PowerSync) can accelerate list filters/search later.

**Cons**

- Large migration of board page away from RSC hydrate + Zustand.
- Sync rules must encode board/org/team ACL — easy to get wrong (over-share).
- Dual writers (UI + MCP + webhooks) increase conflict surface.
- Vendor/ops cost (PowerSync service) or protocol ownership (RxDB/Zero).
- Replicache is in maintenance mode; Zero is the successor — early adoption risk.

### 4.3 Strategy C — CRDT / OT for collaborative fields (Yjs / Automerge)

**Model**

- Structural merge for concurrent edits (best for Tiptap rich text, not for list `order` integers).

**Verdict:** useful **later** for description/comment bodies only. Poor primary sync for Kanban order, assignees, labels, and ACL-sensitive fields. Do **not** use as the board-wide sync strategy.

### Strategy comparison (summary)

| | A: Read sync + API writes | B: Bidirectional engine | C: CRDT (field-scoped) |
|---|---|---|---|
| Offline reads | Yes (cached) | Yes | N/A alone |
| Offline writes | Outbox we build | Engine + our validators | Field-local |
| Conflict model | Server authority / rebase | Rules + backend | Automatic merge |
| ACL / audit / MCP | Native | Must be re-expressed | Orthogonal |
| Effort vs current stack | **Lowest meaningful win** | High | Medium (text only) |
| Fit with EventBus | **Direct** | Parallel system | Optional later |

---

## 5. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| **Stale ACL in local DB** (removed from board, still sees cache) | Data exposure | TTL + hard invalidate on 401/404; subscribe to membership events; never store rows the last successful authorized fetch did not return; encrypt-at-rest optional for sensitive boards |
| **Conflict on concurrent edits** (two users, MCP + UI) | Lost updates, confusing UI | Server remains source of truth; version/`updatedAt` check on PATCH; surface “remote changed” toast; MCP already has change/revert — keep that as audit spine |
| **Partial sync / torn board** | Wrong order, missing tasks | Transactional apply of delta batches; snapshot epoch per board; full resync if checksum fails |
| **Storage quota / eviction** | Silent data loss of outbox | Persist outbox with retry budget; warn when IndexedDB fails; do not treat local DB as backup of record |
| **Security of client replica** | Device theft, shared computer | Same as today for SSR HTML in memory, but durable: clear DB on sign-out; no secrets in IndexedDB; attachments stay token-gated downloads |
| **Migration complexity during `app/api` → `kiki-api`** | Dual paths break sync | Gate POC on routes already on `apiFetch` + EventBus; do not invent a third write path |
| **SSR vs SPA hydrate mismatch** | Flicker / wrong first paint | POC can keep RSC for first paint, then hydrate local DB; or mark board client-shell only after cache warm |
| **ISO / audit expectations** | Undocumented client behavior | Document that local DB is a cache; server logs remain authoritative; outbox never skips `createActivity` |
| **Vendor lock-in** | Rewrite later | Prefer Strategy A with our EventBus for POC; evaluate PowerSync only if offline writes become a hard product requirement |

---

## 6. Impact estimates

| Dimension | Estimate |
|---|---|
| **UX** | Board switch and DnD already feel fast for the actor; biggest win is **collaborator freshness** (sub-second vs 25s) and **revisit latency** (warm IndexedDB vs full RSC + Prisma). Offline edit is a secondary win for mobile/flaky networks. |
| **Performance** | Local reads: ~0–5 ms for in-memory Zustand today; IndexedDB ~1–20 ms. Network eliminated on warm navigations. Bundle + WASM cost only if SQLite path chosen. |
| **Dev effort** | Strategy A POC: **~1–2 engineer-weeks**. Strategy B productization: **multi-sprint** (ACL sync rules, conflict UX, migration of board store, test matrix). |
| **Ops** | Strategy A: WebSocket fan-out + Redis/PubSub for multi-instance Cloud Run. Strategy B: sync service + monitoring of lag/conflicts. |

---

## 7. Recommendation

**Proceed with a small-scale POC — Strategy A (read-path sync + API-authoritative writes + IndexedDB cache/outbox). Do not adopt a full bidirectional CRDT/PowerSync stack yet.**

Rationale:

1. Kikiboard is multi-writer (UI, MCP, integrations) with strict ACL and audit — server authority is non-negotiable.
2. `kiki-api` already has the EventBus hook for push; polling is the obvious first replacement.
3. IndexedDB matches our JSON API without introducing SQLite WASM cost for a first experiment.
4. A full local-first rewrite would collide with the ongoing API migration and ISO change-management overhead for little incremental UX beyond push + cache.

**Decision gate after POC:** if success metrics pass, productize WebSocket + board cache. Only then revisit PowerSync/RxDB for true offline write queues as a separate epic.

---

## 8. Proof of concept plan

### Scope (in)

- One board’s lists + tasks (card fields used on Kanban) in **Dexie/IndexedDB**.
- **Outbox** for a single mutation type (e.g. `PATCH /v1/tasks/:id` title or list move) with retry.
- **Push or short-poll delta**: prefer WebSocket subscribed to `EventBus` for `boardId`; fallback: poll `GET /v1/boards/:id/tasks` with `updatedSince` if WS is not ready in time.
- Keep Zustand as the reactive UI layer (hydrate from IndexedDB, apply events).

### Scope (out)

- Attachments blobs, comments threads, search index, calendar, MCP client, CRDT descriptions.
- Replacing RSC first paint.
- Multi-board global offline mode.

### Success metrics

| Metric | Baseline (approx.) | POC target |
|---|---|---|
| Collaborator sees remote card move | ≤ 25s (poll) | **≤ 2s** p95 with tab visible |
| Warm revisit of same board (client nav) | Full network board fetch | **≤ 100 ms** to interactive lists from IndexedDB (network refresh in background) |
| Mutation ack while online | Existing API latency | No regression > 10%; UI paint **≤ 50 ms** optimistic |
| Outbox durability | N/A | Survive reload; flush within **5s** of reconnect; **0** silent drops in test script |
| Conflict handling | Last-write / overwrite | Detect `updatedAt` mismatch; show recoverable UI in **100%** of forced conflict tests |
| Security smoke | — | Sign-out clears DB; user without access gets empty store + redirect, not cached rows |

### Test plan for the POC

1. Two browsers, same board: move task in A; assert B updates within metric without manual refresh.
2. DevTools offline: edit title; go online; assert server + activity log match.
3. Force conflict: A and B edit same title; assert one wins server-side and loser is notified.
4. Remove membership while cache warm; assert next sync wipes local board data.
5. Measure with Performance API marks (`local-read`, `ws-event`, `outbox-flush`).

### Suggested sequencing

1. Add `updatedSince` (or etag) to board tasks GET if missing — enables cheap delta even before WS.
2. Wire WebSocket (or SSE) to `EventBus` in `kiki-api` with Clerk token auth.
3. Introduce Dexie schema `boards`, `lists`, `tasks`, `outbox`.
4. Feature-flag on one internal board; compare metrics; write go/no-go note.

### Rough sizing

| Work | Owner surface | Size |
|---|---|---|
| Event transport (WS/SSE) | `kiki-api` | M |
| Client DB + hydrate | `management-tool-v2` | M |
| Outbox for one mutation | both (reuse OpenAPI) | S |
| Metrics harness + flag | app | S |

---

## 9. Presentation outline (engineering)

Use this doc as the leave-behind. Suggested 15-minute talk:

1. **Baseline pain** — 25s poll, memory-only Zustand, EventBus unused (2 min).
2. **Options matrix** — IndexedDB vs SQLite; Strategy A vs B (5 min).
3. **Risks** — ACL cache, conflicts, ISO (3 min).
4. **Recommendation + POC metrics** — ask for flag approval (5 min).

Open question for the team: is **true offline write** a near-term product requirement, or is **fast multiplayer freshness** enough? That answer chooses Strategy A vs B for the epic after the POC.

---

## 10. References (internal)

- `docs/architecture.md` — request path, `apiFetch`, board surfaces.
- `hooks/use-board-polling.ts` — polling safety net (60s when SSE is configured).
- `hooks/use-board-local-first.ts` — IndexedDB hydrate/persist, SSE refresh, outbox flush.
- `lib/local-first/*` — Dexie schema, cache, outbox, SSE client.
- `app/(routes)/(dashboard)/board/[boardId]/store/useBoardStore.ts` — in-memory client model.
- `kiki-api` `docs/events.md` — `GET /v1/boards/:boardId/events` SSE listener.

## 11. Implemented slice (Strategy A)

| Piece | Where |
|---|---|
| Board SSE | `kiki-api` `GET /v1/boards/:boardId/events` (Bearer + `canReadBoard`, heartbeat ACL re-check, CORS after hijack) |
| IndexedDB | Dexie `boardCache` + `outbox` (`lib/local-first/db.ts`) |
| Hydrate / persist | `useBoardLocalFirst` on `BoardContent` (empty `[]` is a real snapshot) |
| Invalidation | SSE `ready` + `domain` → debounced `router.refresh()`; poll stays 25s |
| Outbox | DnD + menu move `updateOrder` via `enqueueAndSend` (IDB failure falls back to direct `apiFetch`) |
| Sign-out wipe | `await clearLocalFirstDb()` before Clerk `signOut` |
| Kill switch | **Opt-in:** `NEXT_PUBLIC_LOCAL_FIRST=1` |
| SSE prerequisite | `NEXT_PUBLIC_API_URL` pointing at kiki-api |

**Still open (not claimed done):** shared EventBus across Cloud Run instances; per-user IndexedDB partition; conflict rebase / `updatedAt` UI when flush races a remote edit; outbox for more mutations; optional `updatedSince` delta GET; field-scoped CRDT for rich text.
