# Independent review — HOME cursor / 1-row leftover — 5 October 2026

U17R. Grok 4.7 on
`/Users/paramveer/.codex/worktrees/home-anim-cursor-review-20261005`
(`codex/home-anim-cursor-review-20261005` at `3556026d`). Review of leftover
`3556026d` / worker note [HOME cursor anim](home-cursor-anim-2026-10-05.md).
Different model from the U17 worker (Grok 4.6). Docs only. No Azahar,
production `:3000`, preview 3021, or CDP. This review did not edit the
painter.

**Verdict: APPROVE** of `3556026d`.

Frozen 1-row native `4adc0ef0…` has no unused idle cursor pane. `LncCsr_00`
is already the idle bind. Decide and UnSelect write that same scene pane,
and frame 0 is the press. The note does not invent a pane and does not
excuse a painter change. This is not 1:1.

Implemented: N/A. Tested: N/A. Browser-inspected: N/A. Native-compared: N/A.
The recount below is from the pinned HOME `code.bin`, unpacked
`launcher_LZ`, the published launcher pack, and a local re-diff of the
already frozen pair.

## Assigned leftover

Worker commit `3556026d` on parent `bd0f8b72`. Note:
[home-cursor-anim](home-cursor-anim-2026-10-05.md). That commit adds the
note and `tests/home-cursor-anim.test.mjs` only.

## Pair (reused, not recaptured)

Neighbour mask rectangles `[32,118,80,82]` and `[112,118,88,82]`.
Threshold any RGB channel >2/255. Official lower crop of the native
400×480 PNG is `(40,240,320,240)`. Upper crop is `(0,0,400,240)`. Frozen
after-walk yaw 304 / COMMON 303 / Loop 338 / cursor 37.

| Item | SHA-256 |
| --- | --- |
| Native `_26.09.26_04.14.35.203.png` | `4adc0ef0cbba7175b641fbe4107f697f15ff7a4aadd482c746e389ea7abf5bdb` |
| After-walk upper | `2a2d920edce45c295d01a7479c0d1632b3c73e2bf04d38da1ca84e54abd26a6c` |
| After-walk lower | `cd0c87d30ab440b06a70d27787d58a6959e4e631c591a0cc319c02297903921a` |
| Masked lower report | `0069238f120e100fdd74ea9d4c484bfa46144818c0e2800a29be2207b3749d96` |
| Neighbour mask | `6b64f906f07315f9252e25f2df23c4b6e92c8535ab659b9e56523f71de587f6d` |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` |

Recomputed with the same crop, mask, 4-neighbour regions, and threshold as
`scripts/native-compare/compare.mjs`: lower **5,426**, upper **190**,
**58** lower components. Top six **2,220 + 1,656 + 561 + 391 + 162 + 145
= 5,135**. Tail **291**. Settings face core `[232,142,32,32]` is **0**
over 2 (max channel error **1**). Tail label remains Grok 4.6 **APPROVE**
`f72296ff` (“Record independent APPROVE of the HOME 1-row 291-pixel tail
attribution”), unlabelled tail **0**.

## Dump identity

EUR HOME `0004003000009802`. Pinned extract
`/Users/paramveer/.codex/3ds-artifact-overflow/assets/extracted/home/`.
`source.json` version **24576**. Installed `00000000.tmd` title version
**24576**, one content chunk, index **0**, id **`00000082`**, size
`0x39c000`. That `00000082.app` SHA-256 equals `source.json`
`contentSha256`
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.

`exefs/code.bin` SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Virtual base `0x100000`. `romfs/launcher_LZ.bin` SHA-256
`826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`,
equal to published `packs/home/launcher.json` `sourceSha256`. Delivered
pack SHA-256
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`.
Published `manifest.json` records converter **ctr-native-web 1.2.0** /
CTRTool **1.3.0**. Dump BCLYT/BCLAN/BCLIM bytes equal
`resourceSources`.

Cursor layouts in the unpacked archive are only `LncCsr_00`,
`LncCsrEfct_00`, and `LncCsrEfct_01`. No other BCLYT names a `Csr` pane.

## `LncCsr_00` is the idle bind

Dump `LncCsr_00.bclyt`
`72f59f9f3d0a327c6c1e3e012a1aa9f1a1a84ab3d0c829772ae4a2a43ecd0738`.
Tree: `RootPane` → `N_Scene_00` → `W_CsrF_00` (95×95, `LncCsr_41.bclim`)
and `W_CsrLgt_00` (78×78, `LncCsrShdw_44.bclim`). Groups: `G_Scale_00` is
the two windows; `G_Csr_00` is only `N_Scene_00`. There is no extra
picture or window.

`cursorAt` draws `LncCsr_00` with Select `pressed ? 5 : 0`, Scale
`scaleFrame`, and Loop `loopFrame`. The retained HOME path passes
`primaryScale.appliedFrame` and the cursor loop. This frozen route forces
loop **37**. Density 0 selects Scale frame **0**. Every bound Scale track
starts at frame 1, and frame 0 holds that first key (window sizes 95 and
78, the layout rest). Select frame 0 writes `N_Scene_00` translation.y
**0**. Decide and UnSelect are absent from that draw.

## Decide and UnSelect are the press, not a new pane

