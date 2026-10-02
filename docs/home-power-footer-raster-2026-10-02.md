# HOME Power footer raster trace — 2 October 2026

## Scope and captured residual

This bounded source slice addresses only the upper-screen Power footer pane
`Slp_U_00/T_Btm_00`. The preceding integrated slice already resolved the main
Power list with writer mode `0x110`, and the lower screen remains within the
static pixel tolerance. Neither path is changed here.

The native reference is
`native-close-clean-20261002/screenshots/_02.10.26_11.56.52.015.png`
(SHA-256 `a585889277da13c28f9b184c279c9775997859a7dbbdd64a946016dc0dfd4a3e`).
A fresh repeat, `_02.10.26_12.10.33.701.png`, has the same SHA-256. The
production upper capture before this slice is
`power-centering-20261002/browser-after/home-power/upper.png` (SHA-256
`905288af31f5dfdbbc22c217ae8807cafc6594ba91cd050b0a1aa848ee222bca`).
Its report (SHA-256
`aec62b45abe839256540739a6cde61511dd6e569a82e81d8848afd08f40a5dab`)
leaves exactly three pixels over delta 2:

| Pixel | Native RGB | Browser RGB | Maximum delta |
| --- | --- | --- | --- |
| 146,188 | 78, 78, 81 | 62, 62, 65 | 16 |
| 146,189 | 85, 85, 93 | 35, 35, 45 | 50 |
| 146,190 | 80, 80, 81 | 63, 63, 65 | 17 |

All surrounding differences are at most 1. The three pixels are the right
edge of the final lower-case `s` in the first-line word `system`.

## Native identity and source trace

The pane is decoded from `sleep_LZ.bin/blyt/Slp_U_00.bclyt`, SHA-256
`4b2d4f32afdb368996a9d9f6e5947a3b0155bfad802d4c9e9b9696b5a1344027`,
title `0004003000009802`, version 24576, content index 0 / `00000082`. It is
380×63, source translation `[0,-55,0]`, alignment 4,
and line alignment 0. `menu_msbt_LZ/lau_press_pow5`, style 503, supplies:

```text
Close the system to enter Sleep Mode.
The HOME Menu will appear when
you resume use.
```

The decoded scale is `[0.699999988079071,0.699999988079071]`, with zero
character and line spacing. The English `menu_msbt_LZ.bin` SHA-256 is
`1df2193c64e8d08b3b670923617ea1f0461537397b3da671d394304a664b4350`
and the RI style table SHA-256 is
`224aec428f67f35e0a23b3e7de464b2b4fe1d18dd1cf07fa9b0b53d5ad3db555`.
The checked-in sleep JSON SHA-256 is
`bfe9219930b99d475b0ceb0895c086e5854442a1e91fae2f5120feab313f59ef`;
the messages JSON SHA-256 is
`3df11ee9ad6b57e4c043da636c4b606f52e41fbf0a57022cc2696f8b895817d2`.
The shared-font source is title `0004009b00014002` v0,
`cbf_std.bcfnt.lz`, SHA-256
`95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581`;
the legacy font record does not identify a content index or ID. Its converted
JSON SHA-256 is
`d48b661f446e3e581abeceb62b86312a6fea6c8120cd1214ba76b298f94c9f27`.
Conversion is `ctr-native-web` 1.2.0 with CTRTool 1.3.0.

The pane setup selects writer flags `0x111`: center the measured block and
center each measured line. At `0x2ffc90` the complete rectangle is accumulated
with VFP float32 operations and exact ceil. The path at
`0x2ffdf0..0x2ffe2c` measures each line independently and applies
`ceil(blockWidth/2) - ceil(lineWidth/2)`. Glyph bearing, width, and final
advance are measured at `0x2187b4`, also in float32. The supporting extracts
have these SHA-256 identities:

- pane setup: `8741db5a0273c72044b302521b9d13a6eb75f77d9ff1df655c52d2dcb16a811b`
- writer alignment: `2a317bd23c4ae3f6bbb01e55369f97a02c85db70d0a656d485cb275c0c89befc`
- string measurement: `ee4ba5670cfcd0c7369ecbd030b0cd562e59a4bc527c42e1c39055f6458994fb`
- line measurement: `4e745160a67824cde33b8ae1f24e486021dbdc37abfcdd9e25d951b20c6e5aa5`

