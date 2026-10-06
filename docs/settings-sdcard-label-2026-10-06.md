# Settings Software/Extra Data `SMng_U_01` "SD Card" LCD sampling — 6 October 2026

Worker U24 on `codex/settings-sdcard-label-20261006` from fidelity
`3b2655a1`. Assigned defect: after U23 LCD-sampled every Settings
`CommonBG_U_00` title, Software Management dated upper still differed
by **521** (HUD 0, title 0, Open Blocks number 0). **515** px are the
"SD Card" label. Data root title leftover **14** is a one-column stem
at x=248. No Azahar. No production browser on `:3000`. No recapture.

This is not a 1:1 claim. Offline `@napi-rs/canvas` 1.0.9, tests and this
note do not close pixels, input, motion, or audio.

## Assigned defect

Coordinator HUD-aligned recapture, empty mask, any RGB channel >2/255:

| Pair | Native SHA-256 | Browser upper SHA-256 | Whole upper | SD Card |
| --- | --- | --- | ---: | ---: |
| Software empty dated | `9c5cb75cda80fd2bcbc377da0372f83a1bf435182d06a9c2c3ed2182afdf7881` | `9a2b20b161efd95a4ac28e8de865b4ec68d67d605f37634b3266751a336de568` | **521** | **515** |
| Data root dated | `686d3dfbfedd574c27b23464046152d5999aff0962563dd283ddc4d23f1383ea` | title-sampling `data-dated` | **14** | — |

Software native:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/settings-data-parental-20261006/software/native/azahar-software-empty-400x480.png`.
Browser:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/settings-title-sampling-20261006/software-dated/browser/upper.png`.
Report:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/settings-title-sampling-20261006/software-dated/diff/report.json`.
Zoom:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/settings-title-sampling-20261006/sdcard-zoom.png`.
Native glyphs are crisper/darker; the browser is softer — the same
double-filter U23 removed on `CommonBG_U_00` titles. Open Blocks label
and description already match on that dated pair (0).

## Why this pane differs

Software and Extra Data share `up_LZ.bin/blyt/SMng_U_01.bclyt`
SHA-256 `a644e5620b65fbae9cc8ce47fcb17ddb7466afb49362f942a49955ba5b4f60c5`
(Settings `0004001000022000` content 0 / `0000003d`). Extra Data uses
the same layout and the same `dat_sd_u` string. `SMng_U_00` / `SMng_U_02`
are unpublished.

| Pane | Role | Alignment / line | LCD box | Dated residual |
| --- | --- | --- | --- | --- |
| `TextBox_03` | `dat_sd_u` "SD Card" | **3 / 2** (writer **0x101**) | left **35.5**, top 74, 269×24 | **515** |
| `TextBox_04` | `dat_block_u` "Open Blocks" | 5 / 0 | left **98**, 134×22 | 0 |
| `TextBox_05` | Open Blocks integer | 4 / 2 | left **242**, 120×36 | 0 |
| `TextBox_00` | instruction | 4 / 2, multiline | left **21**, 358×44 | 0 |

`TextBox_03` is origin 4, size `[269,24]`, translation `[-30,34,0]`,
font `cbf_std.bcfnt` SHA-256
`95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581`,
pane size `[18.75,22.5]`, English style 491 scale `0.75`, character
spacing 0. Every "SD Card" glyph bearing is ≥ 0. Writer flags 0x101
are the shared HOME font-library constructor already used for
Notifications titles (`0x16b080` / origin `0x18fe2c`): one-line
middle-left, same quads as alignment 3 / line alignment 0.

Open Blocks and the description sit on integer LCD origins, so the
pane-local cache plus a second Canvas filter does not soften them.
`TextBox_03` sits on a half-pixel X. Whole-layout `textSampling:'lcd'`
does **not** take alignment 3 / line alignment 2: `writer0101` still
requires an explicit `textSamplingPanes` allowlist
([notifications list direct](notifications-list-direct-2026-10-04.md)).
That is a sourced gate, not a per-pane snap.

## Decision

Bind the existing sourced LCD-centre sampler to `SMng_U_01` with
`textSamplingPanes:['TextBox_03']` on both Software and Extra Data.

- Same sampler U23 used on titles; the 3/2 pane needs the existing
  writer-0x101 allowlist that titles (3 / 0) do not.
- No new coverage constant. Offline `azahar-12p4-fit` on this pane is
  **byte-identical** to lcd-only, so the labelled title/Health snap
  stays off `SMng_U_01`.
- Open Blocks, the number box, the description, pictures, and the
  `CommonBG_U_00` title bind are unchanged.

## Offline ROI estimate

`scripts/verify-stock-settings.mjs` plus a private interceptor at
`/Volumes/Sandisk1/3ds-fidelity-artifacts/settings-sdcard-label-20261006/`
(`measure.json`). `@napi-rs/canvas` 1.0.9, module
`/Users/paramveer/.codex/artifacts/canvas-verifier/…`. Empty mask, any
RGB channel >2/255, native = top 400×240 of each 400×480 PNG. This is
napi-rs Canvas vs Azahar, not production Chrome.

