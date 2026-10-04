# Camera Welcome page 1 remaining 0 / 1,401 lower source gap — 4 October 2026

Stock/Camera worker on `codex/camera-welcome-p1-1401-20261004` from HOME
fidelity `b37da78c`. Sparse worktree; `node_modules` linked from HOME
fidelity. No `model/`. No runtime change. No Azahar. No preview 3021. No
CDP 9320. No recapture. No CSS, font, mip, sampler or second CGFX
projection. Capture stays inert. The already-bound shoot underlay /
`P_Shoot_D` / modal black-alpha128 stay untouched
([underlay note](camera-shoot-underlay-2026-10-04.md)). HOME 1-row
leftovers stay labelled and are not reopened.

This is not a 1:1 claim. Independent review **APPROVE** of fidelity
`c07e7de9` / worker `adf0cf88`. Tests and this note do not close pixels, input,
motion or audio. Coordinator recapture remains the acceptance gate.

## Pair (reused, not recaptured)

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260926/reference/scenario-matrix/v1/captures/camera-guide-page1-modal-0d7bfea/`.
Empty mask. Threshold any RGB channel >2/255. Official lower crop of the
native 400×480 PNG is `(40,240,320,240)`.

| Item | SHA-256 |
| --- | --- |
| Native `camera-first-run/native/combined.png` | `52a6dcf75c85d9be6cdc9e245f5767acfcf4373400a06c584f5dbd3a915bdf6b` |
| Browser upper | `b642d80f8f219a90f61f38718f58c6be71cfbd48aee421763ffaff878f7ac00e` |
| Browser lower | `230864dc8b338b25efd2b3724e76aa1f436c34eb6a09e6b8ce707e3fff10f56b` |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` |
| `R/diff/report.json` | `b4d96e28336c4eaa439b831c26487153a166aa2509328b770281218678937584` |
| `R/diff/lower-contact-sheet.png` | `8f15b9878484f375f7de3d1dc00b5d83487c02b60977feb5a4285a9597b9568e` |

Inspected `R/diff/lower-contact-sheet.png`. The Welcome card, “Welcome to
Nintendo 3DS Camera!”, Next and bird body align. Remaining red is the top
photo/video chrome, the left/right grid strips, and the page-counter
edge. Guide interior `[20,20,300,220]` is **0** over 2/255 (max 1).
Black-feed versus the native configured photo feed is the existing
labelled adaptation; this slice does not invent photos.

Recorded empty-mask counts over 2/255: **0 upper / 1,401 lower**
(MAE 0.1715 / 0.2372, max lower 101 at `(315,167)`).

## Residual ownership

Half-open rectangles. Counts are pixels with any RGB channel delta
greater than 2. Official 4-neighbour components from `report.json`:

| Region | Rectangle | Over 2 | Max | Owner |
| --- | --- | ---: | ---: | --- |
| Whole lower | `[0,0,320,240]` | **1401** | 101 | mixed |
| Whole upper | 400×240 | **0** | 2 | already matched |
| Guide interior | `[20,20,300,220]` | **0** | 1 | `C_DlgChA` + `C_DlgGuid1BtnW` already bound |
| Top Y0–5 controls | `[0,0,320,6]` | **588** | 91 at `(202,5)` | capture-fitted `P_Shoot_D_Disable` / `P_CamBtn_Disable` plus unbound base |
| Official right top | `[183,0,53,6]` | 308 | 91 | same |
| Official left top | `[84,0,43,6]` | 255 | 11 | same |
| Left side strip | `[0,0,6,240]` | 362 | 18 | `P_Shoot_D` Grid1 / 2D / modal; CGFX registration unbound |
| Right side strip | `[314,0,320,240]` | 372 | 101 | same |
| Page counter | `[290,226,23,11]` | 78 | 76 at `(312,227)` | already-bound `TxtNumber0` / `TxtNumber1` glyph edge |
| Bird-adjacent | `(8,227)` | 1 | 3 | `C_DlgChA` bird fringe |

Official components start 308 / 255 / 199 / 193, then 78 / 63 / 49 / 48 /
44 / 41 / 40 side-strip and counter fragments. Those eleven boxes sum to
1,318. The remaining 83 are the smaller official fragments (19 / 12 / 12
/ 12 / 6 / 5 / 5 / 4 / 3 / 2 / 2 / 1). 588 + 362 + 372 + 78 + 1 = 1,401.

`(0,80)` is now native `(115,111,103)` versus browser `(116,112,104)`
(under threshold). The earlier black-surround defect is already closed by
the bound underlay. Remaining side pixels are grid/backdrop registration,
not a missing first clear.

## Already-bound source (no unused unique owner)

EUR Camera `0004001000022400`, version 4097, content index 0 / ID
`0000001a`. Pinned executable SHA-256
`3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`,
image base `0x100000`.

