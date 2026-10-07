# Notifications incoming entry source gap

## Outcome

This is the one bounded Notifications incoming-source pass following the
coordinator's visible outgoing-cover recapture. It identifies the title-owned
cover, ordinary startup writer and separate LCD completion state. It does not
implement or publish an incoming cover. Lower component activation and its
relationship to the cover are unresolved. A paired overlay over the currently
settled stock painter would not reproduce the traced native draw order.

Delivered files are this handoff and
`tests/notifications-entry-source.test.mjs`. Runtime, public assets, manifest,
Notes sequencing, Manual and folder behavior are unchanged. Friends was not
traced in this slice. Local base is `a556ab33e05cc1f57b24c447b332834c43b25148`;
the coordinator has since integrated folder host gates at `8558a1e2`.
Dirty local STATUS is preserved and excluded from delivery.

## Visible defect

The existing browser incoming path reveals the settled Notifications pair
after the receipt-backed HOME outgoing cover. Notifications' own incoming
cover and component ordering are absent. AN-01 remains fail.

The coordinator's normal-speed native capture
`native-manual-slow/screenshots-notifications-normal/_07.10.26_16.22.50.365.png`
has SHA-256
`968fc663d29c059297c97629b9ca6f336bfd68f984689a2f5f5fcdf7282431c9`.
Worker inspected the original 400x480 PNG. Its upper HUD/unread pane are
already visible while the lower Notifications belt is clearing over a
near-white background. This is ordering evidence, not a measured native
duration or a source-frame assignment. No matching browser incoming pair,
mask or pixel report is claimed for this slice.