| Pair | Baseline SD Card `[36,74,110,100]` | lcd + allowlist | lcd + 12p4 | Whole-layout lcd |
| --- | ---: | ---: | ---: | ---: |
| Software empty | 521 | **0** | **0** (same SHA) | 521 |
| Extra Data | 521 | **0** | **0** (same SHA) | 521 |
| Data root | 0 (no `SMng_U_01`) | 0 | 0 | 0 |

Software title ROI stays **0**. Extra title leftover stays **13**
(x=129). Data title leftover stays **14** (x=248). Number ROI stays
**0**. Open Blocks / description counts are unchanged by the bind
(offline napi-rs still shows AA vs Azahar; the dated production pair
already has those at 0).

## Predicted ROI per pair (coordinator recapture)

| Pair | Current | Predicted |
| --- | ---: | --- |
| Software empty dated upper | 521 (SD Card 515) | **0–6** (SD Card **0**; six dated specks at (319,195), (179,212), (179,218) stay outside this pane) |
| Software empty dated lower | 22 | **22** (untouched) |
| Extra Data upper SD Card | 515-class (no post-U23 dated browser) | **0** |
| Extra Data title | 13 offline | **0–13** (U23 near-tie; not this pane) |
| Extra Data lower | 51927 | **unchanged** (native `?` row vs empty copy) |
| Data root title `[20,25,380,65]` | 14 | **14** (see below) |
| Data root lower | 177 | **unchanged** |
| Other / Internet / Parental titles | 0 / 0 / 0 | **unchanged** |

This prediction is not acceptance.

## Data x=248 stem (bounded look)

Data root draws `CommonBG_U_00` + `TextBG_U_00`, not `SMng_U_01`. The
14 px are one column x=248, y=34–47 in `dat_title_u` "Data Management"
(native cream vs offline green). Extra Data's opposite near-tie is
x=129, y=34–46. Both are the class
[U23 already labelled](settings-title-sampling-2026-10-06.md) under
`azahar-12p4-fit`. No unique dump writer, UV, or alignment difference
appeared in this look. No per-screen snap added.

## Regression checks

- Software / Extra `SMng_U_01` keep `SMng_U_01_NonSD` frame 1 and
  `TextBox_05` `65,536`.
- Only `TextBox_03` is allowlisted. Open Blocks, number, and
  description stay on the pane-raster path.
- `CommonBG_U_00` titles keep `textSampling:'lcd'` and
  `azahar-12p4-fit`. Other p1 `Null_Title` remains **95.19999694824219**.
- Settings main, DS Profile, Manual, and helper `CommonBG_U_00` draws
  are unchanged.
- Icon attachments stay off `textSampling` / `pictureSampling`.
- `scripts/verify-stock-settings.mjs`: five main and 47 subpage paired
  renders passed.

## Remaining residuals / open gaps

- Dated Software six specks outside the SD Card box (if they hold).
- Data x=248 / Extra x=129 one-column title near-ties (offline).
- HUD clock/date vs `lcdDate` on undated pairs.
- Extra Data native `?` row vs empty copy (lower **51927**).
- Internet lower selected yellow vs unfocused blue.
- Data root 3DS selected vs unfocused and Reset AA (lower **177**).
- Open Blocks integer remains the empty-SD portfolio fixture.
- Input, motion, and audio remain uncompared.
- Offline napi-rs Canvas is not production Chrome and is not a
  native/browser pair.

## Still non-native elements

- CommonBG title coverage snap: `azahar-12p4-fit` (existing
  capture-supported adaptation; still not a proven GPU rule). Not
  applied to `SMng_U_01`.
- `textSampling:'lcd'` on `TextBox_03` is the sourced LCD-centre
  sampler with the existing writer-0x101 allowlist, not a substitute
  font or hand-drawn glyph.
- Unidentified detail headings: local `view.heading` without `mset`
  style, still centred as drawn.
- Open Blocks integer `65536` and EUR comma grouping: portfolio
  empty-SD fixture.
- HUD battery/network frames: reference-session adaptation.
- Empty Software list: no title-icon buttons, arrows, or wait icon.
- Extra Data empty copy vs native `?` row: labelled scene mismatch.
- DS Profile values remain blank.
- System Transfer eShop-required dialog vs portfolio 3DS/DSi choices
  (labelled helper adaptation; different header).
- No CSS-reconstructed label or substitute font.

## Evidence split

| Gate | Status |
| --- | --- |
| Source-identified | yes — `SMng_U_01` `TextBox_03` flags, writer 0x101, LCD left 35.5, HOME font-library LCD sampler |
| Delivered | yes — already in `up.json`, `message_EU.json`, `fonts/shared` |
| Implemented | yes — allowlisted `lcd` on Software / Extra `SMng_U_01` `TextBox_03` |
| Tested | `tests/settings-sdcard-label.test.mjs`, `tests/settings-open-blocks.test.mjs`, `tests/settings-title-centre.test.mjs`. `npm test`: 2216 / 2082 pass / 37 fail (all pre-existing ENOENT) / 96 skipped / 1 todo. `npm run typecheck` pass |
| Browser-inspected | no — worker must not drive `:3000` |
| Native-compared | no — coordinator recapture after integration. Offline SD Card ROI is an estimate only |
