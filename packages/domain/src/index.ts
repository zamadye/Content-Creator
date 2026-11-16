import { z } from "zod";
import { OpaqueIdSchema } from "@content-studio/contracts";

export const JobStateSchema = z.enum([
  "queued",
  "running",
  "succeeded",
  "failed",
  "cancelled",
]);
export type JobState = z.infer<typeof JobStateSchema>;

const JOB_TRANSITIONS: Record<JobState, ReadonlySet<JobState>> = {
  queued: new Set(["running", "cancelled"]),
  running: new Set(["succeeded", "failed", "cancelled"]),
  succeeded: new Set(),
  failed: new Set(["queued"]),
  cancelled: new Set(),
};

/** Validates a state transition. Retry is explicit: failed -> queued starts a new attempt. */
export function transitionJob(current: JobState, next: JobState): JobState {
  if (!JOB_TRANSITIONS[current].has(next)) {
    throw new Error(`Invalid job transition: ${current} -> ${next}`);
  }
  return next;
}

export const WorkspaceContextSchema = z.strictObject({
  workspaceId: OpaqueIdSchema,
  actorId: OpaqueIdSchema,
});
export type WorkspaceContext = z.infer<typeof WorkspaceContextSchema>;

export const RevisionPreconditionSchema = z.strictObject({
  projectId: OpaqueIdSchema,
  baseRevisionId: OpaqueIdSchema,
  ifMatch: z.string().min(1).max(160),
});
export type RevisionPrecondition = z.infer<typeof RevisionPreconditionSchema>;

export function assertWorkspaceOwnership(resourceWorkspaceId: string, context: WorkspaceContext): void {
  if (resourceWorkspaceId !== context.workspaceId) {
    throw new Error("RESOURCE_NOT_FOUND");
  }
}