| Element | Manifest / pack | Dump source | SHA-256 |
| --- | --- | --- | --- |
| Shoot CGFX | `manifest.models.cameraShootBackground` | `romfs/res/P_Shoot_D.bcenv.LZ` | `728ff7412764350ab15fd978236e29dfc0a5bd850803b7a2f343ad82ca0294a1` |
| Published model | `models/camera-shoot-background/model.json` | same CGFX | `fbcf4aefc917396979cef9a4993508e5bdb2e68dbf5f0e34e34e717cc1a7bafe` |
| Shoot layout pack | `lyt-P_Shoot_D-arc-LZ.json` | `lyt/P_Shoot_D.arc.LZ` | `a5aa9ae10eb59d400160a85f8aa919a274f6f13d480d041d7f95b91eef0dd41e` |
| `P_Shoot_D` BCLYT | pack `resourceSources.layouts.P_Shoot_D` | `blyt/P_Shoot_D.bclyt` | `3000aa79b92564e0cf495403adaa1c5d835fc44c1c64449075c369137d23ef5b` |
| `P_Shoot_D_Disable` | already requested | `anim/P_Shoot_D_Disable.bclan` | `a129d382126a52af8f615d4348f80fc9a20425134c1d2c3c789abc8b007fc1a1` |
| `P_CamBtn` | already requested | `blyt/P_CamBtn.bclyt` | `af471925343dab648422e7793264b99f1ebd7267cc48bd01cfc644c72acb1e2f` |
| `P_CamIcon` | already requested | `blyt/P_CamIcon.bclyt` | `2e70e74d1d877be77179b5bbed79cf73131101c3fbbc58b105b90b284a524da2` |
| `C_DlgChA` | `lyt-C-Dlg.json` | `lyt/C.LZ/Dlg/blyt/C_DlgChA.bclyt` | `4d35e4b38ae75fa7ad8c8f2d2484bd200856b562ee4c493b13adbc765c5eb8d7` |
| `C_DlgGuid1BtnW` | same pack | `blyt/C_DlgGuid1BtnW.bclyt` | `aaa3aeceda6930838285e3c03f032170d9d8e23690cabca843f26405c8116773` |

Settled paint order in `drawNativeCameraGuide` is unchanged: black
320×240 clear, scene `P_Shoot_D` CGFX, 2D `P_Shoot_D` + `P_CamBtn` +
`P_CamIcon`, source black-alpha128 modal (`0x31a540` / `0x2736e4`, draw
`0x300e70`), then `C_DlgChA` and `C_DlgGuid1BtnW`. Warm lower clear
`(233,224,208,255)` is the source node write at `0x2a5e60`.

`cameraScreenPacks` requests only `P_Shoot_D_Disable`, `P_CamBtn_Disable`
and `P_CamIcon_IconPtrn`. Those Disable frame-0 binds remain the
capture-fitted Welcome candidates from the
[top-control audit](camera-guide-top-controls-audit.md). Camera owner
`+0x418` is the upper `P_Finder_U` controller (`0x2a7358`, vtable
`0x420e1c`), not the lower clip selector. Nested constructor `0x26f6cc`
selects `Default`; event 6 selects `Disable` (`0x26f3fc`). That is
initialization, not a settled Welcome event history.

## Unused members that do not uniquely own the 1,401

The shoot pack still publishes `P_Shoot_D_Default` /
`P_Shoot_D_Push` / `P_Shoot_D_BtnTxtIn` / `P_Shoot_D_BtnTxtOut` and
`P_CamBtn_Default` / `P_CamBtn_Push`. Default frame 0 raises no
PhoBase/MovBase Y and keeps CamBase alpha 255; Disable raises those
bases by 8 and keeps CamBase alpha 128. The earlier isolated Default
probe reduced the top strip but left ~75 top pixels and did not own the
734 side-strip or 78 counter leftovers. Selecting Default because it
shrinks a screenshot is still a fit.

`C_BkMask` is a name at `0x4239aa` with pointer `0x4407b4`. It is not in
any published Camera pack on this checkout (`lyt-C-Dlg.json` layouts are
only `C_DlgChA`, `C_DlgGuid1BtnW`, `C_DlgGuid2Btn`, `C_DlgGuid_U`). A
resource-name pointer is not a Welcome bind.

Published CGFX models remain `P_Shoot_D,X_Arw,Z_Arw,A_stick`. Only
`P_Shoot_D` is visible. Authored camera aspect is 1.5; the runtime keeps
the existing 4/3 lower-LCD fit. Wiring arrows, inventing a second
projection, or painting sampled warm-gray rectangles would hide an
unbound scene.

The 78-pixel counter already uses source `Guide_D_00_00` / `Guide_D_00_01`
at shared RI.mstl width 48 with `textSampling:'lcd-source-size'`. No
unused font or second raster owner is present.

## Labelled gap

M-CAM-01 page 1 is a **source-gap** for the remaining 1,401 lower
pixels. The missing evidence is still the settled Welcome controller
update that selects PhoBase/MovBase / CamBase clips, the final CGFX
viewport/projection and Grid1 backdrop, and the already-bound counter
glyph raster. Until those have a unique unused owner, the painter stays
unchanged.

## Checks

Focused `tests/camera-welcome-p1-1401.test.mjs` plus `git diff --check`.
Application typecheck/build were not rerun because no application files
changed. This lane did not drive Azahar or preview 3021.
