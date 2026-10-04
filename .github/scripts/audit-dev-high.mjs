import { execSync } from "node:child_process";

const KNOWN_UNPATCHED_DEV_TOOLCHAIN_GHSAS = new Set([
  "GHSA-vfj7-8cjw-p6xm",
]);

function ghsaFromAdvisoryUrl(url) {
  const segment = url.split("/").at(-1);
  return segment && segment.startsWith("GHSA-") ? segment : null;
}

function collectHighCriticalGhsas(audit) {
  const found = new Set();
  for (const vulnerability of Object.values(audit.vulnerabilities ?? {})) {
    if (vulnerability.severity !== "high" && vulnerability.severity !== "critical") {
      continue;
    }
    for (const via of vulnerability.via ?? []) {
      if (typeof via === "object" && via !== null && via.url) {
        const ghsa = ghsaFromAdvisoryUrl(via.url);
        if (ghsa) found.add(ghsa);
      }
    }
  }
  for (const [ghsa, advisory] of Object.entries(audit.advisories ?? {})) {
    if (advisory.severity === "high" || advisory.severity === "critical") {
      found.add(ghsa);
    }
  }
  return found;
}

function readFullAuditJson() {
  try {
    return execSync("npm audit --package-lock-only --audit-level=high --json", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch (error) {
    if (error.stdout) return error.stdout;
    throw error;
  }
}

const audit = JSON.parse(readFullAuditJson());
const ghsas = collectHighCriticalGhsas(audit);
const unexpected = [...ghsas].filter(
  (id) => !KNOWN_UNPATCHED_DEV_TOOLCHAIN_GHSAS.has(id),
);

if (unexpected.length > 0) {
  console.error(
    `Unexpected high/critical advisories in full dependency audit: ${unexpected.join(", ")}`,
  );
  process.exit(1);
}

const known = [...ghsas].filter((id) =>
  KNOWN_UNPATCHED_DEV_TOOLCHAIN_GHSAS.has(id),
);
if (known.length > 0) {
  console.log(
    `Known unpatched dev-toolchain advisories (allowed until upstream fix): ${known.join(", ")}`,
  );
}
