# Settings Other pages 3 and 4 recapture — 4 October 2026

Worker recapture on `codex/settings-other-p34-20261004` from HOME fidelity
`87b65a41`. Exclusive production preview 3021 is Sound clock runtime
`605f39fe` (preview HEAD `448bc19f`). No product change. No Azahar. Sparse
worktree; `node_modules` linked from HOME fidelity.

Targets v102 `settings-other-page3-sandisk-direct-bfe467b` and
`settings-other-page4-sandisk-direct-bfe467b` (S-07 / S-08). The 26 September
pairs were **169 / 8** and **169 / 35** over 2/255. The old 169 upper was
recorded as HUD battery/colon phase. HOME reference-profile HUD `82ab64c7`
and colon `97298910` / Sound HudTime `605f39fe` do not paint Settings
`HudMset_00`; this recapture checks whether those later HOME/Sound commits
moved the Settings stills.

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/settings-other-p34-20261004/`.

## Why these stills

Matrix natives, not a new Azahar pass. Combined 400×480 PNGs from
`camera-guide-replay-20260926`. Page-4 SHA-256 was confirmed against the v102
entry before compare.

| Still | SHA-256 | Role | Injected `lcdDate` | Local clock |
| --- | --- | --- | --- | --- |
| `System Settings_26.09.26_21.45.42.533.png` | `76ff09145c2883225368be33d32986322e3cb3d733556d81bb994292a7b4daac` | Other page 3 | `2026-09-26T20:45:42.533Z` | `21:45:42` (even, native colon on) |
| `System Settings_26.09.26_21.46.07.466.png` | `3250974938fec12396178767df9f526d314c524978c962a3584a80a4d92d15d3` | Other page 4 | `2026-09-26T20:46:07.466Z` | `21:46:07` (odd, native colon off) |

## Capture

Muted Chrome CDP 9320, preview `http://127.0.0.1:3021/?lcdCapture=1`.
`lcdElapsedMs=12000` (historical Settings sample, not a recovered native
epoch). `captureScreensAt(12000, lcdDate)` with
`calendarSampling=verification-settings-local-replay`. Empty mask
`scripts/native-compare/empty-mask.json` SHA-256
`dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`.
Official compare `scripts/native-compare/compare.mjs`. IndexedDB prefs
restored byte-identically (`preferences-start.json` /
`preferences-restored.json` SHA-256
`86a5908895212fc08d84b24758ac1ecbbc149afa85b580736e3e8203c35c2f3a`).
Browser process left open. Preview was not rebuilt, restarted or killed.

Route: HOME Settings slot 9 selected → wait banner `active` / scale 1 (not
incoming) → A → settled Settings main (`System Settings. Internet Settings`)
→ projected Other Settings `Touch_230_170` → settled page 1 (`Other
Settings. Profile`) → page-dot LCD `(180,20)` → settled page 3 (`Other
Settings. Outer Cameras`) capture → page-dot LCD `(220,20)` → settled page 4
(`Other Settings. Language`) capture. Announcement was required to be stable
for 900 ms before each pair.

## Scores

Threshold 2/255. Empty mask. HUD band `[0,0,400,28]`.

| Pair | Whole upper / lower | HUD band | Official result |
| --- | ---: | ---: | --- |
| `settings-other-page3-sandisk-direct-bfe467b` | **169 / 8** | **169** (MAE 1.082, max 255) | `unexplained-differences` |
| `settings-other-page4-sandisk-direct-bfe467b` | **169 / 35** | **169** (same 137+16+16 split) | `unexplained-differences` |

These are the same counts as v102 / `bfe467b`. Browser LCD PNG SHA-256s are
byte-identical to that pair:

| LCD | SHA-256 |
| --- | --- |
| page 3 upper | `1548bfb7a2ea07c1cbf13649e741ff1f392be8ce858e591d5444d6860a0e1a3f` |
| page 3 lower | `5ebc1404c08c9cded1183d748090dc849d1282d208919979050782769cec2548` |
| page 4 upper | `fceaa771716c952e3c975801eb4c6f9acbd7ef1d3ac17ecec19c1f41726b06d3` |
| page 4 lower | `a2a473ec5819df679bfd4377916e8d59e46911dc2c12591a7c5cd9c36443c0d2` |

