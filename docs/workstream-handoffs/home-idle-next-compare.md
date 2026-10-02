# HOME idle next residual classification

Base: `88319a917209d041643697bab4678a0b6f867d93`

Browser runtime: `d4c96f26`

## Finding

The next bounded visible HOME-idle target is the **unselected yellow Game
Notes toolbar glyph**, not the Health balloon, selected Health icon, Open
footer, Camera artwork, wallpaper, or upper Health banner.

In the fixed lower-LCD rectangle `[64,90) x [3,26)` (half-open), the current
native/browser pair has **201 / 598 pixels above 2/255**, mean absolute RGB
channel error `1.942029`, RMSE `5.077438`, and maximum channel delta `25`.
The visible differing component is bounded by `x=65..88, y=4..23`.
Exhaustive integer translations through `dx,dy=-3..3` rank `(0,0)` first;
the next result, `(1,-1)`, increases the count to 300 and RMSE to 42.733652.
This is therefore a raster/material residual, not evidence for moving the
toolbar icon.

This pair does **not** establish scenario acceptance. Its input, clock,
population and animation epochs are unmatched. It does provide a more useful
next target than the larger pose-dependent regions because `P_Memo_10` is an
unselected child of the fixed `LncBase_D_01` toolbar paint. The browser paint
uses settled `PaletteOut` frame 12 and `MvsToggle` frame 0; no cursor or banner
clock drives this glyph.

## Inputs and whole-LCD result

Native is Azahar's own combined 400x480 PNG:

- `/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/native-close-clean-20261002/screenshots/_02.10.26_12.10.02.428.png`
- SHA-256 `a8d38cb04fd45b85232765c045a81ef421f50b8ae15b6aa2aaeeafef4685aebc`
- lower crop `(40,240,320,240)`

Browser inputs are the preserved `reboot-home` pair:

- upper SHA-256 `afe22bfa9a07ede713e0e0ab6bc9cadef5a9e8bfd5707ee80f5dc2fbfd277eaa`
- lower SHA-256 `6a6ec684a6b57be2f7dc4fd7b45c47d280c392ea07eee767a291c7dcb97d2d87`
- metadata SHA-256 `76867c283eb4d8d56e9ee04bc4dcf66eaa4a0b43439d1e1f1ffa9db697be034d`
- metadata records commit `d4c96f26`, one row, selected slot 8,
  `health-safety`, cursor centre `(76,161)`, `elapsedMs=120000`, settled
  presentation sampling, `inputMatched=false` and `epochMatched=false`
- the selected banner records yaw/source skeletal frame 98; the HOME
  background records Loop frame 105

Both LCDs visibly select Health at the left one-row anchor. Native's centre
neighbour is vacant while the browser intentionally supplies Settings; that is
a scoped population adaptation and not a parity target.

With the empty mask (SHA-256
`dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`),
the diagnostic remains `unexplained-differences`:

| LCD | Pixels above 2 | Total | Mean absolute RGB channel delta | Maximum |
| --- | ---: | ---: | ---: | ---: |
| Upper | 51,727 | 96,000 | 8.772986 | 215 |
| Lower | 16,060 | 76,800 | 5.167083 | 246 |

Empty-mask report SHA-256:
`3cd036af6109aa5ae2f32451f1550abdf34afe7ad3a610bc9362510e7e385e2c`.
Both upper and lower contact sheets were opened and inspected at original
resolution.

## Named-region classification

All rectangles below are half-open LCD coordinates. Counts use the same
`max(|RGB channel delta|) > 2` rule.

| Region | Rectangle | Result | Classification |
| --- | --- | ---: | --- |
| Lower toolbar | `(0,0,320,40)` | 262 / 12,800, max 25 | 201 pixels are the Notes glyph. The other 61 are the top edge of the population-dependent left paging content at `x=0..21,y=37..39`. |
| Notes toolbar glyph | `(64,3,26,23)` | **201 / 598, max 25** | Stable, source-backed, zero-translation raster/material residual; chosen target. |
| Health balloon body | `(24,49,256,62)` | 3 / 15,872, max 3 | Already resolved. The three pixels are the documented left soft fringe. |
| Health balloon text | `(40,60,224,38)` | 0 / 8,512, max 2 | Pixel tier. |
| Health balloon tail | `(66,105,20,21)` | 0 / 420, max 2 | Pixel tier. |
| Selected Health icon | `(55,141,42,43)` | 0 / 1,806, max 1 | Pixel tier. The larger selected-tile count belongs to the unmatched mint cursor loop. |
| Selected icon + cursor | `(36,122,80,82)` | 2,040 / 6,560, max 46 | Pose-dependent cursor loop (`appliedFrame=27`); not an icon defect. |
| Camera artwork | `(221,140,44,44)` | 1 / 1,936, max 16 | One residual pixel, not a pixel-tier pass; `(0,0)` is the best translation. |
| Camera ordinary plate, excluding the icon interior | `(202,122,82,82)` minus `(218,137,50,50)` | 963 / 4,224, max 26 | Reproduces the previously documented `LncIconSetSrc_00` theme/filtering plate residual; `(0,0)` is best. Do not move the tile or artwork. |
| Native vacancy / browser Settings | `(118,122,80,82)` | 6,167 / 6,560, max 175 | Intentional population adaptation. |
| Left / right paging edges | `(0,106,24,78)` / `(296,106,24,78)` | 1,868 / 1,872 and 667 / 1,872 | Different installed population/page context; not a geometry conclusion. |
| Open footer | `(0,212,320,28)` | **694 / 8,960**, max 30 | Exact recurrence of the known active-theme edge source gap. Do not reopen or conceal it. |
| Upper HUD | `(0,0,400,28)` | 6,772 / 11,200, max 215 | `Internet`/12:10 native versus `Disabled`/11:05 browser and other live telemetry. |
| Upper Health banner/title | `(48,88,324,86)` | 16,610 / 27,864, max 204 | Source-backed but epoch/pose unmatched. Native-dark title and warning pixels both fit best at `(0,-1)` against this browser frame; that coincidence does not authorize a transform. |
| Upper wallpaper quiet bands | top 12,881 / 24,000; left 3,371 / 5,952; right 1,684 / 3,472; bottom 7,656 / 15,200 | max 13 | HOME `Loop` phase is unmatched. |