Both clips are 6 frames, non-looping, group `G_Csr_00`, `childBinding`
false. Dump targets are `N_Scene_00`, `W_CsrF_00`, and `W_CsrLgt_00`.
Because the group lists only `N_Scene_00`, the window size and scale keys
are not applied. Those keys are single constants on negative frames
(face scale 0.58 / size 68, light scale 0.7 / size 66). They do not move
the idle halo. The applied track is `N_Scene_00` translation.y:

| Clip | Frame 0 | Frame 5 | SHA-256 |
| --- | ---: | ---: | --- |
| Select (already bound) | **0** | **−2** | `ecdf8761f6e0c07c9405dc12f9d4d65f1b97b4c70bb110da4a0afc52fdc46e02` |
| Decide | **−2** | **0** | `f4e9629915edb668c9e93d3e734ee5e2247c372d8a0dcdedb0abc72ca936f89d` |
| UnSelect | **−2** | **0** | `8a1142d146b7294c09c9f828f2f74b21f6e82537717e7fb6fe2833e3842fa766` |

`W_CsrF_00` and `W_CsrLgt_00` are children of `N_Scene_00`, so frame 0 of
either unused clip translates the brackets by **−2**. That is the held
press already represented by Select frame 5. The Settings 32×32 core is
already inside threshold. Binding the press on this settled still would
move that matching face. It would not fill the labelled **1,656** halo,
the **2,485** ring, or the **291** tail.

## Loader `0x258d14`

Instructions are the file words. The only caller is `0x2b1ce8`. It passes
`r2` = `0x2b2014`, the string `LncCsr_00.bclyt`. The loader copies the
9-byte prefix `LncCsr_00` and formats `%s_Scale.bclan` at `0x258e18`.
Factory `0x22a658` then stores four controllers:

| Field | Resource | After the store |
| --- | --- | --- |
| `+0x80` | `LncCsr_00_Scale.bclan` | vtable `+0x28` with mode **5**, then vtable `+0x10` start |
| `+0x84` | `LncCsr_00_Select.bclan` at `0x258e28` | load only |
| `+0x88` | `LncCsr_00_Decide.bclan` at `0x258e40` | load only |
| `+0x8c` | `LncCsr_00_Loop.bclan` at `0x258e58` | vtable `+0x10` start |

The function returns at `0x258e14`. Decide is loaded and not started.
`LncCsr_00_UnSelect` does not occur in this `code.bin`. The only
`UnSelect` bytes are `ThmWndwBtn_D_00_UnSelect.bclan` at `0x326a2e`.
`home-cursor-loop.ts`, `home-cursor-presentation.ts`, and
`home-primary-cursor.ts` do not name Decide or UnSelect.

## Effects and the compact window

`LncCsrEfct_00` is `W_CsrEfct_00` on `LncCsrShdw_44.bclim`.
`cursorEffectAt` draws it for a move. `LncCsrEfct_01` panes are
`N_EfctRoot_00`, `N_EfctRoot_01`, `P_CsrEfct_00`, and `P_CsrEfct_01` on
`LncCsrShdw_50.bclim`
`33587eabdda5527f8df22893c61d5c8e177e53ece4d71cff7083dbe4094cae67`.
`launchCursorEffectAt` draws that ring. `LncCsr_00` does not reference
`LncCsrShdw_50`. Neither effect is on the idle `cursorAt` bind, and this
settled still is not a move or a launch.

`LncBase_U_00`
`b1afe7bece548a4ffad1211d011b4822349f61b002616e3a173e2923f06f6a50` and
`LncBase_U_00_ScaleUpDown`
`e1669ce6c081b61200d24d99cd4f61fd24b8c4967fef9b4a99728c29ee10f8d8` belong
to `drawHomeSuspendedWindow` in `home-suspended-window.ts` (ScaleUpDown
frame 0 compact / 15 expanded). That function is outside `cursorAt`.
This 1-row Settings still has no retained-title window. Upper **190**
stays the labelled banner gap.

## Why the painter stays

`3556026d` does not modify a painter, controller, or mask. The idle draw
is already Select 0 / Scale 0 / Loop 37 on `LncCsr_00`. Decide and
UnSelect add no pane; frame 0 presses the existing scene. Effect layouts
and `LncCsrShdw_50` are move/launch. Compact `LncBase_U_00` is another
owner and is not on this pair. A recapture of this frozen route would
still score masked lower **5,426** and upper **190**. Loop 37 stays a
verification freeze. Whole-scenario 1:1 still fails. Input, motion, and
audio remain open.

## Evidence

| Tier | Result |
| --- | --- |
| Source-identified | Dump `LncCsr_00` panes `RootPane` / `N_Scene_00` / `W_CsrF_00` / `W_CsrLgt_00`. Decide and UnSelect frame 0 `N_Scene_00` translation.y **−2**, group `G_Csr_00` only. Loader `0x258d14` starts Scale and Loop, loads Decide, does not contain UnSelect. Frozen re-diff lower **5426** / upper **190** / tail **291** |
| Delivered | Published launcher pack `f251db1a…`. Dump hashes match `resourceSources` |
| Implemented | N/A. Painter unchanged in `3556026d` |
| Tested | N/A |
| Browser-inspected | N/A |
| Native-compared | N/A. Reused frozen `home-row-viewport-20261004` pair only. Not recaptured. Not 1:1 |

## Checks

No test file was run for this review. `git diff --check` on this note.
This lane did not drive Azahar or `:3000` and did not recapture.

## Remaining

Masked lower **5426**, upper **190**, labelled tail **291**, unlabelled
**0**. Whole HOME 1-row still fails. Static still only. Not 1:1.
