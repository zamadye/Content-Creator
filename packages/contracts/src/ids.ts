import { z } from "zod";

/** Opaque transport-safe identifiers; path, slug, or storage key is never an ID. */
export const OpaqueIdSchema = z.string().min(1).max(128).regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/);
export type OpaqueId = z.infer<typeof OpaqueIdSchema>;
