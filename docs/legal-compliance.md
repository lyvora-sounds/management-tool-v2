# Legal Compliance, Privacy & Audit Guide (UAE / USA / EU / Switzerland)

> **Code pointers (KI-00059).** Since the final release this repository is only the frontend: the handlers under `app/api/**` and the libraries `lib/db`, `lib/crypto`, `lib/boardAccess`, `lib/boardRoles`, `lib/externalAccess`, `lib/blobStore`, `lib/mfa`, `lib/createActivity`, `lib/ai/*` and `lib/mcp/*` named below were moved to **`kiki-api`** (`src/routes/*`, `src/lib/*`, `prisma/schema.prisma`) and no longer exist here. The claims and findings are kept as written and were **not re-verified** against the new location; check them there before relying on them.

This document is the repo-grounded legal compliance reference for KikiBoard (`kikiboard.xyz`, operated in the **United Arab Emirates (UAE)**). Every inventory row below was verified directly against `package.json`, `.env.example`, `prisma/schema.prisma`, `middleware.ts`, `app/`, `components/`, and `lib/`.

Jurisdictions covered:
- **UAE (Primary operating jurisdiction):** Federal Decree-Law No. 45 of 2021 on Personal Data Protection (UAE PDPL) & applicable UAE commercial/governing law
- **USA:** CCPA/CPRA, FTC Act, California ARL, CAN-SPAM, TCPA, DMCA (17 U.S.C. § 512)
- **EU / EEA:** GDPR, ePrivacy Directive, Consumer Rights Directive (14-day withdrawal)
- **Switzerland:** Revised Federal Act on Data Protection (nLPD / FADP)

Where jurisdictions conflict, KikiBoard applies the **stricter standard** by default (prior opt-in for non-essential cookies, unbundled unchecked-by-default consents, explicit GPC honoring, and EU/CH consumer carve-out on arbitration/liability).

### Single Source of Truth for Entity Name, Jurisdiction & Contacts
All legal pages (`/terms`, `/privacy`, `/cookies`), footer copyright notices (`HomeFooter.tsx`), cookie banners (`CookieBanner.tsx`), and sign-up consent proof text (`SignUpConsentGate.tsx`) interpolate their entity/platform name, operating jurisdiction, governing law, registered address, email, and document version from **`lib/legalConfig.ts`** (`LEGAL_CONFIG` / `getLegalTemplateVars()`), which supports single-change overrides via `NEXT_PUBLIC_LEGAL_*` environment variables (see `.env.example`) or editing the defaults once in `lib/legalConfig.ts`.

---

## 0. Repo-Grounded Inventory & `[TO CONFIRM]` Placeholders

### Verified Stack & Sub-Processors (from code)
| Category | Actual Implementation in Repo | Evidence |
|---|---|---|
| Auth & Identity | Clerk (`@clerk/nextjs`), email/password & OAuth, webhooks verified via `svix` | `package.json`, `middleware.ts`, `app/api/webhooks/clerk/route.ts` |
| Database | PostgreSQL on Neon via Prisma 7 (`@prisma/adapter-pg`, `sslmode=require`) | `.env.example`, `prisma/schema.prisma`, `lib/pgSsl.ts` |
| File Storage | Cloudflare R2 private bucket (migrated from Vercel Blob in `KI-00026`) | `lib/blobStore.ts`, `app/api/tasks/[taskId]/attachments/route.ts` |
| Transactional Email | Resend (`resend` SDK) for invitations and MFA codes | `package.json`, `lib/resend.ts` |
| Hosting | Next.js 16 (Vercel and/or standalone container / Google Cloud Run) | `next.config.ts`, `docs/architecture.md`, `kiki-infra` |
| Payments / Billing | **None** — no Stripe, Paddle, or PayPal SDK or webhook in repo (`Free forever on basic plan`) | `package.json`, `messages/en.json` |
| Analytics / Ad Trackers | **None** — zero Google Analytics, Meta Pixel, PostHog, Sentry, or ad scripts in repo | `package.json`, `app/layout.tsx` |
| Optional Integrations | Google Calendar OAuth (`UserCalendarSync`), GitHub App (`OrganizationGithubConnection`), Slack/Discord board webhooks, MCP OAuth/bearer tokens, BYOK AI (`UserSettings.aiProvider` + AES-256-GCM `aiApiKey`) | `prisma/schema.prisma`, `lib/crypto.ts`, `lib/externalAccess.ts` |
| Client Storage | Cookies: Clerk session, `github_setup_result`, `NEXT_LOCALE`, `kiki_appearance`, `sidebar_state`. `localStorage`: `cookie_consent_v2`, `recent_boards`, `kiki.hierarchy.open`. `sessionStorage`: `kiki_pending_signup_consent`. `IndexedDB`: `kikiboard-local-first` (Dexie). | `actions/locale.ts`, `components/Appearance/AppearanceProvider.tsx`, `components/ui/sidebar.tsx`, `components/CookieBanner.tsx`, `lib/cookieConsent.ts`, `lib/local-first/db.ts` |

