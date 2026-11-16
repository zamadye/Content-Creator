import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import type { JobRecord, ProjectRepository, ProjectSummary } from "@content-studio/db";

const project: ProjectSummary = {
  id: "33333333-3333-4333-8333-333333333333",
  title: "Proyek sintetis",
  currentRevisionId: "66666666-6666-4666-8666-666666666666",
  etag: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
};
const user = { subject: "owner-sub", issuer: "https://identity.example.test" };
const key = Buffer.alloc(32, 7);
const webOrigin = "http://localhost:3000";

function fakeProjects(): ProjectRepository {
  return {
    async listProjects(subject) {
      assert.equal(subject, `${user.issuer}|${user.subject}`);
      return [project];
    },
    async createProject(subject, title) {
      assert.equal(subject, `${user.issuer}|${user.subject}`);
      return { ...project, title };
    },
  };
}

const job: JobRecord = { id: "55555555-5555-4555-8555-555555555555", projectId: project.id, operation: "system.health-check", state: "queued", stage: "queued", progress: 0, createdAt: "2026-11-01T00:00:00.000Z" };
function fakeJobs() {
  return {
    async enqueue(input: { subject: string; projectId: string; operation: string; idempotencyKey: string; payload: Record<string, unknown> }) {
      assert.equal(input.subject, `${user.issuer}|${user.subject}`);
      assert.equal(input.projectId, project.id);
      assert.equal(input.operation, "system.health-check");
      return { job, created: true };
    },
    async cancel(input: { subject: string; jobId: string }) {
      assert.equal(input.subject, `${user.issuer}|${user.subject}`);
      return input.jobId === job.id;
    },
  };
}

async function addTestIdentity(app: Awaited<ReturnType<typeof createApp>>) {
  app.addHook("preHandler", async (request) => {
    (request.session as unknown as { set(key: string, value: unknown): void }).set("user", user);
  });
}

test("session is anonymous by default and identity headers do not authenticate", async () => {
  const app = await createApp({ sessionKey: key, projects: fakeProjects() });
  try {
    const response = await app.inject({ method: "GET", url: "/auth/session", headers: { "x-user-id": "forged", "x-workspace-id": "forged" } });
    const projects = await app.inject({ method: "GET", url: "/api/projects", headers: { "x-user-id": "forged" } });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), { authenticated: false });
    assert.equal(projects.statusCode, 401);
  } finally {
    await app.close();
  }
});

test("readiness and login fail closed without configured OIDC", async () => {
  const app = await createApp({ sessionKey: key });
  try {
    const readiness = await app.inject({ method: "GET", url: "/health/ready" });
    const login = await app.inject({ method: "GET", url: "/auth/login" });
    assert.equal(readiness.statusCode, 503);
    assert.equal(readiness.json().error.code, "OIDC_NOT_CONFIGURED");
    assert.equal(login.statusCode, 503);
  } finally {
    await app.close();
  }
});

test("session key length is enforced", async () => {
  await assert.rejects(createApp({ sessionKey: Buffer.alloc(16) }), /exactly 32 bytes/);
});

test("project list and create require session identity and validate strict payloads", async () => {
  const app = await createApp({ sessionKey: key, projects: fakeProjects(), allowedWebOrigin: webOrigin });
  await addTestIdentity(app);
  try {
    const list = await app.inject({ method: "GET", url: "/api/projects" });
    assert.equal(list.statusCode, 200);
    assert.deepEqual(list.json(), { projects: [project] });

    const created = await app.inject({ method: "POST", url: "/api/projects", headers: { origin: webOrigin }, payload: { title: "  Proyek sintetis  " } });
    assert.equal(created.statusCode, 201);
    assert.equal(created.json().project.title, "Proyek sintetis");
    assert.match(created.headers.etag!, /^"[a-f0-9]{64}"$/i);

    const invalid = await app.inject({ method: "POST", url: "/api/projects", headers: { origin: webOrigin }, payload: { title: "x", workspaceId: "attacker" } });
    const csrf = await app.inject({ method: "POST", url: "/api/projects", headers: { origin: "https://attacker.example" }, payload: { title: "forged" } });
    assert.equal(invalid.statusCode, 422);
    assert.equal(invalid.json().error.code, "VALIDATION_ERROR");
    assert.equal(csrf.statusCode, 403);
    assert.equal(csrf.json().error.code, "CSRF_REJECTED");
  } finally {
    await app.close();
  }
});

test("job enqueue enforces idempotency key, operation allowlist, owner identity and CSRF", async () => {
  const app = await createApp({ sessionKey: key, jobs: fakeJobs(), allowedWebOrigin: webOrigin });
  await addTestIdentity(app);
  try {
    const headers = { origin: webOrigin, "idempotency-key": "request-0001" };
    const accepted = await app.inject({ method: "POST", url: `/api/projects/${project.id}/jobs`, headers, payload: { operation: "system.health-check", payload: {} } });
    assert.equal(accepted.statusCode, 202);
    assert.equal(accepted.json().job.id, job.id);
    const invalid = await app.inject({ method: "POST", url: `/api/projects/${project.id}/jobs`, headers, payload: { operation: "project.render" } });
    assert.equal(invalid.statusCode, 422);
    const cancelled = await app.inject({ method: "POST", url: `/api/jobs/${job.id}/cancel`, headers: { origin: webOrigin } });
    assert.equal(cancelled.statusCode, 202);
    assert.equal(cancelled.json().state, "cancelled");
  } finally {
    await app.close();
  }
});
