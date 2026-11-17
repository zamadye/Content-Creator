import { Pool, type PoolConfig } from "pg";

const SUPABASE_DATABASE_HOST = /(?:^|\.)(?:supabase\.co|pooler\.supabase\.com)$/i;

/** Validate database URL transport requirements before constructing a connection pool. */
export function postgresPoolConfig(connectionString: string): PoolConfig {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new TypeError("DATABASE_URL must be a valid PostgreSQL URL");
  }
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new TypeError("DATABASE_URL must use PostgreSQL protocol");
  }

  const isSupabaseHost = SUPABASE_DATABASE_HOST.test(url.hostname);
  const sslmode = url.searchParams.get("sslmode")?.toLowerCase();
  if (isSupabaseHost && sslmode !== "require" && sslmode !== "verify-ca" && sslmode !== "verify-full") {
    throw new TypeError("Supabase DATABASE_URL must use sslmode=require (or stronger)");
  }
  if (isSupabaseHost) {
    // Pass TLS explicitly to node-postgres instead of relying on a connection-string
    // parser to honor sslmode. Remove sslmode so it cannot override this TLS config.
    url.searchParams.delete("sslmode");
    return {
      connectionString: url.toString(),
      ssl: { rejectUnauthorized: true },
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    };
  }
  return { connectionString, max: 5, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 5_000 };
}

export function createPostgresPool(connectionString: string): Pool {
  return new Pool(postgresPoolConfig(connectionString));
}