### `[TO CONFIRM]` Items Required from Founder / Legal Counsel Before Production Publish
1. `[TO CONFIRM: Legal entity form and registered UAE physical address]` (e.g., FZCO / LLC in Dubai / DIFC / ADGM — set once via `NEXT_PUBLIC_LEGAL_ENTITY_NAME`, `NEXT_PUBLIC_LEGAL_REGISTERED_ADDRESS`, and `NEXT_PUBLIC_LEGAL_GOVERNING_LAW` or `lib/legalConfig.ts` for UAE PDPL, GDPR Art. 13, Swiss nLPD, CAN-SPAM, and Terms).
2. `[TO CONFIRM: DPO contact details, if appointed]` (currently `support@lyvorasounds.com` is used as the single privacy/support contact; override via `NEXT_PUBLIC_LEGAL_DPO_CONTACT`).
3. `[TO CONFIRM: Production hosting provider(s) and data region(s)]` (Vercel vs. Google Cloud Run / GCP region).
4. `[TO CONFIRM: US governing law state]` (if US law applies alongside UAE governing law, e.g., Delaware or California; override via `NEXT_PUBLIC_LEGAL_US_GOVERNING_STATE`).
5. `[TO CONFIRM: Designated DMCA Agent Name, Postal Address, Email, Phone]` (must also be registered with the US Copyright Office to preserve DMCA safe harbor; override via `NEXT_PUBLIC_LEGAL_DMCA_AGENT`).
6. `[TO CONFIRM: SecurityAuditLog retention period & anonymization schedule]` (e.g., anonymize `actorEmail` / `ipAddress` after X months/years, or retain under legal/ISO 27001 obligation).
7. `[TO CONFIRM: Executed DPAs with Clerk, Neon, Cloudflare, Resend, and host]` for EU/CH/UAE international transfer compliance (SCCs / DPF).
8. `[TO CONFIRM: Paid-plan pricing, refund window, pro-ration, and custom-service milestone/deposit rules]` before integrating any payment processor.

---

## 1–4 & 6. Implemented Legal Surfaces (Frontend)

- **Terms of Service (incl. Refund/Cancellation & DMCA):** `app/(routes)/(home)/terms/page.tsx` (`/terms`, public in `middleware.ts`)
- **Privacy Policy (GDPR + Swiss nLPD + US CCPA/CPRA):** `app/(routes)/(home)/privacy/page.tsx` (`/privacy`, public in `middleware.ts`)
- **Cookie & Local Storage Policy:** `app/(routes)/(home)/cookies/page.tsx` (`/cookies`, public in `middleware.ts`)
- **Cookie Consent Banner & Preferences Modal:** `components/CookieBanner.tsx` + `lib/cookieConsent.ts`
  - Unchecked-by-default non-essential toggle, Accept all / Reject non-essential / Customize.
  - Automatically detects and honors `navigator.globalPrivacyControl === true` (CCPA/CPRA GPC).
  - Re-openable from `HomeFooter.tsx` and `/cookies`.
- **Sign-Up Separate Consent Gate:** `app/(auth)/sign-up/[[...sign-up]]/SignUpConsentGate.tsx`
  - Separate required Terms of Service and Privacy Policy checkboxes + separate optional unchecked-by-default Marketing Email checkbox (no SMS checkbox because SMS marketing does not exist).
  - Persists pending consent proof payload in `sessionStorage` (`kiki_pending_signup_consent`) for backend persistence once Ticket 3 ships in `kiki-api`.
