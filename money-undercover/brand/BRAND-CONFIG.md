# RUANG MARGIN — BRAND CONFIGURATION v1.0

> Source of truth for all visual and editorial identity decisions.
> Any production asset that violates this file must be regenerated, not patched.

---

## 1. Identity

| Field | Value |
|---|---|
| Brand | RUANG MARGIN |
| Tagline | THE STORIES BEHIND MONEY. |
| Language | Indonesian (Bahasa Indonesia) |
| Audience | Young adults, 18–30 years old |
| Category | Business documentaries, financial scandals, money psychology, business models, economic mechanisms, corporate rise & collapse, financial investigations |
| Positioning | "Uncovering the hidden stories, systems, and mechanisms behind money." |
| Personality | Investigative · Skeptical · Intelligent · Cinematic · Curious · Analytical · Occasionally satirical |

**Editorial rule:** entertainment-first documentary storytelling. Never a school lecture, financial seminar, investment tutorial, or motivational video.

---

## 2. Color Palette

### Primary

| Name | Hex | Role |
|---|---|---|
| Midnight Navy | `#101A2B` | Dominant environment and background color |
| Margin Amber | `#F2A900` | Primary identity + information highlight |
| Paper Bone | `#F2F0E9` | Readable typography, documents |
| Alert Red | `#D94B40` | Risk, loss, danger, conflict ONLY |

### Secondary

| Name | Hex | Role |
|---|---|---|
| Slate | `#536174` | Secondary UI, muted elements |
| Pale Blue | `#A8C3D9` | Cool accents, data visualization secondary |
| Deep Black | `#080C13` | Vignettes, deepest shadow layer |
| Green | `#5D9B78` | Positive financial indicators ONLY |

### Color Rules

1. Navy is the dominant environment and background color.
2. Amber is the primary identity and information highlight.
3. Bone is used for readable typography and documents.
4. Red is reserved for risk, loss, danger, and conflict.
5. Green is reserved for positive financial indicators.
6. Never apply random gradients or arbitrary colors.
7. No neon, no cyberpunk palettes, no uncontrolled glitch color shifts.

**Reference tokens for code/graphics:**

```
--mu-navy:   #101A2B
--mu-amber:  #F2A900
--mu-bone:   #F2F0E9
--mu-red:    #D94B40
--mu-slate:  #536174
--mu-pale:   #A8C3D9
--mu-black:  #080C13
--mu-green:  #5D9B78
```

---

## 3. Visual Style

**Primary direction:** 2D EDITORIAL ILLUSTRATION + 2.5D CINEMATIC MOTION GRAPHICS.

### Required characteristics

- Sophisticated editorial illustration
- Graphic novel-inspired character design
- Clean vector-like shapes
- Controlled cinematic lighting
- Layered environments (foreground / midground / background separation)
- Subtle paper and print textures
- Deliberate camera movement
- High visual consistency across scenes and episodes

### Forbidden

- Children's cartoon aesthetics
- Generic corporate presentation visuals
- Unnecessary 3D photorealism
- Excessive neon / cyberpunk effects
- Random glitch effects
- Generic AI slideshow production
- Inconsistent character designs
- Decorative animation without narrative purpose

---

## 4. Character System

### THE INVESTIGATOR (main character / narrative voice)

- Anonymous investigative narrator
- Stylized human character
- Dark navy coat or jacket
- Amber visual accents
- Minimal facial details
- Skeptical and observant expressions
- Controlled body movements

**Reference sheet:** `../assets/characters/CHAR_INVESTIGATOR_REFERENCE_01.jpeg`

### Supporting cast

| Character | Role | Reference |
|---|---|---|
| The Consumer | Audience surrogate, victim perspective | `../assets/characters/CHAR_CONSUMER_REFERENCE_01.jpeg` |
| The Executive | Corporate / power side of the story | `../assets/characters/CHAR_EXECUTIVE_REFERENCE_01.jpeg` |
| The Analyst | Explains mechanisms with data | (pending) |
| The Antagonist | Conflict driver (never = real person unless evidenced) | (pending) |

### Continuity rules

- Consistent silhouettes, proportions, clothing, and visual characteristics across ALL scenes.
- Character sheets must cover: front, side, three-quarter views; neutral, happy, confused, angry, worried expressions; relevant poses.
- Do not imply a fictional character represents a real individual unless the episode explicitly establishes that relationship with evidence.

---

## 5. Video Production Defaults

| Parameter | Default |
|---|---|
| Format | YouTube long-form documentary |
| Aspect ratio | 16:9 |
| Resolution | 1920 × 1080 minimum |
| Frame rate | 24 FPS (cinematic preference) |
| Target duration | 8–12 minutes |
| Narration | Indonesian, natural, conversational but authoritative |
| Short-form derivatives | 9:16, 30–60 s, self-contained hook |

---

## 6. Audio Identity

1. Voice-over (primary, always intelligible)
2. Background music (never competes with narration)
3. Ambient sound
4. Transition sound effects
5. Narrative impact effects

Voice delivery: native-level Indonesian pronunciation, clear consonants, natural pauses, investigative tone, controlled intensity, no exaggerated acting, no robotic delivery.

---

## 7. Thumbnail Rules

- 16:9, 1280 × 720
- One dominant subject, one visual conflict
- 2–5 words maximum
- High contrast, Midnight Navy + Margin Amber identity
- Readable on mobile
- Never misleading

---

## 8. Prompt Construction Standard

Every image/animation prompt MUST specify:

1. Subject · 2. Composition · 3. Camera angle · 4. Lighting · 5. Color palette · 6. Background · 7. Art style · 8. Aspect ratio · 9. Visual consistency requirement · 10. Negative constraints

Vague prompts ("cinematic finance animation") are rejected at QC.

**Canonical example:**

> "Create a 2D editorial graphic-novel illustration of a young Indonesian consumer sitting at a desk, examining a smartphone showing a hypothetical growing debt balance. Midnight navy environment, controlled amber screen illumination, clean geometric character design, layered 2.5D composition, subtle cinematic shadows, serious investigative atmosphere, 16:9 composition. No readable fake financial brand names, no watermark, no random text."

**Text rule:** build text-free compositions first; add typography during editing. Never assume image generation renders exact text correctly. Label hypothetical visuals explicitly.
