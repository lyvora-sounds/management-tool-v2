import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { isTransientDbError } from "@/lib/dbRetry";
import { allowSlowIpv4Connect, withVerifyFullSsl } from "@/lib/pgSsl";

allowSlowIpv4Connect();

/** Bump when the pool or the retry wrapper changes, so a hot reload does not keep the old client. */
const CLIENT_GENERATION = 2;

const READ_OPERATIONS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
]);

const globalForPrisma = global as unknown as {
  prisma?: ReturnType<typeof createClient>;
  pool?: Pool;
  clientGeneration?: number;
};

function createPool() {
  const pool = new Pool({
    connectionString: withVerifyFullSsl(process.env.DATABASE_URL),
    connectionTimeoutMillis: 20_000,
    idleTimeoutMillis: 10_000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 5_000,
    // Recycle before Neon’s pooler drops a long-lived socket mid-query.
    maxLifetimeSeconds: 60,
  });
  pool.on("error", (error) => {
    console.error("Postgres connection dropped:", error.message);
  });
  return pool;
}

function createClient(pool: Pool): PrismaClient {
  const adapter = new PrismaPg(pool as unknown as ConstructorParameters<typeof PrismaPg>[0]);
  // The extension retries reads. Call sites keep using PrismaClient, so a transaction still matches.
  const client = new PrismaClient({ adapter }).$extends({
    query: {
      $allModels: {
        async $allOperations({ operation, args, query }) {
          if (!READ_OPERATIONS.has(operation)) return query(args);
          try {
            return await query(args);
          } catch (error) {
            if (!isTransientDbError(error)) throw error;
            await new Promise((resolve) => setTimeout(resolve, 300));
            return query(args);
          }
        },
      },
    },
  });
  return client as unknown as PrismaClient;
}

function client() {
  if (globalForPrisma.prisma && globalForPrisma.clientGeneration === CLIENT_GENERATION) {
    return globalForPrisma.prisma;
  }
  const pool = createPool();
  const prisma = createClient(pool);
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
    globalForPrisma.pool = pool;
    globalForPrisma.clientGeneration = CLIENT_GENERATION;
  }
  return prisma;
}

const db = client();

export default db;
