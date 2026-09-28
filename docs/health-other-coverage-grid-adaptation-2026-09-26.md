# Health and Other title coverage-grid adaptation — 26 September 2026

This is a **capture-fitted adaptation**, not a verified native GPU raster rule.
The coordinator explicitly authorized it after the bounded source investigation
could not establish the captured OpenGL rasterizer's subpixel precision.

## Evidence and scope

Health Usage native `_26.09.26_04.46.01.113.png` has22 residual lower pixels after
centered direct sampling. All occur at Back glyph left edges x151 and172,
y218..233. Source float32 glyph arithmetic places those edges at
151.49999809265137 and172.49999809265137. The current sample-centre ownership
includes the columns; native excludes them. Other title production at `bdf5fc7`
has9 upper residual pixels: seven O right-edge samples x160,y35..41, plus two
existing HUD pixels. Its emitted right endpoint is160.49999809265137; native
includes that column. These are opposing near-tie cases, not a common position
translation. The source glyphs and pane transforms remain unchanged.

Only Health's `health-back/BtmBtn_White` and Settings' `up/CommonBG_U_00` when
`screen==='other'` opt into `textCoverageAdaptation:'azahar-12p4-fit'`. The option
requires the existing direct-LCD eligibility conditions; other text retains its
prior behavior. Coverage endpoints round to the nearest1/16 pixel, while atlas
sampling still uses the original quad positions and dimensions. The cache key
includes the effective adaptation. No alpha, color, texture or font is replaced.

## Why the choice remains an adaptation

Pinned Azahar commit `9e6f523a57fac9564ac0bf8286db3c3702d301ec`
[`sw_clipper.h`, lines17–24](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/video_core/renderer_software/sw_clipper.h#L17-L24)
uses rounded12.4 coordinates, explicitly labels that format an assumption and
questions the rounding in a TODO. Its software rasterizer converts f24 viewport
coordinates through this helper. This is a source precedent, not proof for the
OpenGL backend used by the captured native screenshot. The host GPU's precision,
rounding and interaction with projection remain untraced.

Offline candidate results:

| Coverage rule | Health lower >2 | Health RGB MAE | Other source title >2 |
| --- | ---: | ---: | ---: |
| Existing |22|0.109361979|0|
| Nearest1/16 |0|0.096141493|0|
| Nearest1/256 |0|0.096141493|0|
| Truncate1/16 |22|0.109361979|0|

The captures cannot distinguish the two nearest grids. A near-tie synthetic test
at0.49 demonstrates that the grids are not generally equivalent. Choosing1/16
follows the documented software precedent under the explicit adaptation; it
must not be described as recovered hardware precision. A stronger rule needs a
captured edge between the candidate grids' rounding intervals, together with
the actual OpenGL backend/vertex projection and subpixel precision trace.

## Asset provenance

All assets remain firmware-derived EUR10.7.0-32E. Health title0004001000022300
uses `btmbtn_LZ.bin/blyt/BtmBtn_White.bclyt`, SHA-256
`a6e45258ad317687584980f0831177204475deecec8de73d8ee664f7d7b89d99`, its source
Back message and style17.5×21. Settings title0004001000022000 uses CommonBG
SHA-256 `a298448098578ecbbaf195fc5b87a76ac7483a363ad5196aaa212b351362f56d`.
The shared A4 font source SHA-256 is
`95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581`.
See [Health footer](health-footer-direct-sampling-2026-09-26.md) and
[Other bottom edge](settings-other-lcd-bottom-edge-2026-09-26.md) for the source
pane and executable mappings. No delivered asset changed.

## Verification and limits

Actual final implementation replay: Health Usage22→0 lower pixels above2;
Other source title stays0. All103 Settings verifier PNGs are decoded-pixel
identical, including main selections and all50 lower screens. Source Canvas
already rounds the O endpoint differently from production Chrome; the exact
emitted160.49999809265137 synthetic regression predicts production O coverage
recovery, but a production9→2 result is not yet claimed.

Tests exercise both near-tie directions, a point beyond the fitted rounding
interval, unchanged default coverage, unchanged interior atlas interpolation,
cache separation and unsupported-transform fallback. Private lane artifacts:
`.local/edge-snap-audit/{comparison,final-comparison,near-ties}.json`, candidate
and final Health/Settings renders, tests/typecheck/build logs. No browser or
Azahar session was driven. Coordinator production recapture remains required;
this adaptation does not establish timing, input or full native acceptance.

Checks:119 focused tests passed, one existing TODO; typecheck, production build
and diff-check passed. Full suite:1349 passed,40 failed,23 skipped, one TODO.
Failures are missing model/GLB fixtures in this stock lane and one existing Notes
publication test attempting to write to the full external artifact volume
(`ENOSPC`); they are not presented as a passing full-suite result. No shader or
material path changed.
