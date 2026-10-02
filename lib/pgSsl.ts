import net from "node:net";

const SLOW_IPV4_ATTEMPT_MS = 10_000;

/**
 * Node's Happy Eyeballs abandons each address after 500ms. Reaching Neon over
 * IPv4 often takes longer, while IPv6 on the same network is unreachable, so
 * the socket dies with ETIMEDOUT before Postgres can answer.
 */
export function allowSlowIpv4Connect() {
  if (typeof net.setDefaultAutoSelectFamilyAttemptTimeout !== "function") return;
  const current = net.getDefaultAutoSelectFamilyAttemptTimeout?.() ?? 0;
  if (current < SLOW_IPV4_ATTEMPT_MS) {
    net.setDefaultAutoSelectFamilyAttemptTimeout(SLOW_IPV4_ATTEMPT_MS);
  }
}

/**
 * Current node-pg treats sslmode=prefer|require|verify-ca as verify-full, and
 * warns that a future release will weaken them. Spell out the strict mode so
 * the warning goes away and certificate checks stay as they are today.
 */
export function withVerifyFullSsl(connectionString: string | undefined) {
  if (!connectionString) return connectionString;
  return connectionString.replace(
    /([?&])sslmode=(?:prefer|require|verify-ca)(?=&|$)/gi,
    "$1sslmode=verify-full",
  );
}
