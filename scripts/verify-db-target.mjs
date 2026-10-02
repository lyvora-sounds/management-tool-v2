import "dotenv/config";
import pg from "pg";

const { Client } = pg;
const expected = process.env.EXPECTED_NEON_BRANCH_ID;
const connectionString = (process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL)?.replace(
  /([?&])sslmode=(?:prefer|require|verify-ca)(?=&|$)/gi,
  "$1sslmode=verify-full",
);

if (!connectionString) {
  console.error("Database URL is missing from the selected environment file.");
  process.exit(1);
}

const client = new Client({ connectionString });
try {
  await client.connect();
  const result = await client.query(
    "select current_database() as database, current_setting('neon.branch_id', true) as branch_id",
  );
  const target = result.rows[0];
  console.log(`Database: ${target.database}`);
  console.log(`Neon branch: ${target.branch_id ?? "not reported"}`);

  if (process.argv.includes("--write")) {
    if (!expected) {
      console.error("EXPECTED_NEON_BRANCH_ID is required for database writes.");
      process.exitCode = 2;
    } else if (target.branch_id !== expected) {
      console.error("Refusing database write: EXPECTED_NEON_BRANCH_ID does not match the connected branch.");
      process.exitCode = 3;
    }
  }
} finally {
  await client.end();
}
