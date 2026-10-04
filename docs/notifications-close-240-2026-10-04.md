# Notifications lower Close 240: `T_EndB_00` shadow sampling — 4 October 2026

Worker `codex/notifications-close-240-20261004` from `67a14967`. No Azahar,
production browser, Sidecar or recapture. No CSS, colour, font, snap,
`azahar-12p4-fit`, HUD, list, scrollbar or `new_close` change. The
writer-0x110 guards on `T_EndF_00` are unchanged.

This is **not** a 1:1 claim. Tests and offline renders do not close pixels,
input, motion or audio. Coordinator recapture on Sidecar is the acceptance
gate.

Follows [the Close/list writer note](notifications-close-list-2026-10-04.md).

## Pair (frozen, not recaptured)

| Item | SHA-256 |
| --- | --- |
| Native `_27.09.26_13.16.53.105.png` | `58fff71424e1301e6ead6d7ef9281689faa368bf0e6403dc6dccaef1f9afa389` |
| Browser lower (`notifications-close-list-recapture-20261004/browser/lower.png`) | `f132dc8d0ba3eaf5aa10c58c5cf952c13e89bfe18b902a6eb886a16e6311b0e0` |

Report `556401d1…`, threshold 2/255. Close `[0,210,320,240]` is **240**,
with max 26 at `(154,217)` (native `56` / browser `79`). It splits exactly into:

| Part | Box | Pixels | Owner |
| --- | --- | ---: | --- |
| Glyphs | `[125,216,195,234]` | **184** | `T_EndB_00` shadow, this slice |
| Seam | `[0,210,320,214]` | **56** | List row content clipped at y 210, not Close |

The white `T_EndF_00` front already matches. Every glyph-box difference is
in the dark shadow: its edges and corners are softer in the browser (for
example, × left edge row 217 `x 126`: native `54`, browser `72`).

## Cause

Source geometry (`news.json` → `NewsTopBtn_D_00`): `P_Btn_00` is origin 7
at y −120, so its children's frame is LCD y 240. Text panes are origin 1
(top). `T_EndF_00` is at y 25, so its top is at 215. `T_EndB_00` is at
y **26.5**, so its top is at 213.5. Both are drawn by the traced one-line
writer (0x110 / 0x111, same quads). That writer puts the block at local
y **−0.5**.

| Pane | Final glyph row | Native | Browser before |
| --- | --- | --- | --- |
| `T_EndF_00` | 214.5 | one atlas sample | pane raster at −0.5, integer composite: one sample ✓ |
| `T_EndB_00` | **213.0** | one atlas sample | pane raster at −0.5, then Canvas `drawImage` at +0.5: **two** linear filters |

The NW writer emits the glyph vertices in one transform (pane translation
plus writer origin), and the GPU samples the atlas once. The browser split
the half pixel: half went into the pane raster, and the composite moved it
by the other half.

## Proof (frozen pair, real raster code)

`tests/notifications-close-shadow.test.mjs` uses the actual
`nativeCenteredGlyphQuads` and `rasterNativeAlphaGlyph`, the shared
`cbf_std` atlas sheets and konst0 `(50,50,50)`, with native row backgrounds:

| Model, glyph box `[118,214,200,236]` | vs native | vs frozen browser |
| --- | ---: | ---: |
| Shadow sampled once at row 213 (bound) | **0** over, max 2 | 172 |
| Pane raster at 212.5 moved down 0.5 (before) | 167, max 24 | **0** over, max 2 |

So the 184 glyph pixels are entirely this second filter. They are not an
origin, colour or font difference.

Offline `@napi-rs/canvas` render of the full painter (private
`.../home-fidelity-20261001/notifications-close-240-20261004/`):
at HEAD its glyph box equals the frozen browser (0 over, max 1). With the
bind it is **0 over, max 2** against native. Lower changes are limited
to `[125,216,194,232]`; upper differences are only the run-to-run HUD clock.

## Binding

`src/os/stock-native-personal-tools.ts`: `NewsTopBtn_D_00` adds
`textSampling:'lcd', textSamplingPanes:['T_EndB_00']`. Sleep `Slp_D_00`
uses that same allowlist **API**, not the same pane-local y. Sleep's
half-pixel is parent pose (`T_BtnB_01` / `T_BtnF_01` matrices y 169.5 /
167.5), so it allowlists both front and back. Close's half-pixel is
`T_EndB_00.translation.y` 26.5; `T_EndF_00` is already one sample at
214.5 with an integer composite, so only B is allowlisted. The
renderer's existing direct path samples `T_EndB_00` once at final LCD
rows (phase 0.5) through the same 0x111 quads. `T_EndF_00` stays on the
writer-0x110 pane route, which still rejects LCD sampling. No other
pane, layout, asset or option changes.

Provenance: `packs/notifications/news.json` (`9f6e27e6…`, from
`RomFS/news_LZ.bin` `4b4e5bd8…`, converter 1.3.1) layout
`NewsTopBtn_D_00` panes `T_EndB_00` / `T_EndF_00` / `P_Btn_00`;
`newslist_msbt_LZ` `new_back`; shared `fonts/shared/font.json`; EUR
Notifications `000400300000a002` v4097 content `00000012`, `code.bin`
`b3993f1e…`, writer `0x16b080` / `0x18fe2c`. No new asset.

## Expected after recapture (not established)

Close glyphs 184 → about 0. Close stays about **56** (the seam). Only the
coordinator's Sidecar recapture can establish the count.

## Remaining (labelled)

- Seam **56** (`y 210–211`, x 81–250): near-white list content edges
  (for example `252` vs `239`) cut by the balloon clip. This is the
  list-title AA family, not the Close footer. It is not reopened here.
- List **820**, scrollbar **34**: separate leftovers, not reopened.
- Whole lower is still **fail** until recapture. Input, motion and audio
  are not compared.

## Checks

`tests/notifications-close-shadow.test.mjs` (new; coverage plus
`renderer.draw` LCD phase on `T_EndB_00` / writer-0x110 reject on
`T_EndF_00`), `notifications-close-list`, `notifications-lower` and
`notifications-upper-body` (the painter's single `textSampling` is
pinned to `T_EndB_00`), and the rest of `tests/notifications-*`,
`bitmap-font` and `native-renderer`. Offline full-painter 0 over 2 vs
native is private and is not a pixel bar. `npm run typecheck` and
focused tests pass on this tree. Full `npm test` / `npm run build`
remain the coordinator's job.
