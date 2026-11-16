import test from "node:test";
import assert from "node:assert/strict";
import { assertWorkspaceOwnership, transitionJob } from "../src/index.js";

test("job lifecycle is explicit and terminal states cannot be reopened", () => {
  assert.equal(transitionJob("queued", "running"), "running");
  assert.equal(transitionJob("running", "succeeded"), "succeeded");
  assert.equal(transitionJob("failed", "queued"), "queued");
  assert.throws(() => transitionJob("succeeded", "queued"), /Invalid job transition/);
  assert.throws(() => transitionJob("queued", "succeeded"), /Invalid job transition/);
});

test("workspace mismatch is concealed as not found", () => {
  assertWorkspaceOwnership("ws-a", { workspaceId: "ws-a", actorId: "user-a" });
  assert.throws(
    () => assertWorkspaceOwnership("ws-b", { workspaceId: "ws-a", actorId: "user-a" }),
    /RESOURCE_NOT_FOUND/,
  );
});
