# Independent review — Settings Other p3/p4 upper HUD 169 — 5 October 2026

Grok 4.5 `settings-other-p34-hud-169-review-20261005` on
`/Users/paramveer/.codex/worktrees/settings-other-p34-hud-169-review-20261005`
(`codex/settings-other-p34-hud-169-review-20261005`). Review of leftover
`a74309f6` / worker note
[settings-other-p34-hud-169](settings-other-p34-hud-169-2026-10-05.md) /
worker `codex/settings-other-p34-hud-169-20261005` at `f93689df`. Different
model from the leftover worker (Grok 4.6). Docs and tests only. No Azahar,
production `:3000`, preview 3021, or CDP. Sparse checkout without `model/`.
HEAD stayed on `a74309f6` until this review commit. Fidelity parent
`codex/home-fidelity-20261001`.

**Verdict: APPROVE** of `a74309f6`.

Frozen upper **169** is uniquely dump `HudMset_00` Bat frames 4/5
(`HudBat_04` / `HudBat_05`, **137**) plus pane `T_TimeC_00` (**32**). Painter
unchanged (existing previous-seconds sampler). Lower **8** / **35** stay out.
Predicted **169 / 8** and **169 / 35**. This is not 1:1. Tests and this note
do not close pixels, input, motion, or audio.

## Assigned leftover

Queue §3 Other p3/p4 **169/8** and **169/35**
([leftover-queue](feature-map/leftover-queue-2026-10-05.md)). Worker bind
`a74309f6`. Worker note:
[settings-other-p34-hud-169](settings-other-p34-hud-169-2026-10-05.md).

## Pair (reused, not recaptured)

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/settings-other-p34-20261004/`.
Empty mask
`dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`.
Threshold any RGB channel >2/255. Native 400×480 vs raw 400×240 / 320×240.
Official upper crop `(0,0,400,240)`; lower `(40,240,320,240)`.

| File | SHA-256 (hashed this review) | Role |
| --- | --- | --- |
| `R/natives/page3.png` | `76ff09145c2883225368be33d32986322e3cb3d733556d81bb994292a7b4daac` | Other page 3 native |
| `R/natives/page4.png` | `3250974938fec12396178767df9f526d314c524978c962a3584a80a4d92d15d3` | Other page 4 native |
| `R/browser-page3/upper.png` | `1548bfb7a2ea07c1cbf13649e741ff1f392be8ce858e591d5444d6860a0e1a3f` | page 3 browser upper |
| `R/browser-page3/lower.png` | `5ebc1404c08c9cded1183d748090dc849d1282d208919979050782769cec2548` | page 3 browser lower |
| `R/browser-page4/upper.png` | `fceaa771716c952e3c975801eb4c6f9acbd7ef1d3ac17ecec19c1f41726b06d3` | page 4 browser upper |
| `R/browser-page4/lower.png` | `a2a473ec5819df679bfd4377916e8d59e46911dc2c12591a7c5cd9c36443c0d2` | page 4 browser lower |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` | mask |
| `scripts/firmware/texture.py` | `399be43d43fc6d92363386c0a5347135e875ec35edca8d1a1e36145366aed38f` | converter texture path |

Regression copies under
`…/regression-recapture-20261005/settings-other-p34/` are byte-identical to
the four browser hashes above. Independent recount of both frozen and
regression pairs: **169 / 8** and **169 / 35**. Whole upper **169** sits in
HUD `[0,0,400,28]`: battery `[377,6,18,8]` **137** plus colon clusters
`[339,5,4,4]` / `[339,11,4,4]` **16+16**. Zero pixels outside those ROIs.

## Dump identity (hashed this review)

EUR 10.7.0-32E System Settings `0004001000022000` v9220, content 0 /
`0000003d`. Converter `ctr-native-web` 1.2.0, CTRTool 1.3.0. Pack
`packs/settings/contents/0000-0000003d/hud.json` SHA-256
`01025d86a3f136a773fec95eb00ade65c54718d0a1eeec01c3e904ad1352d427`.
Pack `sourceSha256` (archive `hud_LZ.bin`)
`c25089a209c4dcec2096ad65c5e4f8d20e41e9991e81551d56a5f483c96de129`.

