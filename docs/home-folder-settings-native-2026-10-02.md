# HOME Folder Settings native-resource replacement

Later [empty-folder Delete evidence](home-folder-delete-native-2026-10-02.md)
supersedes this checkpoint's generic Delete-confirmation route for empty folders:
runtime `2f074d64` deletes directly, as observed twice in native HOME. Populated
folders retain the unverified adapter; the other contracts below are unchanged.

Date: 2 October 2026. Implementation base: coordinator `5fd6a99c`; this
worktree already contained the two toolbar audit commits `268feb10` and
`553b176e`. This is a bounded source implementation and focused-test handoff.
It does not contain a production build, browser inspection, Azahar operation,
raw-LCD capture, diff, mask update or scenario-matrix change.

## Delivered result

The lower Folder Settings panel no longer uses the reconstructed rounded
gradient, authored buttons, generic text or mint selection cursor from
`src/os/screens.ts`. `createFirmwareHome` now composes the settled modal from
three decoded HOME resources through the existing `NativeLayoutRenderer`:

1. `home.dialogmask/DlgMask_D_00`, `FadeIn` frame 20, dims the underlying HOME
   lower LCD.
2. `home.dialog/Dlg_B_D_01`, `FadeIn` frame 20, supplies the 280×200 window,
   shadow, separators and 28-pixel B Cancel row.
3. `home.sequence/DlgBtn02_00` supplies the title and two 280×72 button rows.

All four visible strings come from `menu_msbt_LZ` with their decoded message
styles: `lau_dlg_folder_setting` (“Folder Settings”),
`lau_dlg_folder_name` (“Rename”), `lau_dlg_folder_delete` (“Delete”) and
`lau_dlg_1b_cance` (the B Cancel label). The settled touched-open reference has
no mint selection cursor, so this slice deliberately binds neither
`DlgBtn02_00_Select` nor a `PtCsr_00` substitute.

The modal now owns the full lower presentation: the underlying HOME
Settings/Open footer is not painted, and its former full-width y≥214 touch
shortcut is disabled. The selected-folder upper banner/name remains eligible
while this particular panel is open; the generic rotating toolbar-symbol
placeholder is suppressed. The retained banner host remains inhibited by the
scene while any panel is open, which freezes its existing lifecycle rather
than speculatively changing animation clocks.

## Source geometry and input

The shared hit map in `stock-screen-layout.ts` comes directly from the source
bounding panes at the settled mounts:

| Action | Resource pane | Lower-LCD half-open rectangle |
| --- | --- | --- |
| Rename | `DlgBtn02_00/B_Btn_00` | x `[20,300)`, y `[49,119)` |
| Delete | `DlgBtn02_00/B_Btn_01` | x `[20,300)`, y `[121,191)` |
| B Cancel | `Dlg_B_D_01/Bounding_00` | x `[20,300)`, y `[192,220)` |

The source separator gaps between the three hit regions remain inert.
Phased pointer input retains the down-owned action and activates only when the
release resolves to that same action, so dragging Rename→Delete or
Delete→Cancel cannot activate either destination.

Rename remains intentionally inert because software-keyboard/text entry is
outside the approved firmware scope. Delete still opens the pre-existing
confirmation adapter; its presentation is not made native by this slice and
remains a visible non-native residual pending its own resource contract and
capture. No deletion can occur from the Folder Settings modal alone.

## Element-to-source mapping

The pinned source is EUR HOME title `0004003000009802`, version 24576, content
index 0 / content ID `00000082`, English locale. Conversion is
`ctr-native-web` 1.2.0 with CTRTool 1.3.0. The HOME CIA SHA-256 is
`2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`;
decrypted `code.bin` is
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.

| Visible element | Manifest/pack key → CIA-internal member | Member SHA-256 |
| --- | --- | --- |
| Dimmed lower backing | `home.dialogmask` → `layouts.DlgMask_D_00` → `dialogmask_LZ.bin/blyt/DlgMask_D_00.bclyt` | `45ffaa6a0379423844784ffd3e450b5f3e2bf46e1724484a234b40ca73afbc86` |
| Settled backing alpha | `home.dialogmask` → `animations.DlgMask_D_00_FadeIn` → `dialogmask_LZ.bin/anim/DlgMask_D_00_FadeIn.bclan` | `400bd1588c04d175c54104110c004f32dc96dd82d0a7cd9d9f0b8da8b2734fe4` |
| Modal frame, separator and Cancel row | `home.dialog` → `layouts.Dlg_B_D_01` → `dialog_LZ.bin/blyt/Dlg_B_D_01.bclyt` | `5f94fdfb5b5624957628173cf6411680a266558cd11367a1056eb8c960478edc` |
| Settled modal frame | `home.dialog` → `animations.Dlg_B_D_01_FadeIn` → `dialog_LZ.bin/anim/Dlg_B_D_01_FadeIn.bclan` | `8309b159b5f3d4df08f8e6260d6fa8707a421bfa3262233fb8314502f494e92b` |
| Title, Rename/Delete rows and hit panes | `home.sequence` → `layouts.DlgBtn02_00` → `sequence_LZ.bin/blyt/DlgBtn02_00.bclyt` | `1c53a7c5608659f5e1a198221902d814a58745b871f96d211248fc9446e76365` |
| English title/row/Cancel strings and styles | `home.messages` → `messages.menu_msbt_LZ` → `RomFS/message/EU_English/menu_msbt_LZ.bin` | `1df2193c64e8d08b3b670923617ea1f0461537397b3da671d394304a664b4350` |

