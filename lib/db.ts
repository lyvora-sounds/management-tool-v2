import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { allowSlowIpv4Connect, withVerifyFullSsl } from "@/lib/pgSsl";

allowSlowIpv4Connect();

const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};

const pool =
  globalForPrisma.pool ||
  new Pool({
    connectionString: withVerifyFullSsl(process.env.DATABASE_URL),
    connectionTimeoutMillis: 20_000,
  });

const adapter = new PrismaPg(
  pool as unknown as ConstructorParameters<typeof PrismaPg>[0],
);

const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
  globalForPrisma.pool = pool;
}

export default db;
