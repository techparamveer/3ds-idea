# Settings main focus pose: bounded source audit

25 September 2026. This audit asks whether the lower `top4btn` scene begins
with a yellow Internet button or five white buttons on a cold Settings entry,
and what Back from Internet or Other Settings paints. It reads the original
EUR 10.7.0-32E Settings image and delivered resources; it does not operate
Azahar or the browser. The current painter is unchanged because the traced
source does not yet establish the main scene's visual Select pose.

## Evidence

Settings title `0004001000022000`, content `0000003d`, mapped executable
SHA-256 `1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5`.
The original `table_LZ.bin` SHA-256 is
`1df90f560d13eb1fbc46f0a1c33b9f743b2686ad64eb5c0f980ac75224de7794`.
The exact source words and range hashes are in the SSD report
`reference/settings-main-focus-source-2026-09-25/report.json`.

| Scene record | Source member SHA-256 | Route fact |
| --- | --- | --- |
| `top4btn` | `fea73c10a5e76b2ca9ff8463acd42f3afbdb70802630a9784d3636636e49e872` | Names lower `Top_D_02`, five button labels and the Internet, Parental, Data, Other and NNID destinations. |
| `net_top` | `333a369d0c8ee63b20e9734ed945e92f4a504a5af8261ba560ce818d99359397` | Names `top4btn` as its Back scene. |
| `basic_top1` | `c90bb99d9ad5a4ed16e55f5c502313d022d85fe5834dd7bc669be3ba58949cfb` | Names `top4btn` as its Back scene. |

Generic scene construction calls the selection manager constructor at
`0x20c180`, applies action 6 with target 0 at `0x20c188–0x20c194`, and then
enters the scene-handle setup at `0x20c1a0`. Those calls establish a logical
initial target, but do not directly name a child button Select frame. The
layout factory compares `Top_D_02` at `0x2155d4–0x2155e0` and creates its
controller at `0x2159e0–0x215a00` through `0x239c38`. That constructor
initializes fields and a global condition; the traced range contains no
`I_TopLTs_Select` frame decision. This is a bounded observation, not proof
that no later callback selects it.

The existing [Other Settings focus audit](settings-other-focus-source-audit.md)
traces `BasicTop_D_00`'s explicit cross-scene row callback at
`0x22f944–0x22f968`, which gives an all-white visual pose after entry despite
logical row 0. `top4btn` uses `Top_D_02` and a different controller. The
Other-page callback therefore does not determine main's pose on a cold entry
or Back. The source `I_TopLTs_Select` clip is a two-frame resource, SHA-256
`7dbea46b5d36e952c89ce23fd0a24d8dfdbdcfcb53d267ebaf698f04f016c208`;
its frame 0 shows `Window_01` and frame 1 hides it and changes text RGB.
The delivered member hash matches the original `button_LZ.bin`. These are
distinct visual poses, so choosing one by default is consequential.

## Current live mapping and decision

`drawNativeSettingsMain` binds each source Select clip to frame 1 when that
button matches `view.selection`, and to frame 0 otherwise. The cold portfolio
state selects index 0, so Internet appears yellow. `settingsBack` preserves
the returned section's index on main: Back from Internet selects Internet;
Back from Other selects Other. Thus the painter does **not** always select
Internet on main, although it always selects one button in these paths.

The available isolated native capture covers Other page 1 only
(`reference/native-settings-2026-09-24/other-page1-opengl.jpg`, SHA-256
`38fc0d4cc78144064b6378969cbcb19cb702cb59d4e2588ca631a777e9f91192`).
It cannot resolve `top4btn`'s cold or return pose. Existing generated
`system-settings-main-bottom.png` files are portfolio renders, not native
capture evidence. No main-screen visual change is supported by this audit.

The next source step is to trace `Top_D_02`'s child-button Select callback and
the source/target-scene condition that calls it, then replay cold `top4btn`,
`net_top` → `top4btn` and `basic_top1` → `top4btn` separately. A coordinator
native capture of those three settled routes would confirm the pixels and
timing. Until then, main focus remains a possible 1:1 difference.
