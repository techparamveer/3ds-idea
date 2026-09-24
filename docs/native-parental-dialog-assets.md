# Parental introduction and first PIN notice resources

This is a bounded source-resource checkpoint for original EUR Settings,
content `0000-0000003d`. It does not implement PIN entry or restrictions.
The existing scene trace establishes `pare_new_set` → `pare_explain` →
`pr_dlg_explain`. The introduction uses `StartChild_D_00` with `st_start_comm`,
`Base_D_01` with Back/Next, and the existing parental upper page. The literal
`Parent` table field is not a standalone layout in the converted source.

## First notice selector

Read-only ARM disassembly of the supplied `exefs/code.bin` (SHA-256
`1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5`)
establishes:

- The table parser at `0x2344e8–0x2344fc` copies the first 36 source bytes
  unchanged. `pr_dlg_explain.bin` has selector byte 0 equal to 1.
- The common dialog scene handler at `0x20378c` obtains the parsed record via
  `0x19f028`. At `0x2039e0–0x2039f8`, it copies byte 0 into dialog-parameter
  offset 4 and calls factory `0x1d1d44`.
- The factory indexes the layout-name table at `0x297754` using that parameter
  (`0x1d1df4–0x1d1df8`). Entry 1 points to `Dialog_D_01`. Its one full-width
  button is correct even though the label is named `dlg_2b_ok`.
- The switch at `0x1d2034–0x1d20a4` sets one button for selector 1.
  Text is bound to `TextBoxDialog_00`; button label layers are `TextBox_00`
  and `TextBoxShdw_00` (tables `0x2977a4` and `0x2977b0`).
- The factory intentionally uses the animation donor `Dialog_D_02`:
  FadeIn at `0x1d1e5c–0x1d1e80`, FadeOut00/01 at `0x1d1eb8–0x1d1edc`,
  Select and Decide at `0x1d2208–0x1d2260`. The single button binds Group_00.
  The donor layout is delivered to retain source animation-parent provenance;
  it is not the notice's rendered layout.
- `DlgMask_D_00` is created at `0x1d1f64–0x1d1fb8`, with its own FadeIn and
  FadeOut clips bound at `0x1d1fbc–0x1d2010`.

For a settled lower notice, the source FadeIn endpoint is frame 20 of the
21-frame clips. `Dialog_D_02_FadeIn` gives `N_Dlg_00` unit scale and alpha 255;
`DlgMask_D_00_FadeIn` gives `P_Bg_00` alpha 140. Apply scene tracks through
Group_Scene and the button's own source group; do not manufacture a second
button for donor-only tracks. The shared clip's extra donor panes are not
proof of extra visible controls.

The body is `mset/par_dlg_pin0`, source message index 850, style 171:
font scale 0.7, line spacing 1. The button is `mset/dlg_2b_ok`, source index 26,
style 169. The original style records and source indices are preserved.

## Upper page qualification

The normal upper controller creates `DlgMask_U_00` only behind `0x1d28e4`
(`0x211fc4–0x211fd0`), which checks global `0x297608` for modes 3 or 4.
A second, unconditional-looking path at `0x21a1e4` belongs specifically to
`qtm_manual`/`qtm_check`, as shown by its constructor call at
`0x222e30–0x222e70`. It must not be generalized to parental settings.
No upper mask is published by this checkpoint. The current source audit does
not establish the running mode value or an independent native screenshot;
retain the established upper page and resolve that condition before claiming
exact whole-screen equivalence.

## Delivery and checks

Converter 1.3.2 source packs supply `StartChild_D_00`, its ParentChild image,
`Dialog_D_01`, `Dialog_D_02` as the animation donor, `DlgMask_D_00`, and eight
source clips. No converter or renderer changes are required. All existing
selected packs and global launch/source metadata are preserved. The delivery
audit has zero errors: 1,561 resources, 571 layouts, 1,820 animations and
1,784 texture references. This source checkpoint has no new browser capture.
