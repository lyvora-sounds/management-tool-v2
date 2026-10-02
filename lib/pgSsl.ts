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
