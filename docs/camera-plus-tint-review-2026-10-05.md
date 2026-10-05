# Independent review — Camera browse plus tint ZoomUp decode — 5 October 2026

Grok 4.6 `plus-tint-review-20261005` on
`/Users/paramveer/.codex/worktrees/plus-tint-review-20261005`
(`codex/plus-tint-review-20261005` at `2757aa7b`). Review of fidelity
`ed55865e` / worker `618cd628` (`codex/camera-plus-tint-20261005`). Worker
note and test blobs match (`docs/camera-plus-tint-2026-10-05.md`
`41ce0c13…`, `tests/camera-plus-tint.test.mjs` `6009aa71…`). Different
model from the Grok 4.7 plus-tint worker. Docs and tests only. No Azahar,
production `:3000`, preview 3021, or CDP. Sparse checkout without `model/`.
This lane did not recapture and did not byte-grep `code.bin`.

**Verdict: APPROVE** of `ed55865e` / `618cd628`.

Keep the source-gap. The earlier **APPROVE** `90be3135` rejected peach
`(255,208,128)` because `code.bin` had no byte sequence or float for it.
That search is not the evidence. An independent dump LA4 decode of
`P_BtnO_BrwsZoom0.bclim` stores **156** opaque whites and **0** alpha-128
texels. No dump pane, material, TEV stage, vertex colour, or animation
sets the plus alone to the alpha that produces the peach. The painter is
unchanged. Predicted strip **1992**. This is not 1:1. Tests and this note
do not close pixels, input, motion, or audio.

## Assigned leftover

Queue rank 4 ([leftover-queue](feature-map/leftover-queue-2026-10-05.md)):
re-review the Camera browse plus tint after a real `ZoomUp` decode. Worker
note: [plus tint](camera-plus-tint-2026-10-05.md). Prior slider lock:
[browse slider](camera-browse-slider-2026-10-05.md) **APPROVE** `90be3135`.

## Pair (reused, not recaptured)

Empty mask `dc4b320b…`. Threshold any RGB channel >2/255. Native combined
400×480 lower origin `(40,240)`.

