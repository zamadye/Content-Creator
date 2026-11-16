import { cancelJob, createPostgresPool, enqueueJob, PostgresProjectRepository, bootstrapOwnerWorkspace } from "@content-studio/db";
import { createApp, type OidcSettings } from "./app.js";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const keyHex = required("SESSION_KEY_HEX");
if (!/^[a-f0-9]{64}$/i.test(keyHex)) throw new Error("SESSION_KEY_HEX must be 64 hexadecimal characters");
const issuer = process.env.OIDC_ISSUER?.trim();
const clientId = process.env.OIDC_CLIENT_ID?.trim();
const clientSecret = process.env.OIDC_CLIENT_SECRET;
const redirectUri = process.env.OIDC_REDIRECT_URI?.trim();
const production = process.env.NODE_ENV === "production";
const webUrl = process.env.PUBLIC_WEB_URL?.trim() || (production ? required("PUBLIC_WEB_URL") : "http://localhost:3000");
const parsedWebUrl = new URL(webUrl);
if (production && parsedWebUrl.protocol !== "https:") throw new Error("PUBLIC_WEB_URL must use HTTPS in production");
const partialOidc = [issuer, clientId, clientSecret, redirectUri].some(Boolean);
let oidc: OidcSettings | undefined;
if (partialOidc) {
  if (!issuer || !clientId || !clientSecret || !redirectUri) {
    throw new Error("OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET and OIDC_REDIRECT_URI must be configured together");
  }
  oidc = { issuer, clientId, clientSecret, redirectUri, webUrl };
}

const port = Number(process.env.PORT ?? 3100);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT is invalid");
const databaseUrl = required("DATABASE_URL");
const ownerSubject = required("STUDIO_OWNER_SUBJECT");
const workspaceId = required("STUDIO_WORKSPACE_ID");
if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(workspaceId)) {
  throw new Error("STUDIO_WORKSPACE_ID must be a UUID");
}
const workspaceName = process.env.STUDIO_WORKSPACE_NAME?.trim() || "Studio pribadi";
const pool = createPostgresPool(databaseUrl);
await bootstrapOwnerWorkspace(pool, { workspaceId, workspaceName, ownerSubject });
const projects = new PostgresProjectRepository(pool);
const app = await createApp({
  sessionKey: Buffer.from(keyHex, "hex"),
  oidc,
  production,
  allowedWebOrigin: parsedWebUrl.origin,
  projects,
  jobs: {
    enqueue: (input) => enqueueJob(pool, input),
    cancel: (input) => cancelJob(pool, input),
  },
  checkDatabase: async () => { await pool.query("SELECT 1"); },
});
await app.listen({ port, host: "0.0.0.0" });
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    await app.close();
    await pool.end();
    process.exit(0);
  });
}
