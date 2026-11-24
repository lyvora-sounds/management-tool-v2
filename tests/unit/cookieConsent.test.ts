import { describe, expect, it } from "vitest";
import { LEGAL_CONFIG, getLegalTemplateVars } from "@/lib/legalConfig";
import {
  COOKIE_CONSENT_STORAGE_KEY,
  LEGACY_COOKIE_CONSENT_KEY,
  LEGAL_DOC_VERSIONS,
  OPTIONAL_COOKIE_NAMES,
  OPTIONAL_LOCAL_STORAGE_KEYS,
  PENDING_SIGNUP_CONSENT_KEY,
  buildConsentPreferences,
  buildPendingSignUpConsent,
  clearOptionalFunctionalStorage,
  clearPendingSignUpConsent,
  isFunctionalStorageAllowed,
  isGlobalPrivacyControlEnabled,
  isSignUpSubRoute,
  readCookieConsent,
  readPendingSignUpConsent,
  savePendingSignUpConsent,
  validateSignUpConsents,
  writeCookieConsent,
  type StorageLike,
} from "@/lib/cookieConsent";

function createMemoryStorage(initial: Record<string, string> = {}): StorageLike {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

describe("cookieConsent helpers", () => {
  it("detects Global Privacy Control signal safely", () => {
    expect(isGlobalPrivacyControlEnabled({ globalPrivacyControl: true })).toBe(true);
    expect(isGlobalPrivacyControlEnabled({ globalPrivacyControl: false })).toBe(false);
    expect(isGlobalPrivacyControlEnabled({})).toBe(false);
    expect(isGlobalPrivacyControlEnabled(null)).toBe(false);
  });

  it("builds strict consent preferences with analytics and marketing always false", () => {
    const fixedDate = new Date("2026-11-24T12:00:00.000Z");

    const accepted = buildConsentPreferences({ mode: "accept_all" }, false, fixedDate);
    expect(accepted).toEqual({
      necessary: true,
      functional: true,
      analytics: false,
      marketing: false,
      version: LEGAL_DOC_VERSIONS.cookies,
      updatedAt: "2026-11-24T12:00:00.000Z",
      gpcApplied: false,
    });

    const rejected = buildConsentPreferences(
      { mode: "reject_non_essential" },
      true,
      fixedDate,
    );
    expect(rejected).toEqual({
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
      version: LEGAL_DOC_VERSIONS.cookies,
      updatedAt: "2026-11-24T12:00:00.000Z",
      gpcApplied: true,
    });

    const custom = buildConsentPreferences(
      { mode: "custom", functional: true },
      false,
      fixedDate,
    );
    expect(custom.necessary).toBe(true);
    expect(custom.functional).toBe(true);
    expect(custom.analytics).toBe(false);
    expect(custom.marketing).toBe(false);
  });

  it("persists v2 consent, clears legacy key, and ignores outdated or corrupt entries", () => {
    const storage = createMemoryStorage({
      [LEGACY_COOKIE_CONSENT_KEY]: "accepted",
    });

    // Legacy key alone requires fresh granular consent
    expect(readCookieConsent(storage)).toBeNull();

    const prefs = buildConsentPreferences(
      { mode: "reject_non_essential" },
      false,
      new Date("2026-11-24T12:00:00.000Z"),
    );
    writeCookieConsent(prefs, storage);

    expect(storage.getItem(LEGACY_COOKIE_CONSENT_KEY)).toBeNull();
    expect(readCookieConsent(storage)).toEqual(prefs);

    // Outdated version forces re-consent
    storage.setItem(
      COOKIE_CONSENT_STORAGE_KEY,
      JSON.stringify({ ...prefs, version: "2020-01-01" }),
    );
    expect(readCookieConsent(storage)).toBeNull();

    // Corrupt JSON does not throw
    storage.setItem(COOKIE_CONSENT_STORAGE_KEY, "{not-valid-json");
    expect(readCookieConsent(storage)).toBeNull();
  });

  it("validates separate sign-up consents without requiring optional marketing opt-in", () => {
    expect(
      validateSignUpConsents({
        termsAccepted: false,
        privacyAccepted: false,
        marketingEmailAccepted: false,
      }),
    ).toEqual({ valid: false, missingTerms: true, missingPrivacy: true });

    expect(
      validateSignUpConsents({
        termsAccepted: true,
        privacyAccepted: false,
        marketingEmailAccepted: true,
      }),
    ).toEqual({ valid: false, missingTerms: false, missingPrivacy: true });

    expect(
      validateSignUpConsents({
        termsAccepted: false,
        privacyAccepted: true,
        marketingEmailAccepted: false,
      }),
    ).toEqual({ valid: false, missingTerms: true, missingPrivacy: false });

    expect(
      validateSignUpConsents({
        termsAccepted: true,
        privacyAccepted: true,
        marketingEmailAccepted: false,
      }),
    ).toEqual({ valid: true, missingTerms: false, missingPrivacy: false });
  });

  it("captures and stores pending sign-up consent proof payload", () => {
    const storage = createMemoryStorage();
    const record = buildPendingSignUpConsent(
      {
        termsAccepted: true,
        privacyAccepted: true,
        marketingEmailAccepted: false,
      },
      {
        termsText: "I have read and accept the Terms of Service",
        privacyText: "I have read and accept the Privacy Policy",
        marketingEmailText: "I agree to receive product updates and marketing emails",
      },
      new Date("2026-11-24T15:30:00.000Z"),
    );

    savePendingSignUpConsent(record, storage);
    const saved = JSON.parse(storage.getItem(PENDING_SIGNUP_CONSENT_KEY) ?? "null");

    expect(saved).toEqual({
      terms: {
        accepted: true,
        version: LEGAL_DOC_VERSIONS.terms,
        checkboxText: "I have read and accept the Terms of Service",
      },
      privacy: {
        accepted: true,
        version: LEGAL_DOC_VERSIONS.privacy,
        checkboxText: "I have read and accept the Privacy Policy",
      },
      marketingEmail: {
        accepted: false,
        checkboxText: "I agree to receive product updates and marketing emails",
      },
      capturedAt: "2026-11-24T15:30:00.000Z",
    });
    expect(readPendingSignUpConsent(storage)).toEqual(saved);

    // Rejects outdated version or unaccepted required consents
    storage.setItem(
      PENDING_SIGNUP_CONSENT_KEY,
      JSON.stringify({
        ...saved,
        terms: { ...saved.terms, version: "2020-01-01" },
      }),
    );
    expect(readPendingSignUpConsent(storage)).toBeNull();

    storage.setItem(
      PENDING_SIGNUP_CONSENT_KEY,
      JSON.stringify({
        ...saved,
        privacy: { ...saved.privacy, accepted: false },
      }),
    );
    expect(readPendingSignUpConsent(storage)).toBeNull();

    storage.setItem(PENDING_SIGNUP_CONSENT_KEY, "{broken");
    expect(readPendingSignUpConsent(storage)).toBeNull();

    savePendingSignUpConsent(record, storage);
    clearPendingSignUpConsent(storage);
    expect(readPendingSignUpConsent(storage)).toBeNull();
  });

  it("enforces prior opt-in for functional storage and clears optional keys/cookies on rejection", () => {
    const storage = createMemoryStorage({
      recent_boards: '["b1"]',
      "kiki.hierarchy.open": "1",
    });

    // No consent yet => functional storage must NOT be allowed (EU/CH prior opt-in)
    expect(isFunctionalStorageAllowed(storage)).toBe(false);

    writeCookieConsent(
      buildConsentPreferences({ mode: "reject_non_essential" }, false),
      storage,
    );
    expect(isFunctionalStorageAllowed(storage)).toBe(false);

    const expiredCookies: string[] = [];
    clearOptionalFunctionalStorage(storage, (name) => expiredCookies.push(name));

    for (const key of OPTIONAL_LOCAL_STORAGE_KEYS) {
      expect(storage.getItem(key)).toBeNull();
    }
    expect(expiredCookies).toEqual([...OPTIONAL_COOKIE_NAMES]);
    // Strictly necessary consent record itself must remain intact
    expect(readCookieConsent(storage)?.necessary).toBe(true);

    writeCookieConsent(
      buildConsentPreferences({ mode: "accept_all" }, false),
      storage,
    );
    expect(isFunctionalStorageAllowed(storage)).toBe(true);
  });

  it("identifies Clerk sign-up callback sub-routes so OAuth/verification flows are never blocked", () => {
    expect(isSignUpSubRoute("/sign-up")).toBe(false);
    expect(isSignUpSubRoute("/sign-up/")).toBe(false);
    expect(isSignUpSubRoute("/sign-in")).toBe(false);
    expect(isSignUpSubRoute(null)).toBe(false);
    expect(isSignUpSubRoute(undefined)).toBe(false);

    expect(isSignUpSubRoute("/sign-up/sso-callback")).toBe(true);
    expect(isSignUpSubRoute("/sign-up/verify-email-address")).toBe(true);
    expect(isSignUpSubRoute("/sign-up/continue")).toBe(true);
  });

  it("provides centralized legal identity and UAE jurisdiction defaults as a single source of truth", () => {
    expect(LEGAL_CONFIG.platformName).toBe("KikiBoard");
    expect(LEGAL_CONFIG.jurisdiction).toContain("UAE");
    expect(LEGAL_DOC_VERSIONS.terms).toBe(LEGAL_CONFIG.documentVersion);
    expect(LEGAL_DOC_VERSIONS.privacy).toBe(LEGAL_CONFIG.documentVersion);
    expect(LEGAL_DOC_VERSIONS.cookies).toBe(LEGAL_CONFIG.documentVersion);

    const vars = getLegalTemplateVars();
    expect(vars).toEqual({
      platformName: LEGAL_CONFIG.platformName,
      legalEntityName: LEGAL_CONFIG.legalEntityName,
      jurisdiction: LEGAL_CONFIG.jurisdiction,
      governingLaw: LEGAL_CONFIG.governingLaw,
      registeredAddress: LEGAL_CONFIG.registeredAddress,
      websiteUrl: LEGAL_CONFIG.websiteUrl,
      contactEmail: LEGAL_CONFIG.contactEmail,
      usGoverningState: LEGAL_CONFIG.usGoverningState,
      dmcaAgent: LEGAL_CONFIG.dmcaAgent,
      dpoContact: LEGAL_CONFIG.dpoContact,
      documentVersion: LEGAL_CONFIG.documentVersion,
    });
  });
});
