# Sound empty-entry mid: S_BG_D-Grid bind — 5 October 2026

Worker Claude Opus 5.5 on `codex/sound-empty-grid-20261005` from fidelity
`f26cf564`. Sparse worktree; `node_modules` linked from HOME fidelity. No
`model/`. No Azahar. No preview 3021. No CDP. No recapture. Row **1916**,
footer **4707**, title **1774**, Span, birds, volume **130**, battery, Line01,
clock **0** and the first-run guide perimeter **6072** are not reopened.

This is a source-backed bind with an offline estimate. It is not a 1:1 claim.
Tests and this note do not close pixels, input, motion or audio. Coordinator
recapture remains the acceptance gate.

## Review: source-gap label rejected

Commit `636976ad` labelled `[41,96,47,48]` **2255** and `[136,116,48,28]`
**1024** as an `S_BG` constant source-gap. Independent reviewer **Grok 4.6
`sound-empty-mid-review-20261005-r1`** returned **REJECT**:

- Decoded `lyt/S_BG.arc.LZ` `timg/S_BG_Grid.bclim` (ETC1 64×64) holds
  **2048** texels `(223,215,206)` and **2048** `(231,223,215)`.
- The native empty-entry lower holds **7411** / **7290** pixels of those
  colours. The browser lower holds **14701** `S_BG` fill pixels and **0** of
  either.
- `S_BG_D-Grid` + `S_BG_D-Grid_Default` frame 0 is bound on the library path
  but was not bound on the empty-entry path.
- Old test 2 searched raw member bytes. ETC1 stores block codes, so a byte
  search cannot find a texel colour.

This worker reproduced every count with `scripts/firmware/texture.py`
`decode_bclim` on the dump member and with the reused stills. The old
"native mid fill is flat, not a grid" reading was wrong. Each official rect is
one dark 48 px checker square, or part of one. The light squares differ from
the browser fill by at most `(2,1,1)`, which is under threshold. So only the
dark squares showed up as residual.

