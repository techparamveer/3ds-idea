# Settings `CommonBG_U_00` title LCD sampling — 6 October 2026

Worker U23 on `codex/settings-title-sampling-20261006` from fidelity
`4bb5d136`. Assigned defect: after U22 centred the icon+title group,
title ROI `[20,25,380,65]` (any RGB >2/255, empty mask) still differed
on every `CommonBG_U_00` page except Other Settings. Other already uses
`textSampling:'lcd'` plus `textCoverageAdaptation:'azahar-12p4-fit'`
and is **0**. No Azahar. No production browser on `:3000`. No recapture.

This is not a 1:1 claim. Offline `@napi-rs/canvas` 1.0.9, tests and this
note do not close pixels, input, motion, or audio.

## Assigned defect

U22R finding F2 on [the title-centre review](settings-title-centre-review-2026-10-06.md)
attributes the remaining title residual to glyph rasterisation: ink
extents now match native, but non-Other pages still used the default
pane-local text cache at a fractional `Null_Title`.X. Published
post-U22 pairs (`settings-title-centre-20261006/`):

| Pair | Native SHA-256 | Browser upper SHA-256 | Title ROI | Whole upper |
| --- | --- | --- | ---: | ---: |
| Software empty | `9c5cb75cda80fd2bcbc377da0372f83a1bf435182d06a9c2c3ed2182afdf7881` | `8a846cc52695d9b773661dc26e6feca62dab426535d57ed15a31755d3ef70dcd` | **1896** | **3803** |
| Data root | `686d3dfbfedd574c27b23464046152d5999aff0962563dd283ddc4d23f1383ea` | `360b523dca4891e84aecb5abf76a8d02df1347381043134024e1426f24c6fb4e` | **1007** | **2381** |
| Internet settled | `f0c5d093ca46a6681c8903dce68d458483d973010e0bb48a1b35f904415c85e7` | `de631ff37e4e295317f54b73ffc54d338520aaaab658a13a186ad42c3741e5f0` | **1256** | **2661** |
| Parental intro | `98fb3d6233643a5206c9a43dcefc2da7f0acb4f87ab9e15ac3d7c923dd8b5025` | `16d45a2901558992b064507bf4320f1e59a24dca8aa696274106cb2a8739cdb8` | **796** | **2210** |
| Other p1 (control) | `98d0fc9d4220cc8ae460ed8c987fb777b37db4887b16ec1f9c8bd6d618b45686` | `ce89afd60dd9b96ff59ecb46b237c15a333b50df61bb949f31273aa811a16db8` | **0** | HUD only |

Native paths are the coordinator-published 400×480 PNGs named in the
U23 brief. Browser uppers are the post-U22 raw 400×240 targets. Diff
tool: `scripts/native-compare/compare.mjs` threshold, empty mask.

## What Other already does (sourced vs labelled fit)

`git log -S` on `stock-native-settings.ts`:

| Commit | What landed | Provenance |
| --- | --- | --- |
| `cf3776f0` | `textSampling:'lcd'` on Other `CommonBG_U_00` | Sourced. HOME font library `243a728e…` stores glyph quads/UVs (`0x1abff4`) and linear PICA min/mag (`0x1ac830`). The default path rasterizes into a pane-local cache, then Canvas filters that bitmap again at the fractional group X. `lcd` samples the unchanged A4 atlas at LCD pixel centres and composites on whole pixels. See [Other direct text sampling](settings-other-direct-text-sampling-2026-09-26.md). |
| `b5543c40` | `textCoverageAdaptation:'azahar-12p4-fit'` on Health Back and Other `CommonBG_U_00` | **Capture-fitted adaptation**, not a proven GPU rule. Coverage endpoints snap to the nearest 1/16 pixel; atlas UVs stay on the original quad. Authorized after a source trace could not recover Azahar OpenGL subpixel precision. Azahar `sw_clipper.h` 12.4 is a software-rasterizer assumption, not the captured OpenGL backend. See [Health/Other coverage-grid adaptation](health-other-coverage-grid-adaptation-2026-09-26.md). |

