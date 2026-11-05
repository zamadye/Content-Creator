# ASSET INVENTORY — TEMPLATE

**Episode ID:** EP-__  
**Status:** NOT STARTED / IN PROGRESS / NEEDS REVIEW / APPROVED  
**Last updated:** YYYY-MM-DD

---

## Naming Convention

```
CHAR_<NAME>_<STATE/POSE>_<NN>
ENV_<LOCATION>_<TIME>_<NN>
PROP_<OBJECT>_<VIEW>_<NN>
INFO_<TOPIC>_<TYPE>_<NN>
FX_<EFFECT>_<VARIANT>_<NN>
```

Examples: `CHAR_INVESTIGATOR_IDLE_01` · `ENV_MINIMARKET_NIGHT_01` · `PROP_SMARTPHONE_FRONT_01` · `INFO_MONEY_FLOW_01` · `FX_MONEY_PARTICLES_01`

---

## Categories

A. CHARACTERS — investigator, consumers, executives, analysts, narrative others  
B. ENVIRONMENTS — city, office, bank, home, retail, corporate buildings, relevant locations  
C. PROPS — smartphones, money, documents, computers, credit cards, financial instruments  
D. INFOGRAPHICS — financial flows, charts, timelines, comparisons, org structures, process diagrams  
E. EFFECTS — money movement, lighting, smoke, particles, paper transitions, screen overlays  

---

## Asset Register

| Asset ID | Category | Description | Visual style | Dimensions | Background | Reusable | Scene refs | Generation prompt | Status |
|---|---|---|---|---|---|---|---|---|---|
| CHAR_INVESTIGATOR_REFERENCE_01 | A | Character reference sheet (narrator/Investigator) — turnaround | 2D editorial, graphic-novel | source ref | plain | YES | all episodes | (reference image, not generated) | APPROVED |
| CHAR_CONSUMER_REFERENCE_01 | A | Character reference sheet (Consumer) | 2D editorial flat | source ref | navy | YES | all episodes | (reference image, not generated) | APPROVED |
| CHAR_EXECUTIVE_REFERENCE_01 | A | Character reference sheet (Executive) — turnaround + expressions | 2D editorial graphic-novel | source ref | plain | YES | all episodes | (reference image, not generated) | APPROVED |
| | | | | | | | | | |

---

## Generation Prompt Standard

Every generated asset prompt must include (per BRAND-CONFIG §8):

1. Subject · 2. Composition · 3. Camera angle · 4. Lighting · 5. Color palette · 6. Background · 7. Art style · 8. Aspect ratio · 9. Consistency requirement · 10. Negative constraints

**Negative constraints baseline:** no readable fake brand names, no watermark, no random text, no children's-cartoon style, no photorealism, no neon/cyberpunk, palette limited to BRAND-CONFIG colors.

---

## Character Sheet Checklist (per character)

- [ ] Front view · [ ] Side view · [ ] Three-quarter view
- [ ] Neutral · [ ] Happy · [ ] Confused · [ ] Angry · [ ] Worried expressions
- [ ] Relevant poses
- [ ] Silhouette/proportion lock documented

---

## QC Gate — Assets

- [ ] No duplicate assets where reuse was possible
- [ ] All prompts meet the 10-point standard
- [ ] Style consistent with BRAND-CONFIG
- [ ] Hypothetical/evidence visuals clearly labeled
- [ ] Usage rights verified for any licensed/external asset (music, fonts, footage, images)
- [ ] No copyrighted characters or distinctive brand artwork without permission

**Stage approval:** APPROVED / NEEDS REVIEW — reviewer: ____ date: ____
