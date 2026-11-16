import { createHash, randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { StoredObject } from "./index.js";

const SAFE_MIME = new Set([
  "audio/wav", "audio/x-wav", "audio/mpeg", "audio/mp4",
  "image/png", "image/jpeg", "image/webp",
]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HASH_KEY = /^([0-9a-f-]{36})\/([a-f0-9]{2})\/([a-f0-9]{64})$/i;
const INTENT_KEY = /^([0-9a-f-]{36})\/uploads\/([0-9a-f-]{36})$/i;

export type S3PrivateStorageConfig = {
  bucket: string;
  region: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  maxBytes: number;
};

export type UploadIntent = { intentId: string; uploadUrl: string; mime: string; maxBytes: number; expiresInSeconds: number };
export type CompleteUpload = StoredObject & { intentId: string };

function assertWorkspace(value: string): string {
  if (!UUID.test(value)) throw new TypeError("workspaceId must be a UUID");
  return value.toLowerCase();
}

async function* chunks(body: unknown): AsyncGenerator<Buffer> {
  if (!body || !(Symbol.asyncIterator in Object(body))) throw new TypeError("Object storage returned no readable body");
  for await (const chunk of body as AsyncIterable<Uint8Array | string>) {
    yield Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
  }
}

/** Generic S3-compatible private bucket adapter. No ACL/public access is ever requested. */
export class S3CompatiblePrivateStorage {
  private readonly client: S3Client;
  private readonly signedUrl: typeof getSignedUrl;

  constructor(private readonly config: S3PrivateStorageConfig, dependencies: {
    client?: S3Client;
    signedUrl?: typeof getSignedUrl;
  } = {}) {
    if (!config.bucket || !config.region || !config.endpoint || !config.accessKeyId || !config.secretAccessKey) {
      throw new Error("S3 private storage configuration is incomplete");
    }
    if (!Number.isSafeInteger(config.maxBytes) || config.maxBytes <= 0) throw new RangeError("maxBytes must be positive");
    const url = new URL(config.endpoint);
    if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
      throw new Error("S3 endpoint must use HTTPS except for local development");
    }
    const clientConfig: S3ClientConfig = {
      region: config.region,
      endpoint: url.href,
      forcePathStyle: true,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    };
    this.client = dependencies.client ?? new S3Client(clientConfig);
    this.signedUrl = dependencies.signedUrl ?? getSignedUrl;
  }

  async createUploadIntent(input: { workspaceId: string; mime: string; bytes: number }): Promise<UploadIntent> {
    const workspaceId = assertWorkspace(input.workspaceId);
    if (!SAFE_MIME.has(input.mime)) throw new TypeError("Unsupported media MIME type");
    if (!Number.isSafeInteger(input.bytes) || input.bytes <= 0 || input.bytes > this.config.maxBytes) {
      throw new RangeError("Upload size is outside the configured limit");
    }
    const intentId = randomUUID();
    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: `${workspaceId}/uploads/${intentId}`,
      ContentType: input.mime,
      ContentLength: input.bytes,
    });
    const uploadUrl = await this.signedUrl(this.client, command, { expiresIn: 300 });
    return { intentId, uploadUrl, mime: input.mime, maxBytes: this.config.maxBytes, expiresInSeconds: 300 };
  }

  async completeUpload(input: { workspaceId: string; intentId: string; expectedMime: string; expectedBytes: number }): Promise<CompleteUpload> {
    const workspaceId = assertWorkspace(input.workspaceId);
    if (!UUID.test(input.intentId) || !SAFE_MIME.has(input.expectedMime)) throw new TypeError("Invalid upload intent");
    if (!Number.isSafeInteger(input.expectedBytes) || input.expectedBytes <= 0 || input.expectedBytes > this.config.maxBytes) {
      throw new RangeError("Upload size is outside the configured limit");
    }
    const intentKey = `${workspaceId}/uploads/${input.intentId}`;
    if (!INTENT_KEY.test(intentKey)) throw new TypeError("Invalid upload key");
    const head = await this.client.send(new HeadObjectCommand({ Bucket: this.config.bucket, Key: intentKey }));
    if (head.ContentLength !== input.expectedBytes || head.ContentLength > this.config.maxBytes || head.ContentType !== input.expectedMime) {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: intentKey })).catch(() => undefined);
      throw new Error("Uploaded object metadata does not match the accepted intent");
    }
    const object = await this.client.send(new GetObjectCommand({ Bucket: this.config.bucket, Key: intentKey }));
    const hash = createHash("sha256");
    let bytes = 0;
    for await (const chunk of chunks(object.Body)) {
      bytes += chunk.byteLength;
      if (bytes > this.config.maxBytes) throw new RangeError("Uploaded object exceeds configured limit");
      hash.update(chunk);
    }
    if (bytes !== input.expectedBytes) throw new Error("Uploaded object size changed during verification");
    const sha256 = hash.digest("hex");
    const storageKey = `${workspaceId}/${sha256.slice(0, 2)}/${sha256}`;
    const copySource = `${this.config.bucket}/${intentKey.split("/").map(encodeURIComponent).join("/")}`;
    await this.client.send(new CopyObjectCommand({
      Bucket: this.config.bucket,
      Key: storageKey,
      CopySource: copySource,
      ...(head.ETag ? { CopySourceIfMatch: head.ETag } : {}),
      MetadataDirective: "REPLACE",
      ContentType: input.expectedMime,
      Metadata: { sha256 },
    }));
    await this.client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: intentKey }));
    return { intentId: input.intentId, storageKey, sha256, bytes, mime: input.expectedMime };
  }

  async createDownloadUrl(input: { workspaceId: string; storageKey: string; expiresInSeconds?: number }): Promise<string> {
    const workspaceId = assertWorkspace(input.workspaceId);
    const match = HASH_KEY.exec(input.storageKey);
    if (!match || match[1]!.toLowerCase() !== workspaceId || match[2]!.toLowerCase() !== match[3]!.slice(0, 2).toLowerCase()) {
      throw new TypeError("Invalid workspace-scoped object key");
    }
    const expiresIn = input.expiresInSeconds ?? 120;
    if (!Number.isInteger(expiresIn) || expiresIn < 1 || expiresIn > 300) throw new RangeError("Download URL expiry must be 1–300 seconds");
    return this.signedUrl(this.client, new GetObjectCommand({ Bucket: this.config.bucket, Key: input.storageKey }), { expiresIn });
  }

  async get(input: { workspaceId: string; storageKey: string }): Promise<Buffer> {
    const workspaceId = assertWorkspace(input.workspaceId);
    this.assertContentKey(workspaceId, input.storageKey);
    const response = await this.client.send(new GetObjectCommand({ Bucket: this.config.bucket, Key: input.storageKey }));
    const buffers: Buffer[] = [];
    let total = 0;
    for await (const chunk of chunks(response.Body)) {
      total += chunk.byteLength;
      if (total > this.config.maxBytes) throw new RangeError("Stored object exceeds configured limit");
      buffers.push(chunk);
    }
    return Buffer.concat(buffers);
  }

  async remove(input: { workspaceId: string; storageKey: string }): Promise<void> {
    const workspaceId = assertWorkspace(input.workspaceId);
    this.assertContentKey(workspaceId, input.storageKey);
    await this.client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: input.storageKey }));
  }

  private assertContentKey(workspaceId: string, storageKey: string): void {
    const match = HASH_KEY.exec(storageKey);
    if (!match || match[1]!.toLowerCase() !== workspaceId || match[2]!.toLowerCase() !== match[3]!.slice(0, 2).toLowerCase()) {
      throw new TypeError("Invalid workspace-scoped object key");
    }
  }
}

/** Stream helper for implementations and tests without materializing an entire upload in memory. */
export function readableFromBuffer(buffer: Buffer): Readable {
  return Readable.from([buffer]);
}