- **Refund / Cancellation Product Gap:** Flagged explicitly — the repo currently has **zero payment, subscription, or refund code**. Paid-plan terms in `/terms` document the legal framework for future paid tiers (US FTC / CA ARL auto-renewal disclosure + EU 14-day B2C withdrawal right & immediate-performance waiver).

---

## 5. Consent & Acceptance Log Design (Backend Spec for `kiki-api`)

Per `AGENTS.md`, **new HTTP API endpoints must be implemented in `kiki-api` first (`/v1/...`)**, and the Prisma schema and its migrations live only in `kiki-api`, which applies them before each deploy.

### Prisma Model (`prisma/schema.prisma`)
```prisma
/// Append-only legal consent & acceptance proof (GDPR Art. 7(1), Swiss nLPD, US CAN-SPAM/TCPA).
/// No foreign keys on purpose so proof survives user deletion. UPDATE and DELETE are rejected by DB trigger.
model LegalConsentLog {
  id              String   @id @default(cuid())
  userId          String?
  email           String?
  consentType     String   // "terms" | "privacy" | "marketing_email" | "cookies"
  granted         Boolean
  documentVersion String   // e.g. "2026-11-24"
  checkboxText    String   // exact localized string shown to the user
  source          String   // "sign_up" | "cookie_banner" | "settings"
  ipAddress       String?
  userAgent       String?
  createdAt       DateTime @default(now())

  @@index([userId, createdAt])
  @@index([email, createdAt])
  @@index([consentType, createdAt])
}
```

### PostgreSQL Immutability Trigger (matching `SecurityAuditLog`)
```sql
CREATE OR REPLACE FUNCTION prevent_legal_consent_log_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'legal_consent_logs are append-only and cannot be updated or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_legal_consent_log_immutable
BEFORE UPDATE OR DELETE ON "LegalConsentLog"
FOR EACH ROW EXECUTE FUNCTION prevent_legal_consent_log_mutation();
```

### API Contract (`kiki-api`)
- `POST /v1/legal/consents`: accepts `{ consents: Array<{ consentType, granted, documentVersion, checkboxText, source }> }`, derives `userId`/`email` from verified Clerk JWT (or nullable for anonymous cookie banner), extracts `ipAddress` & `userAgent` via `auditRequestMeta`, and inserts immutable `LegalConsentLog` rows.
- Frontend wiring: on first authenticated load after sign-up, read `sessionStorage.getItem("kiki_pending_signup_consent")`, POST to `/v1/legal/consents`, and clear `sessionStorage` on `201`.

---

## 7. Data Minimization Audit

### Forms & Models Audited
| Surface | Fields Collected | Assessment |
|---|---|---|
| Sign-Up (`Clerk <SignUp />` + `SignUpConsentGate`) | Email, password/OAuth, optional name (Clerk `showOptionalFields: false`), Terms/Privacy/optional Marketing checkboxes | **Minimized.** No phone, address, DOB, or company size requested at sign-up. |
| Organizations / Boards / Epics / Tickets | Title, description, dates, priority, custom fields, assignees | **Minimized** to core project-management functionality. |
| MFA Settings (`UserMfa`) | Optional `phone` (only if user enables SMS MFA) or `totpSecret` | **Minimized** (opt-in only). |
| AI Settings (`UserSettings`) | `aiProvider`, encrypted `aiApiKey`, `aiModel`, `aiBaseUrl`, `voiceLanguage` | **Minimized** (opt-in BYOK, AES-256-GCM encrypted at rest). |
| Integrations (`UserCalendarSync`, `OrganizationGithubConnection`, `Board`) | Encrypted OAuth tokens, GitHub installation metadata, Slack/Discord webhook URL | **Minimized** (opt-in per user/org/board). |
| Public Contact / Newsletter / Checkout Forms | **None exist in repo** | N/A — zero unnecessary public forms. |