All private paths below are rooted at
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/`.

## Pinned extraction

Original read-only input is
`native-manual-slow/user/nand/00000000000000000000000000000000/title/00040030/0000a002/content/00000012.app`.
Full content SHA-256 is
`80e73dc01348a7e68975073ba4317856e9b79821b27ce4d65692612c500dacc8`.
It matches manifest title `000400300000a002`, version 4097, contentIndex 0,
contentId `00000012`, resourceContentIndex 0, EUR English. The manifest's CIA
identity is `edbe3dec63e8ac70a033df4216baafe27d94e4ee11ea9407d88567a1ed5190ae`;
that CIA was not re-extracted or rehashed in this slice.

CTRTool 1.2.0 at
`/Users/paramveer/Downloads/Smelt.app/Contents/Resources/ctrtool`, SHA-256
`1b91c6339bab12453fdf06f28d4a40d39a81e785e7eda92e555a9bcabb1d1991`,
extracted only into the newly assigned `notifications-entry-source/`.
Original content, executable, configuration and old broken private paths
remain untouched. `exefs/code.bin` is decompressed ARM code with image base
`0x100000`, SHA-256
`b3993f1e4fe5ed7e5760f0f4c3926c95b42ea8de53c25bb95864499342e5b228`.
This matches earlier Notifications code evidence.

Source decoding used existing `ctr-native-web` 1.5.4 code, not a new converter:
`scripts/firmware/native.py` SHA-256
`0acd5820861c357a55e2e86f12d58addfc985aeb3b536123f67fe93fa3fe0a06`,
`scripts/unpack_home_resources.py` SHA-256
`02581cb73e4f35c05d9fdd173bb7dbb03a6085c6f5ec40d12c988e19cc28bf7b`.
Existing read-only Capstone 5.0.7 supported disassembly; no packages were
installed. No new public conversion occurred.

## Resource binding

Original `romfs/common_LZ.bin` compressed archive SHA-256 is
`1ac03207aa03eb4f447e7ae5d4fe7f64fba08dca055717b8ff0ce9067db8e4ae`.
No Notifications manifest pack currently delivers this archive. It must not
be replaced by HOME `packs/home/common.json` or its selector 2 binding.

| Element | Member in title common_LZ.bin | Member SHA-256 |
| --- | --- | --- |
| Upper cover | `blyt/CmnFade_U_00.bclyt` | `727986552371a72c62a0a24f11e2ef778d90156b210b9d009f9e1c301aa9620b` |
| Lower cover | `blyt/CmnFade_D_00.bclyt` | `e8fb04c1e1dbea4523423f4e7b18d3ae50801f6b5b312c02a1510869e1c5b1c6` |
| Upper incoming | `anim/CmnFade_U_00_SceneIn.bclan` | `d5e5dad524a7d074362ddc5de840dd64be715c021229c0fb8b0d1aa93d54d805` |
| Lower incoming | `anim/CmnFade_D_00_SceneIn.bclan` | `e47fa2508f3aa924cea2d5901ed04d8c271ba19730915f2265509cf1956d3fe2` |
| Background light | `timg/BgLgt.bclim` | `c0d63a4ee5205e77b89b18b334ffbd13df83a06912ac258119a46160791f983b` |
| Background line | `timg/BgLine.bclim` | `f9d858867fbd4c5db9d3fccb83819b9ed41052e96aeac9bcde0b63ed262134cc` |
| Belt lines | `timg/LncApltBeltLine_00.bclim` | `e89489c43f81e212a19b5370dc2905f4b1580ffcc011ee0ecb05c010d4c1e434` |
| Belt mask | `timg/LncApltBeltMask_00.bclim` | `1dd62f26e7387aea82f14c80bfdd89b0316d9a773eb7aac42b8349b8d91b4e55` |
| Belt | `timg/LncApltBelt_00.bclim` | `d41841f80d82c1f95eb3efb62103f13af506ccb12c5ab30ff153f9702870fd71` |
| Authored hidden HOME icon | `timg/LncApltPictHome_00.bclim` | `c50f34febfce1b655d775997c7e8fa252e436626b5b283342e970114df00c406` |
| Notifications icon | `timg/LncApltPictNews_00.bclim` | `dfded3b8d750da95d921f06468e02d87dccc3ca86c62a700c5edcb4da3fd9a1e` |

Both SceneIn clips have 21 source poses 0..20, no loop, childBinding=true,
sourceFrameRange `[20,40]`. Each background alpha track has Hermite keys
`(0,255,-12.75)` and `(20,0,0)`. Lower belt alpha has the same keys;
translation.x has `(0,0,-4)` and `(20,-80,0)`. Original step keys at -10 hide
`P_Home_00` and show `P_Aplt_00`. Original lower material-color tracks at -10
write `(55,205,165)` into belt constantColor 1. These are authored tracks,
not CSS fades or timing measurements.

Preserve the lower belt 480x64 at `[0,-4,0]`, icon 32x32 at `[-152,4,0]`,
original doubled icon UVs, texture transforms/TEV stages and text parent path
`RootPane/P_Belt_00/P_Aplt_00/T_Aplt_00`. Preserve the upper picture's original
white/black vertex colors and original two-texture background material.
The title contains separate NinLogo resources; ordinary startup below selects
normal CmnFade, not that other branch.

English label is already delivered in
`packs/notifications/messages-and-loose.json` SHA-256
`69afc667ca78a6087fd1b2ae296c89d13603a648790ccd7d6762b783ed949112`.
Use `newslist_msbt_LZ/new_title_new` and style 13, text `Notifications`, not
HOME `menu_msbt_LZ/lau_title_news`/style 12. Original source message index is 26;
the published selection remaps it to 0 without changing message content.
Style 13 has fontScale `[0.8999999761581421,0.8999999761581421]`, zero line and
character spacing, and unresolved original style words. Do not invent a font
size or discard those unresolved fields.

| CIA-internal message resource | Compressed SHA-256 | Decompressed manifest resource-source SHA-256 |
| --- | --- | --- |
| `romfs/message/EU_English/newslist_msbt_LZ.bin` | `cd9261dd122c66ff8feaddc68f2bd5f8e199ebb90feb7067976fa34fa0966652` | `72d4794bb526ae90bb7d06e99a039ea1701044dad3b850983217a8a63b2cbb62` |
| `romfs/message/EU_English/RI_mstl_LZ.bin` | `bd8b581be5f49d28cbf81321595c1451e6634e701563696d1e41aa4fc20bcf03` | `23833acc620efbf4f5119ce7c0dace5ac68e9055f79eb54cc3489c60b6d65834` |

## Code boundary

Addresses are image addresses; subtract `0x100000` for code.bin offsets.

| Original code | Established behavior |
| --- | --- |
| `0x1879d0..0x187a10` | Ordinary startup builds a both-LCD command with lower `CmnFade_D_00`, upper `CmnFade_U_00`, message-label literal `new_title_new` at `0x187a14`, then calls `0x17fcc0`. |
| `0x17fcc0..0x17fd00` | If own common resources exist, builds command type 1 and invokes `0x14f8dc`; this is the SceneIn branch, not type 2 SceneOut. |
| `0x14f8dc..0x14fdd0` | Loops native LCD index 0 lower and 1 upper. Creates separate layouts and SceneIn animators; starts type 1 at `0x14fb0c`, writes per-LCD state 1. |
| `0x14fd34..0x14fd94` | Resolves command message label through `0x149d8c` and writes localized text into `@T_Aplt_00`/`@T_Home_00` through `0x14a680`. |
| `0x14a680..0x14a720`, `0x116948..0x116c10` | Finds the native TextBox pane and writes resolved UTF-16 text. The selected original message has style 13. |
| `0x14f9f8`, `0x14ab1c` | Cover constructor priority 3 is stored with native LCD index at layout offsets +0x58/+0x54. |
| `0x180c64..0x180c6c` | Own HudMenu upper constructor uses LCD 1 and priority 100. |
| `0x17c534..0x17c53c` | NewsUnread upper constructor uses LCD 1 and priority 500. Descriptor `0x1a6ea8+4` points to `NewsUnread_U_00.bclyt` at `0x19e36d`. |
| `0x116c24..0x116c78`, `0x1484d0..0x1484f0` | Inserts strictly greater incoming priority before the existing node, advances on signed less-than-or-equal, and preserves arrival order for equal priorities. The list is descending. |
| `0x154138..0x154280` | Traverses the list forward in the post3D pass and invokes each enabled layout draw at vtable+0x0c. Among the traced upper layouts, NewsUnread500 then HUD100 draw before cover3. The cover is the final traced title-layout overlay. |
| `0x103b50..0x103d84` | Polls each LCD animator/state independently, retires completed cover resources independently and can dispatch queued per-LCD commands. |
| `0x1384c4..0x138550` | Both-LCD completion requires neither LCD state 1/2 and checks each layout visibility independently. |

The original comparison at `0x116c50` is incoming priority against existing
priority. `0x116c54` is signed BLE to `0x116c60`, which follows the next link.
The incoming priority comes from object+0x58. The existing load at
`0x116c4c` reads node+0x54, also object+0x58 because the link node is object+4.
The greater branch enters the original insert-before helper at `0x1484d0`.
The draw loop follows the next link at `0x154274` and branches back at
`0x154280`. This agrees with the independently executed descending HOME list
in [native upper composition](../native-upper-composition.md).

The initial handoff at `3d58f199` inverted this order. Its claim that a final
title cover would violate native priority is withdrawn. A title cover after
the traced HUD/unread layouts preserves their relative draw order. This does
not establish the frame-dependent activation or visibility of those layouts.

Separate animator objects are not proof of an arbitrary upper/lower time
offset. The startup command starts both, but lower row/button/background
activation relative to that command was not established. Current stock code
samples NewsUnread SceneIn 20, HUD SceneIn 40, lower rows SceneIn 10 and lower
Close SceneIn 20. Adding the original title cover to that settled pair would
not establish the original component sequence or the independent LCD phases.
No universal paired SceneIn is justified by this ordering result.

The exact unresolved source boundary is the lower title component activation
and visibility rule around ordinary startup's queued command `0x01000015`
at `0x187a00..0x187a10`. This pass does not assign independent incoming LCD
epochs, durations, delay counters or component SceneIn frames. It stops here;
no further speculative source slice is proposed.

## Checks and handoff

Focused command:

```sh
node --test --test-reporter=spec tests/notifications-entry-source.test.mjs tests/notifications-hud-3347.test.mjs tests/notifications-lower.test.mjs tests/applet-entry-assets.test.mjs
```

Result after the ordering correction: 18 pass, 0 fail, 2 historical private-pair
skips. The four Notifications entry source checks all ran without skips.
They decode original layouts/animations,
sample source poses 0/20 through `poseNativeLayout`, verify archive/member/code
hashes and startup literal/opcodes, and compare original localized text/style
with the published selection.

The ordering regression executes pinned ARM instructions in the existing
read-only Unicorn 2.1.4 environment at
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/camera-grid-venv/bin/python`.
It inserts all six permutations through `0x116c24..0x116c78` and
`0x1484d0..0x1484f0`, then runs the post3D list setup/traversal at
`0x154138..0x154280`. Every permutation records `NewsUnread500`, `HUD100`,
`cover3` through the original virtual draw call. Equal priorities preserve
arrival order, and a synthetic negative priority checks the signed comparison.
In-memory BLE-to-BGE and next-to-previous mutations change the observed draw
order. The original executable is never modified.

