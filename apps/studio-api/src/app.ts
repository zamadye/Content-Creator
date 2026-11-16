import Fastify, { type FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import secureSession from "@fastify/secure-session";
import { z } from "zod";
import { AccessDeniedError, type ProjectRepository } from "@content-studio/db";
import {
  authorizationCodeGrant,
  buildAuthorizationUrl,
  calculatePKCECodeChallenge,
  discovery,
  randomNonce,
  randomPKCECodeVerifier,
  randomState,
  type Configuration,
} from "openid-client";

export type OidcSettings = {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  webUrl: string;
};

type AuthUser = { subject: string; issuer: string; email?: string };
type SessionState = { user?: AuthUser; oidc?: { state: string; nonce: string; verifier: string } };
type SessionAccess = { get(key: string): unknown; set(key: string, value: unknown): void; delete(): void; regenerate(): void };

export type AppOptions = {
  sessionKey: Buffer;
  oidc?: OidcSettings | undefined;
  production?: boolean;
  projects?: ProjectRepository;
  checkDatabase?: () => Promise<void>;
  allowedWebOrigin?: string;
};

function errorBody(requestId: string, code: string, message: string, retryable = false) {
  return { error: { code, message, retryable, requestId } };
}

export async function createApp(options: AppOptions): Promise<FastifyInstance> {
  if (options.sessionKey.byteLength !== 32) throw new Error("SESSION_KEY_HEX must decode to exactly 32 bytes");
  if (options.production && (!options.allowedWebOrigin || new URL(options.allowedWebOrigin).protocol !== "https:")) {
    throw new Error("Production requires an HTTPS allowedWebOrigin");
  }
  const app = Fastify({ logger: false, bodyLimit: 1_048_576, genReqId: () => randomUUID() });
  await app.register(secureSession, {
    key: options.sessionKey,
    cookieName: "studio_session",
    expiry: 60 * 60 * 8,
    cookie: {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: options.production === true,
    },
  });

  let oidc: Configuration | undefined;
  if (options.oidc) {
    const issuer = new URL(options.oidc.issuer);
    if (issuer.protocol !== "https:" && options.production) throw new Error("Production OIDC issuer must use HTTPS");
    oidc = await discovery(issuer, options.oidc.clientId, options.oidc.clientSecret);
  }

  app.get("/health/live", async () => ({ status: "ok" }));
  app.get("/health/ready", async (request, reply) => {
    if (!oidc) return reply.code(503).send(errorBody(request.id, "OIDC_NOT_CONFIGURED", "Login belum dikonfigurasi."));
    if (!options.checkDatabase) return reply.code(503).send(errorBody(request.id, "DATABASE_NOT_CONFIGURED", "Database belum dikonfigurasi."));
    try {
      await options.checkDatabase();
    } catch {
      return reply.code(503).send(errorBody(request.id, "DATABASE_UNAVAILABLE", "Database belum siap.", true));
    }
    return { status: "ready", auth: "oidc", database: "ok" };
  });

  app.get("/auth/session", async (request) => {
    const user = (request.session as SessionAccess).get("user") as AuthUser | undefined;
    return user ? { authenticated: true, user: { subject: user.subject, email: user.email } } : { authenticated: false };
  });

  app.get("/auth/login", async (request, reply) => {
    if (!oidc || !options.oidc) return reply.code(503).send(errorBody(request.id, "OIDC_NOT_CONFIGURED", "Penyedia login belum dikonfigurasi."));
    const state = randomState();
    const nonce = randomNonce();
    const verifier = randomPKCECodeVerifier();
    const challenge = await calculatePKCECodeChallenge(verifier);
    (request.session as SessionAccess).set("oidc", { state, nonce, verifier });
    const target = buildAuthorizationUrl(oidc, {
      redirect_uri: options.oidc.redirectUri,
      scope: "openid profile email",
      response_type: "code",
      state,
      nonce,
      code_challenge: challenge,
      code_challenge_method: "S256",
    });
    return reply.redirect(target.href);
  });

  app.get("/auth/callback", async (request, reply) => {
    if (!oidc || !options.oidc) return reply.code(503).send(errorBody(request.id, "OIDC_NOT_CONFIGURED", "Penyedia login belum dikonfigurasi."));
    const stored = (request.session as SessionAccess).get("oidc") as SessionState["oidc"];
    if (!stored) return reply.code(400).send(errorBody(request.id, "LOGIN_STATE_MISSING", "Sesi login kedaluwarsa. Silakan mulai lagi."));
    try {
      const currentUrl = new URL(request.url, options.oidc.redirectUri);
      const tokens = await authorizationCodeGrant(oidc, currentUrl, {
        pkceCodeVerifier: stored.verifier,
        expectedState: stored.state,
        expectedNonce: stored.nonce,
      });
      const claims = tokens.claims();
      if (!claims?.sub || claims.iss !== options.oidc.issuer) {
        request.session.delete();
        return reply.code(401).send(errorBody(request.id, "INVALID_IDENTITY", "Identitas dari penyedia login tidak valid."));
      }
      (request.session as SessionAccess).regenerate();
      const user: AuthUser = {
        subject: claims.sub,
        issuer: claims.iss,
        ...(typeof claims.email === "string" ? { email: claims.email } : {}),
      };
      (request.session as SessionAccess).set("user", user);
      return reply.redirect(new URL("/", options.oidc.webUrl).href);
    } catch {
      request.session.delete();
      return reply.code(401).send(errorBody(request.id, "LOGIN_FAILED", "Login gagal atau tautan sudah kedaluwarsa."));
    }
  });

  const originAllowed = (origin: string | undefined): boolean => {
    if (!origin || !options.allowedWebOrigin) return false;
    try { return new URL(origin).origin === options.allowedWebOrigin; } catch { return false; }
  };

  app.post("/auth/logout", async (request, reply) => {
    if (!originAllowed(request.headers.origin)) return reply.code(403).send(errorBody(request.id, "CSRF_REJECTED", "Asal permintaan tidak diizinkan."));
    request.session.delete();
    return reply.code(204).send();
  });

  app.get("/api/projects", async (request, reply) => {
    const user = (request.session as SessionAccess).get("user") as AuthUser | undefined;
    if (!user) return reply.code(401).send(errorBody(request.id, "UNAUTHENTICATED", "Silakan masuk untuk melihat proyek."));
    if (!options.projects) return reply.code(503).send(errorBody(request.id, "DATABASE_NOT_CONFIGURED", "Penyimpanan proyek belum siap.", true));
    try {
      const projects = await options.projects.listProjects(`${user.issuer}|${user.subject}`);
      return reply.header("cache-control", "no-store").send({ projects });
    } catch {
      return reply.code(503).send(errorBody(request.id, "PROJECTS_UNAVAILABLE", "Daftar proyek belum dapat dimuat.", true));
    }
  });

  app.post("/api/projects", async (request, reply) => {
    if (!originAllowed(request.headers.origin)) return reply.code(403).send(errorBody(request.id, "CSRF_REJECTED", "Asal permintaan tidak diizinkan."));
    const user = (request.session as SessionAccess).get("user") as AuthUser | undefined;
    if (!user) return reply.code(401).send(errorBody(request.id, "UNAUTHENTICATED", "Silakan masuk untuk membuat proyek."));
    if (!options.projects) return reply.code(503).send(errorBody(request.id, "DATABASE_NOT_CONFIGURED", "Penyimpanan proyek belum siap.", true));
    const parsed = z.strictObject({ title: z.string().trim().min(1).max(120) }).safeParse(request.body);
    if (!parsed.success) return reply.code(422).send({
      error: { code: "VALIDATION_ERROR", message: "Periksa nama proyek.", retryable: false, requestId: request.id, fieldErrors: parsed.error.issues.map((issue) => ({ path: issue.path, message: issue.message })) },
    });
    try {
      const project = await options.projects.createProject(`${user.issuer}|${user.subject}`, parsed.data.title);
      return reply.code(201).header("cache-control", "no-store").header("etag", `\"${project.id}\"`).send({ project });
    } catch (error) {
      if (error instanceof AccessDeniedError) return reply.code(404).send(errorBody(request.id, "NOT_FOUND", "Proyek atau workspace tidak ditemukan."));
      return reply.code(503).send(errorBody(request.id, "PROJECT_CREATE_FAILED", "Proyek belum dapat disimpan.", true));
    }
  });

  app.setNotFoundHandler((request, reply) => {
    return reply.code(404).send(errorBody(request.id, "NOT_FOUND", "Rute tidak ditemukan."));
  });
  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error, requestId: request.id }, "request failed");
    return reply.code(500).send(errorBody(request.id, "INTERNAL_ERROR", "Terjadi kesalahan internal."));
  });
  return app;
}