## Pairs (reused, not recaptured)

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/sound-clock-recapture-20261004/`.
Hashed natives under
`/Users/paramveer/.codex/3ds-artifact-overflow/reference/screenshots/`.
Empty mask `dc4b320b…`. Threshold any RGB channel >2/255. Lower crop of each
native 400×480 PNG is `(40,240,320,240)`.

| File | SHA-256 | Role |
| --- | --- | --- |
| `Nintendo 3DS Sound_25.09.26_22.31.31.595.png` | `65fc5f8819d31c49622d9e2a8ee7ba79c0675fd7dd3a73f783255eb7efe3b4cd` | `sound-empty-entry` native |
| `Nintendo 3DS Sound_25.09.26_22.27.14.541.png` | `9dea0cc2fa7022ccd032c5a94ae59c2dbe37e6b7e800fbf8668b356fc9e5ce69` | `sound-first-run` native |
| `R/browser-empty-entry/lower.png` | `ee103d93d744f5037fd36f24ad93403bf57298b2e1d74752da09d542023ea38d` | pre-bind browser |
| `R/browser-first-run/lower.png` | `b9d1093ab9641460de6e9e0490707ae12d41008085ee8f7c9995d12fd504fbb9` | pre-bind browser |
| `R/diff-sound-empty-entry-hudtime-phase/report.json` | `d28688a4a28c3c5cabc303cc6fb824045ee4a074f4f25fffcacc07944e5425f2` | lower **16021**; `regions[2]` 2255, `regions[3]` 1024 |

## Source

EUR Sound `0004001000022500` v3088 (`CTR-N-HESP`), content 0 / `0000000b`,
`exefs/code.bin` SHA-256
`3c57f2c4091c1bec6b3834609f1e2a6488712e21775d7548b441c69c60b3e5a9`,
image base `0x100000`. Converter `ctr-native-web` **1.2.0**. Archive
`lyt/S_BG.arc.LZ` SHA-256
`944b1cf9a81eac5b162001ac6b9a5dfae63513e1dc45981c87496c159fd0d434`.
Public pack `lyt-S_BG-arc-LZ.json` `c5af6df2…`, unchanged.

| Element | Manifest key | Dump source | SHA-256 |
| --- | --- | --- | --- |
| Lower backdrop | `sound-bg` / `S_BG_D-Grid` | `blyt/S_BG_D-Grid.bclyt` | `925f961ae0eed19b4ab5318d61e0fa609aa465cdd0202f73c6772661647669d6` |
| Pose | `S_BG_D-Grid_Default` frame 0 | `anim/S_BG_D-Grid_Default.bclan` | `4dc57eec9552dd8513f3786a727856d7b8e08c7b27f33083a4619d8c8d2009c9` |
| Checker | `S_BG_Grid.bclim` | `timg/S_BG_Grid.bclim` | source `138b6fc990989d157e970a65d92999e9a81370e9ce02281581da8c6f516c46f3`; public `7407446ca0120cd4b13a02eb1af7215602e82f5aec9f270005715e1732a9b237` |

`BG_Grid` is `pic1` 320×240 at the identity transform. It has white vertex
colours and no TEV stages, so the output is the texel. The sampler is nearest
(`magFilter` / `minFilter` 0) with repeat wrap. Texture matrix scale is
`(3.35, 2.5)` about the centre. That gives 32-texel squares of about 47.8 × 48
LCD pixels, with edges at x 41/88/136/184/232/279 and y 96/144. Default holds
`BG_Grid` alpha **255**. ETC1 has no alpha, so the pane is opaque.

`code.bin` (ARM, cited by test):

| VA | Instruction | Meaning |
| --- | --- | --- |
| `0x1c65dc` / `0x1c65e0` | `add r2, pc` → `"S_BG_D-Grid"`; `add r1, pc` → `"S_BG"` | layout / archive passed to loader `0x1e5b90` (`bl` at `0x1c65e8`) |
| `0x1c65f0` | `add r6, pc` → `"S_Common-BrwCursorB"` | same function then builds browse-cursor parts |
| `0x2315b8` | `bl 0x1c65c8` | sole caller; inside `0x231230` (vtable slot `0x3211d8`) |
| `0x231614` / `0x231628` | `"S_BG_D-Ctr"` / `"S_BG"` → `bl 0x1e5b90` at `0x231634` | the footer backing that empty-entry already draws |
| `0x231648` | `"S_Guid_D"` | the same constructor builds the lower guide object |

The constructor that loads the grid also loads `S_BG_D-Ctr` and `S_Guid_D`.
So the grid is the lower backdrop of the same scene that empty-entry and the
guide draw. The `S_BG` layout name at `0x2fcc98` still has no xref.

## Bind

`src/os/stock-native-sound.ts`, empty-entry / guide block. The lower
`entry(bottom,'sound-bg','S_BG')` becomes
`entry(bottom,'sound-bg','S_BG_D-Grid',{bindings:[{name:'S_BG_D-Grid_Default',frame:0}]})`.
That matches the library path. Draw order on the lower is grid, `S_BG-Record`,
bird, cursor/row, slider, `S_BG_D-Ctr`, footer, then (on the guide)
`C_DlgChA` and the guide card. The opaque grid fully covers the old `S_BG`
fill, so dropping lower `S_BG` changes nothing else. Upper `S_BG` stays.

First-run guide: native complement pixels outside `[20,20,300,220]` are
`(115,111,107)` / `(111,107,103)`. Those equal ⌊grid/2⌋ in the same checker
phase at **864** of **884** such pixels. The other 20 are footer-button edge
blends. So native draws the grid under the guide too. The half-intensity veil
stays the labelled source-gap
([guide perimeter](sound-guide-perimeter-2026-10-04.md)). The guide path keeps
the grid, and its counts do not move (below).

## Offline estimate (awaits coordinator recapture)

No repo script renders the whole Sound lower offline. The estimate rasterises
the posed `S_BG_D-Grid` pane with the repo's own `rasterNativePicture`
(`src/os/native-layout.ts`). It then replaces each browser pixel that is
exactly the old fill `(229,224,216)` with the raster texel. Pixels where
`S_BG` was blended under partial alpha, such as the record lip, are not
re-blended. They may move by a few levels.

The raster equals the native colour at all **14701** native grid pixels. The
browser's **14701** fill pixels are exactly those positions.

| Empty-entry lower ROI | Pre-bind | Predicted |
| --- | ---: | ---: |
| Whole 320×240 | **16021** | **8610** |
| Mid left `[41,96,47,48]` | **2255** | **3** |
| Mid under-lip `[136,116,48,28]` | **1024** | **41** |
| Disc lip `[232,137,47,7]` | 223 | 39 |
| Slider `[0,144,320,175]` | 4271 | 1504 |
| Row `[0,32,320,64]` / footer `[0,178,320,240]` | 1916 / 4707 | 1916 / 4707 |

The labelled slider **4271** held **2767** pixels of this pair. The estimate
drops it to **1504**, the residual that [slider 4271](sound-empty-slider-2026-10-04.md)
actually owns. First-run lower: whole **6267**, both mid rects **0**, row
384, slider 372 and footer 2914 are all predicted unchanged. Its 860 fill
pixels sit in the veiled complement and stay over threshold.

## Still non-native in this scenario

Labelled: row 1916, slider (residual after this bind), footer 4707, title
1774, first-run veil 6072, Next glyphs. The leftover mid pixels (3 / 41 /
39) are record-lip blends that the estimate does not re-blend. Coordinator
recapture decides them. Whole scenario stays **fail**.

## Checks

`tests/sound-empty-mid.test.mjs` (rewritten): pack identity and binding regex;
public PNG 2048/2048; dump ETC1 decode through `decode_bclim`; `code.bin`
ADR/BL xrefs; raster agreement and predicted counts on the reused pair.
`tests/sound-entry-native.test.mjs` expects lower `S_BG_D-Grid` first on
entry and guide. Focused Sound tests pass 21/21.

- `npm test`: 2122 pass, 36 fail, 23 skip. All 36 failures are `ENOENT` on
  `model/candidates/…` files that this sparse checkout does not include.
- `npm run typecheck`: pass.
- `npm run build`: the default build fails because Turbopack rejects the
  outside-root `node_modules` symlink. With a temporary
  `turbopack.root: '/Users/paramveer/.codex/worktrees'` override it passes.
  The override was reverted and is not committed.
- `git diff --check`: clean.

This lane did not drive Azahar or preview 3021.
