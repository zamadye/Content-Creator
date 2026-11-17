import test from "node:test";
import assert from "node:assert/strict";
import { postgresPoolConfig } from "../src/pool.js";

test("Supabase PostgreSQL URLs must require TLS", () => {
  const base = "postgresql://studio:synthetic@db.ryceszwjligderxteaus.supabase.co:5432/postgres";
  assert.throws(() => postgresPoolConfig(base), /sslmode=require/);
  assert.throws(() => postgresPoolConfig(`${base}?sslmode=disable`), /sslmode=require/);
  for (const mode of ["require", "verify-ca", "verify-full"]) {
    const config = postgresPoolConfig(`${base}?sslmode=${mode}`);
    assert.equal(config.connectionString, `${base}?sslmode=${mode}`);
    assert.equal(config.max, 5);
  }
});

test("local PostgreSQL URL remains usable without hosted TLS policy", () => {
  const config = postgresPoolConfig("postgresql://studio:synthetic@127.0.0.1:54329/studio?schema=public");
  assert.equal(config.connectionTimeoutMillis, 5_000);
  assert.equal(config.idleTimeoutMillis, 30_000);
  assert.throws(() => postgresPoolConfig("https://db.example.test/path"), /PostgreSQL/);
});