| Element | CIA-internal / pack path | SHA-256 (hashed or pack-recorded) |
| --- | --- | --- |
| Layout `HudMset_00` | `hud_LZ.bin/blyt/HudMset_00.bclyt` | `834c8f31e06d5c43bc2e651d59a2754a0c69346997df8e543f6a833200981114` |
| Clip `HudMset_00_Bat` | `hud_LZ.bin/anim/HudMset_00_Bat.bclan` | `e8c70db4c5f366e5251aba8c93e2a32a7622e595e511d000ac063f567de83729` |
| `HudBat_04.bclim` | `hud_LZ.bin/timg/HudBat_04.bclim` | `6e5e661417dbb2972de2d586dd05479dcc26539820e046f5c641d89ccaecee17` |
| decoded PNG | `textures/a38db030…png` | `a38db030a56d4f7be610ea8a6b1c567d9d12d6c65df2e7450ee16e9e41f6d179` |
| `HudBat_05.bclim` | `hud_LZ.bin/timg/HudBat_05.bclim` | `ded9e05759df120c1cf5f1cfecd7dd9891c1faa993040a979e69878795d6924c` |
| decoded PNG | `textures/0eefbdb3…png` | `0eefbdb3e25aabc813e86b6b4e1f7e16ae0b1f28f2b8f34b88edbf7c24e7fc47` |
| HUD font | `font/Hud_JP.bcfnt` (HOME `0004003000009802`; Settings binds `Hud.bcfnt`) | `172b12ad40f2feb04d4422ec67dead3b579a4706ca2a6413f652e1f7de026bb8` |
| font sheet-0 | `fonts/hud/sheet-0.png` | `c41bb1a929dd5755dbc6724afad2d3552474bfad9312019529029eb31b4fec28` |

Decoded PNG URLs match their filename SHA-256s when rehashed on disk. Clip
keys 4/5 select `HudBat_04` / `HudBat_05`. Pane `T_TimeC_00` is `txt1` size
`[7,20]`, local translation `[136,0]`, text `:`, font 1 (`Hud.bcfnt`). Glyph
`:` width is 4. `ExeFS/code.bin` SHA-256
`1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5` is the
identity already recorded in
[settings-hud-runtime](settings-hud-runtime-2026-09-26.md) /
[prev-seconds](settings-hud-prev-seconds-2026-10-04.md); this sparse review
lane did not re-hash a private `code.bin` blob (path absent under reachable
artifact roots). Colon / Bat writers `0x238aec..` / `0x238f10..` stay as in
those notes.

With BCLYT Y-up on the 400×240 root, `N_DateTime` at translation `[0,120]`
centres at screen `(200,0)`. Child origin-0 panes then land at still-matched
boxes: `P_Bat_00` `[368,0,32,20]`, `T_TimeC_00` `[336,0,7,20]`, `T_TimeL_00`
`[317,0,20,20]` (ends x=337), `T_TimeR_00` `[343,0,20,20]` (starts x=343).

## Unique bind (independent)

Opaque 190 texels, threshold 2, battery pane origin `[368,0]`:

| Still | Native opaque hit | Browser opaque hit |
| --- | --- | --- |
| page 3 | `HudBat_05` **190/190**; every other frame differs | `HudBat_04` **190/190** |
| page 4 | `HudBat_04` **190/190** | `HudBat_05` **190/190** |

All **137** residual pixels in `[377,6,18,8]` match native `HudBat_05` and
browser `HudBat_04` on page 3 (the reverse on page 4). Frames 0–3 and 6 do
not. `HudBat_04` vs `HudBat_05` differ by 141 texels; 137 are the residual;
the other four are alpha 0 at local x=27 (screen x=395), y=8..11.

The **32** colon pixels sit inside `T_TimeC_00` only: recount of upper
mismatches partitioned by pane boxes gives TimeL **0**, TimeR **0**, TimeC
**32**, elsewhere **137** (battery). Glyph `:` is 4 wide. Page 3 native has
the two 4×4 ink clusters; the browser is HUD beige. Page 4 is the reverse.
HOME `HudMenu_00` is not this title's HUD.

Texture-matched poses: page 3 native is colon on + Bat 5; page 4 native is
colon off + Bat 4. Same parity on each still is allowed when previous
displayed `+e5` and cached `+f1` share a second bit. It does not uniquely
require painting both from `lcdDate.getSeconds()`.

## Painter

`drawSettingsStatus` already binds `HudMset_00_Bat` to `hud.batteryFrame` and
`T_TimeC_00.visible` to `hud.colonVisible`. `sampleSettingsHud(null, 12000,
lcdDate)` for these stamps still paints colon off / Bat 4 on page 3 and colon
on / Bat 5 on page 4, the opposite of native. Dump uniquely owns the 169 as
Bat 4/5 plus `T_TimeC_00`. It does not uniquely require seeding `+e5` from
`lcdDate`, snapping colon to current seconds, or reconstructing a HUD.
Historical `lcdElapsedMs=12000` is not a recovered native epoch. No
`displayedDateMs` or `date.getSeconds()` in the Settings painter.

## Tests

Focused `tests/settings-other-p34-hud-169.test.mjs` passes here (2/2): dump
identity, unique Bat 4/5 and `T_TimeC_00` bind on the frozen pair, regression
hashes held, 12000 ms sampler still not `lcdDate` even/odd.

## Remaining

Predicted residual stays **169 / 8** and **169 / 35**. Lower glyph-edge
clusters are not this slice. Native HUD counter and previous displayed date
at the 26 September stills remain unrecovered. Pixel tiers still fail. Whole
scenarios still fail. Not 1:1.
