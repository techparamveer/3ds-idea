# HOME cursor / 1-row leftover — no unused idle pane — 5 October 2026

Worker U17 `home-anim-cursor-20261005` / `codex/home-anim-cursor-20261005`
from fidelity `bd0f8b72`. Sparse worktree; no `model/`. Docs and tests
only. No painter change. No controller change. No Azahar. No production
`:3000`. No preview 3021. No CDP. No recapture. Do not paint cursor
brackets.

H-12 still lists compact-window motion and remaining cursor motion as
incomplete. The living leftover on this lane is the frozen
[1-row Right walk](home-row-viewport-2026-10-04.md). Neighbour-masked
lower stays **5,426**. The [tail **291**](home-row-tail-2026-10-05.md) is
already labelled, Grok 4.6 **APPROVE** `f72296ff`, unlabelled tail **0**.
This slice asks whether any unused dump pane uniquely owns the remaining
cursor / compact residual. None does.

Evidence: source-identified and tested. Not browser-inspected here. Not
native-compared here. Not 1:1.

## Pair

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-row-viewport-20261004/`.
Frozen after-walk yaw 304 / COMMON 303 / Loop 338 / cursor 37. Threshold
any RGB channel >2/255. Official lower crop of the native 400×480 PNG is
`(40,240,320,240)`. Neighbour mask rectangles stay
`[32,118,80,82]` and `[112,118,88,82]`.

| Item | SHA-256 |
| --- | --- |
| Native `_26.09.26_04.14.35.203.png` | `4adc0ef0cbba7175b641fbe4107f697f15ff7a4aadd482c746e389ea7abf5bdb` |
| After-walk upper | `2a2d920edce45c295d01a7479c0d1632b3c73e2bf04d38da1ca84e54abd26a6c` |
| After-walk lower | `cd0c87d30ab440b06a70d27787d58a6959e4e631c591a0cc319c02297903921a` |
| Masked lower report | `0069238f120e100fdd74ea9d4c484bfa46144818c0e2800a29be2207b3749d96` |
| Neighbour mask | `6b64f906f07315f9252e25f2df23c4b6e92c8535ab659b9e56523f71de587f6d` |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` |

Already labelled on this pair and not reopened: upper **190**
[`mt_pict` / wrench](home-upper-190-2026-10-04.md), neighbour peeks
**2,220 / 561+391+145** [About / Camera](home-neighbor-peeks-2026-10-04.md),
Settings+cursor **1,656** [`LncCsr_00`](home-settings-cursor-2026-10-04.md)
(Loop 37 stays a freeze), News lamp **162** on empty `N_NewsRcv_00`,
footer ROI **30** [cursor-ring bottom](home-footer-edges-2026-10-04.md),
tail **291** (78 mask-miss `P_BtnShdw_00` + 30 cursor fringe + 183
cursor/shadow/peek/News). Unlabelled tail **0**.

This still is settled 1-row Settings. There is no other retained title, so
there is no compact `LncBase_U_00` window on either LCD.

## Dump identity