The decoded archive source SHA-256 values are
`65675c4a6ecada83a0d7256ea20c36692190be10349bf87c32e6068376409704`
for `dialog_LZ.bin`,
`5add87203eb9a8adf05bc748a21fb47ee8bb8b55c6cf854e94c0007741e016d2`
for `dialogmask_LZ.bin`, and
`a8a1d36fe833cc91d8bf284b5c81c5f8492dfb669ec470a1b2612a41afa97668`
for `sequence_LZ.bin`. Delivered pack JSON SHA-256 values are
`8a7b72cd0e69601da7938503f648c18286fb4bcb2bf27fc0c33839dd4e0dca17`,
`675959c0268ed340a8d926836370a535c4a09b3acf2724b85ef9243a43348e4f`,
`c38ca7d80b27ffa88875c1d9090d11e7cad7e9f23f9398de69032dc807b9b1a0`
and (messages)
`3df11ee9ad6b57e4c043da636c4b606f52e41fbf0a57022cc2696f8b895817d2`.
The table above is the authoritative per-visible-element mapping.

## Reference and verification boundary

The implementation was fitted to the coordinator-supplied native own-PNG
`native-close-clean-20261002/screenshots/_02.10.26_16.35.34.415.png`, SHA-256
`055e408e5a079095db664963549ef218b3f77e9002ab2ce76433c250d03f2725`.
That image established the settled composition, absence of a mint cursor,
hidden underlying footer and retained selected-folder upper context. It was
used as reference evidence only; this worker did not operate or recapture the
native session.

Focused source verification passed:

- 73 tests across `native-home-folder-settings-panel`,
  `native-home-controls-paint`, `native-home-settings-panel`, `menu` and
  `native-screen-input`;
- `npm run typecheck`;
- `git diff --check`.

The tests cover exact resource order/bindings/messages, missing-resource and
draw failure behavior, eager texture readiness, half-open hit bounds, inert
gaps, phased pointer ownership, Rename exclusion, Delete routing, Cancel,
footer suppression, paired native-panel readiness and upper-folder retention.
The paired readiness recovery also releases held input and lets B/HOME close
Folder Settings from either the loading or error screen.

The full `npm test` run reached 1,715 passing, 23 skipped and one todo test.
Its 36 failures are the pre-existing sparse-worktree absence of
`model/candidates/joshua-xl/*.glb`: three model-delivery assertions and 33
source-model test modules fail with `ENOENT` before their assertions. This
slice neither owns nor restores those sourced model binaries.

Strict 1:1 fidelity is not established. The coordinator still must build and
run the required native/browser identical-input loop, capture raw browser LCDs,
diff the matched pair with a reasoned mask, inspect motion/input/cue timing and
record the result. Opening/fade timing, pressed-row animation and the existing
Delete confirmation remain unverified/non-native; the known opened-folder
side/root gutter residual is outside this slice and unchanged.

## Integrated residual triage

The coordinator integrated this slice as runtime `79e77f58` and captured the
production Folder Settings lower LCD. The fixed 280x200 modal comparison in
`home-folder-interaction-20261002/comparison/after/report.json` has 107 pixels
above delta 2. Header and Delete have zero pixels above delta 2 and maximum
delta 2. The residual is confined to:

- Rename: 11 pixels at x157/y82..92, maximum delta 89;
- Cancel: 96 pixels in the symmetric rounded bottom corners at
  x20..299/y212..219, maximum delta 8.

The source `DlgBtn02_00` panes place `T_BtnF_00` at y36 with source text size
17.5x21. The English `Rename` run has source width 67.9; its `n` glyph projects
from x149.1 through the exact right boundary x157.5. The native capture owns
coverage at browser column x157 while the existing LCD text path samples the
transparent atlas boundary there. All neighboring pixels are within delta 2.
No existing per-pane option changes that endpoint without changing the shared
font sampler or applying a capture-fitted translation/coverage override.
Neither is justified by the decoded layout, so the 11 pixels remain an explicit
source gap rather than a guessed panel correction.

The Cancel residual follows the source `P_WndwL_00`/`P_WndwR_00` rounded alpha
edge symmetrically. Those pictures already use their exact integer source pose
and extent. Their low-amplitude difference is composited over the independently
mismatched HOME substrate outside the modal; it does not identify a panel-local
geometry, texture or sampling correction. It must be reassessed only after the
underlying lower background is matched, without attributing that separate
scenario defect to this modal.

The report SHA-256 is
`ed993a37d7b13f3e261788a3c405a21229c0b679f05ff39505cf305109e12076`;
the inspected lower sheet is
`9dc3ee8dd13e14ff89ec88e4e58a5f3833961223d626d8e90c21391161c1d2c6`;
and the production lower capture is
`9859a03ed60111cb9550722112071835b8f6c409a02aff5e45084bdf0c131613`.
This bounded follow-up changed no runtime, assets or private evidence. No GUI,
build, browser or native session was run.
