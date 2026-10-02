# Native lower folder balloon

## 2 October density verification

Settings root-title balloons now follow both source density-index checks:
current0 and target0 only (`5de1f381`). Fresh native two-row Settings has no
balloon; one-row retains it. The previous two-row exception was incorrect.
[Production/native evidence and remaining limits](home-balloon-density-2026-10-02.md).
The same-anchor Health comparison supports the existing body clamp and tail
positioning, not a new offset. Root density and folder density remain distinct.

The settled folder balloon now uses the native HOME position routine and the
source `LncBlln_00` pane hierarchy. This replaces the earlier screen-space body
clamp and separate pointer offsets. Visibility during transitions remains a
conservative adapter; the native predicate and required runtime contract are
recorded below for integration.

## Evidence and scope

Source: the supplied EUR HOME Menu 10.7.0-32E executable, loaded at ARM virtual
base `0x100000`. `code.bin` SHA-256:
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
The extracted `launcher.json` contains `LncBlln_00` and its original animation
resources. Private executable, disassembly and execution evidence stay outside
Git under:

`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/presentation/folder-balloon/`

- `update.asm`: `0x1e66bc..0x1e6b44`, the balloon update routine.
- `visibility.asm`: `0x2eb804..0x2eb8d8`, its visibility predicate.
- `execute-position.py` and `native-position.json`: isolated execution of the
  actual ARM instructions through Unicorn 2.1.4, with VFP enabled.

No screenshot coordinates were fitted. This change does not establish text
rasterization or whole-screen visual parity. Browser verification belongs to
the integration task; this worker did not operate the browser or emulator.

## Position and hierarchy

Initialization at `0x2b1c44..0x2b1ca4` loads the layout and its Appear/DisAppear
clips, and stores pointers to `N_Base_00` and `N_LR_00` at scene offsets `+0xbe0`
and `+0xbe4`. Initialization at `0x2b4920` stores width **256** at `+0x3a40`.
There is no horizontal lookup table in the update path.

At `0x1e6758..0x1e67c8`, the signed selected slot comes from `+0x1178`, its X
coordinate from `+0x1868 + 4 * selected`, and scroll from `+0x3a28`. With
float32 arithmetic, the routine computes:

```text
a = slotX - scroll
childX = a
if a - 128 < -136: childX = -8 - a
else if a + 128 > 136: childX = 8 - a
N_Base_00.x = a
N_LR_00.x = childX
```

The interior branch deliberately retains `a`. It does not set the child offset
to zero. The body therefore has twice the anchor offset when `-8 <= a <= 8`,
including discontinuities at the boundaries. This unusual branch is confirmed
by executing the original instructions; replacing it with a conventional clamp
would change the source behavior. The pane setter at `0x1d9f38` writes local
translation and invalidates the matrix, so these are parent/child transforms.

The updater retains each pane's Y and sets Z to zero. The authored hierarchy is:

| Pane | Parent | Translation | Size |
| --- | --- | --- | --- |
| `N_Base_00` | Root | `(0, 0, 0)` | 20 × 20 |
| `N_LR_00` | Base | `(0, -6, 0)` | 20 × 20 |
| `P_BllnL/R_00` | LR | `(0, 46, 0)` | 136 × 64 each |
| `P_BllnShdwL/R_00` | LR | `(0, 46, 0)` | 136 × 74 each |
| `T_Blln_00` | LR | `(0, 46, 0)` | 248 × 56 |
| `P_Pnt_00` | Base | `(0, 9, 0)` | 16 × 21 |
| `P_PntShdw_00` | Base | `(0, 9, 0)` | 16 × 26 |

The pointers inherit the selected anchor directly. Their authored translations
are not overridden. Body center Y is 40 in the centered, upward-positive layout
coordinates; pointer Y is 9. Text and body keep all authored metrics/materials.
An empty folder name uses `lau_2b_folder_noname`, as in `0x1e6994..0x1e69c4`.

The isolated execution uses scroll 39.125 and selected slot zero, writes
`slotX = anchor + scroll`, then runs `0x1e6758` through exclusive `0x1e67c8`.
Representative results, included with the boundary cases in the test table:

| Anchor / base X | Child X | Composed body X |
| ---: | ---: | ---: |
| -244 | 236 | -8 |
| -84 | 76 | -8 |
| -8.000999450683594 | 0.00099945068359375 | -8 |
| -8 | -8 | -16 |
| -4 | -4 | -8 |
| 0 | 0 | 0 |
| 4 | 4 | 8 |
| 8 | 8 | 16 |
| 8.000999450683594 | -0.00099945068359375 | 8 |
| 84 | -76 | 8 |
| 244 | -236 | 8 |

There is no selected-tile Y test or screen-X clipping test in this updater. The
previous invented gates were removed. Presentation derives the anchor from the
runtime's existing tile center relative to lower-screen X = 160.

## Native visibility predicate

`0x2eb804` returns true only when every condition below holds:

1. The pointer at scene `+0x3fd0` is null.
2. Selected slot `+0x1178` is nonnegative.
3. The byte at `+0x3ca8` is zero.
4. The object returned by `0x217a90` either has no `+0x14` object, or that object's
   `+0x1f1` byte is zero, or its `+0x11` byte is not 2.
