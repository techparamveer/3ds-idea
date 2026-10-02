# HOME ordinary Camera plate baseline

Comparison branch: `codex/home-ordinary-plate-compare-20261002`

Comparison base: `1e5fb2004ba3bd86c0440db506477d8f67d7d556`

Fresh browser runtime: `1e5fb200` (same integrated Notes source as
`79597372`)

Status: **the unselected Camera plate is a byte-repeatable fixed raster
residual; candidate-after remains pending**.

## Bounded finding

Three Health-selected native captures and three fresh production captures
repeat the complete Camera tile at `[202,284) x [122,204)` byte for byte within
their respective sources. The three fresh browser tiles also equal the three
preserved `79597372` browser tiles despite different whole-LCD hashes and HOME
update counts.

The stable RGBA crop identities are:

- native complete 82x82 tile:
  `96e679837c70d7d32a9d09d21c55804b78f6ab3958c42d7334272d9a2be825e3`;
- fresh and preserved browser complete tile:
  `b3f55cd226416951ce36923abb404719b490dae14356fae7b7000bdef51886ee`;
- native plate outside the 50x50 icon interior:
  `c3b3f7fdc8262bd2754d28dca594f8df08d804361a38d609487a2876afaefab5`;
- fresh and preserved browser plate outside the icon interior:
  `f0671ba5b9cfdc1d13650b257b590df2e37de243aa12ee1c861a09d4d0e6fb60`.

The fixed plate mask is the 82x82 tile minus `[218,268) x [137,187)`.
It repeats **963 / 4,224 pixels above 2/255**, mean absolute RGB-channel
delta `1.422033`, RMSE `3.516488` and maximum channel delta `26` in every
pair. The stable difference-map SHA-256 is
`ad8746103b8e642123130c1da7433171e0d8a743bcf96025a03e9c6d36bc3e42`.

This repeatability separates the plate from the selected Health cursor. The
fresh captures remain on selected slot 8 at HOME update counts 50, 191 and
362. The matching preserved tiles came from cursor frames 56, 20 and 14.
Neither cursor loop paints the unselected Camera tile.

## Inputs

Native is Azahar's own 400x480 PNG. Its lower LCD is cropped at
`(40,240,320,240)` without scaling. Browser inputs are raw 320x240 lower LCDs.

| Pair | Native own-PNG SHA-256 | Fresh lower SHA-256 | Fresh metadata SHA-256 | Preserved lower SHA-256 |
| --- | --- | --- | --- | --- |
| Health initial | `9cf0e063670fcd7b598768af0a45b45a33ccea430e5905a4c9e71f84d1b1b755` | `aa59a3dd4af0d88981264fb9db8ba9529757434880479901989eff4529bc8c75` | `1c0a9c8978acc66de3e5e904ab8f71ad4bf362ac821cd94b5cde72fd23d72a28` | `6e163632d33a2f33188a93522052813b05b5eed195b5c0b651bee4d66901ae25` |
| Health reselected | `0bd89694a6a5e4e29c06a60ae5a35d6707f5d50e248a4a3e7a89c1fe55eea079` | `ced1fe8bcd098867143096c4efb0ea4834919d032880c82810a6afe5669a2299` | `a18b8c809c8f22238056b8528e743b6765157f08815273c8e83c10ddd1b6ae50` | `56b38289cbf98032e8c53805148f056308feadde83d5b6b419cc568b8b69c915` |
| Health repeat | `5d5768b7b2ebe6141324cb69537f4dfccc82d15ef2e1c6955ad4c804d513b0a3` | `928d752bbcaf7147a80c09ca354ef1d9a0e565d9fdf504a730a4ae32f9955783` | `e32aef1f25046b5339094bfff149caaac56a110782bb53e4274d24e7fbc28e54` | `4705745bbacd283d71eef86331648433fd0ffbe6032ac225815e36a36c4f57be` |

Fresh metadata records runtime `1e5fb200`, one row, selected Health, muted
state true, `inputMatched=false` and `epochMatched=false`. The coordinator
reports a 200 ms semantic touch route and no browser errors. This baseline
does not convert those facts into an exact native HID or epoch claim.

Whole-LCD evidence is intentionally not duplicated here. The existing
[Notes comparison](home-notes-toolbar-compare.md) retains the empty-mask
reports, input limitations and whole-pair `unexplained-differences` status.
The earlier [HOME lower comparison](../native-home-lower-comparison-2026-09-22.md)
records the original plate routing and theme/filtering limitation.

## Stable regional localization

The following masks partition the 82x82 tile. The 72x72 body rectangle
`[208,280) x [126,198)` follows the frame-1 source geometry; the masks are
diagnostic pixel regions, not a claim that overlapping source panes can be
isolated from a final native framebuffer.

| Region | Diagnostic mask | Pixels above 2 / total | Mean / RMSE | Maximum | Stable localization |
| --- | --- | ---: | ---: | ---: | --- |
| Outer shadow band | tile minus the 72x72 body | **415 / 1,540** | 0.876190 / 1.485427 | 5 | Low-amplitude edge/shadow error. Main components are 144 pixels at `[212,276) x [198,202)` and 106-pixel vertical strips at each body side; a separate 49-pixel line is at `x=203,y=139..187`. |
| Body and edge | 72x72 body minus the icon interior | **548 / 2,684** | 1.735221 / 4.265529 | 26 | Largest stable plate contribution. A 542-pixel connected rim component spans the full 72x72 body bounds; six isolated lower-corner pixels form the remainder. |
| Icon fringe | 50x50 icon interior minus 44x44 artwork | **23 / 564** | 2.966903 / 19.835851 | 246 | Four stable 3x3 corner components at the artwork boundary. These high deltas are outside the Camera artwork core and are not evidence for moving the tile. |
| Camera artwork | `[221,265) x [140,184)` | **1 / 1,936** | 0.067837 / 0.344676 | 16 | The already-recorded single pixel at `(221,183)`; not a pixel-tier pass, but separate from the 963-pixel plate mask. |

