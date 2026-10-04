# Settings Other page 2 left adjacent-page/arrow overlap — 4 October 2026

Worker `3ds-settings-other-p2-overlap-20261004` /
`codex/settings-other-p2-overlap-20261004` from HOME fidelity `19827636`.
Sparse worktree; `node_modules` linked from HOME fidelity. No runtime change.
No Azahar. No preview 3021. No CDP 9320. No recapture. No compositor snap,
mask, alpha or invented raster.

Target residual remains **0 upper / 960 lower** over 2/255 on
`settings-other-page2-sandisk-direct-7ec0483` at `bfe467b`. 959 of those
lower pixels are the left adjacent-page/arrow overlap at x = 0–34,
y = 66–167 beside the prior page-1 buttons and left arrow. One other lower
pixel remains at (36, 132). Empty mask. Evidence: source-identified and
tested. Not browser-inspected here. Not native-compared here. Not 1:1.

This follows the [page-edge note](settings-other-page-edges.md) integrated as
`bfe467b`. The painter already mounts `Null_LeftPage` / `Null_RightPage` at
source ±276 and sets `ScrollBg` to 270 / −6 / −6 / −282.

## Pair

| Side | File | SHA-256 |
| --- | --- | --- |
| Native 400×480 | `System Settings_26.09.26_21.40.05.978.png` | `f645cedc1dedcd380972114e5d98da5428f8110cbcc253468baf25bbc792da7f` |
| Browser upper | `…/settings-other-page2-sandisk-direct-7ec0483/browser/upper.png` | `494e9a9a309c06cd0aefaa10ffe18283d934329e437727ebe51df8bc99657f3a` |
| Browser lower | `…/settings-other-page2-sandisk-direct-7ec0483/browser/lower.png` | `4003356bf1f5751e5a342efc32b382028584f0b702fd3fe138aeab63d877d8b6` |
| Empty mask | `scripts/native-compare/empty-mask.json` | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` |

Lower clusters from that report: (0, 124, 34, 44) = 552; (0, 68, 31, 39) = 384;
plus 23 scattered pixels inside x = 0–34, y = 66–167; and the leftover
(36, 132) singleton.

## Source identity

EUR 10.7.0-32E System Settings `0004001000022000`, content 0 / `0000003d`,
`exefs/code.bin` SHA-256
`1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5`.
Virtual base `0x100000`. Capstone 5.0.7 via
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/camera-grid-venv/bin/python`.

| Resource | SHA-256 |
| --- | --- |
| `layout_LZ.bin/blyt/BasicTop_D_00.bclyt` | `1262f71b7b29cc91ac342cc56161f39bbd4dc2a5b8fb1c42aa31e90669943273` |
| `layout.json/BasicTop_D_00_SpecialIn_00` | `80d8afb285d827a649d85fbfd4358e956abfb15588c673198c4e7d0f08855f8a` |
| published `layout.json` | `892e8f5497fd151ca9432457e17136d728dc62b2edc137ef7649cfbf6a40c6b0` |
| published `button.json` | `9a658f4e98b8cb17cc15d2650f55723cd27432cda4524849b7e7ec7efe0a6b3f` |

## Layout

`BasicTop_D_00` canvas is 320×240. `Scroll` (with `Null_LeftPage` at x = −276,
current `N_I_Button_0*` at y = +44 / −4 / −52, and `Null_RightPage` at
x = +276) is a sibling **before** `Arrow`. Source therefore paints the
adjacent-page slivers under `R_ArrowL` (`P_arwL_00` alpha 210,
`W_arwShdwL_00` alpha 60). `Null_LeftPage` size 30×40 is a null mount, not a
clip window.

`BasicTop_D_00_SpecialIn_00` (settled entry) keeps `Scroll` x = 0,
`ScrollBg` x = 270, `N_R_ArrowL_00` x = −180. `BasicTop_D_00_Special_00`
(15-frame forward clip) moves `ScrollBg` 270 → −6 and **`Scroll` 0 → −276**.
That `Scroll` pitch is the in-flight page change, not a reconstructed
settled pose. Rebinding it on page 2 would slide the current 3D / Sound /
Mic buttons off the LCD.

`ScrollBg` / `Window_00` (830×152 at local [6, −6]) already covers the left
edge at the capture-constrained page-2 `ScrollBg` x = −6.

## Executable

Constructor `0x22f854` rebuilds the target `basic_top` page, registers focus
at argument 0, sets row Select from the same/cross-scene invert
(`0x22f944..0x22f968`), then writes arrow flags `+0x45` / `+0x46` and calls
`0x22f2a4`.

`0x22f2a4` attaches at most six named children per side
(`N_I_Button_%02d`, else `Null_Blank_%02d`) onto `Null_LeftPage` /
`Null_RightPage`. For each slot, page index is `current±1` (slots 0–2) or
`current±2` (slots 3–5). `0x22f3a4` `cmp r5, #0` / `0x22f3a8` `blt` skips a
negative page. Settled page 2 (index 1) therefore mounts **only page 1's
three buttons** on the left — the painter's `adjacentPage(page-1)` path.
`0x22f2a4` is reached only from `0x22f9b8`.

The −276.0 / −552.0 add at `0x213604` / `0x213608` is **not** a
`Null_LeftPage` owner. `0x213610` loads the pane name `Window_00` and adds
that pitch to its translation.x when `+0x45` is set (both arrows: −276;
left-only: −552). That site lives in the transition helper starting
`0x2132ec`. Applying it again on a reconstructed page-2 `Window_00` would
double-shift the 830 px background and is equivalent, after a SpecialIn
`ScrollBg` reset, to the already-bound −6 capture fit.

`0x196d44` walks `Null_LeftPage` children for `TextBox_00` and writes
`+0xb7` bit 0 from its `r2` argument. The only caller is `0x213644`, with
`r2 = 0` (hide labels after the clip). The constructor range
`0x22f854..0x22f9c8` does not call it. Hiding adjacent labels would not
uniquely own the x = 0–34 frame/arrow sliver.

No settled write changes `Null_LeftPage` alpha, clip or z-order. Arrow
layout, `R_ArrowL_Appear` frame 0, and hit targets stay as `bfe467b`.

## Why the painter stays unchanged

The remaining 959 pixels sit where source-correct page-1 button slivers and
the source left arrow overlap. Layout order already puts `Arrow` on top.
A guessed clip to the 30×40 null pane, a blend-mode change, an extra
`Scroll` −276, or a `Window_00` snap would be compositor invention, not a
unique executable/layout bind. Page 1's 0/0 static tier and pages 3/4 lower
8/35 are outside this residual.

## Tests

Focused `tests/settings-other-page-tab.test.mjs`: page 2 still mounts
page-1 icons at the source centres, binds `SpecialIn_00` frame 1, overrides
only `ScrollBg` to −6, and leaves `Special_00`'s `Scroll` −276 unbound.
Source tree order, ±276 mounts, Special endpoints, and `R_ArrowL` alphas
are pinned.

## Remaining / doubts

Pixel tier still fails. Whole scenario still fails. Native entered Settings
from Azahar's list; the browser used HOME Settings → A and a page-tab
touch. Motion and audio remain open. The (36, 132) singleton is untraced.
No 1:1 claim.

Private trace
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/settings-other-p2-overlap-20261004/trace-report.json`.