Upper 169 is entirely inside the HUD band: battery `[377,6,18,8]` (137) and
colon clusters `[339,5,4,4]` / `[339,11,4,4]` (16+16). Inspected contact
sheets: page 3 native paints `21:45` (colon on) and an orange battery;
browser paints `21 45` (colon off) and a charging-looking battery. Page 4
native paints `21 46` (colon off); browser paints `21:46` (colon on) with
the same battery mismatch. That is Settings `HudMset_00` previous-displayed
seconds / Bat frames 4–5 ([settings HUD runtime](settings-hud-runtime-2026-09-26.md)),
not HOME `HudMenu_00` colon or Sound type-47.

Lower 8/35 are the same sparse glyph-edge clusters as `bfe467b` (page 3:
`(107,179)` 5 px and `(117,163)` 3 px; page 4: one-row AA on Language /
Update / Format labels). No source-justified defect was proven on those
edges, so no runtime change.

## Artifacts

| File | SHA-256 |
| --- | --- |
| `R/natives/page3.png` | `76ff09145c2883225368be33d32986322e3cb3d733556d81bb994292a7b4daac` |
| `R/natives/page4.png` | `3250974938fec12396178767df9f526d314c524978c962a3584a80a4d92d15d3` |
| `R/browser-page3/upper.png` | `1548bfb7a2ea07c1cbf13649e741ff1f392be8ce858e591d5444d6860a0e1a3f` |
| `R/browser-page3/lower.png` | `5ebc1404c08c9cded1183d748090dc849d1282d208919979050782769cec2548` |
| `R/diff-settings-other-page3-sandisk-direct-bfe467b/upper-contact-sheet.png` | `7ac1c05f8978e1afd14fe39683c2056a29d4443f42b42dbce15dbb902a7a6346` |
| `R/diff-settings-other-page3-sandisk-direct-bfe467b/lower-contact-sheet.png` | `5566c418319b9cae92e38fd942424729a3dd31ae582996186782bdff29e2a407` |
| `R/diff-settings-other-page3-sandisk-direct-bfe467b/report.json` | `eeabf42ad7cf2108294327e10ec1405239a3c1c0018fcca25f1589d0a7ff466b` |
| `R/browser-page4/upper.png` | `fceaa771716c952e3c975801eb4c6f9acbd7ef1d3ac17ecec19c1f41726b06d3` |
| `R/browser-page4/lower.png` | `a2a473ec5819df679bfd4377916e8d59e46911dc2c12591a7c5cd9c36443c0d2` |
| `R/diff-settings-other-page4-sandisk-direct-bfe467b/upper-contact-sheet.png` | `66b892c505ce8295e8864eccbe13a0200a3e0e439963376c8c64ac273ecfb962` |
| `R/diff-settings-other-page4-sandisk-direct-bfe467b/lower-contact-sheet.png` | `754238954029a315c111f2b1fba781c926495b00c813f84bbab261e76ab98b68` |
| `R/diff-settings-other-page4-sandisk-direct-bfe467b/report.json` | `95d837a87c9046de109d92d2b65f607803c4c52a6bff4de3e39fdff01cd3b147` |

Inspected all four contact sheets. Lower heatmaps are faint one-pixel label
edges, not page-arrow or tab-identity errors. Pages were settled (tab 3 /
tab 4 raised) before capture.

## Remaining

Pixel tiers still fail. Whole scenarios still fail. Native entered Settings
from Azahar's list/Recent Files with repeated mapped touches; the browser
used HOME Settings → A and one projected Other / page-dot each. Settings HUD
sampler uses live `settingsHudElapsedMs` and previous displayed seconds, so
even/odd wall-clock in `lcdDate` does not by itself match the still's colon /
Bat frame. Motion and audio remain open. Matrix unchanged. No 1:1 claim.
