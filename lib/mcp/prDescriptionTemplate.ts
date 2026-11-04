/** ISO change-management PR body agents must use when opening a pull request for a Kikiboard ticket. */
export const ISO_PR_DESCRIPTION_SECTIONS = [
  "Summary",
  "Context / Problem",
  "Proposed Change",
  "Acceptance Criteria",
  "Security / Privacy Impact",
  "Test Plan",
  "Out of Scope",
] as const;

export const ISO_PR_DESCRIPTION_TEMPLATE = `## Summary
<!-- One sentence: what this PR delivers and why. -->

## Context / Problem
<!-- Current behavior and why it matters. Link the Kikiboard ticket. -->

## Proposed Change
<!-- What changed in code; call out notable files or APIs. -->

## Acceptance Criteria
- [ ] <!-- Testable criterion from the ticket -->

## Security / Privacy Impact
<!-- Access, authz, data exposure, secrets, logging. Say "None identified" only after review. -->

## Test Plan
- [ ] <!-- How this was verified -->

## Out of Scope
- <!-- Explicit non-goals -->
`;

export const ISO_PR_DESCRIPTION_INSTRUCTION = [
  "When the ticket is solved and you open a pull request, the PR body MUST follow the ISO change-management template with every section filled:",
  ISO_PR_DESCRIPTION_SECTIONS.join("; ") + ".",
  "If any section cannot be filled from context, ask the user before opening the PR.",
  "Include the Kikiboard ticket URL in Context / Problem.",
  "Do not open a PR with an empty or unstructured description.",
].join(" ");
