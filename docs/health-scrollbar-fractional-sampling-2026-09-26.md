# Health scrollbar fractional sampling — 26 September 2026

Target: genuine native `_26.09.26_04.55.28.03.png` (SHA-256
`4fc41442320d3513a0d29b8f57b90cf825f20660d912c7d9a21755bf5e58bed0`) and production
`health-usage-down2-unphased-bdf5fc7-20260926`. The article is displaced8 LCD px
in both. The browser lower had73 pixels above2:22 Back footer pixels addressed
by the prior coverage adaptation and51 scrollbar pixels at x298..318,y42..51.
The upper animation is unphased. Native repeated Down and browser two clicks
are different input sequences; this is a matched-offset rendering diagnostic,
not a matched-input scenario or native acceptance.

## Source calculation and cause

Usage has208 source parser rows, viewport8 and pitch21, hence extent4200.
Controller0x1286ec and thumb setter0x1290dc preserve the float32 offset ratio
and154-pixel travel; paneY8 gives thumbY76.7066650390625. No arithmetic correction
is needed. The [touch/scroll source audit](health-touch-scroll-source-audit.md)
records the executable replay establishing this state and resource geometry.

The thumb contains window patches (`SBBtn`, shadow and frame) and the picture
`SBBtnEmb`. The existing renderer first sampled each texture into a pane-sized
image, then Canvas sampled that image again at the fractional thumb translation.
The source draw uses the original material/UV coordinates at the transformed
quad. The already implemented affine picture sampler removes the extra filter;
window patches need the same path and their own material override.

`pictureSampling:'lcd'` now opts in only the Health `SlideBar` draw. Fractional
axis-aligned pictures and window patches use inverse-transform sampling at LCD
pixel centres once. Existing rotated-picture behavior remains. Integer positions
keep their prior path. The source alpha/blend and opaque-destination guards are
preserved, with fallback for unsupported contexts. No pane rounding, movement,
colors, fitted offsets, scroll-state or asset changes were made.

## Provenance

EUR10.7.0-32E Health title0004001000022300, delivered pack
`packs/health-and-safety/slidebar.json`, source SHA-256
`82acca12d303bf83c7677ec1fbcd05ebe40805a6934574c1e5bf00778a641ac8`.
Layout `slidebar_LZ.bin/blyt/SlideBar.bclyt` SHA-256
`180f74a63764582dad06c52d039703d87002ee21e23f84ed9fb3566b9d733548`.
Emboss texture `slidebar_LZ.bin/timg/SBBtnEmb_8x16.bclim` SHA-256
`f10919f46e64953872ddc105bede2cdb6a8c12d8baaa5b163e7c092ef260bfe7`.
Window top-left texture `SBBtnWndwLT_16.bclim` SHA-256
`4ec700d71642675c3d181cd505f71fca0cd1a92ae278e3b7110fa36a8422fa08`.
Other shadow/frame/window identities remain in the pack's `resourceSources`;
all are unchanged decoded firmware assets.

## Evidence and remaining verification

Offline full lower replay against the named native capture:

| Path | Pixels above2 | RGB MAE |
| --- | ---: | ---: |
| Before (existing footer fix included) |44|0.104184028|
| Direct pictures only |20|0.100086806|
| Direct pictures and window patches |0|0.095850694|

The source Canvas baseline44 differs from production51 because the Canvas
backends filter the intermediate differently. The final implementation also
preserves initial Health Usage lower0 (MAE0.096141493). All103 Settings verifier
PNGs, including main selections and50 lower screens, are decoded-pixel identical.

115 focused renderer/raster/Health/Settings tests pass, one existing TODO;
typecheck, build and diff-check pass. A transport test verifies original-gradient
sampling at a fractional LCD position, window material override, unchanged
uncovered pixels, opt-in gating and unsupported-alpha fallback. Existing source
scroll replay tests still pass. No shader changed.

Private artifacts: lane `.local/health-scroll8/{baseline,direct,window,final}/`,
`settings/`, `comparison.json` and test/typecheck/build logs. Evidence is source
replay plus the supplied native comparison; no browser or Azahar was operated.
Coordinator production recapture is required before claiming the51 live pixels
resolved. Matching held-key timing and upper animation remain separate gates.
