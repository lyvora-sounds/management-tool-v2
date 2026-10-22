// Fail CI if the Node.js binary is below the 21 Oct 2026 security release
// (CVE-2026-111497 and related TLS hostname fixes). Node 18 and 20 have no patch.
const minPatch = {
  22: [23, 4],
  24: [22, 1],
  26: [12, 1],
};

const [major, minor, patch] = process.versions.node.split(".").map(Number);
const floor = minPatch[major];
const patched =
  Boolean(floor) &&
  (minor > floor[0] || (minor === floor[0] && patch >= floor[1]));

if (!patched) {
  console.error(
    `Node.js ${process.versions.node} is below the 21 Oct 2026 security release. Use 22.23.4, 24.22.1, or 26.12.1.`,
  );
  process.exit(1);
}

console.log(`Node.js ${process.versions.node} includes the 21 Oct 2026 security release.`);