### Hard Security & Data Minimization Rule
**NEVER** ask for passwords, API keys, secrets, government ID documents, payment card numbers, or confidential company/NDA data in any public or unauthenticated form. Sensitive credentials (such as BYOK AI API keys or OAuth tokens) must ONLY be collected inside authenticated settings flows over HTTPS and encrypted immediately at rest (`lib/crypto.ts`).

---

## 8. Image, Content & IP Rights Checklist

### Codebase Audit of Uploads & Assets
- **User uploads:** Ticket attachments (`app/api/tasks/[taskId]/attachments/route.ts`) stored in private **Cloudflare R2** (`lib/blobStore.ts`) and served only through authenticated board-access checks.
- **Public marketing assets:** Icons (`lucide-react`, `@hugeicons`), custom `KikiLogo`, and `public/*.svg` / `public/glass/*`. **No third-party stock photos, client logos, or customer testimonials** currently exist in `app/(routes)/(home)/`.
- **AI-generated content:** Generated on-demand via user-supplied BYOK AI keys (`app/api/ai/*`, `lib/ai/*`) for ticket parsing/improvement/triage; user owns their inputs and outputs subject to their chosen AI provider's terms.

### Pre-Publish Rights Verification Checklist
- [ ] **Stock media:** Verify commercial license, attribution requirements, and model/property releases before adding any stock photography.
- [ ] **AI-generated marketing assets:** Confirm commercial rights under the generator's terms; note that purely AI-generated works may have limited copyright protection in the US and EU.
- [ ] **User-uploaded content:** Ownership stays with the user; limited hosting license is granted in `/terms` Section 5.
- [ ] **Client logos & portfolio/case studies (EU/CH & US):** Never display a customer's trademark/logo without written permission. For screenshots of boards/tickets in marketing or case studies, **redact or anonymize all personal data** (names, emails, avatars) under GDPR/nLPD unless explicit written consent is obtained.
- [ ] **DMCA Takedown (USA):** Register a Designated Agent with the US Copyright Office, replace the `[TO CONFIRM]` placeholder in `/terms` Section 12, and maintain a repeat-infringer policy.

### Portfolio & Logo Permission Template
> **Subject:** Permission to feature [Company Name] in Kikiboard's portfolio
>
> Hi [Name],
>
> We've loved seeing how [Company Name] uses Kikiboard. Would you grant us written permission to feature [Company Name]'s name and official logo (and, if approved, a brief anonymized quote/case study) on kikiboard.xyz and in our marketing materials?
>
> - We will follow your brand guidelines and will not include any confidential project details or personal data of your team members in screenshots.
> - You may revoke this permission at any time by emailing support@lyvorasounds.com, and we will remove it within 10 business days.
>
> Please reply "Approved" if you are authorized to grant this permission on behalf of [Company Name].

---

## 9. Final Audit: Code vs. Legal Docs

### Compliant (Verified in Code)
- [x] Zero third-party analytics, ad pixels, or cross-site trackers (`package.json`, `app/layout.tsx`).
- [x] Accurate sub-processor disclosure matching code: Clerk, Neon, Cloudflare R2, Resend, optional Google Calendar / GitHub / Slack / Discord / BYOK AI / MCP.
- [x] Fixed `contact@kikiboard.xyz` vs `contacto@kikiboard.xyz` inconsistency in `/privacy`.
- [x] Fixed stale `Vercel Blob` claim in `/privacy` (now discloses Cloudflare R2).
- [x] Disclosed `SecurityAuditLog` and `TaskStateTransition` immutability in `/privacy` Section 6.
- [x] Cookie banner (`CookieBanner.tsx`) offers Accept all / Reject non-essential / Customize, zero pre-ticked boxes, honors Global Privacy Control (GPC), and clears/suppresses optional functional storage (`kiki_appearance`, `sidebar_state`, `recent_boards`, `kiki.hierarchy.open`) when `functional === false`.
- [x] Sign-up (`SignUpConsentGate.tsx`) enforces separate, unbundled, unchecked-by-default Terms, Privacy, and optional Marketing Email checkboxes while passing Clerk OAuth/verification sub-routes (`/sign-up/sso-callback`, `/sign-up/verify-email-address`, etc.) straight through.
- [x] Security controls verified in code: AES-256-GCM encryption (`lib/crypto.ts`), SHA-256 MCP token hashing (`lib/externalAccess.ts`), Svix webhook verification (`app/api/webhooks/clerk/route.ts`), RBAC (`lib/boardAccess.ts`), private R2 storage (`lib/blobStore.ts`).

