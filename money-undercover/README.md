# RUANG MARGIN — AI VIDEO PRODUCTION SYSTEM

> THE STORIES BEHIND MONEY.
> Repeatable professional documentary production system — not a one-off AI-generated video.

**Master prompt:** RUANG MARGIN — AI VIDEO PRODUCTION AGENT v1.0  
**Project initialized:** 2026-11-04  
**Overall status:** ACTIVE — EP01 + EP02 DELIVERED (Drive review)

---

## Production Project Structure

```
money-undercover/
├── README.md                      ← this file (project status + workflow)
├── brand/
│   └── BRAND-CONFIG.md            ← brand configuration (palette, style, characters, defaults)
├── templates/
│   ├── RESEARCH-LEDGER-TEMPLATE.md
│   ├── SCRIPT-TEMPLATE.md
│   ├── STORYBOARD-TEMPLATE.md
│   ├── ASSET-INVENTORY-TEMPLATE.md
│   └── QC-CHECKLIST.md
├── assets/
│   ├── characters/
│   │   ├── CHAR_INVESTIGATOR_REFERENCE_01.jpeg   ← main narrator (Investigator) reference
│   │   ├── CHAR_CONSUMER_REFERENCE_01.jpeg       ← The Consumer reference
│   │   └── CHAR_EXECUTIVE_REFERENCE_01.jpeg      ← The Executive reference
│   ├── environments/
│   ├── props/
│   ├── infographics/
│   └── effects/
└── episodes/
    ├── EP01_ponzi/
    └── EP02_emas/
        ├── 01-topic-analysis.md
        ├── 02-research-ledger.md
        ├── 03-story-outline.md
        ├── 04-script.md
        ├── 05-storyboard.md
        ├── 06-asset-inventory.md
        ├── 07-animation-shot-list.md
        ├── 08-audio-cue-sheet.md
        └── 10-publishing-package.md
```

---

## Workflow (mandatory order — never skip stages)

| Stage | Deliverable | Status |
|---|---|---|
| STAGE 01 — Topic Analysis | TOPIC ANALYSIS REPORT | APPROVED |
| STAGE 02 — Research & Fact Verification | RESEARCH DOSSIER + SOURCE LEDGER | APPROVED |
| STAGE 03 — Story Architecture | STORY OUTLINE + NARRATIVE BEATS | APPROVED |
| STAGE 04 — Scriptwriting | FINAL SCRIPT WITH FACT REFERENCES | APPROVED |
| STAGE 05 — Storyboard | COMPLETE STORYBOARD | APPROVED |
| STAGE 06 — Asset Generation | ORGANIZED ASSET INVENTORY (9 key assets generated) | COMPLETED |
| STAGE 07 — Animation Direction | ANIMATION DIRECTION SHEET + SHOT LIST | APPROVED |
| STAGE 08 — Voice & Sound Design | VOICE-OVER SCRIPT + AUDIO CUE SHEET | APPROVED — VO voice-00 recorded EP01+EP02 (14/14 each); cue-cascade mixes executed (MIX-PLAN.md) |
| STAGE 09 — Video Editing | FINAL VIDEO + PROJECT FILES (or clearly listed manual steps) | DONE — EP01 11:25 (16440 f) + EP02 10:35 (15240 f) rendered, muxed, QC passed; see episodes/*/ASSEMBLY-STATUS.md |
| STAGE 10 — Publishing Package | YOUTUBE PUBLISHING PACKAGE | COMPLETED |

**Status values:** NOT STARTED · IN PROGRESS · NEEDS REVIEW · APPROVED · COMPLETED · BLOCKED

---

## Approval Gates

Default interaction — each step requires review before the next:

1. Topic analysis + research plan → review  
2. Research dossier + story outline → review  
3. Complete script → review  
4. Storyboard + shot list (after script approval)  
5. Visual assets  
6. Animation + audio materials  
7. Assembly + quality check  
8. Publishing materials  

For small corrections: update only the affected section; preserve approved work. Never restart the whole workflow for a localized change.

---

## Production Log

| Date | Event | Decision / Version | Pending |
|---|---|---|---|
| 2026-11-04 | Project initialized; brand config v1.0; 5 templates created; 3 character references registered | v1.0 | — |
| 2026-11-04 | EP01 topic confirmed: Skema Ponzi; STAGE 01 analysis approved | EP01 v1.0 | — |
| 2026-11-05 | EP01 STAGE 02–08, 10 completed (research, outline, script, storyboard, 9 assets, animation sheet, audio design, publishing) | EP01 all v1.0 | STAGE 09 final render uploaded (ffmpeg npm + Chromium sparticuz + Remotion + bpy all proven) |
| 2026-11-05 | Full EP01 package uploaded to Google Drive for review | — | User review |
| 2026-11-05 | Brand renamed MONEY UNDERCOVER → RUANG MARGIN across docs + render source; video re-render in progress | brand v1.1 | VO recording |
| 2026-11-05 | EP01 FINAL: rebrand render + VO (voice-00, 14 clips, cue cascade) muxed; QC passed; `EP01-ruangmargin-1080p24-AV.mp4` (66 MB) uploaded to Drive | EP01 v1.1 final | platform publish (user) |
| 2026-11-06 | EP02 topic: **Emas Bodong 2026** (Pandeglang Mitra Makmur + Divine Gold) — user pick "topik hot"; STAGE 01–08, 10 docs done; 9 assets generated; render running; VO 14/14 + mix track 635.00s executed | EP02 v1.0 | render → QC → mux → Drive |
| 2026-11-06 | **EP02 DELIVERED**: full render v1 QC → source-line fix (8 scenes) → render v2 → QC frames PASS → mux (635.01s) → thumbnail → CRF-22 upload + 4 review docs → Drive | EP02 v1.0 final | user publishes to platform |

### Registered character references (approved v1.0)

| Asset ID | Source file | Role |
|---|---|---|
| CHAR_INVESTIGATOR_REFERENCE_01 | `character utama narator.jpeg` | THE INVESTIGATOR — main narrator |
| CHAR_CONSUMER_REFERENCE_01 | `character_consumer.jpeg` | The Consumer |
| CHAR_EXECUTIVE_REFERENCE_01 | `eksikutive_character.jpeg` | The Executive |

Pending characters: The Analyst, The Antagonist (reference sheets not yet supplied).

---

## Recommended First Episode

**"Bagaimana Skema Ponzi Membuat Korban Percaya Mereka Kaya?"**

Awaiting user confirmation of the first episode topic before STAGE 01 begins.