| Item | SHA-256 |
| --- | --- |
| Native `camera-populated-browse-global/native/combined.png` | `cae793c31bdf9f13d44f0834582bf99fead5bb8d652321913993bedde7ae1652` |
| Browser lower `0d0ffe41…` | `0d0ffe41fed0cebe34d78ae196cf1694ffeeb3fde59379a027b8969b35845dea` |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` |

Recounted the hashed pair: strip `[0,170,320,210]` **1992**, max 127 at
`(17,181)` native `(255,208,128)` / browser `(255,255,255)`.

## Dump identity

EUR Camera `0004001000022400` v4097, content index 0 / `0000001a`.
Archive `lyt/P_Brws_D.arc.LZ` decompressed with
`scripts/unpack_home_resources.py` LZ11/DARC. Layout and clips decoded
with `scripts/firmware/native.py`. Textures decoded with
`scripts/firmware/texture.py` `decode_bclim`. Converter **ctr-native-web
1.2.0**, extractor CTRTool **1.3.0**.

| Element | Manifest / pack | Dump source | SHA-256 |
| --- | --- | --- | --- |
| Browse archive | `packs/camera/contents/0000-0000001a/lyt-P_Brws_D-arc-LZ.json` | `lyt/P_Brws_D.arc.LZ` | `ed22962fa35a3019457302e059ddc19709fa07e36ae1d67b506a58e9d317181a` |
| `P_BrwsBase_D` | `resourceSources.layouts.P_BrwsBase_D` | `blyt/P_BrwsBase_D.bclyt` | `9a4899a6d5188952f6a9a6cb2715afe756f2a6a476c3f77143caddce9a93890c` |
| Plus icon | pack texture `P_BtnO_BrwsZoom0.bclim` | `timg/P_BtnO_BrwsZoom0.bclim` | BCLIM `5dd880375fd9519421bf2668c9d3b7af9d14f92b250af447cba35d8152e32342`; decoded LA4 32×32 PNG `abfc6d9ee9523ff5b04f407bf6aa7aa6e35b319524ecf56ba513743019287782` |
| Minus icon | pack texture `P_BtnO_BrwsZoom1.bclim` | `timg/P_BtnO_BrwsZoom1.bclim` | BCLIM `942371957a8967f962ce9b919dc9ed0b98c52c68054c4e6a5d0b20e01cafada7` |
| UserBG field | same pack | `timg/P_Back.bclim` | BCLIM `78b343716eddf098a7b9d1607422d8f1cb042d9211d1ba60b4fb684a360dac68`; L4 8×8, 64 opaque whites |
| Shared tape (not bound) | unpublished | `lyt/P_Tape.arc.LZ` | `34fb91c550a7b00a537055c7535cab3805f532f79f0a36cba6e1e08e1533ea31` |

The published plus PNG equals this decode byte-for-byte. CLIM format 2,
PICA format 9, **LA4**. Legal alphas step by 17. 128 is not a legal texel
alpha. The 156 `(255,255,255,255)` texels are the plus shape the frozen
still maps at lower `[2,176,32,32]`. Minus LA4 has **177** opaque whites
and **0** alpha 128.

## ZoomUp subtree

Dump `P_BrwsBase_D.bclyt`, not the published JSON as the source:

`-B-ZoomUp` is `pan1`, flags **1**, alpha **255**, translation
`[-142,-72]`, two children: picture `ZoomUp` and bounds `BB-ZoomUp`
(`bnd1`, no picture). There is no UserBG-tinted backing pane under the
plus. `ZoomUp` is `pic1`, flags **1**, alpha **255**, size 32×32, vertex
colours white. Parent flags lack InfluenceAlpha. `nativeLowerPaneRect`
of that pose is `[2,176,32,32]`.

`ZoomUp` material flags 21: one map, one matrix, one coordinate
generator, **no TEV stages**, no `colorBlend`. Buffer `(70,55,55,0)`.
All six constants white, including slot 5. Texture
`P_BtnO_BrwsZoom0.bclim`. Mag filter 1 (linear). The implicit combiner
sends an opaque white texel to `(255,255,255,255)`.

`ZoomBack` uses the same buffer, constants, empty TEV list, and
`P_BtnO_BrwsZoom1.bclim`. Its flags are **3** (visible and
InfluenceAlpha) with no children, so InfluenceAlpha is inert. Both
authored picture alphas are 255.

Full-screen `UserBG` sits behind both buttons (`pic1`, 320×240, flags 1,
alpha 255, z `-500`). `P_Back.bclim` is an 8×8 L4 white field. UserBG
constant 5 is authored `(0,128,255)` until `cameraBrowseOrange` writes
`cameraBrowseUserColor` `(255,161,0)` on that one material.
`cameraBrowseOrange` does not touch `ZoomUp`. `stock-native-camera.ts`
does not name `ZoomUp`. Bound clip is `P_BrwsBase_D_Brws` frame 0.

## Animations

Every Camera `lyt/` CLAN that names `ZoomUp` also names `ZoomBack`.
**0** plus-only clips in `P_Brws_D.arc.LZ` or the rest of Camera
`romfs/lyt` (Image Edit names `Zoom` / `ZoomUpBase`, not this browse
plus). `P_BrwsBase_D_*` alpha tracks:

| Clip | ZoomUp alpha keys | ZoomBack |
| --- | --- | --- |
| `Brws` | `(-479, 255)` | identical |
| `Default` | `(0, 255), (60, 255), (60, 128)` | identical |
| `Disable` | `(0, 128), (1, 128), (1, 255)` | identical |
| `Push` | `(-30, 255), (30, 255), (30, 128)` | identical |
| `In` / `Out` | 255 | identical |

`Default` / `Disable` / `Push` also write buffer RGB `(70,55,55)` to
**both** zoom materials. Binding any 128 key would peach the minus
button, whose 177 opaque whites are `(255,255,255)` on native and in the
browser. `Brws` frame 0 leaves both picture alphas at 255.

`P_TapeEdge_1_0.bclim` is A4 with alphas **0 / 17 / 34 / 51 / 68 / 85**
(bar rows y=182–184), not alpha 128 on the plus. It is shared across
browse, edit, shoot, and slideshow, so it is not a unique plus owner.

## Why the still is peach

On native `cae793c3…`, all **156** opaque-white plus texels are
`(255,208,128)`. On browser `0d0ffe41…` they are `(255,255,255)`.
`(255,208,128)` is opaque white at alpha **128** over UserBG
`(255,161,0)`. Implicit TEV of texel `(51,51,51)` is `(107,95,95)`; that
colour at alpha 128 over `(255,161,0)` is native `(181,128,48)` at
`(17,200)`. The same browser pixel stays `(107,95,95)`. Minus grey at
`(301,200)` is `(107,95,95)` on both sides.

Of the strip's **1992** mismatch pixels, an unapplied composite of the
decoded plus at pane alpha 128 over `(255,161,0)` brings **516** under
threshold. The other **1476** of that set stay, including the bar rows.
Applying the same composite to the whole 32×32 plus rect would leave
strip **1479**, because 3 previously matching plus-rect pixels then fail.
That composite is not a dump bind: resource alpha is 255, and every clip
that writes 128 writes it to both buttons. Predicted strip on this still
stays **1992**.

## Evidence

| Tier | Result |
| --- | --- |
| Source-identified | Dump LA4 `P_BtnO_BrwsZoom0.bclim` `5dd88037…`; 156 opaque whites; 0 α128; PNG `abfc6d9e…` matches decode; no plus-only pane, material, or Camera `lyt/` clip |
| Delivered | Existing published packs only. `P_Tape` stays unpublished |
| Implemented | Painter unchanged. `cameraBrowseOrange` still UserBG-only |
| Tested | `node --test tests/camera-plus-tint.test.mjs` |
| Browser-inspected | Not run |
| Native-compared | Reused frozen pair only. Not recaptured. Not 1:1 |

## Checks

`node --test tests/camera-plus-tint.test.mjs` **3/3**. `npm run typecheck`
passes. `npm test` 2135 pass / 36 fail / 23 skip / 1 todo (2195); the 36
fails are sparse `model/` / GLB ENOENT. `git diff --check` clean. This
lane did not drive Azahar or preview 3021 and did not recapture.

## Remaining

Strip **1992** on `0d0ffe41…`. Plus tint and the y=181..184 bar highlight
stay with their previous owners. Whole `camera-readonly-view-photos-page1`
stays fail. Static still only. Not 1:1.
