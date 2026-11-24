import { LEGAL_CONFIG } from "./legalConfig";

export const LEGAL_DOC_VERSIONS = {
  terms: LEGAL_CONFIG.documentVersion,
  privacy: LEGAL_CONFIG.documentVersion,
  cookies: LEGAL_CONFIG.documentVersion,
} as const;

export const COOKIE_CONSENT_STORAGE_KEY = "cookie_consent_v2";
export const LEGACY_COOKIE_CONSENT_KEY = "cookie_consent";
export const PENDING_SIGNUP_CONSENT_KEY = "kiki_pending_signup_consent";
export const COOKIE_PREFERENCES_EVENT = "kiki:open-cookie-preferences";

export const OPTIONAL_LOCAL_STORAGE_KEYS = [
  "recent_boards",
  "kiki.hierarchy.open",
] as const;

export const OPTIONAL_COOKIE_NAMES = [
  "kiki_appearance",
  "sidebar_state",
] as const;

export interface CookieConsentPreferences {
  necessary: true;
  functional: boolean;
  analytics: false;
  marketing: false;
  version: string;
  updatedAt: string;
  gpcApplied: boolean;
}

export type CookieConsentChoice =
  | { mode: "accept_all" }
  | { mode: "reject_non_essential" }
  | { mode: "custom"; functional: boolean };

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface NavigatorWithGpc {
  globalPrivacyControl?: boolean;
}

export function isGlobalPrivacyControlEnabled(
  nav?: NavigatorWithGpc | null,
): boolean {
  const target =
    nav !== undefined
      ? nav
      : typeof navigator !== "undefined"
        ? (navigator as NavigatorWithGpc)
        : null;
  return target?.globalPrivacyControl === true;
}

export function buildConsentPreferences(
  choice: CookieConsentChoice,
  gpcApplied: boolean,
  now: Date = new Date(),
): CookieConsentPreferences {
  const functional =
    choice.mode === "accept_all"
      ? true
      : choice.mode === "reject_non_essential"
        ? false
        : Boolean(choice.functional);

  return {
    necessary: true,
    functional,
    analytics: false,
    marketing: false,
    version: LEGAL_DOC_VERSIONS.cookies,
    updatedAt: now.toISOString(),
    gpcApplied,
  };
}

export function readCookieConsent(
  storage?: StorageLike | null,
): CookieConsentPreferences | null {
  const store =
    storage !== undefined
      ? storage
      : typeof window !== "undefined"
        ? window.localStorage
        : null;
  if (!store) return null;

  try {
    const raw = store.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CookieConsentPreferences>;
      if (
        parsed &&
        parsed.necessary === true &&
        typeof parsed.functional === "boolean" &&
        parsed.version === LEGAL_DOC_VERSIONS.cookies &&
        typeof parsed.updatedAt === "string"
      ) {
        return {
          necessary: true,
          functional: parsed.functional,
          analytics: false,
          marketing: false,
          version: parsed.version,
          updatedAt: parsed.updatedAt,
          gpcApplied: Boolean(parsed.gpcApplied),
        };
      }
      return null;
    }

    // Legacy "accepted" value predates granular consent; treat as needing fresh consent
    // so EU/CH users get explicit Accept / Reject / Customize choices.
    return null;
  } catch {
    return null;
  }
}

export function writeCookieConsent(
  prefs: CookieConsentPreferences,
  storage?: StorageLike | null,
): void {
  const store =
    storage !== undefined
      ? storage
      : typeof window !== "undefined"
        ? window.localStorage
        : null;
  if (!store) return;

  try {
    store.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(prefs));
    store.removeItem(LEGACY_COOKIE_CONSENT_KEY);
  } catch {
    // Storage unavailable (private mode / quota exceeded)
  }
}

export function openCookiePreferences(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(COOKIE_PREFERENCES_EVENT));
}

export function isFunctionalStorageAllowed(
  storage?: StorageLike | null,
): boolean {
  return readCookieConsent(storage)?.functional === true;
}

export function clearOptionalFunctionalStorage(
  storage?: StorageLike | null,
  expireCookie?: (name: string) => void,
): void {
  const store =
    storage !== undefined
      ? storage
      : typeof window !== "undefined"
        ? window.localStorage
        : null;

  if (store) {
    for (const key of OPTIONAL_LOCAL_STORAGE_KEYS) {
      try {
        store.removeItem(key);
      } catch {
        // Ignore storage errors
      }
    }
  }

  const clearCookie =
    expireCookie ??
    (typeof document !== "undefined"
      ? (name: string) => {
          document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
        }
      : null);

  if (clearCookie) {
    for (const name of OPTIONAL_COOKIE_NAMES) {
      try {
        clearCookie(name);
      } catch {
        // Ignore cookie errors
      }
    }
  }
}

