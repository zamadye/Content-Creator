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
const webUrl = process.env.PUBLIC_WEB_URL?.trim() ?? "http://localhost:3000";
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
const app = await createApp({ sessionKey: Buffer.from(keyHex, "hex"), oidc, production: process.env.NODE_ENV === "production" });
await app.listen({ port, host: "0.0.0.0" });
