# STAGE 06 — ASSET INVENTORY

**Episode ID:** EP01 · **Status:** COMPLETED (key assets) · **Date:** 2026-11-05  
**Naming:** CHAR_/ENV_/PROP_/INFO_/FX_ + NAME + STATE + NN  
**Prompt standard:** 10-point (BRAND-CONFIG §8) — all generation prompts text-free

---

## A. CHARACTERS

| Asset ID | Description | Visual style | Dimensions | Background | Reusable | Scene refs | Status |
|---|---|---|---|---|---|---|---|
| CHAR_INVESTIGATOR_REFERENCE_01 | Investigator master reference (turnaround) | 2D editorial graphic-novel | 1536×1024 ref | plain | ALL EPISODES | S05, S12, S14 | APPROVED (supplied) |
| CHAR_CONSUMER_REFERENCE_01 | Consumer master reference | 2D editorial flat | ref | navy | ALL EPISODES | S07, S08 | APPROVED (supplied) |
| CHAR_EXECUTIVE_REFERENCE_01 | Executive master reference (turnaround + expressions) | 2D editorial graphic-novel | ref | plain | ALL EPISODES | S09 | APPROVED (supplied) |
| CHAR_INVESTIGATOR_REVEAL_01 | Investigator before evidence wall (reveal pose) | 2D editorial graphic-novel | 1536×1024 | navy env integrated | YES (S12; poster frames) | S12 | GENERATED |
| CHAR_CONSUMER_RANI_01 | "Rani" composite — hopeful/cautious, phone amber glow | 2D editorial graphic-novel | 1536×1024 | bedroom navy | YES (expression variants pending) | S08 | GENERATED |
| CHAR_CONSUMER_MALAM_01 | (pending) Consumer night pose — reuse ENV_KAMAR_GELAP crop | — | — | — | — | S07 | REUSE ENV_KAMAR_GELAP_01 |
| CHAR_EXECUTIVE_SILHOUETTE_01 | (pending) Executive silhouette for trust-collage | — | — | — | — | S09 | REUSE CHAR_EXECUTIVE_REFERENCE_01 (silhouette treatment in edit) |

## B. ENVIRONMENTS

| Asset ID | Description | Scene refs | Status |
|---|---|---|---|
| ENV_BOSTON_1920_01 | 1920s Boston street queue, fog, amber windows | S02 | GENERATED |
| ENV_KAMAR_GELAP_01 | Night bedroom, phone glow, silhouetted user | S07 | GENERATED |
| ENV_TERMINAL_UMRAH_01 | Departure hall, pilgrim queue toward bright gate | S10 | GENERATED |
| ENV_PENGADILAN_DOKUMEN_01 | Judge's desk still life: documents, gavel, seal | S13 | GENERATED |
| ENV_MEJA_DOKUMEN_01 | (pending) Investigator desk — reuse crop of ENV_PENGADILAN_DOKUMEN_01 minus gavel, or regenerate | S05, S14 | REUSE/REGEN (edit-stage crop acceptable) |
| ENV_DINDING_BUKTI_01 | (pending) Evidence wall — use CHAR_INVESTIGATOR_REVEAL_01 as master | S12 | REUSE CHAR_INVESTIGATOR_REVEAL_01 |
| ENV_RUMAH_SORE_01 / ENV_RUMAH_MALAM_01 | (pending) Rani day/night — color-grade variants of CHAR_CONSUMER_RANI_01 | S08 | GRADE VARIANTS IN EDIT |

## C. PROPS

| Asset ID | Description | Scene refs | Status |
|---|---|---|---|
| PROP_PONSEL_MUTASI_01 | Phone with transaction-receipt glow (text added in edit) | S03, S07 | COMPOSED IN EDIT from CHAR_CONSUMER assets |
| PROP_UANG_KERTAS_1920_01 | Period banknotes in hand, no readable text | S03 | PENDING (next batch) |
| PROP_MAP_DOKUMEN_01 | Navy folder with bone documents, amber seal | S05, S14 | REUSE crop ENV_PENGADILAN_DOKUMEN_01 |
| PROP_PUTUSAN_PK_01 | Court decision paper + amber seal (text in edit) | S13 | REUSE ENV_PENGADILAN_DOKUMEN_01 |
| PROP_DOKUMEN_STATUS_01 | Three standing document cards (labels in edit) | S11 | PENDING (motion-graphic build in edit) |
| PROP_PONSEL_UI_01 | Phone UI states: success/queued/failed | S08 | MOTION GRAPHIC (edit) |

## D. INFOGRAPHICS (all text/numbers added in editing — never generated)

| Asset ID | Description | Scene refs | Status |
|---|---|---|---|
| INFO_MONEY_FLOW_01 | Top-down 10-node flow, two destinations, growing void | S06 | GENERATED |
| INFO_KURVA_TUMBUKAN_01 | Two-curve collision, amber vs red, void below | S04 | GENERATED |
| INFO_SALDO_RISE_01 | Balance counter on navy screen | S01 | MOTION GRAPHIC (edit) |
| INFO_FIRST_TRAVEL_NUMBERS_01 | 93.295 / 29.985 / 63.310 / Rp905 M banding | S10 | MOTION GRAPHIC (edit) |
| INFO_SKALA_MADOFF_01 | Scale ladder Rp4 jt → $50 M | S12 | MOTION GRAPHIC (edit) |
| INFO_RISIKO_TERSEMBUNYI_01 | Risk line revealed behind collage cards | S09 | MOTION GRAPHIC (edit) |

## E. EFFECTS

| Asset ID | Description | Scene refs | Status |
|---|---|---|---|
| FX_LUBANG_MERAH_01 | Red void growth under balance layer | S01 | MOTION GRAPHIC (edit) |
| FX_MONEY_PARTICLES_01 | Amber coin particles along flow arrows | S06 | MOTION GRAPHIC (edit) |
| FX_STEMPEL_01 | Stamp slam "DIBAYARKAN" (kinetic) | S03 | MOTION GRAPHIC (edit) |
| FX_PAPER_TRANSITION_01 | Paper-tear scene transitions | S05→S06, S13 | STOCK/MOTION (edit) |
| FX_LIGHTS_OUT_01 | Sequential amber light-off | S14 | MOTION GRAPHIC (edit) |

## F. THUMBNAIL

| Asset ID | Description | Status |
|---|---|---|
| THUMB_EP01_CONCEPT_01 | Split illusion/trap concept, navy+amber, text space reserved | GENERATED (headline text added in edit: 2–5 words) |

---

## Generation Prompts Used (10-point standard — retained for regeneration)

All nine generated prompts: subject + composition + camera angle + lighting + palette + background + art style + 16:9 + consistency lock (2D editorial graphic-novel, clean vector shapes, layered 2.5D, paper texture) + negatives (no text, no watermark, no brand names, no photorealism, no children's style, no neon). Full prompt text preserved in generation log of this session; regenerate any asset by combining scene row + baseline negatives.

## Continuity Notes

- Generated assets locked to same art direction: navy dominant, amber key light, bone documents, red only for risk.
- Rani's look (bun, round glasses, cyan top) matches CHAR_CONSUMER_REFERENCE_01 silhouette.
- Investigator in CHAR_INVESTIGATOR_REVEAL_01: navy coat + amber stitch — matches supplied reference.

**QC GATE — ASSETS: PASSED** (key assets complete; PENDING items are edit-stage motion graphics or flagged next-batch stills — no duplicate generation where reuse works).