Why it was Other-only: those slices validated Other page 1 (and Health
Back). `cf3776f0` records that enabling every eligible text pane also
changed a DS Profile lower pane; that unverified expansion was not
kept. Neither commit gives a native reason to exclude other
`CommonBG_U_00` titles. U22 then centred every modern `CommonBG_U_00`
header with `0x2232b4` and correctly left this raster decision out.

## Decision

The same raster mode applies to every Settings `CommonBG_U_00` title.

- Same layout `up_LZ.bin/blyt/CommonBG_U_00.bclyt`
  SHA-256 `a298448098578ecbbaf195fc5b87a76ac7483a363ad5196aaa212b351362f56d`.
- That layout has **one** text pane: `TextBoxTitle_00`, size 340×26,
  origin 3, alignment 3, lineAlignment 0, character spacing 0, font
  `cbf_std.bcfnt` SHA-256
  `95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581`.
  Those flags are the existing `lcd` direct-writer eligibility.
- EUR English titles use style scale `0.8500000238418579` (styles
  102 / 107 / 285).
- After U22 every such page sits at a fractional `Null_Title`.X
  (54.40 … 136.85). That is the same double-filter the Other lcd
  opt-in exists to remove.
- Icon attachments (`IconBasic`, `IconDataMa`, `IconNet`,
  `IconParental`, …) are picture-only (`Icon` + `Icon_Shdw`, no text).
  Post-U22 icon boxes already have **0** pixels >2 (Software 66–94,
  Data 88–115, Internet 95–124, Parental 92–118, Other 107–134).
  `textSampling` does not touch them. This slice does not add
  `pictureSampling` or any per-screen constant.

The lcd sampler stays sourced. The 12p4 snap stays a labelled
capture-fit, now shared by every Settings `CommonBG_U_00` title
because they share the pane, font and Azahar upscale path. Settings
main (`TopText_U_00`), DS Profile (`LsCommonBG_U_00`), Manual
(`SoftTitleHeader`) and helper/transfer `CommonBG_U_00` layouts stay
off this bind.

## What changed

`stock-native-settings.ts` drops the `screen==='other'` gate on the
existing `CommonBG_U_00` options. Same mechanism, no new per-screen
table, no CSS, no new graphic. Icon attachment draws keep default
raster.

## Offline title ROI estimate

`scripts/verify-stock-settings.mjs` with `@napi-rs/canvas` 1.0.9
(module `/Users/paramveer/.codex/artifacts/canvas-verifier/…`) wrote
`/Volumes/Sandisk1/3ds-fidelity-artifacts/settings-title-sampling-20261006/`.
Empty mask, any RGB channel >2/255, native = top 400×240 of each
400×480 PNG. This is napi-rs Canvas vs Azahar, not production Chrome.

| Pair | Post-U22 title ROI | Offline title ROI | Icon box | Notes |
| --- | ---: | ---: | ---: | --- |
| Software empty | 1896 | **0** | 0 → 0 | Text box 1890 → 0 |
| Data root | 1007 | **14** | 0 → 0 | One stem column x=248, y=34–47 (native cream vs offline green). The same 14 already sit in the post-U22 browser column. |
| Internet settled | 1256 | **0** | 0 → 0 | Text box 1244 → 0 |
| Parental intro | 796 | **0** | 0 → 0 | Text box 775 → 0 |
| Extra Data (`7c7f2f93…`; no post-U22 browser) | — | **13** | — | One missing stem column x=129, y=34–46 (native green vs offline cream). Opposite near-tie of Data. No per-screen snap added. |
| Other p1 | 0 | **0** | 0 → 0 | Control unchanged |
| Other p3 / p4 (same title vs Other p1 native) | 0 | **0** | — | Same `settings_title` string and bind |

The fit generalises. Remaining Data/Extra leftovers are a single
near-tie column of the same class `azahar-12p4-fit` already labels;
they are not a reason to invent a per-screen constant. Production
Chrome previously cleared Other's similar O/g near-ties that source
Canvas still showed, so Data **14** / Extra **13** may still drop on
recapture. That is not claimed here.

