# Preliminary license and service inventory — P0-05

Status: **PARTIAL; not legal advice**. Checked 2026-11-01 UTC using repository manifests, npm metadata, and GitHub refs. Exact source licenses/transitive dependencies and service terms remain to be reviewed before adoption.

| Item | Evidence | Current status / action |
|---|---|---|
| OpenFilm `0.3.2` | npm metadata: MIT; upstream `openfilm/openfilm`. | Existing baseline only. Resolve/pin exact dependency tree and review bundled assets before use in new product. |
| HyperFrames `0.9.52` | npm metadata: Apache-2.0; upstream main at `e426ce4eb44517db3f65105f1e05cb7b762cd950`. | Candidate only. Verify exact package license files, transitive/runtime licenses and Pro boundary at selected release. |
| Remotion `4.0.380` | Existing legacy package manifest; npm metadata points to `LICENSE.md` rather than SPDX. Upstream main at `b0c3781e6acc736aeaf2102511068094032ea061`. | Existing legacy declaration is not license clearance. Read exact license and current pricing/eligibility before selection. |
| FFmpeg | Not installed on host. | Build configuration determines GPL/LGPL/codec obligations; inspect exact binary/build license before distribution. |
| Chrome/Chromium | Not installed on PATH. | Browser distribution/version and sandbox terms not reviewed. |
| Next.js, Fastify, Zod, Prisma, BullMQ, PostgreSQL, Redis, AWS SDK | Listed as design candidates only. | Not installed/selected. Inventory exact versions and licenses after package/runtime spike. |
| Provider/model/ASR/image services | No credentials or provider configured for Content Studio. | No live provider tested. Record provider, model, terms, privacy, retention, cost, and provenance before enabling. |
| Fonts/media/music | No new Content Studio media included. | Per-asset and per-font rights still required; no assumption of reuse permission. |

## Guardrails

- Keep media, transcripts, VO, keys, signed URLs, private receipts and generated outputs out of public Git.
- A package's top-level license does not cover its dependencies, optional commercial features, models, fonts or generated assets.
- Store exact versions, upstream URL, commit/tag, license-file hash, required/optional flag, attribution and rollback in the final inventory.
- Do not finalize renderer/auth/storage ADRs on this preliminary inventory alone.