The same-anchor balloon analyzer independently confirms body/text/tail best
translation `(0,0)`, with zero text/tail pixels above threshold. Its report is
`balloon-report.json`; the inspected native/browser/difference sheet SHA-256 is
`41b69d21dc57a4c65b2a4854fea797a63cde36a6826d4f417e85a5d4b7a5760c`.
No balloon offset should be added.

## Selected target source owner

The source route for the Notes toolbar glyph is complete and remains
unaltered:

- manifest key `home.launcher` -> `packs/home/launcher.json`, pack SHA-256
  `f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`;
- EUR HOME title `0004003000009802`, version 24576, content index 0 /
  content ID `00000082`;
- `launcher_LZ.bin`, SHA-256
  `826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`;
- layout `launcher_LZ.bin/blyt/LncBase_D_01.bclyt`, SHA-256
  `787e6b58e0455130ae1f7f4f35a5edf4472c8a21151a53bbce782e813fab5adf`;
- pane/material `P_Memo_10` under `N_Memo_00`;
- `IcnCherry_10.bclim` L8, source SHA-256
  `f9d251d21cf6aa2f63bd91278fabd936221ec67406b6a646169f1cb0a44622e0`,
  delivered PNG SHA-256
  `b7bfe2e1107b8ab6d40b616c2b70b72f5f1ece94831142b312b14406cb07f306`;
- `IcnCherry_11.bclim` LA8, source SHA-256
  `cfa03ff0df374a909eb88b0e98378f160903fcc260e4c6392e0d304c26ebaffb`,
  delivered PNG SHA-256
  `6dc5a83d971315b9734fb7714e85714d26476ef37d9abfd2986cb49c3a6d1a78`;
- `IcnGrw_8_00.bclim` A8, source SHA-256
  `738dbfe353a887f9dcb568f5800f9435def7b2f5c1e5ec7fc7422839eded1a68`,
  delivered PNG SHA-256
  `1b26c20824b0d4e72ad172c031cc40488e9ee674f6ae3d30eb69396e58d2de7b`;
- converter `ctr-native-web` 1.2.0 and extractor CTRTool 1.3.0.

Runtime ownership is `createFirmwareHome().toolbar` ->
`NativeLayoutRenderer` -> `LncBase_D_01`. The HOME lane owns the runtime path;
the Assets lane owns decoded texture/material evidence. The measurements
contradict a layout translation, so the next investigation must stay inside
`P_Memo_10` texture sampling/TEV/material output rather than changing pane
coordinates or substituting artwork.

## Next verification action

The coordinator should perform one actual matched-input replay before any new
source-only implementation slice:

1. from the same clean HOME population, navigate both native and browser to
   one-row Health at the left anchor through the same accepted inputs;
2. capture two settled raw LCD pairs at named HOME update boundaries, retaining
   the Notes toolbar glyph unselected in both;
3. score `(64,3,26,23)` and the visible component `(65,4,24,20)` in both pairs,
   alongside the Camera artwork/plate and footer controls;
4. if the zero-translation Notes residual repeats while Camera artwork remains
   at pixel tier, isolate `P_Memo_10` TEV/texture sampling and validate the
   resulting visible change with another coordinator capture. If it does not
   repeat, retain this as capture-state evidence and prioritize the matched
   Health banner/background epochs instead.

This does not repeat the known 694-pixel footer edge gap or the resolved
balloon offset. It also avoids promoting the current `(0,-1)` upper artwork fit
to a guessed banner transform.

## Artifacts and verification boundary

All new outputs are under the internal overflow root:

- named report:
  `/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-idle-next-20261002/named-regions/report.json`,
  SHA-256 `a11de07c94ef874fe51835a9d0974df182e5433a5101c44942971e575c7f7480`;
- toolbar native/browser/4x-difference sheet SHA-256
  `8ba8b62948d86d0aa8475cdf4f78b193816a6f34fca814b1690230d1e7dd876b`;
- Camera tile native/browser/4x-difference sheet SHA-256
  `a24677b3d202e03fb29783f46f5b5be4cf1286e3f26d9db80f8bd3582aeba7dd`;
- empty-mask upper/lower contact sheet SHA-256 values
  `ecaed13355149ca395f90357db93b41ccc93b7a2fcada1dbd660ed038196b80c`
  and `36a81dabd6cc5868728673f601d8968db89aa99de9893aec61fb2a2a10dfb6e9`.

The empty-mask sheets, toolbar sheet, Camera sheet and source input images were
opened and inspected. This was a read-only pixel classification: no runtime,
asset, matrix, GUI session, production browser, Azahar profile, audio, build or
shared project document changed. Documentation-only verification is
`git diff --check`; no scenario status is promoted.