5. Both **current density** `+0x118c` and **target density** `+0x1190` are zero.
6. Mode byte `+0x3a80` is neither 2, 4 nor 14.
7. Selected-record helpers `0x1e89f8` and `0x1e6b44` both succeed. These check bits
   0 and 1 respectively of the selected record's halfword at `+0x36`.

The exact semantics of `+0x3fd0`, `+0x3ca8` and the external object condition are
not fully established here. In particular, `+0x3fd0` must not be equated to an
open folder without proof. The active folder identifier is separately stored
at `+0x1170`, with -1 denoting the root.

The runtime investigation identifies mode 2 as target-column scrolling, mode 3
as a separate linear scroll path and mode 5 as density interpolation. The
predicate excludes mode 2 but does **not** exclude mode 3. This is why a generic
`gesture !== null` check cannot represent the native predicate. Mode 0 is idle
both inside and outside folders; folder enter/exit are modes 43/44. Modes 4 and
14 remain numeric here because a complete input-event mapping is unproven.

At the root, density zero means one row. In a folder, native density indices
0 and 1 both yield one row. Therefore a future general title-balloon adapter
must use density indices, not merely a one-row Boolean. This folder-specific
renderer only handles folder entries in the root; native title balloons for
software inside a folder are outside this change.

## Appearance, disappearance and runtime contract

The authored Appear and DisAppear clips each declare six frames, with Hermite
keys at 0 and 5 and zero slopes. They animate only `N_Base_00.alpha`: 0→255 or
255→0 respectively, through `G_Scene_00` with child binding enabled. SceneIn and
SceneOut are separate eleven-frame clips with keys at 0 and 10. They must not be
substituted for selection appearance.

The update routine keeps a visibility latch at `+0x3a44`:

- When desired visibility becomes true, it waits for mode 0, sets the latch,
  enables the layout, and restarts Appear (`0x1e66f8..0x1e6724`).
- When desired visibility becomes false, it clears the latch and restarts
  DisAppear without the mode-zero gate (`0x1e6728..0x1e6738`).
- Ordinary updates change position/text only when desired visibility is true
  and mode is 0. A force-update input bypasses this gate.
- When desired visibility is false, the layout remains available for the fade;
  only DisAppear state 2 disables it (`0x1e6b1c..0x1e6b40`). Position/text are
  retained through that fade.

Selection changes call the routine with force-update at `0x2ad6c4..0x2ad794`;
regular updates call it without force at `0x2b8580..0x2b8588`. Initial scene setup
at `0x29367c..0x2936bc` sets the latch, selects a static clip frame, and forces an
update. Integration must distinguish initialization from an ordinary change.

Animation setup `0x133078..0x1330a4` converts the declared count to the terminal
frame by subtracting 1, giving range 0..5. Constructor `0x131db8` sets playback
step 1. `0x2693fc` resets and starts; `0x269430` applies the current frame then
advances through `0x1bbd94`. On reaching frame 5 the latter sets its end flag;
a following update marks state 2. No conversion to milliseconds or display
refresh rate is claimed from this trace.

A concrete shared-state contract for the runtime owner is:

- Native current/target density indices, mode, selected slot/record eligibility,
  the three additional predicate conditions above, and selected anchor/text.
- A persistent balloon visibility latch, whether its layout is enabled, active
  clip, native frame and completion state, plus retained anchor/text.
- A force-update signal for selection/context changes and a distinct initial
  setup path. Source update ticks or a proven clock conversion drive animation;
  rendering alone must not restart the clip.
- A derived paint view containing `visible`, `clip`, `frame`, `baseX`,
  `bodyOffsetX` and retained text. Paint must continue through DisAppear even
  when the new selected state is ineligible.

The initial adapter required a root folder, one rendered row, no panel and no
active gesture. It rendered Appear frame 5 immediately and removed the balloon
immediately when that adapter returned null. The later HOME presentation pass
now retains the selected label/anchor across the original six-frame
`LncBlln_00_Appear` and `DisAppear` clips. `home-controls.ts` advances one clip
frame per HOME update; initial HOME uses the source static settled pose, and the
last DisAppear frame stays visible until the following update. This fixes the
instantaneous lower-LCD pop for supported root-folder selections.

The eligibility adapter remains conservative and is not the complete source
visibility predicate. It still omits the unknown `+0x3fd0`, `+0x3ca8` and
external-object conditions and does not implement native force-update or title
balloons. No matched native transition frames are available for pixel/timing
acceptance; the supplied native capture verifies the settled appearance only.

## Verification

`tests/home-presentation.test.mjs` compares 13 anchor cases against actual native
instruction execution, including both boundary discontinuities. It also checks
root folder selection, empty names, row exclusion, removed Y gating and the
existing conservative suppression behavior.

`tests/native-presentation.test.mjs`, with the real resource path supplied,
checks the native parent/child hierarchy, pointer dimensions and transforms,
all four alpha clips, composed left/center/right/interior positions and
preservation of the immutable source layout. These checks validate the native
quantities they measure; they do not replace a browser comparison.

Validation on this worker: 71 focused menu, presentation, native PNG/layout/
renderer, font and model tests passed with `FIRMWARE_PRESENTATION_ASSETS` set to
the private extracted resource root; TypeScript `--noEmit --incremental false`
and `git diff --check` passed. No application structure or shared state changed.
