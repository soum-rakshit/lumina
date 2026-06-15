import { PrismaClient } from '@prisma/client';

// If we are not in an edge environment, we can just use the standard pg driver, 
// but wait, if it expects the pg adapter, let's use pg.
import { Pool as PgPool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Next.js Turbopack might complain if we use a raw Postgres pool without the adapter 
// if Prisma 7 requires it.
const connectionString = process.env.DATABASE_URL;
const pool = new PgPool({ connectionString });
const adapter = new PrismaPg(pool);

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
