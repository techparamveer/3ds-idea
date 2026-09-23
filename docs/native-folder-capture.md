# Selected folder in the opening capture

For settled root mode 0, without a suspended overlay, HOME hides the ordinary
selected slot instance and shows the separate `LncIconFolderInB_00` /
`LncIconFolderInT_00` pair in its fresh opening capture. Both halves remain
visible. At root density 1 and slot center Y = 82, the replacement has visible
pixels above the opened panel's Y = 64 edge. Do not hide the pair to remove the
ordinary icon's ghost.

This is a source contract and numeric proof, not an application implementation
or a browser fidelity sign-off. The integration task owns capture painting and
browser/native comparisons. The compared native one-row parent (density 0,
center Y = 161) and browser two-row parent (density 1, center Y = 82) must be
matched before judging what remains above the panel.

## Evidence

HOME 10.7.0-32E `code.bin` SHA-256:
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Addresses use virtual image base `0x100000`. The checked values are in
[`evidence/native-folder-capture.json`](evidence/native-folder-capture.json).
Private disassembly, original ARM harness and material probe are under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/presentation/folder-panel-geometry/`
(`execute-selected.py`, `selected-native.json`, `check-selected-material.mjs`,
`selected-material.json`). No firmware bytes or texture images are committed.

| Native source | Established operation |
| --- | --- |
| `0x1e24e8`, `0x1e26a8`, `0x1e2720` | Capture argument with previous root mode 0 routes the selected slot through the replacement branch when `0x1e0d28` reports no overlay. |
| `0x1e2774..27ac`, `0x207db8` | Folder lookup followed by a 16-bit manager value: zero chooses scene `+0xb54`; nonzero chooses `+0xb50`. The same getter is compared with capacity 60 at `0x1d51a8..b4`. The fixture supplies zero for the empty case. |
| `0x2b3930..3970`, `0x2b3b50..7c` | Both instances load the same B/T layouts and Scale clips. The pair object is B; its `+0x80` child is T. |
| `0x1e2824..2858`, `0x232214` | Set up B's icon material, show both layouts, then position both roots at `(slotX − scroll, slotY, 0)`. |
| `0x258724` | Writes each root's position, without replacing authored child dimensions or applying a panel-edge crop. |
| `0x1e285c..287c`, `0x1e8c50` | Hide the ordinary slot instance and its pane. This does not hide the replacement pair. |
| `0x1e3590..35bc` | Keep the used pair; hide the unused pair according to the per-pass flags. |
| `0x1d62e0..f4`, `0x258788` | Seek both Scale controllers to density frame; density 1 uses frame 1. |

The isolated selected-branch execution stubs only the external slot lookup
(`0x1edb7c`, returning folder ID 0) and texture/resource setup (`0x1e801c`).
The manager getter, pair show, root positioning, ordinary hide and Scale seek
execute original instructions. The fixture yields ordinary layout/pane hidden,
B and T shown, both roots `(-84, 38, 0)` (logical center `(76, 82)`), and both
Scale frames 1. It does not execute the entire HOME process or native GPU draw.

Paint **T before B**. The constructor at `0x2b3930..3964` supplies B priority
`0x19c` (412) and T priority `0x19e` (414); `0x2587c4..8830` installs them.
The insertion routine `0x11eae8..eb3c` orders larger priorities first, and
`0x23662c..6750` draws that list head-to-tail. T's body/shadow therefore precede
B's dynamic glyph.

## PicToggle and the empty contents tab

For the settled default color branch, use PicToggle frame 0 **with direct group
member binding**. `G_PicToggle_00` selects only `N_Color_00`, `N_Pic_00` and
`N_Had_00`. This shows the color branch, hides the picture branch and retains
`N_Had_00` Y = 0.

The constructor at `0x132fe8..133024` passes `r2 = 0`, `r3 = 1` to each group
member's binding method. `0x1a1fe0 → 0x1a11f4` passes that zero to pane/material
name lookup; `0x1a2000` skips child traversal. Executing that original binder
against the actual PicToggle resource and full T pane hierarchy binds exactly
the three group members. It does **not** bind `N_Had_01` or `P_FolderHad_01`.

The exported resource's `childBinding: true` must not override this call-site
behavior. Recursively applying its unrelated negative-frame channels would
incorrectly shrink the contents tab and make it visible. The empty `+0xb54`
instance retains the authored hidden `P_FolderHad_01`. `AnimationBinding` now
accepts an optional `childBinding` override: bind this PicToggle with
`childBinding: false`. Omission preserves the resource's existing behavior;
the override applies only to that binding and does not rewrite the shared
resource. The focused `native-animation-binding.test.mjs` covers both override
directions, ungrouped clips and the actual FolderInT panes with source assets.
The `+0xb50` instance has a separate HadToggle controller constructed at
`0x2b3d9c..db4`; empty-case
handling must not copy that instance's controller state.

`0x1e07b4` selects the no-image path and calls `0x2b041c(S, 0)`. Original
controller execution shows its initialization applies frame 1, then the next
update applies frame 0; it settles at frame 0. This contract concerns settled
ordinary entry, not capture during a theme switch.

## Geometry and visible coverage

At root density 1, center `(76, 82)`, Scale frame 1:

| Pane | Logical rectangle `[left, top, width, height]` | Visibility |
| --- | --- | --- |
| T `P_FolderIn_01` | `[35, 54, 82, 64]` | Shown under `N_Color_00` |
| T `P_BaseShdw_00` | `[34, 54, 84, 68]` | Shown, native multiplicative material |
| T `P_BaseShdw_01` | — | Hidden |
| T `P_FolderHad_01` | — | Hidden for the empty instance |
| B `P_Icon_00` | `[60, 85, 32, 25]` | Ordinary available-icon path shows it |
| B `P_IconPrize_00` | — | Ordinary available-icon path hides it |

The body rectangle derives from authored 100 × 100 under Scale1
`N_FolderRoot_00 = (Y −4, scale .82 × .64)`. B retains parent Y −2 and its
icon Y −13.5. Float32 authored scales are preserved in the resource; the table
expresses their intended integer pixel sizes.

The body uses `LncFolderIn_11.bclim`. Lossless PNG decoding, source texture
sampling and full TEV evaluation produce the first nonzero body alpha at
logical row **55**, continuing above the panel through row **63**. Row 55 has
28 covered pixels and maximum alpha 197; row 56 has opaque interior pixels.
The shadow also first changes RGB at row 55. Its alpha alone is not a coverage
test because its blend multiplies the framebuffer RGB. Per-row counts and
texture-delivery hashes are included in the numeric fixture.

The ordinary 72-pixel tile beginning at Y = 46 is therefore the wrong capture
instance. Replace it with the source pair; do not discard the legitimate exposed
replacement. The opening capture crops the fresh root draw at logical Y = 34,
so it retains these rows. The opened panel is painted afterward and covers only
its own footprint. No Y = 64 clip is established for the replacement draw.

## Texture binding and limits

T's color body and shadow preserve their source materials and texture maps.
For B, `0x1e8074..809c` binds scene `+0xc88` to sampler 1 and supplies its unit
UV rectangle. The normal mask initialization is documented in
[`native-folder-glyph.md`](native-folder-glyph.md). The available-icon path at
`0x1e8598..8658` shows `P_Icon_00`, hides `P_IconPrize_00`, binds sampler 0 to
the selected record's atlas resource, and installs its atlas UVs through
`0x206484`. Kind 3 uses the folder glyph's full 32 × 32 atlas cell; an empty
folder's contents do not imply that its name glyph is empty. Preserve that
dynamic binding; `IconDmy.bclim` is not its runtime contents.

Gift/reserved and unavailable-resource branches use different sampler-0
sources (`0x1e81c4..8274`). The selected-branch harness deliberately stubs this
resource setup, so it does not establish the current emulator save's atlas
availability or exact B glyph pixels. Those remain integration inputs. They
cannot explain an exposed shape above Y = 64: B's authored icon starts at Y = 85.

Verification covers original ARM setters, group binding/controller state, and
CPU source-material evaluation. Native GPU sampling/blend rounding, custom
picture themes, nonempty HadToggle behavior and full capture/browser parity
are outside this bounded proof. No browser or native UI was operated here.