### In Docs but NOT Yet in Code (Must Implement)
- [ ] **Server-side `LegalConsentLog` persistence (`Ticket 3`):** `SignUpConsentGate` captures proof in `sessionStorage`, but `POST /v1/legal/consents` and the `LegalConsentLog` Prisma model/trigger must be built in `kiki-api` first per `AGENTS.md`.
- [ ] **Local-first IndexedDB & `NEXT_LOCALE` server-cookie consent gating (`Ticket 2 follow-up`):** Client-side optional writers (`AppearanceProvider.tsx`, `sidebar.tsx`, `BoardVisitTracker.tsx`, `TaskHierarchy.tsx`) now check `isFunctionalStorageAllowed()`, while `lib/local-first/db.ts` (when local-first is enabled) and `actions/locale.ts` (user-explicit language switch) should be reviewed if strict server-side gating is desired.
- [ ] **Payment / Subscription / Refund flows (`Ticket 4`):** Documented as "future paid plans" in `/terms`; no Stripe/billing/refund code exists yet.
- [ ] **Self-serve DSAR data export & `SecurityAuditLog` anonymization job (`Ticket 4`):** Account deletion deletes `User` via Clerk webhook, but `SecurityAuditLog.actorEmail` and `ipAddress` persist indefinitely.
- [ ] **Security headers & app-level rate limiting:** `next.config.ts` / `middleware.ts` do not yet set CSP/HSTS/X-Frame-Options headers or app-level rate limits on `/share/task/[token]` and `/api/mcp` (tracked in `docs/production-security-checklist.md` SEC-20 / SEC-23).

### In Code but Previously NOT in Docs (Now Disclosed)
- [x] Cloudflare R2 (`lib/blobStore.ts`), Resend (`lib/resend.ts`), `SecurityAuditLog` IP/UA/email immutability, `UserMfa.phone`, `NEXT_LOCALE`, `kiki_appearance`, `sidebar_state`, `github_setup_result`, `recent_boards`, `kiki.hierarchy.open`, and `IndexedDB` (`kikiboard-local-first`).

### Urgent Fixes Before Public Launch
1. Fill all 8 `[TO CONFIRM]` placeholders in `messages/{en,es,tl}.json` and register the DMCA Designated Agent.
2. Ship **Ticket 3** (`LegalConsentLog` + `POST /v1/legal/consents` in `kiki-api`, then wire frontend) so EU/CH/US consent proof is persisted server-side.
3. Review remaining optional storage (`lib/local-first/db.ts` IndexedDB when local-first is enabled) to ensure full alignment with `isFunctionalStorageAllowed()`.
4. Add HTTP security headers (CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`) and rate limiting on public routes (`/share/task/[token]`, `/api/mcp`).

### US vs. EU/Switzerland Stricter-Rule Matrix
| Topic | USA | EU / Switzerland | Kikiboard Standard Applied |
|---|---|---|---|
| Cookie consent | Opt-out / GPC (CCPA/CPRA) | Prior opt-in, no pre-ticked boxes (ePrivacy/GDPR/nLPD) | **Stricter:** Prior opt-in banner (Accept / Reject / Customize) + automatic GPC honoring |
| Sign-up consents | Separate marketing consent (CAN-SPAM); written consent for SMS (TCPA) | Unbundled Terms/Privacy/Marketing, unchecked by default (GDPR Art. 7) | **Stricter:** Separate unchecked boxes for Terms, Privacy, and optional Marketing Email |
| Arbitration & liability caps | Generally enforceable (FAA) | Invalid / restricted for consumers | **Dual:** US arbitration/class-waiver clause + explicit EU/CH consumer carve-out |
| Digital service refunds | FTC clear disclosure + CA ARL | 14-day B2C withdrawal unless immediate-start waiver | **Dual:** Current free plan disclosed + both US ARL and EU 14-day B2C rules for future paid plans |