The first line measures `337.3999938964844`, so its source origin is
`190 - ceil(width/2) = 21`. For the final `s`, U+0073 uses sheet 0 at
`(76,65)`, a 12×30 cell, left bearing 0, and advance 13. The exact source
cursor is `128.10000610351562`; its width is `8.399999618530273`; the
float32 endpoint is exactly local x=136.5 and, after the pane's x=10
translation, screen x=146.5. The established upright native alpha raster owns
an exact right-edge pixel-center tie. The old generic binary64 path ended at
`136.49999803304672`, excluding screen x=146.

The source atlas's last ink column and transparent padding at x=87/x=88 have
alpha pairs `[0,0]`, `[85,0]`, `[119,0]`, `[68,0]`, `[0,0]` across rows
84..88. Half-edge bilinear samples therefore predict the same three nonzero
rows and their observed delta shape. This rules out a pane offset or color
change.

## Bounded implementation

`writer-0x111` is an explicit opt-in accepted only for multiline alpha text
with alignment 4, line alignment 0, zero spacing, no row scales
or cursor controls. It reproduces the traced float32 block, per-line, vertical
advance, glyph advance, and endpoint order. Direct LCD sampling additionally
excludes color spans and requires upright unit-scale, integer-sized pane transforms. The Power
presentation opts in only `T_Btm_00`; `T_Main_00` stays on `writer-0x110`, and
the lower screen's two existing button sampling panes are unchanged.

Focused tests pin the decoded message, style and scale; exact local and screen
right endpoints; direct right-edge ownership; rejection of unsupported
spacing; pane-scoped LCD sampling; the unchanged generic endpoint; and the
existing `writer-0x110` result.

## Verification boundary

Worker verification completed `git diff --check`, the three focused test files
(53/53 passing), and `npm run typecheck`. This worker did not run a build,
browser inspection, Azahar, audio checks, or modify the private scenario
matrix. The coordinator must integrate the commit and perform the matched
native/browser recapture. Until that comparison exists, this is a
source-proven implementation, not a scenario pass or 1:1 fidelity claim.

## Coordinator integration and recapture

Source `bc37da53` is integrated as `d4c96f26`; comparison `ec6325a0` is
integrated as `a8b8dda7`. The [comparison handoff](workstream-handoffs/home-power-footer-compare.md)
records every source identity, named capture, mask and report hash. Private
artifacts are under
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/power-footer-20261002/`.

Fresh native own-PNGs for HOME and app Power are byte-identical to their prior
references. Both production upper LCDs improve from 3 pixels above delta 2
(maximum 50) to zero (maximum 2). Both lower LCDs remain byte-identical to
their baselines and also have zero pixels above 2. All masks are empty.
The three defect pixels now equal native RGB exactly; whole-upper mean error
rises slightly from 0.048521 to 0.049517 because other footer coverage changes
remain below threshold. This is a static tolerance match, not RGB identity.
The app-only repeat reproduces both LCDs exactly. All four comparison sheets
were opened and inspected by the coordinator.

Full tests: 1780 pass, 0 fail, 23 skip, 1 TODO; typecheck and production build
pass. No shader/material changed. Browser HOME/app Power, inert footer,
physical HOME return, central Off and reboot passed muted without page errors.
Desktop 1150x690 and mobile 390x700 controls and framing were inspected.
Five regression lower and two Settings upper LCDs are byte-exact. Animated
Health main/Usage/scrolled upper differences remain 241/2034/14281 pixels
above 2, maximum 7/35/43, with unmatched local phases.

Browser-only motion replay completed 32 HOME-origin and 33 app-origin paired
samples through Power, shutdown and off; both sheets were opened, with no
page errors. Neither this replay nor the settled 120000 ms presentation sample
matches native event epochs or establishes native timing.

Sidecar geometry and test-window placement were reverified. The native
process exited and temporary Power/touch bindings were restored after exit;
Static input 2, Null output 1 and volume 0 stayed intact. The production
preview remains at port 3021. Spotify, system audio and microphone were not
changed; no new artifacts went to DeveloperStorage.

Both whole scenarios remain fail. Exact input/HID epoch, motion, shutdown and
LCD/backlight/indicator timing, muted audio and earlier unexplained app-output
variance are open. Host lifecycle assembly and documented HOME/close fits,
portfolio content and local/read-only adaptations remain explicitly non-native
or unproven. No private matrix status or global 1:1 claim changes.
