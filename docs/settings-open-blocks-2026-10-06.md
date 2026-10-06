# Settings Open Blocks `65,536` bind — 6 October 2026

Worker U20 on `codex/settings-blocks-65536-20261006` from fidelity `743512b6`.
Assigned pair: Settings → Data Management → Nintendo 3DS → Software
Management empty list. No Azahar. No production browser. No recapture.

This is not a 1:1 claim. Tests and this note do not close pixels, input,
motion, or audio.

## Assigned defect

Official Azahar combined PNG
`/Volumes/Sandisk1/3ds-fidelity-artifacts/settings-data-parental-20261006/software/native/azahar-software-empty-400x480.png`
SHA-256 `9c5cb75cda80fd2bcbc377da0372f83a1bf435182d06a9c2c3ed2182afdf7881`.
Browser raw LCDs `ed423379739fe76ea3be8cf12169676029d599dc64174dca1742b72be3e98baa`
/ `379919e6d47f89aa8dac416a59def83bcb6e8d9e9b6fff26600bb23bd8adac3a`.
Report `dea16338…` (file
`/Volumes/Sandisk1/3ds-fidelity-artifacts/settings-data-parental-20261006/software/compare/report.json`).
Empty mask `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`.
Threshold any RGB channel >2/255. Upper **6852** / lower **22**.

Native upper paints white **65,536** in the orange Open Blocks box
(right of "Open Blocks", y≈140–172). Browser left that box empty. The
rest of the upper is HUD clock/date (live vs `lcdDate`) and title AA —
not this slice.

## Dump identity

EUR System Settings `0004001000022000` v9220, content index 0 /
`0000003d`. Converter **ctr-native-web 1.3.2** for the Settings pack
publication; shared-font conversion **ctr-native-web 1.2.0** /
`scripts/convert_bcfnt.py`
`a88bc088b04c383658f83ed9712f4accff10dc08b4929500ec7c7c7900cd8375`.
Pinned Settings `exefs/code.bin` SHA-256
`1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5`
(mapped at `0x100000`). The private `code.bin` blob is not on a
reachable path in this worktree; instruction words below are from the
existing [Open Blocks source audit](settings-open-blocks-source-audit.md).

| Element | Manifest / pack | Dump source | SHA-256 |
| --- | --- | --- | --- |
| Settings title | `titles["0004001000022000"]` | CIA `0004001000022000.cia`, v9220 | title `sourceSha256` `876c57b6…` |
| `up_LZ.bin` | `packs/settings/contents/0000-0000003d/up.json` | `up_LZ.bin` | `28cb896701472d0756397d9a6a65d3defa02d692a3f8e5204f9327ab025decbf` |
| `SMng_U_01` | `resourceSources.layouts.SMng_U_01` | `up_LZ.bin/blyt/SMng_U_01.bclyt` | `a644e5620b65fbae9cc8ce47fcb17ddb7466afb49362f942a49955ba5b4f60c5` |
| `SMng_U_01_NonSD` | `up.json` animations | `up_LZ.bin/anim/SMng_U_01_NonSD.bclan` | delivered with the same pack |
| `TextBox_05` | pane on `SMng_U_01` | BCLYT `txt1`, origin 4, size `[120,36]`, font 0, alignment 4, line alignment 2, font size `[25,30]`, capacity 14, placeholder `888888` | member hash above |
| Shared font | `fonts/shared/font.json` | `cbf_std.bcfnt.lz` title `0004009b00014002` | `95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581` |
| `dat_block_u` | `message_EU.json` `mset` | "Open Blocks" | already delivered; unchanged |

`0x218474` selects `NonSD` final frame 1 for accessible SD (state 2).
`0x218598`–`0x2185cc` format the SD free-block counter through `0x19a0b8`
with limit `0xf423f` (999999) and assign `TextBox_05`. The integer is
`floor(clusterSize * freeClusters / 131072)` from filesystem IPC
`0x08490040`. That IPC is not executed here.

## What changed

`stock-native-settings.ts` now writes `TextBox_05` through the existing
native layout/font path (`cbf_std.bcfnt`, pane size/alignment, no CSS
font, no `fontSize` override, no hand-drawn digits). Software and Extra
Data share this pane.

The displayed integer **65536** is an explicit **portfolio-state
adaptation**: NAND/SD allocation, not a RomFS graphic. It matches the
official empty-SD Azahar still. EUR English grouping for this fixture is
the captured string `65,536` (comma). The helper
`settingsOpenBlocksText` only applies that captured grouping and the
sourced clamp; it is not a re-execution of `0x19a0b8`. The private
format table was not re-hashed in this worktree.

## Predicted ROI residual

Compare report number-box connected components (y 139–155, x 256–333)
sum to **841** upper pixels. Binding the dump pane should remove that
empty-bar miss. Predicted number ROI residual after coordinator
recapture: **0–80** AA / placement fringe over 2/255 (direct alignment-4
/ line-2 sampler is not enabled on `SMng_U_01`; this slice keeps the
same pane-raster path already used for "Open Blocks"). Whole-upper
prediction: **≈6010** remaining (HUD clock/date + title AA). Lower **22**
hairline is untouched.

This prediction is not acceptance.

## Remaining residuals

- HUD clock/date vs `lcdDate` (native `06/10 (Tuesday) 15:04` vs
  browser `05/10 (Monday) 18:01` on the published pair).
- Title / instruction AA.
- Lower 22-pixel hairline.
- Extra Data still has the native `?` row vs empty copy (**6989 / 51927**);
  this slice only fills the shared Open Blocks pane.
- Input, motion, and audio remain uncompared.

## Still non-native elements

- Open Blocks **integer** `65536`: portfolio empty-SD fixture, not live
  `FSUSER_GetArchiveResource`.
- Thousands comma: captured EUR English grouping for that fixture, not a
  re-traced locale table from `code.bin` in this worktree.
- `SMng_U_01` implicit-material orange window: source registers
  `(230,150,20)` verified earlier; native final pixels still unproven.
- HUD battery/network frames: reference-session adaptation.
- Empty Software / Extra Data lists: no titles, no icon-button / arrow /
  wait-icon attachments.
- DS Profile values remain blank.
- Camera gallery photos on the same imagined SD are a separate portfolio
  content set; they do not change this fixture.
- No CSS-reconstructed digits or substitute font.

## Evidence split

| Gate | Status |
| --- | --- |
| Source-identified | yes — `TextBox_05` / `cbf_std.bcfnt` / `0x218598` |
| Delivered | yes — already in `up.json` and `fonts/shared` |
| Implemented | yes — `settingsOpenBlocksText` → `TextBox_05` |
| Tested | `tests/settings-open-blocks.test.mjs` plus `npm test` / typecheck / build |
| Browser-inspected | no — worker must not drive `:3000` |
| Native-compared | no — coordinator recapture after integration |
