# Native toolbar cursor and departed-selection effect

2026-09-23. This is a source/resource audit. It changes no runtime, painter,
public asset, browser or Azahar state. It extends the
[direction/focus evidence](HOME_DIRECTION_MASK_EVIDENCE.md) and
[primary Loop evidence](CURSOR_LOOP_CLOCK_EVIDENCE.md).

The primary cursor uses the **new** focus. The separate `LncCsrEfct_00` effect
uses the **departed** focus or slot. Toolbar centers come from named resource
panes, with uneven spacing and half-pixel Y values. Scale frames10–12 must reach
the CLAN sampler unchanged; the current grid-density clamp would discard them.

## Reproduction and scope

Source: owner-supplied EUR HOME `0004003000009802`, version24576. Map original
`code.bin` at ARM address `0x100000`. SHA-256:
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.

Run `home_toolbar_cursor.py` using the SSD research Python with Unicorn and
Capstone. Required arguments are `--code`, `--resources` (original
`launcher_LZ` directory), and `--output`. Then run:

```sh
node scripts/firmware/home_toolbar_cursor_resources.mjs \
  OUTPUT/decoded-resources.json \
  public/os/firmware/10.7.0-32E/packs/home/launcher.json \
  OUTPUT/posed-resources.json
```

Private output remains at
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/presentation/native-toolbar-cursor/verified/`.

- ARM fixture SHA: `00af50c4d548f39e5878f208298dcc48f98110f72652fe559852525316b46e0e`.
- `checked.json` SHA: `05b378c0534019c8ea8d22a966d23ea3bdfd1ac265d8b70d07fc21308f6eaa86`.
- Resource fixture SHA: `fb434d26bd1db33bbf5d4d753a65b85bca674df6d46d90148af7b286ba7d2ce2`.
- `posed-resources.json` SHA: `4128e8d35b59feaeebe6f0c33c97986b0e463e7b8d4e5d60e1bcdccd9e297037`.

Original instructions execute against synthetic scene/layout records. The
fixture records resource lookup, binding enable, layout application/matrices,
selection status/widgets and sound as explicit endpoints. Controller
constructors, original CLAN header readers, seek/start/update, grid table
initialization, coordinates and effect selection execute. The resource check
proves **three layouts and six animations equal their original binary decodes**
and samples24 poses using the existing browser sampler. It is not native GPU
raster verification or a full HOME boot.

Checks passed:8 toolbar positions/seeks,36 root/folder grid positions,
34 direction departures,5 accepted-touch fragments,24 visibility cases,
4 visibility gates,8 hidden focus entries, two-slot alternation,24 effect
updates, restart semantics and mode3 position following. There are16 hashed
source excerpts. No application rebuild is required for these research files.

## Position source

Let `S` be the scene, `C` the primary cursor pointed to by `S+0x820`, and `P`
its root pane at `C+0x38`. At `0x2b1528..156c`, the eight name pointers at
`0x308938` resolve against `LncBase_D_01`. The code copies each pane's **local**
`+0x28/+0x2c` translation into `S+0x3c4c + focus*8`. It does not calculate
button centers from widths or evenly space them.

| Focus | Resource pane | Native x,y | LCD x,y | Scale |
| --- | --- | --- | --- | --- |
| 0 | `N_CPos_Lgt_00` | −134,104 | 26,16 | 10 |
| 1 | `N_CPos_Memo_00` | −84,103.5 | 76,16.5 | 11 |
| 2 | `N_CPos_Frd_00` | −42,103.5 | 118,16.5 | 11 |
| 3 | `N_CPos_News_00` | 0,103.5 | 160,16.5 | 11 |
| 4 | `N_CPos_Web_00` | 42,103.5 | 202,16.5 | 11 |
| 5 | `N_CPos_Mvs_00` | 84,103.5 | 244,16.5 | 11 |
| 6 | `N_CPos_Dw_00` | 121,104 | 281,16 | 12 |
| 7 | `N_CPos_Up_00` | 147,104 | 307,16 | 12 |

LCD conversion is `(160+x,120-y)` for this320×240 canvas. These are cursor
anchors, not a proof of touchscreen hit bounds or feature activation.

Primary positioning `0x1d914c` branches on toolbar-active `S+0x3ca8`:

- Toolbar: copy the current focus's stored position into `P+0x28/+0x2c`, Z0.
- Ordinary grid: read selected `S+0x1178`; x=`S+0x1868[slot]−S+0x3a28`,
  y=`S+0x1e08[slot]`, Z0.
- Grid mode3: leave the primary root unchanged. For each visible effect whose
  `Effect+0x88` slot is not−1, update its root from those live grid coordinates.
  Toolbar effects retain their position because their stored slot is−1.

The actual table initializer fragment `0x2f4124..43f8` and coordinate generator
`0x1d7d00` execute in the fixture. The latter uses current density, root/folder
row tables, native spacing/origin arrays and `N_IconPos_00`'s Y translation.
Its overlay/mode branches remain in the original code; this check exercises
ordinary root/folder configurations. No screenshot-derived grid Y is supplied.

## Scale and independent controllers

Toolbar entry `0x1d8a94`, rotation helpers and `0x1da024` select frame10 for
focus0, frame12 for focus6/7, and frame11 for1–5. Grid return seeks current
density. `0x1da050` reaches primary Scale `C+0x80`, virtual `+0x2c`, which
stores current frame at controller`+0xc`. It does not submit the new frame.

The next eligible update `0x269430` copies current into AnimTransform`+0x10`
**before** advancing. Scale's mode5 retains the sought frame. Primary Loop
`C+0x8c` preserves phase throughout focus/position operations; each eligible
update still advances it. Focus changes do not start primary Select/Decide.
The existing Loop evidence covers the hidden-layout update gate.

Original `LncCsr_00` groups bind Scale/Loop to the two window panes and Select
to `N_Scene_00`. Extraneous fixed window tracks in Select are excluded. Scale
contains deliberate duplicate-key discontinuities at10,11,12. Exact samples:

| Scale | Frame window size × scale | Light window size × scale |
| --- | --- | --- |
| 10 | 78×72 × float32(.58) | 69×64 × float32(.82) |
| 11 | 78×75 × float32(.58) | 69×66 × float32(.82) |
| 12 | 68×68 × float32(.58) | 66×66 × float32(.70) |

These are authored pane dimensions/scales, not visible border extents. At
these frames both window translations are0. Loop continues to animate light
alpha and texture translation independently of the requested Scale.

## Departed-selection effect

Construction `0x2b1cec..1d44` creates **two** `LncCsrEfct_00` layouts at
`S+0x824/+0x828`, priority407; primary cursor priority is406. Their separate
loader `0x266118` starts Scale in mode5, loads DisAppear, and hides the layout.

Direction dispatcher `0x2968fc` captures old selected slot and old focus at
`0x296930..93c`. After the final selection cue, `0x296fdc..297038` chooses:

- If old focus is valid and differs from new focus: old toolbar focus with its
  Scale10/11/12, passing toolbar flag1.
- Otherwise: old selected grid slot with **current** density, flag0.

`0x1de858` reads the departed position at call time. Grid coordinates therefore
come from the current post-handler arrays/scroll, including any mode3 entry
work already performed. It selects effect index `S+0x3a50`, calls `0x2660a0`,
then increments the index modulo2. That helper shows the effect, immediately
sets its root position, seeks its own Scale, starts its own DisAppear, and
stores departed slot or−1. It does not invoke the banner manager or restart
the primary cursor's Loop.

Accepted touch selection differs in order: `0x2a4bb8` saves old slot before
writing the tapped slot. If toolbar-active, `0x2a4c1c..84` saves old toolbar
focus/Scale, clears toolbar focus and seeks primary Scale to current density.
With no overlay, `0x2a4ce4..4d24` emits the departed effect **before** viewport
correction/mode3 selection beginning at `0x2a4d28`. Earlier hit/manager gates
are outside this accepted-branch fixture.

`LncCsrEfct_00_DisAppear` is nonlooping21 frames. Its bound track changes only
`W_CsrEfct_00.alpha`,120 at0 to0 at20. Scale supplies the geometry. Start resets
current to0 but preserves the previously applied frame until the next eligible
update. Reusing an effect after applied9 preserves applied9 immediately after
start; the next update submits0. Likewise a Scale seek12 can coexist briefly
with applied10. The fixture's initial−999 applied sentinel is synthetic and
does not establish native initial transform contents.

Eligible updates submit DisAppear0–20. After submitting20, state becomes2.
On the following update the effect's `0x1f58ac` wrapper hides it, then ordinary
controller update completes state0. Grid effects remain slot-bound during
mode3 scrolling; an event's initial center must not become a permanent anchor.

## Visibility and proposed painter boundary

Focus entry and positioning **preserve** primary visibility, including when
already hidden. There is no focus-index or disabled-density visibility branch
in these helpers. `0x295b60` handles a separate request at `S+0x3a88`:
request0 shows as needed and positions; request1 shows as needed without
positioning; request2 hides as needed. It tracks shown state at `S+0x3a4e`.
Overlay pointers `S+0x3fd0/+0x3fd4` and modes185/186 skip this helper's work.
`0x1ebdcc` is another explicit show/hide path: it also hides both effects and
positions the primary when showing. This is not a complete all-scene
visibility/activation policy.

Recommendation for the next authorized implementation:

1. Add a center-based primary painter accepting raw `scaleFrame`, retained
   applied `loopFrame`, and the existing press input. Keep the grid wrapper if
   needed for compatibility. Do not run toolbar Scale through the0–5 clamp.
2. Add an effect painter accepting center, applied Scale and applied DisAppear
   frame, binding `LncCsrEfct_00`. Runtime owns the two retained instances,
   visibility, modulo2 replacement and controller current/applied separation.
3. Runtime observations carry the departed target, its Scale and event-time
   context/position. Preserve the grid slot identity for subsequent mode3
   updates. The selected slot and effect target are distinct fields.
4. Resolve visibility/position before painting; painting stays read-only.
   Paint toolbar cursors/effects outside the grid-only clip. Follow established
   native layout priority ordering; this audit alone does not verify all
   surrounding layer ordering or the resulting browser pixels.

No runtime or painter API is changed by this recommendation. Integration owns
the eventual contract and live browser verification.
