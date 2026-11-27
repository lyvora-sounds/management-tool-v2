# Board Quarter UI Design (KQ-00016)

**Ticket:** [KQ-00016](https://kikiboard.xyz/board/cmwalc1w8000601s6j4p39bks?taskId=cmwzgann1005z01s6h2fv03yx)  
**Depends on:** KQ-00015 (`GET`/`PUT /v1/boards/:boardId/quarters`) merged and available to the app  
**Repo:** `management-tool-v2`  
**Branch:** `KQ-00016-management-tool-v2-configure-quarter-dates-and-tie` from `origin/dev`

## Problem

After the API ships board quarter calendars, the UI still treats quarter as a free-text label. Admins cannot see or edit start/end dates; cards cannot bind to configured quarters; filters do not reflect the board calendar.

## Goals

- Recommend **calendar-year defaults** (Q1 starts 1 Jan) while allowing **fiscal / custom ranges**.
- Keys stay `YYYY-Qn` (corporate planning labels). Date ranges may **cross calendar years** (e.g. `2026-Q4` ends in early 2027; Q1 may start in February).
- Admins configure ranges; members pick from configured quarters on tickets/epics.
- Client blocks obvious date/quarter mismatches; API remains authoritative.

## Non-goals

- Non-`YYYY-Qn` keys, Q5+, open-ended quarters.
- Deleting quarter keys from the UI (editing dates only; unused years can stay).
- Header/filter chrome work (KQ-00014).
- Arbitrary year jump beyond **current UTC year ± 1**.

## Behavior

### Quarters dialog (Board menu, `canManage`)

- Entry: **Quarters** next to Integrations / Permissions.
- Load: `GET /v1/boards/:boardId/quarters` (shows key, start, end with full dates so cross-year ends are obvious).
- Edit: change start/end per row; save with `PUT /v1/boards/:boardId/quarters` for the edited set (merge semantics as API).
- Overlaps / end &lt; start: show API error; do not invent client-only overlap rules beyond disabled Save when end &lt; start.
- **Reset to calendar defaults** for a chosen year in `{current−1, current, current+1}`: set that year’s four keys to calendar bounds (client computes same bounds as API helpers, or re-fetch after a dedicated reset if we only PUT defaults).
- **Ensure year** (current ± 1): if that year’s keys are missing, PUT calendar defaults for those four keys (or call ensure via GET after API seeds current year only — for ±1, UI PUTs the four default rows). Allows setting up next year’s fiscal calendar early.

### Ticket / epic quarter field

- Replace free-text with a **select** of board quarters from GET.
- Option label: `2026-Q4 · 1 Nov 2026 – 31 Jan 2027` (locale-aware dates).
- Empty / clear still allowed (null quarter).
- On save of quarter or dates: if quarter set and start/due outside that row’s range, block with a clear message (same semantics as API: inclusive UTC calendar-day).

### Filters

- Quarter filter options = configured quarters from GET (plus “all”), not a hard-coded year list.

### Auth

- Dialog edit: `canManage` (board admin/owner), matching API `isBoardAdmin`.
- Selecting a quarter on a card: existing `canEdit`.

## Technical notes

- Wire `lib/apiRoutes.ts` for GET/PUT quarters; regenerate `pnpm api:types`.
- Shared client helper for “date in quarter range” (mirror API inclusive day logic) with unit tests (TDD).
- Locales: `en`, `es`, `tl`.
- Follow existing BoardHeader modal patterns (Integrations / Permissions).

## Acceptance mapping

| Criterion | Design |
|-----------|--------|
| Admin can set start/end per quarter | Quarters dialog + PUT |
| Cards/epics only pick defined quarters | Select from GET |
| Client blocks date/quarter mismatches | Helper + save guards |
| Locales en / es / tl | Copy for menu, dialog, errors, option labels |
| Depends on KQ-00015 | Types + routes against shipped API |

## Open follow-ups (not this ticket)

- Delete unused quarter keys.
- “Reset all years” bulk action.
- Epic create UI parity if epic quarter is edited outside TaskModal (match wherever epics set quarter today).
