# HOME Close Warning Typography

3 October 2026. First runtime `8634178b` integrates worker `31e99d55`;
baseline refinement `03d01e2b` integrates worker `8cfc426d`. Feature L-07/H-12.
The [preceding header comparison](home-camera-close-dialog-2026-10-03.md)
isolated oversized Camera close-warning text after the icon/header correction.

## Implementation

Only HOME close/switch body overrides opt into `glyphScaleSpans`. The decoder
uses balanced MSBT group 1/type 0 controls: control 14 selects its little-endian
percentage and pushes the previous absolute scale; control 15 restores it.
Offsets are UTF-16. Ranges cannot split surrogate pairs or CRLF, overlap or
select invalid scales. Unsupported writer combinations fail explicitly.

The existing bitmap writer measures the complete message, including scaled
glyph bearings, size, advances and newline advances. Color masks select ink
without independently positioning substrings. Span identity participates in
the raster cache; replacing text clears stale spans. Absent/empty spans retain
the original writer. Power and unrelated text callers are not opted in.
Malformed selected controls fail paired HOME publication without retiring
the suspended app. Prompt policy, source strings, icon, masks, footer, input
geometry, transitions, durations, assets and audio are unchanged.

The first production capture reduced body residual from 5,168 to 1,611 pixels
above delta 2. Question and icon aligned; the residual was warning-only.
Retrospective ink diagnostics (luminance below 180, lower `[40,132,280,179)`)
found native line 1 `[78,140,240,155)` versus first `[78,138,240,153)`;
native line 2 `[130,159,189,174)` versus first `[130,157,188,171)`.
No images were shifted or fitted for comparison.

Refinement anchors scaled glyph cells to the existing baseline using
`font.baseline * baseScaleY * (1 - runScale)`. Shared font baseline 25,
base style about 0.7 and run 0.85 yield about 2.625 pixels. No literal screen
offset is encoded. This remains a **capture-supported positioning adaptation**,
not proof of the untraced native call site. The question's scale is 1, so its
position is unchanged by this refinement.

## Source Mapping

HOME `0004003000009802` v24576, EUR 10.7.0-32E, content index 0 / ID
`00000082`. CIA SHA-256
`2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`;
decrypted content
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.

- Warning text/color/size -> `home.messages/menu_msbt_LZ/lau_dlg_quit0`
  or `lau_dlg_quit1` -> `RomFS/message/EU_English/menu_msbt_LZ.bin`, SHA-256
  `1df2193c64e8d08b3b670923617ea1f0461537397b3da671d394304a664b4350`.
  Control bytes `5500` select 85%; existing RGBA `3c3c3cff` remains unchanged.
  Close range `[39,71)`, warning-bearing switch `[50,82)`; `quit8` is unscaled.
- Base styles -> `home.messages/styles[message/EU_English/RI_mstl_LZ.bin]`
  indices 243/244: font scale about 0.7, line spacing 1. Decoded style source
  SHA-256 `224aec428f67f35e0a23b3e7de464b2b4fe1d18dd1cf07fa9b0b53d5ad3db555`.
  Label indices 17/18 are not style indices; this corrects the older private
  comparator log's `style17` wording.
- Delivered message/style pack `packs/home/messages-and-loose.json` SHA-256
  `3df11ee9ad6b57e4c043da636c4b606f52e41fbf0a57022cc2696f8b895817d2`.
- Glyphs/metrics -> `fonts.shared` -> `fonts/shared/font.json`, SHA-256
  `d48b661f446e3e581abeceb62b86312a6fea6c8120cd1214ba76b298f94c9f27`;
  shared-font title `0004009b00014002` v0, `cbf_std.bcfnt.lz`, SHA-256
  `95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581`.
  Width 25, height/lineFeed 30, baseline/ascent 25. Legacy font content index/id
  remain unavailable in the manifest, not inferred.

