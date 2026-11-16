import { createHash, randomUUID } from "node:crypto";
import { mkdir, open, readFile, realpath, rename, rm, stat } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

export type StoredObject = {
  storageKey: string;
  sha256: string;
  bytes: number;
  mime: string;
};

export interface PrivateStorage {
  put(input: { workspaceId: string; bytes: Uint8Array; mime: string }): Promise<StoredObject>;
  get(input: { workspaceId: string; storageKey: string }): Promise<Buffer>;
  remove(input: { workspaceId: string; storageKey: string }): Promise<void>;
}

const SAFE_MIME = new Set([
  "audio/wav",
  "audio/x-wav",
  "audio/mpeg",
  "audio/mp4",
  "image/png",
  "image/jpeg",
  "image/webp",
]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validWorkspaceId(value: string): string {
  if (!UUID.test(value)) throw new TypeError("workspaceId must be a UUID");
  return value.toLowerCase();
}

/** Private local adapter. Keys are server-generated and always scoped to a workspace. */
export { S3CompatiblePrivateStorage } from "./s3.js";
export type { S3PrivateStorageConfig, UploadIntent, CompleteUpload } from "./s3.js";

export class LocalPrivateStorage implements PrivateStorage {
  readonly root: string;
  readonly maxBytes: number;

  constructor(root: string, maxBytes = 512 * 1024 * 1024) {
    if (!isAbsolute(root)) throw new TypeError("Storage root must be an absolute path");
    if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) throw new RangeError("maxBytes must be positive");
    this.root = resolve(root);
    this.maxBytes = maxBytes;
  }

  async put(input: { workspaceId: string; bytes: Uint8Array; mime: string }): Promise<StoredObject> {
    const workspaceId = validWorkspaceId(input.workspaceId);
    if (!SAFE_MIME.has(input.mime)) throw new TypeError("Unsupported media MIME type");
    if (!(input.bytes instanceof Uint8Array)) throw new TypeError("Expected bytes");
    if (input.bytes.byteLength > this.maxBytes) throw new RangeError("Upload exceeds configured byte limit");

    const hash = createHash("sha256").update(input.bytes).digest("hex");
    const key = `${workspaceId}/${hash.slice(0, 2)}/${hash}`;
    const target = this.resolveKey(workspaceId, key);
    const directory = resolve(target, "..");
    await mkdir(directory, { recursive: true, mode: 0o700 });
    await this.assertContained(directory);
    const temp = join(directory, `.tmp-${randomUUID()}`);
    try {
      const file = await open(temp, "wx", 0o600);
      try {
        await file.writeFile(input.bytes);
        await file.sync();
      } finally {
        await file.close();
      }
      await rename(temp, target);
    } catch (error) {
      await rm(temp, { force: true }).catch(() => undefined);
      // Content-addressed writes are idempotent; an existing object must have same hash.
      try {
        const existing = await readFile(target);
        if (createHash("sha256").update(existing).digest("hex") !== hash) throw error;
      } catch {
        throw error;
      }
    }
    return { storageKey: key, sha256: hash, bytes: input.bytes.byteLength, mime: input.mime };
  }

  async get(input: { workspaceId: string; storageKey: string }): Promise<Buffer> {
    const target = this.resolveKey(validWorkspaceId(input.workspaceId), input.storageKey);
    await this.assertContained(target);
    const metadata = await stat(target);
    if (!metadata.isFile() || metadata.size > this.maxBytes) throw new Error("Stored object is invalid");
    return readFile(target);
  }

  async remove(input: { workspaceId: string; storageKey: string }): Promise<void> {
    const target = this.resolveKey(validWorkspaceId(input.workspaceId), input.storageKey);
    await this.assertContained(dirname(target));
    await rm(target, { force: true });
  }

  private async assertContained(path: string): Promise<void> {
    const [rootReal, pathReal] = await Promise.all([realpath(this.root), realpath(path)]);
    const rel = relative(rootReal, pathReal);
    if (rel.startsWith(`..${sep}`) || rel === ".." || isAbsolute(rel)) {
      throw new TypeError("Filesystem object escaped private storage root");
    }
  }

  private resolveKey(workspaceId: string, key: string): string {
    const pieces = key.split("/");
    if (pieces.length !== 3 || pieces[0] !== workspaceId || !/^[a-f0-9]{2}$/.test(pieces[1]!) || !/^[a-f0-9]{64}$/.test(pieces[2]!)) {
      throw new TypeError("Invalid workspace-scoped storage key");
    }
    if (basename(key) !== pieces[2]) throw new TypeError("Invalid storage key");
    const target = resolve(this.root, ...pieces);
    const rel = relative(this.root, target);
    if (!rel || rel.startsWith(`..${sep}`) || rel === ".." || isAbsolute(rel)) throw new TypeError("Storage key escaped root");
    return target;
  }
}