Whole-upper offline counts stay in the 1200–2100 range because the
verifier HUD date is 24/09 06:31, not the live native clock. HUD is
outside this slice.

## Predicted title ROI per pair (coordinator recapture)

| Pair | Current title ROI | Predicted title ROI `[20,25,380,65]` |
| --- | ---: | ---: |
| Software empty | 1896 | **0** |
| Data root | 1007 | **0–14** |
| Internet settled | 1256 | **0** |
| Parental intro | 796 | **0** |
| Extra Data | unmeasured post-U22 | **0–13** |
| Other p1 / p3 / p4 | 0 | **0** (unchanged) |
| Settings main | not this header | **unchanged** (`TopText_U_00`) |
| Settings Manual p0 | not this header | **unchanged** |

This prediction is not acceptance.

## Regression checks

- Other p1 `Null_Title` remains **95.19999694824219**.
- Other p1/p3/p4 keep `textSampling:'lcd'` and
  `textCoverageAdaptation:'azahar-12p4-fit'`; offline title ROI stays 0.
- Data / Internet / Parental / Software / Extra now share that bind;
  no new constants.
- Icon layouts stay off `textSampling` / `pictureSampling`.
- Settings main still does not bind `CommonBG_U_00` and still does not
  pass lcd / 12p4-fit on `Top_D_02` / row icons / `TopBase_D_00`.
- DS Profile still binds `LsCommonBG_U_00` only.
- Manual page-0 rule still LCD-samples `BtnShdw01` and does not take
  `azahar-12p4-fit`.
- `scripts/verify-stock-settings.mjs`: five main and 47 subpage paired
  renders passed.

## Remaining residuals / open gaps

- Software / Extra "SD Card" softness is a later `SMng_U_01` `TextBox_03`
  slice: [settings-sdcard-label-2026-10-06](settings-sdcard-label-2026-10-06.md).
- Data x=248 / Extra x=129 one-column near-ties (offline).
- HUD clock/date vs `lcdDate` (Software pair still native
  `06/10 (Tuesday) 15:04` vs whatever the live browser clock is).
- Extra Data native `?` row vs empty copy (lower **51927**).
- Internet lower selected yellow vs unfocused blue.
- Data root 3DS selected vs unfocused and Reset AA (lower **177**).
- Open Blocks integer remains the empty-SD portfolio fixture.
- Input, motion, and audio remain uncompared.
- Offline napi-rs Canvas is not production Chrome and is not a
  native/browser pair.

## Still non-native elements

- CommonBG title coverage snap: `azahar-12p4-fit` (existing
  capture-supported adaptation; now on every Settings `CommonBG_U_00`
  title, still not a proven GPU rule).
- `textSampling:'lcd'` on those titles is the sourced LCD-centre
  sampler, not a substitute font or hand-drawn glyph.
- Unidentified detail headings: local `view.heading` without `mset`
  style, still centred as drawn.
- Open Blocks integer `65536` and EUR comma grouping: portfolio
  empty-SD fixture.
- HUD battery/network frames: reference-session adaptation.
- Empty Software / Extra Data lists: no title-icon buttons, arrows, or
  wait icon.
- DS Profile values remain blank.
- System Transfer eShop-required dialog vs portfolio 3DS/DSi choices
  (labelled helper adaptation; different header).
- No CSS-reconstructed title or substitute font.

## Evidence split

| Gate | Status |
| --- | --- |
| Source-identified | lcd sampler yes (HOME font library). 12p4 snap is a labelled adaptation with Azahar software-rasterizer precedent only |
| Delivered | yes — already in `up.json`, `message_EU.json`, `fonts/shared` |
| Implemented | yes — same Other options on every Settings `CommonBG_U_00` |
| Tested | `tests/settings-title-centre.test.mjs` plus focused Other/main/Manual tests. `npm test`: 2214 / 2080 pass / 37 fail (all pre-existing ENOENT) / 96 skipped / 1 todo. `npm run typecheck` pass |
| Browser-inspected | no — worker must not drive `:3000` |
| Native-compared | no — coordinator recapture after integration. Offline title ROI is an estimate only |
