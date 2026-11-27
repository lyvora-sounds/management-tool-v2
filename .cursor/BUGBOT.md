# Bugbot rules — management-tool-v2

This repo is the Kikiboard **frontend** (Next.js). The backend is `kiki-api`.

## API ownership

- Flag PRs that add new feature HTTP handlers under `app/api/**`. New `/v1/...` routes belong in `kiki-api`, then this app wires `apiFetch` / `lib/apiRoutes.ts`.
- Temporary exception: only the thin `health` and GitHub redirect relays should live under `app/api`.
- Do not treat UI `canManage` / `canEdit` checks as authorization. Real board access and mutation checks must remain on the API.

## Security / privacy

- Block introducing secrets, decrypted provider credentials, or raw API keys into client components, fixtures, committed files, or logs.
- Prefer existing `apiFetch` (Clerk bearer) over ad-hoc fetch that drops auth.
- Flag XSS risks: prefer React text escaping; treat new `dangerouslySetInnerHTML` as high scrutiny unless paired with sanitization already used in the repo.

## Product / quality

- User-facing strings must land in every locale under `messages/` (`en`, `es`, `tl`). Missing locale keys are a bug.
- Do not hand-edit `lib/api/schema.d.ts`; regenerate with `pnpm api:types` after API contract changes.
- Prefer extending nearby components over large unrelated refactors.

## Review focus for this codebase

- Broken `apiRoutes` proxies (method/path mismatch to `kiki-api`).
- Client-only validation that silently diverges from API errors (e.g. optimistic store updates when `res.ok` is false).
- Filter/modal state that leaks board data across boards or ignores `boardId`.
