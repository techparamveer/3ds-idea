# Parental PIN notice presentation

This implements the settled `parental-pin-notice` screen following
`parental-explain`. It uses the original EUR Settings resources described in
[the dialog asset trace](native-parental-dialog-assets.md). Required asset
commits are `87bdb89` (explanation and messages) and `045cdf1` (dialog and
mask), after the native field resource slice `d874b10`.

## Source composition

`pr_dlg_explain.bin` selects `Dialog_D_01`, with a single full-width button.
The painter retains `StartChild_D_00` and its Back/Next footer beneath the
dialog. It then draws `DlgMask_D_00` at the source FadeIn endpoint, frame 20,
followed by `Dialog_D_01` using the shared `Dialog_D_02_FadeIn` endpoint.
The source `Dialog_D_02_Select` frame 1 is restricted to `Group_00`, the sole
button. The delivered donor layout `Dialog_D_02` is not drawn.

`TextBoxDialog_00` receives `mset/par_dlg_pin0`. Both original button label
layers receive `mset/dlg_2b_ok`. Original font styles, pane sizes, textures,
material colors and animation channels are retained. No synthetic second
button, text panel, font sizing or darkening fill is introduced.

The source button `Bounding_00` has translation `(0,-108)`, size `(300,40)`
and origin 7. Its lower LCD bounds are `(10,188,300,40)`. Integration owns
the corresponding hit geometry; the painter does not change input handling.

The current upper LCD remains the parental explanation upper page. The
ordinary source upper-mask path is gated on global `0x297608` being 3 or 4;
the separately found unconditional path belongs to QTM scenes. The running
parental mode and matched native upper appearance remain unverified. Keeping
the existing upper page is a documented gap, not evidence that it is exact.

## Navigation boundary

Runtime supplies `parental-pin-notice` with one row, action `back`, label
`OK`. The coordinator approved OK and B returning to the explanation with
Next selected. This is a portfolio adaptation: native OK continues to
`pr_dlg_pass_set` and subsequently PIN entry. The software keyboard, PIN
editing and actual console configuration remain excluded.

## Verification

`scripts/verify-stock-settings.mjs` passes 26 paired renders: five main
selections and 21 subpage specimens. The notice checks preserve source
message styles, restrict selection to the single button, verify the lower
draw order, compare the preserved upper LCD against the explanation, and
check resource immutability and renderer diagnostics. Typecheck passes.

Both notice LCDs were inspected at native resolution. The notice text fits
the source body pane, the source OK button occupies the full lower dialog
width, and the explanation remains visible beneath the original mask.
Evidence is under the SSD firmware artifact root at
`presentation/settings-parental-pin-notice/`, including paired PNGs and
`verification.json`.

These are source-render checks. Integration still owns the actual browser
flow, matched native LCD comparison and interaction verification. The wider
Settings work is not complete.
