/**
 * Single source of truth for legal entity identity, platform name, operating
 * jurisdiction, governing law, and contact details interpolated across all
 * legal pages (/terms, /privacy, /cookies), cookie banners, and consent logs.
 *
 * Update the defaults here (or override via NEXT_PUBLIC_LEGAL_* env vars) once
 * to propagate changes across every contract and legal notice.
 */
export const LEGAL_CONFIG = {
  platformName:
    process.env.NEXT_PUBLIC_LEGAL_PLATFORM_NAME?.trim() || "KikiBoard",
  legalEntityName:
    process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME?.trim() ||
    "KikiBoard [TO CONFIRM: Legal entity form, e.g., FZCO / LLC]",
  jurisdiction:
    process.env.NEXT_PUBLIC_LEGAL_JURISDICTION?.trim() ||
    "United Arab Emirates (UAE)",
  governingLaw:
    process.env.NEXT_PUBLIC_LEGAL_GOVERNING_LAW?.trim() ||
    "United Arab Emirates (UAE) [TO CONFIRM: Emirate / Free Zone, e.g., Dubai / DIFC / ADGM]",
  registeredAddress:
    process.env.NEXT_PUBLIC_LEGAL_REGISTERED_ADDRESS?.trim() ||
    "[TO CONFIRM: Registered UAE physical address]",
  websiteUrl:
    process.env.NEXT_PUBLIC_LEGAL_WEBSITE_URL?.trim() || "kikiboard.xyz",
  contactEmail:
    process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL?.trim() ||
    "contact@kikiboard.xyz",
  usGoverningState:
    process.env.NEXT_PUBLIC_LEGAL_US_GOVERNING_STATE?.trim() ||
    "[TO CONFIRM: US State, e.g., Delaware, or UAE governing law]",
  dmcaAgent:
    process.env.NEXT_PUBLIC_LEGAL_DMCA_AGENT?.trim() ||
    "[TO CONFIRM: DMCA Agent Name, Postal Address, Email, Phone]",
  dpoContact:
    process.env.NEXT_PUBLIC_LEGAL_DPO_CONTACT?.trim() ||
    "[TO CONFIRM: DPO contact if appointed]",
  documentVersion:
    process.env.NEXT_PUBLIC_LEGAL_DOCUMENT_VERSION?.trim() || "2026-11-24",
} as const;

export type LegalTemplateVars = {
  platformName: string;
  legalEntityName: string;
  jurisdiction: string;
  governingLaw: string;
  registeredAddress: string;
  websiteUrl: string;
  contactEmail: string;
  usGoverningState: string;
  dmcaAgent: string;
  dpoContact: string;
  documentVersion: string;
};

export function getLegalTemplateVars(): LegalTemplateVars {
  return {
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
  };
}
