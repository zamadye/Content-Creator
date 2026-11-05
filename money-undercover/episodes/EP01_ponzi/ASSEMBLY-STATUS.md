# STAGE 09 — VIDEO ASSEMBLY STATUS

**Episode ID:** EP01 · **Status:** ✅ FINAL RENDER COMPLETE — picture-lock QC passed  
**Date:** 2026-11-05 (previous "blocked" verdict overturned; toolchain proven and used)

---

## Deliverable

**`render/out/EP01-ruangmargin-1080p24-AV.mp4`** — rebrand render + VO mux (supersedes picture-lock `EP01-ponzi-1080p24.mp4`)

| Spec | Value |
|---|---|
| Duration | 11:25.00 video / 11:25.02 A+V (within 8–12 min target) |
| Frames | 16,440 @ 24 fps (exact) |
| Resolution | 1920×1080, 16:9 SAR/DAR 1:1 |
| Codec | H.264 High, CRF 18 master / CRF 22 upload copy |
| Audio | VO track `vo/vo_track_final.wav` → AAC LC 192k, loudnorm −16 LUFS / TP −1.5 dB, voice-00, 14-scene cue cascade (MIX-PLAN.md) |
| QC | see `QC-RESULTS.md` (frame QC f00600/f16200 + A/V sync anchors ✓) |

## Toolchain (all verified working in this environment)

| Tool | Source | Proof |
|---|---|---|
| **ffmpeg** | npm `@ffmpeg-installer/ffmpeg` (static) | version OK; used for probe, QC extraction, splice |
| **Chromium (headless)** | npm `@sparticuz/chromium` v153 | Remotion's browser; full 16,440-frame render |
| **Remotion 4.0.540** | npm (`remotion`, `@remotion/cli`, native compositor) | test render + full render + S14 segment re-render |
| **Blender (bpy)** | pip `bpy` 5.0.1 | headless Cycles CPU frame → `out/bpy-test.png` (X11/GL symbol stubs at `/home/user/xstubs`) |

**Render command:**
```bash
cd render/
FONTCONFIG_PATH=/tmp/fonts LD_LIBRARY_PATH=/tmp/al2023/lib \
  npx remotion render src/index.ts EP01 out/EP01-ponzi-1080p24.mp4
```

## QC record

1. ✅ Test render 1920×1080 24fps H.264 verified before full run
2. ✅ Full render 16,440 frames, exit 0
3. ✅ Hook (3s): balance counter card on-brand (navy/amber, ActTag, brand bug, ILUSTRASI mark)
4. ✅ Scene timeline verified against storyboard boundaries (frame-accurate extracts + PSNR cross-check)
5. ✅ S11 legal status: all 3 columns render with sources; MeMiles framed as acquitted ("tidak terbukti bersalah"); VIR as OJK "indikasi"; First Travel verdict 20/18/15
6. ⚠️ **Bug found:** S14 outro sub-line overlapped the LEGAL/LOGIS/157 cards
7. ✅ **Bug fixed** in `src/Episode.tsx` (headline block raised −70px; sub-line yields to cards via opacity fade at f400–450)
8. ✅ S14 segment re-rendered (frames 15360–16439) and spliced: head (0–639.958s) + new tail → FINAL
9. ✅ Junction QC at 639s/641s seamless; outro at 673s clean
10. ✅ Final: 16,440 frames exact, 11:25.00, 1920×1080 24fps H.264

Pre-fix render archived as `render/out/EP01-ponzi-1080p24.pre-fix.mp4`.

## Remaining before publish

- [x] **Rebrand (user)**: brand renamed MONEY UNDERCOVER → **RUANG MARGIN** — docs (00/01/03/04/05/10) + render source (brand bug, outro) + Drive sync done; rebrand render DONE → `render/out/EP01-ruangmargin-1080p24.mp4` (16,440f, QC f00600/f16200 pass)
- [x] Thumbnail final: `assets/THUMB_EP01_FINAL.png` (1280×720; headline "MEREKA DIBAYAR." bone+amber, RUANG MARGIN mark; from THUMB_EP01_CONCEPT_01)
- [x] **VO recording**: voice-00, 14/14 scene clips from Stage-08 script → cue cascade atempo mix → `vo/vo_track_final.wav` (685.00 s, −16 LUFS) → muxed into `-AV.mp4`; A/V sync anchors verified
- [x] `QC-RESULTS.md` written (video + audio sections); music/SFX pass not produced (VO-only delivery)
- [x] Upload CRF-22 copy → Drive: `EP01-ruangmargin-1080p24-AV.mp4` (66 MB, id `1YkaTHHzPLRAzgBbY4w_ps7IGjHQeiuGI`); old-brand MP4 renamed `[SUPERSEDED]`
- [ ] Publish per `10-publishing-package.md` (platform upload — user action)

## Scene → asset map (as implemented in `render/src/Episode.tsx`)

| Scene | Asset(s) |
|---|---|
| S01 Hook | DOM: balance counter + red void |
| S02 Boston 1920 | ENV_BOSTON_1920_01 |
| S03 It really paid | CHAR_CONSUMER_RANI_01 + receipt card |
| S04 The wall | INFO_KURVA_TUMBUKAN_01 + impact flash |
| S05 Definition | ENV_PENGADILAN_DOKUMEN_01 + OJK quote |
| S06 Money flow | INFO_MONEY_FLOW_01 + animated coins |
| S07 Modern face | ENV_KAMAR_GELAP_01 + notifications |
| S08 Rani | CHAR_CONSUMER_RANI_01 + 3 withdrawal beats |
| S09 Smart people | DOM card stack + red risk line |
| S10 First Travel | ENV_TERMINAL_UMRAH_01 + counters 93.295/29.985/63.310 + gauge Rp905 M |
| S11 Legal status | DOM 3 columns (terbukti/vonis bebas/peringatan) + sources |
| S12 Reveal | CHAR_INVESTIGATOR_REVEAL_01 + flow morph + Madoff scale |
| S13 Aftermath | ENV_PENGADILAN_DOKUMEN_01 + stamp |
| S14 Insight & out | DOM: lights-out + 2L/157 + tagline |