Converter `ctr-native-web` 1.2.0, CTRTool 1.3.0. No asset conversion or source
file changes. Header/dialog/icon/mask mapping remains in the
[preceding source record](home-camera-close-dialog-2026-10-03.md#source-mapping).

## Verification Boundary

Private R:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-close-warning-20261003`.
Fresh baseline `before-desktop` at `10be5b69` reproduces the preceding lower
capture byte-for-byte. `after-desktop/mobile` retain first runtime `8634178b`;
refined runs use distinct `after-refined-*` directories.

Native reference remains the immutable preceding coordinator run's own
400x480 PNG, not a fresh native replay:
`native-folder-switch-20261002/screenshots/switch-sequence-20261003/_03.10.26_02.09.27.325.png`
under R's parent, SHA-256
`e5ca736d34544d7348437112dad7b4700add6a5df3128ea7de12987ef4200f5d`.
Native lower crop `(40,240,320,240)`, raw browser 400x240 upper/320x240 lower.
Named `close-dialog` pairs, empty masks; fixed modal `[20,20,300,212)`,
icon `[136,28,184,76)` and body `[20,84,300,179)` ROIs. No registration,
color fit or phase search. Native/browser epochs, cadence and Camera media
are not matched. Three-dimensional portfolio placement is a separate adaptation.

Both integrations pass full 1,893 tests, zero fail, 23 skip, one TODO;
serialized typecheck and build pass. No shader/material change. Independent
review passes 161 focused tests/typecheck at each worker commit, no findings;
worker broader focused set 291 passes. These do not establish native fidelity.

## Production Results

All six runs finish with no page errors, mute retained and exact fixture
restoration. Baseline records 19 switch pairs; first size-only desktop/mobile
19/19; refined desktop/mobile/reduced-motion 19/17/18. Sampling counts are not
native timing evidence. Eight supplemental captures cover Work close,
Cancel/repeat/confirm, Work-to-About switch, reduced About close and Health's
actual folder Close touch. Accessible portfolio commands establish behavior,
not native input or artwork parity.

| Unmasked region, pixels above delta 2 | Before | Size only | Refined |
| --- | ---: | ---: | ---: |
| Body | 5,168 | 1,611 | 7 |
| Modal | 5,168 | 1,611 | 7 |
| Full lower LCD | 9,002 | 5,445 | 3,841 |

Refined lower dialog PNGs are byte-identical across all three modes and each
initial/repeat/cross-drag capture, SHA-256
`761d23d3ef00082c77bba0a70655de4d61d045dbfb049f79e7d40da39183f259`.
Cancel retains Camera; cross-drag does not activate. Icon stays zero above
delta 2, maximum 1. No-warning `quit8` and switch terminal remain byte controls;
terminal retains its prior 91-pixel residual. All seven body/modal pixels
occupy `[188,163,189,170)`, maximum 86, and remain unexplained and unmasked.

Dedicated Chrome PID 16855 / window 13091 ran muted on the authorized full
Mac, exited 0 through its owned launcher, and exact PID absence was verified.
No native process was launched. System audio, default profiles and unrelated
apps were untouched. Preview 3021 remains HTTP 200 at runtime `03d01e2b`.
Native, refined LCD, desktop/mobile viewport and portfolio-control images
were inspected. No private matrix or DeveloperStorage artifact write.

Final comparison sheet opened; coordinator independently rehashed all 175
manifest records. All refined modes retain upper 95,208 / 96,000 and whole
99,049 / 172,800 pixels above delta 2: these are failures, not accepted masks.
Frozen files under R, SHA-256:

- `home-close-warning-comparison-report.json`:
  `7cbff8081ee512b09c3c23d4d22d65156b3fdf7279e42463ea1908d435dc89c7`.
- `home-close-warning-comparison-sheet.png`:
  `0dc980285059349b1381a69eb5b3fad2cf203b55026fb837019a1b2b8b799026`.
- `home-close-warning-comparison-manifest.json`:
  `23ee7050a5df969b6e62a9bf76e8804accf7bfa3365f90c44f81068facbccc8a`.

Reproduction and integrity checks are `generate_close_warning_comparison.py`
and `verify_close_warning_manifest.py`. The manifest tracks their identities,
the predeclared comparison plan, named inputs, test/control logs and outputs.

## Remaining

Whole scenarios remain **fail**. Camera's middle Manual footer button and
upper Camera/HUD/content composition remain unresolved. Other-title warning
visuals, native caller/prompt policy, exact input/motion/audio and baseline
adaptation acceptance remain unverified. The source size control is supported;
that does not establish whole-dialog or whole-HOME 1:1.