The plate total is exactly the shadow-band plus body/edge counts:
`415 + 548 = 963`. The full tile adds the 23 icon-fringe pixels and one
artwork pixel for `987 / 6,724` above threshold. All regional native hashes,
browser hashes and absolute-difference hashes have one unique value across
the three fresh pairs. Every fresh browser regional hash equals its preserved
`79597372` counterpart.

The opened 4x spatial contact sheet shows the same form in all three rows:
subtle outer shadow differences, a continuous body/rim residual, four bright
icon-boundary corners and an otherwise dark artwork core. Difference RGB is
multiplied by six for visibility. No offset, color or mask is inferred from
the sheet.

## Source provenance

The captured ordinary software plate maps to the pinned firmware without a
substitute graphic:

| Element | Manifest / delivered key | CIA-internal source | SHA-256 |
| --- | --- | --- | --- |
| Launcher pack | `manifest.home.launcher` -> `packs/home/launcher.json` | HOME `0004003000009802` v24576, content index 0 / ID `00000082`, `romfs/launcher_LZ.bin` | archive `826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`; delivered pack `f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044` |
| Ordinary plate layout | `layouts.LncIconSetSrc_00` | `romfs/launcher_LZ.bin/blyt/LncIconSetSrc_00.bclyt` | `1296496b88f41abc6c9382f59bb51927a6b8f049f9cc02454653f27d2730dcaa` |
| Density pose | `animations.LncIconSetSrc_00_Scale`, frame 1 | `romfs/launcher_LZ.bin/anim/LncIconSetSrc_00_Scale.bclan` | `ffbd67a63b4ea0a9396edb95a1f5d44c309131930f8a7de4efd92b092b68a4a6` |
| Frame-1 plate maps | `LncIcon_11.bclim` / `LncIcon_13.bclim`, LA8 | members of `romfs/launcher_LZ.bin` | source `c7efec8c2695132385f73057a0b762c6e03a5204ba182c1e2c8465115b30b2c0` / `5f04658343fb9c62a30bc6424977a03e2258e8016c5103a5d4f7f7f2ec4ba9cf`; delivered PNG `bfb6fcb18eefb9f0626204f6b2615ba9a714396538bf70374e51996ee2f06660` / `b129938af6c76de798959a623495c75bc2da9ca5b230a801e32f0c27ab4599cf` |
| Shadow map | `LncIconBtnShdwLT_00.bclim`, A8 | member of `romfs/launcher_LZ.bin` | source `7f92d1ecff38914a8b6d1c37e7e6ffeb3d05463b383d9f201a8d3f33d670f261`; delivered PNG `413a04a002a02564382932cbe31bdde7e38aec2c79f132f64bb62f6164480b34` |

The pinned CIA SHA-256 is
`2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`;
decrypted content SHA-256 is
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.
The delivered materials retain linear minification/magnification and mirror
wrapping. Conversion is `ctr-native-web` 1.2.0 with CTRTool 1.3.0.

Native initialization loads SetSrc and its Scale clip at executable
`0x2b1ddc..1df4`; the 64x128 source texture is subsequently installed into the
final slot material. Runtime ownership is `createFirmwareHome().tile` ->
`NativeLayoutRenderer` -> `LncIconSetSrc_00`. This establishes the source
owner, not the still-open native-versus-Canvas sampling rule.

## Boundary and next action

This baseline supports a bounded source investigation of frame-1
`LncIconSetSrc_00` plate/shadow sampling. It does not support:

- changing tile, body or artwork coordinates;
- fitting a replacement color or hiding residual pixels;
- reopening the resolved Notes glyph or known 694-pixel Open-footer gap;
- applying a plate behavior to another material without source and capture
  evidence;
- promoting a whole LCD, input, motion, audio or scenario status.

Candidate-after is intentionally absent. If the source worker supplies a
bounded justified candidate, the coordinator must integrate it and recapture
the same three Health states. Acceptance requires the 963-pixel plate mask to
improve without regressing the icon fringe, Camera artwork, Notes crop or
other named controls. Until then this is baseline evidence only.

## Artifacts

Private root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-ordinary-plate-20261002/comparison/`.

- named JSON report: `report.json`, SHA-256
  `521267010f385264ed603360c37d6d2e4b514d0186957a4bfd1773ee0e8c87bd`;
- reproducible comparator: `compare.mjs`, SHA-256
  `10b52fe45566f8438b8b9fbdf84df5bd6068bd48c30fdbfee556ba99acb73c42`;
- enlarged native/browser/6x-difference sheet:
  `camera-plate-native-browser-diff6x-sheet.png`, SHA-256
  `f48151c3ddd59e631cb6b982bcf20ebcfdf862c42eee1410fcc1ff73285d0431`.

The sheet was opened and inspected at original resolution. The report parses
as JSON. This worker changed no runtime, asset, shared project document,
matrix, GUI/native/browser/audio state, build output or DeveloperStorage
artifact. Documentation-only verification is `git diff --check`.