List memory, layout objects, enabled-object flags, stack and draw-vtable leaves
are synthetic. The fixture seeds the post3D cursor at the first list node and
marks GPU setup complete with r7=1, so GPU setup/drawing and the preceding
pre3D pass do not execute. It proves bounded insertion/traversal order, not
native pixels, pane activation or motion timing. The instruction hook rejects
calls outside the stated slices and recorded draw leaf.

The checks skip explicitly on machines without the private extraction;
`NOTIFICATIONS_ENTRY_SOURCE_ROOT` can select an alternate absolute directory.
The ordering check also requires an existing Unicorn interpreter, selectable
with `FIRMWARE_ARM_PYTHON`. The initial invocation returned SIGILL during
emulator memory allocation; the successful rerun is the result recorded above.
This does not verify or claim a change to the user's permission settings.
No packages were installed. `git diff --check` passed. No runtime change means
no build or GUI recapture was run.

Source identified and tested are the result of this slice. Incoming resources
are not delivered, incoming motion is not implemented, browser inspection and
matched native comparison are not performed. No incoming resource readiness
or terminal input gate has been added. Existing outgoing owner/prepared-pair/
valid-WebGL-receipt guards remain intact; all B folder host gates remain the
coordinator's integrated version. Existing portfolio notification content,
HUD clock/profile and scrollbar fits remain declared adaptations in their
earlier records. Native input epoch, rate and muted audio remain unaccepted.

Coordinator decision is needed at this source gap: a future capture-fitted
ordering must be explicitly labelled an adaptation and retain independent LCD
poses, current title-owner/application/generation/prepared-pair identity and
valid paired render receipts. No such fit or invented delay is in this commit.
