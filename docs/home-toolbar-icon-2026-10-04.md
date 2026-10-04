# HOME 1-row toolbar News receive-lamp source gap — 4 October 2026

Worker `3ds-home-toolbar-icon-20261004` / `codex/home-toolbar-icon-20261004`
from HOME fidelity `bc6f4c23`. Sparse worktree; `node_modules` linked from
HOME fidelity. No `model/`. No runtime change. No Azahar. No preview 3021.
No CDP 9320. No recapture. No guessed icon, mip, sampler or unread count.

The [1-row Right walk](home-row-viewport-2026-10-04.md) leaves neighbour-face
masked lower at **5,426** over 2/255. Toolbar ROI `[0,0,320,33]` is **164**.
The largest remaining masked component is **162** at `[161,0,17,16]`, plus
two pixels at `[165,14,2,1]`. The viewport note called that cluster
"toolbar HOME icon". It is not `G_Light_00` / the house+wrench. That left
icon is **0** over 2. The 164 toolbar pixels are the Notifications receive
lamp on empty `N_NewsRcv_00`.

Evidence: source-identified and tested. Not browser-inspected here. Not
native-compared here. Not 1:1.

## Pair

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-row-viewport-20261004/`.
Frozen after-walk yaw 304 / COMMON 303 / Loop 338 / cursor 37. Neighbour
mask `R/adaptation-neighbor-mask.json`. Threshold any RGB channel >2/255.

| Item | SHA-256 |
| --- | --- |
| Native `_26.09.26_04.14.35.203.png` | `4adc0ef0cbba7175b641fbe4107f697f15ff7a4aadd482c746e389ea7abf5bdb` |
| After-walk upper | `2a2d920edce45c295d01a7479c0d1632b3c73e2bf04d38da1ca84e54abd26a6c` |
| After-walk lower | `cd0c87d30ab440b06a70d27787d58a6959e4e631c591a0cc319c02297903921a` |
| Masked lower report | `0069238f120e100fdd74ea9d4c484bfa46144818c0e2800a29be2207b3749d96` |
| Neighbour mask | `6b64f906f07315f9252e25f2df23c4b6e92c8535ab659b9e56523f71de587f6d` |

Official lower crop of the native 400×480 PNG is `(40,240,320,240)`.
Inspected `R/diff-after-masked/lower-contact-sheet.png` and
`R/after-origin-right/lower.png`. Native paints a cyan unread lamp on the
News balloon; the browser balloon has no lamp. Max channel error 248 at
`(165,6)`: native `(248,253,255)` versus browser balloon teal
`(0,200,152)`. House ROI `[10,0,42,33]` is 0.

## Layout

EUR HOME `0004003000009802`, version 24576, content 0 / `00000082`,
`exefs/code.bin` SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Virtual base `0x100000`. Delivered `home.launcher` /
`packs/home/launcher.json` SHA-256
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`.
`layouts.LncBase_D_01` → `launcher_LZ.bin/blyt/LncBase_D_01.bclyt`
SHA-256 `787e6b58e0455130ae1f7f4f35a5edf4472c8a21151a53bbce782e813fab5adf`.
Converter `ctr-native-web` 1.2.0 / CTRTool 1.3.0.

`N_NewsRcv_00` is an empty `pan1` (no children), size 4×4, origin 4,
translation `[11,113,0]`. LCD centre `(160+11,120-113)` = **(171, 7)**.
That point sits inside `[161,0,17,16]`. The same empty-mount pattern is
`N_FrdRcv_00` `[-31,113]`, `N_WebRcv_00` `[53,113]`, `N_MvsRcv_00`,
`N_LgtRcv_00`. `G_News_00` only names `B_News_00` / `P_News_10`; the
receive mounts live on `G_MvsToggle_00`. `LncBase_D_01_Select` therefore
cannot own the lamp.

Delivered launcher members for the attached artwork (not requested by the
live presenter):