export const CLERK_SIGN_UP_CALLBACK_SEGMENTS = [
  "sso-callback",
  "verify-email-address",
  "verify-phone-number",
  "continue",
  "tasks",
] as const;

export function isSignUpSubRoute(pathname: string | null | undefined): boolean {
  if (!pathname || !pathname.startsWith("/sign-up/")) return false;
  const subPath = pathname.slice("/sign-up/".length).split("/")[0];
  return (CLERK_SIGN_UP_CALLBACK_SEGMENTS as readonly string[]).includes(subPath);
}

export interface SignUpConsentState {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  marketingEmailAccepted: boolean;
}

export interface SignUpConsentValidation {
  valid: boolean;
  missingTerms: boolean;
  missingPrivacy: boolean;
}

export function validateSignUpConsents(
  state: SignUpConsentState,
): SignUpConsentValidation {
  const missingTerms = !state.termsAccepted;
  const missingPrivacy = !state.privacyAccepted;
  return {
    valid: !missingTerms && !missingPrivacy,
    missingTerms,
    missingPrivacy,
  };
}

export interface PendingSignUpConsentRecord {
  terms: {
    accepted: boolean;
    version: string;
    checkboxText: string;
  };
  privacy: {
    accepted: boolean;
    version: string;
    checkboxText: string;
  };
  marketingEmail: {
    accepted: boolean;
    checkboxText: string;
  };
  capturedAt: string;
}

export function buildPendingSignUpConsent(
  state: SignUpConsentState,
  texts: {
    termsText: string;
    privacyText: string;
    marketingEmailText: string;
  },
  now: Date = new Date(),
): PendingSignUpConsentRecord {
  return {
    terms: {
      accepted: state.termsAccepted,
      version: LEGAL_DOC_VERSIONS.terms,
      checkboxText: texts.termsText,
    },
    privacy: {
      accepted: state.privacyAccepted,
      version: LEGAL_DOC_VERSIONS.privacy,
      checkboxText: texts.privacyText,
    },
    marketingEmail: {
      accepted: state.marketingEmailAccepted,
      checkboxText: texts.marketingEmailText,
    },
    capturedAt: now.toISOString(),
  };
}

export function savePendingSignUpConsent(
  record: PendingSignUpConsentRecord,
  storage?: StorageLike | null,
): void {
  const store =
    storage !== undefined
      ? storage
      : typeof window !== "undefined"
        ? window.sessionStorage
        : null;
  if (!store) return;

  try {
    store.setItem(PENDING_SIGNUP_CONSENT_KEY, JSON.stringify(record));
  } catch {
    // Session storage unavailable
  }
}

export function readPendingSignUpConsent(
  storage?: StorageLike | null,
): PendingSignUpConsentRecord | null {
  const store =
    storage !== undefined
      ? storage
      : typeof window !== "undefined"
        ? window.sessionStorage
        : null;
  if (!store) return null;

  try {
    const raw = store.getItem(PENDING_SIGNUP_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingSignUpConsentRecord>;
    if (
      parsed &&
      parsed.terms?.accepted === true &&
      parsed.terms?.version === LEGAL_DOC_VERSIONS.terms &&
      typeof parsed.terms?.checkboxText === "string" &&
      parsed.privacy?.accepted === true &&
      parsed.privacy?.version === LEGAL_DOC_VERSIONS.privacy &&
      typeof parsed.privacy?.checkboxText === "string" &&
      typeof parsed.marketingEmail?.accepted === "boolean" &&
      typeof parsed.marketingEmail?.checkboxText === "string" &&
      typeof parsed.capturedAt === "string"
    ) {
      return parsed as PendingSignUpConsentRecord;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearPendingSignUpConsent(
  storage?: StorageLike | null,
): void {
  const store =
    storage !== undefined
      ? storage
      : typeof window !== "undefined"
        ? window.sessionStorage
        : null;
  if (!store) return;

  try {
    store.removeItem(PENDING_SIGNUP_CONSENT_KEY);
  } catch {
    // Session storage unavailable
  }
}