EUR HOME `0004003000009802`, version 24576, content 0 / `00000082`.
`exefs/code.bin` SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Virtual base `0x100000`. Delivered `packs/home/launcher.json` SHA-256
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`,
`sourceSha256`
`826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`.
Converter `ctr-native-web` 1.2.0 / CTRTool 1.3.0.

Published cursor layouts are only `LncCsr_00`, `LncCsrEfct_00` and
`LncCsrEfct_01`. `LncCsr_00` panes are `RootPane`, `N_Scene_00`,
`W_CsrF_00` (95×95 on `LncCsr_41.bclim`) and `W_CsrLgt_00` (78×78 on
`LncCsrShdw_44.bclim`). There is no unused picture or window on that
tree.

| Element | CIA path | SHA-256 |
| --- | --- | --- |
| `LncCsr_00` | `launcher_LZ.bin/blyt/LncCsr_00.bclyt` | `72f59f9f3d0a327c6c1e3e012a1aa9f1a1a84ab3d0c829772ae4a2a43ecd0738` |
| `LncCsr_00_Loop` | `anim/LncCsr_00_Loop.bclan` | `0bf11061be32b1af39749b8ae8342b8010b65ed9dfd257dbce76e38618b76744` |
| `LncCsr_00_Scale` | `anim/LncCsr_00_Scale.bclan` | `74277ac0ec8debf4f035b6e4c629fb9605c897fcb50e6b5ed2447250c671c2dd` |
| `LncCsr_00_Select` | `anim/LncCsr_00_Select.bclan` | `ecdf8761f6e0c07c9405dc12f9d4d65f1b97b4c70bb110da4a0afc52fdc46e02` |
| `LncCsr_00_Decide` | `anim/LncCsr_00_Decide.bclan` | `f4e9629915edb668c9e93d3e734ee5e2247c372d8a0dcdedb0abc72ca936f89d` |
| `LncCsr_00_UnSelect` | `anim/LncCsr_00_UnSelect.bclan` | `8a1142d146b7294c09c9f828f2f74b21f6e82537717e7fb6fe2833e3842fa766` |
| `LncCsrEfct_00` | `blyt/LncCsrEfct_00.bclyt` | `d790461dba3bb8ebb6653c5366b9d502d4b8c709f37ec65224bbe7286c1da6b9` |
| `LncCsrEfct_01` | `blyt/LncCsrEfct_01.bclyt` | `bc9711bf8baa19830ee32619a66e81b354a21a712d79a62f89ee32b2b7f0ced8` |
| `LncCsr_41.bclim` | `timg/LncCsr_41.bclim` | `22956cfb74b6a47883d65e262f940952bd8c6732bf56c105c08066e933daff9a` |
| `LncCsrShdw_44.bclim` | `timg/LncCsrShdw_44.bclim` | `3887e11905c6b27b1965aee3fea6e0caae0a2af9666e839388a2d85c05f6b57e` |
| `LncCsrShdw_50.bclim` | `timg/LncCsrShdw_50.bclim` | `33587eabdda5527f8df22893c61d5c8e177e53ece4d71cff7083dbe4094cae67` |

`cursorAt` already binds Select 0 (released) / Scale
`primaryScale.appliedFrame` / Loop `appliedFrame` (or the forced
diagnostic 37). Density 0's unique Scale frame is 0. The Settings 32×32
face core stays inside threshold. `LncCsrEfct_00` / `LncCsrEfct_01` are
move/launch effects and stay off this idle draw.
`LncCsrShdw_50.bclim` is the launch-ring texture on `LncCsrEfct_01`, not
an idle pane.

## Unused clips are not unused panes

`LncCsr_00_Decide` and `LncCsr_00_UnSelect` are published 6-frame
non-looping clips. Both write the already-bound panes `N_Scene_00`,
`W_CsrLgt_00` and `W_CsrF_00`. They do not introduce a new picture,
window, or texture.

| Clip | `N_Scene_00` translation.y | Idle meaning |
| --- | --- | --- |
| `Select` frame 0 (already bound, released) | **0** | settled idle |
| `Select` frame 5 | **−2** | held press, already the `pressed` bind |
| `Decide` frame 0 | **−2** | press pose |
| `Decide` frame 5 | **0** | released after Decide |
| `UnSelect` frame 0 | **−2** | press pose |
| `UnSelect` frame 5 | **0** | released after UnSelect |

The other Decide / UnSelect tracks are constant window size and scale
keys sitting on negative frames. They do not move the idle halo. Binding
either unused clip at frame 0 on this settled still would write
`N_Scene_00` **−2** and change the already-matching Settings face. That
is painting brackets. Native loader `0x258d14` creates Scale, Select,
Decide and Loop; it starts Scale and Loop and does **not** start Decide
([clock evidence](../scripts/firmware/CURSOR_LOOP_CLOCK_EVIDENCE.md)).
UnSelect is not one of those four controllers.

`home-cursor-loop.ts` owns only `LncCsr_00_Loop`.
`home-cursor-presentation.ts` owns Scale and the two `LncCsrEfct_00`
DisAppear instances. `home-primary-cursor.ts` owns request / visibility /
LCD centre. None of those units starts Decide or UnSelect. The
[presentation note](home-cursor-presentation-runtime.md) already records
that full Select/Decide host lifecycle is outside that controller.

## Compact window is a different pair

[Compact window](home-compact-window-2026-10-02.md) already samples
`LncBase_U_00_ScaleUpDown` frame 0 (compact) / 15 (expanded) from
`home-suspended-window.ts`. That file is outside this slice. This 1-row
Settings still has no compact or expanded retained-app window. Upper
**190** remains the labelled banner `mt_pict` / wrench gap, not
`N_WndwScale_00`. `LncBase_U_00_Sleep` live phase, `KeyDecide` /
`KeyPress`, and caption loops therefore cannot uniquely own this leftover.
Do not adopt Sleep frame 0 as a 1-row clock.

## Why the painter stays

`LncCsr_00` is already the idle cursor bind. The unused clips write its
existing panes and would press the cursor if applied here. The unused
effect layouts and `LncCsrShdw_50` belong to move/launch, which this
still does not show. Compact `LncBase_U_00` panes are not on this pair.
The 1,656-pixel halo, 2,485-pixel ring and 130-pixel labelled fringe
remain after the already-best cursor-37 freeze. No unused pane, texture
or sampler uniquely accounts for them.

The painter is unchanged, so a recapture of this frozen route still
scores masked lower **5,426** and upper **190**. Loop 37 stays a
verification freeze, not a live epoch. Whole-scenario 1:1 still fails.
Input, motion and audio remain open. Matrix unchanged.

## Tests

Focused `tests/home-cursor-anim.test.mjs`: pins the three `LncCsr_*`
layouts and five `LncCsr_00_*` clips, the already-bound `cursorAt`
Select/Scale/Loop path without Decide/UnSelect/`pictureSampling`, Decide
and UnSelect writing only the existing panes with idle frame-0 **−2**,
the three allowed controllers staying Decide/UnSelect-free, compact
`ScaleUpDown` staying off this pair, and — when `R` is present — the
hashed 1-row identities plus masked lower **5,426**.