| Member | CIA path | SHA-256 |
| --- | --- | --- |
| `LncRcvLampSrc_01` | `launcher_LZ.bin/blyt/LncRcvLampSrc_01.bclyt` | `799596bcb744ea79ed9a59ab3fc716b7a6fa2760a2ba2174410d928003a56a6d` |
| `LncRcvLampSrc_01_ReceiveBlue` | `anim/LncRcvLampSrc_01_ReceiveBlue.bclan` | `76e02042798431cd7c52565b2eb995b8fb35e3a357292669c93e8deb72671b77` |
| `LncRcvLampSrc_00` | `blyt/LncRcvLampSrc_00.bclyt` | `e1052f3e7f279cc235833392a3becffd3695c99c513a3e084a89517e5165b2d8` |
| `LncRcvLampDist_00` | `blyt/LncRcvLampDist_00.bclyt` | `e0a27109a2bd06690cf74f7ab26efdc61380f773841481bc9431e0d66b924fd8` |

`LncRcvLampSrc_01` picture `P_Rcv_00` is 22×22 on textures `RL_01.bclim` /
`RL_03.bclim`. Centered on `(171, 7)` it covers the 162-pixel bbox. HOME
`packs/home/receivelamp.json` (`receivelamp_LZ.bin`, `RcvLamp_00`) is a
different archive; its string table sits with Theme Shop names, not this
toolbar ctor. The Notifications-list lamp
([unread marker](notifications-unread-marker-source-trace-2026-09-27.md))
is title `000400300000a002` and is not this HOME toolbar bind.

## Executable

Name pointers at `0x33d110..0x33d120`: `N_FrdRcv_00`, `N_NewsRcv_00`,
`N_WebRcv_00`, `N_MvsRcv_00`, `N_LgtRcv_00`. The ctor copies those five
addresses at `0x2b266c..0x2b267c`. Loop `0x2b2318..0x2b23ac`
(`add r5,#1` / `cmp r5,#5` / `blt`) looks up each pane (`0x2292e4`),
copies the mount translation into the new lamp root, then
`0x2b239c` `mov r1, #0` / `bl 0x232234` — the lamps are created hidden.
Post-loop `0x2b23b0..` binds `LncRcvLampSrc_01` ReceiveOrange / Green /
Blue / GreenBlue / Pink clips onto the five objects. Which clip is
playing, and at which pulse frame, is not a settled store in this range.

No later unique write was found that forces News visible, Friends/Web/Mii
hidden, and a single `ReceiveBlue` frame for this still. Portfolio
Notifications stay empty; the isolated native profile that produced
`_26.09.26_04.14.35.203.png` has an unread lamp. Copying that unread bit,
seeding a pulse frame from the still, or attaching `ReceiveBlue` frame 60
(the list-pose default) would be a guess.

## Why the painter stays unchanged

`firmware-presentation` `toolbar()` draws `LncBase_D_01` with
`PaletteOut` 12, `MvsToggle` 0, optional `Invalid` / touch `Select`. It
has no `attachments` for `N_NewsRcv_00`. `homeLayouts.launcher` does not
request `LncRcvLampSrc_00`, `LncRcvLampSrc_01` or `LncRcvLampDist_00`.
Showing the lamp on this Settings-HOME still is not a unique unused
layout bind: visibility and clip/frame remain unobserved, and the five
sibling mounts stay dark on the same native still. Do not invent a
sampler, mip or always-on badge.

Settings Other page-2 painter, HudMset `+e5`, Sound HUD 5/4 and
`chargingBatteryFrame` were not touched.

## Tests

Focused `tests/home-toolbar-icon.test.mjs`: pins the empty News mount and
LCD centre, the five Rcv siblings, `G_News_00` excluding the mount,
delivered `LncRcvLampSrc_01` 22×22, omitted launcher requests, and
`toolbar()` having no attachments. When `R` is present, pins toolbar 164,
component 162, house 0, and the named SHA-256 identities.

## Remaining / next coordinator action

Masked lower stays **5,426**. Toolbar 164 / News lamp 162 remain. House
matches. The 1,656 Settings+cursor cluster is now a labelled
[source gap](home-settings-cursor-2026-10-04.md). Next visible lower work
is neighbour peeks, not this lamp, until a source-backed HOME
receive-state owner exists. Do not recapture for this documentation
slice. Reuse the matching 1-row Right walk. Whole-scenario 1:1 still
fails. Matrix unchanged.
