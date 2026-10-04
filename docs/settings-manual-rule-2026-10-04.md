# Settings Manual page-0 title rule — 4 October 2026

Worker on `codex/settings-manual-rule-20261004` from HEAD `176d112f`. Sparse
worktree; `node_modules` linked. No Azahar, preview 3021, CDP 9320, native
recapture, push or merge. This is not a 1:1 claim.

Assigned cluster: postfix `8cbee36` upper `[35,37,365,39]` **332** over 2/255
(official `report.screens.upper.regions[1]`). Labelled Contents
`ScrollIndicator` `[363,41,369,186]` **858** is not reopened.

## Pair (natives reused)

| Item | Identity |
| --- | --- |
| Report | `/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260927-postfix/reference/scenario-matrix/v1/comparisons/settings-manual-page0-postfix-8cbee36-20260927/report.json` SHA-256 `d8e3855903868ea39914dc582a28d8220cbe5ac04cdb749589dd1ffee5fdec71` |
| Native 400×480 | `_27.09.26_00.44.30.298.png` SHA-256 `50264d734cdc3a44a1a253f89365ab76a6e97473700a76ec6442935114bf81ed` (contact-sheet left pane `(8,8,408,248)` when the isolated volume is unmounted) |
| Browser upper | SHA-256 `29a0b067a72d5d9110ee194cd5aebd45b3bbc1f86aa7cbdde45e76a13303db62` |
| Browser lower | SHA-256 `6b8e1ec2c1d26a4ad462f2447762ceeb9d2c0fde1b46b2930d40373fdd9364bf` |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` |
| Whole over 2 | **3054 / 2071** (hashed production pair, unchanged until recapture) |

The isolated native volume was unmounted here. The upper contact sheet's
native crop is pixel-identical to the hashed browser file in the right pane
(max channel delta 0) and reproduces the official ROI **332** / max 49 at
`(38,38)`.

## Owner

The hairline is already-bound `BtnHeadLineTxt` / `BtnShdw01` under
`BtnHeadLineTxt_ChangeWait` frame 0, not a missing pane and not `PageBg00`.

Contact-sheet native vs hashed browser at x200:

| y | Native | Browser (canvas) |
| ---: | --- | --- |
| 37 | 255 | 255 |
| 38 | **168** | **208** |
| 39 | 168 | 168 |
| 40–44 | 189, 213, 231, 244, 251 | identical |

ROI over 2 is almost entirely y=38 (328 of 332). Native and browser share the
rest of the shadow gradient. Native y=38 is the same 168 as y=39.

`PageBg00` / `PageBg02_00` is a 305×2 black pane at alpha 110 (white composite
**145**). The application page compositor does not draw it. Wait keeps
`BtnShdw01` alpha 0 (Contents rows). `BtnPageTitleP_01` stays hidden on
ChangeWait frame 0.

## Dump identities

EUR 10.7.0-32E Manual applet `0004003000009b02` v5120. Additive pack
`packs/manual/layout-BtnHeadLineTxt.json` (file SHA-256 `9c0c0fb0…`, pack
`sourceSha256` `8c06c951ba9740058c438b69cc52c4b4bf9e2f53102b73dc8b34aad40845a1f6`).
The pack does not publish a numeric content index; `resourceSources` stamp
titleId `0004003000009b02`.

| Manifest key | Dump path | SHA-256 |
| --- | --- | --- |
| layout `BtnHeadLineTxt` | `layout/BtnHeadLineTxt.arc/blyt/BtnHeadLineTxt.bclyt` | `c41c54be9f004b98714ff8b9dc941b09386de50cd9215894d1ac6fe95181dca2` |
| anim `BtnHeadLineTxt_ChangeWait` | `layout/BtnHeadLineTxt.arc/anim/BtnHeadLineTxt_ChangeWait.bclan` | `e97f49909d10f624ddd5003bcf3ab96c58da3aef93fc36dd76674c669a6e2a58` |
| texture `BtnShdw01.bclim` | `layout/BtnHeadLineTxt.arc/timg/BtnShdw01.bclim` | `02f515645a01baaec666f0582b17d724113c184b3a271b44b5d0b89341accc6e` |
| delivered PNG | `textures/9e287e3f72f9a888f0d7e0d0bb36343f85ad7f857b000510da9b8d72f1616955.png` | `9e287e3f72f9a888f0d7e0d0bb36343f85ad7f857b000510da9b8d72f1616955` |

`BtnShdw01` is LA8 256×64, `picaFormat` 5, magFilter 1 / wrapS 2 / wrapT 0.
ChangeWait frame 0 sets body y **0.5**, shadow width **512**, alpha **255**.
The page painter already used that binding at capture-fitted centre `[200,20]`.
Combined pose puts the 64px pane at LCD top-left `(-56,-12.5)`, so texture row
51 (RGB 3,3,3 alpha ~88 at the sampled centre) sits on a half-pixel.

Converter: `ctr-native-web` **1.2.0** in `manifest.json`; this additive pack's
`uiSelection.sourceConverter` is **1.4.0**. Shared `scripts/firmware/texture.py`
SHA-256 `399be43d43fc6d92363386c0a5347135e875ec35edca8d1a1e36145366aed38f`.
Extractor CTRTool 1.3.0.

## Visible bind

The page header omitted `pictureSampling:'lcd'` while Contents rows of the
same layout already pass it. ChangeWait's fractional y is exactly the case
`projectedPicture` is for: sample the authored material at LCD pixel centres
instead of canvas-filtering a pane raster at `*.5`.

No snap, colour, font, magFilter or `azahar-12p4-fit` guess. Capture-fitted
header y=20 / body origin y=38 stay labelled adaptations. ScrollIndicator is
still not drawn on the page scene.

## Offline measure (no preview 3021)

`scripts/verify-stock-helpers.mjs` `manual-settings-page-1-top.png` against the
contact-sheet native crop, empty-mask any channel >2/255, half-open
`[35,37,365,39]`:

| | ROI over 2 | x200 y=38 | Whole upper |
| --- | ---: | --- | ---: |
| Hashed production browser | **332** | 208 | 3054 |
| Offline before | **332** | 207 | 3122 |
| Offline after | **0** | **168** | 2611 |

After SHA-256
`6a626d6b9d99369b78b6c8f6091db9131f6a2e9d6611631641f26bb0cdc0f52e`.
y=39 stays 168 (max delta 0). ScrollIndicator `[363,41,369,186]` stays **858**.
Title-glyph box `[90,14,230,27]` stays 766. The extra whole-upper drop beyond
332 is the same hairline continuing outside the official 330-wide box, not a
second bind.

Source `rasterNativePicture` of the posed shadow at x200 also composites to
168/168/189 at y=38/39/40, matching native.

Artifacts:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/settings-manual-rule-20261004/{baseline,after}/`.

## Remaining

Hashed production pair is still **3054 / 2071** until coordinator recapture.
Labelled scrollbar **858**, title-glyph AA, lower Back/Enlarge/Language
leftovers, later pages, Enlarge, motion and audio stay open. Header y=20 and
body y=38 remain capture fits.

Recapture (browser only; reuse native `50264d73…`): after integration, drive
Settings → Manual → Important Information page 0, capture raw 400×240 / 320×240,
diff empty mask `dc4b320b…`, named ROI `[35,37,365,39]`. Offline collector:
`scripts/verify-stock-helpers.mjs` (id `manual-settings-page-1`). Do not reopen
ScrollIndicator 858.
