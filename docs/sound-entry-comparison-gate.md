# Sound entry-screen comparison gate

Checkpoint: continuation `0bc724d`. This is a bounded source/resource comparison,
not a matched native capture or a visible UI correction. No runtime or public
asset changes are made.

## Current entry composition

`src/os/stock-apps.ts` initializes Sound without a selected track. With the
production song manifest empty, `drawNativeSoundFrame` in
`src/os/stock-native-sound.ts` draws `S_BG`, `S_BG_D-Grid`,
`S_Inf_U-TitleBar`, `ParakeetA_U` and the Close button. The list cursor and Open
button are conditional on nonempty rows. No native entry-state controller is
represented by this composition; it is the existing portfolio library adaptation.

## Rechecked source evidence

The existing `scripts/firmware/sound_playback_audit.py` passes all 58 instruction
facts against the pinned Sound executable and pack. Its constructor evidence
shows `S_Play_D-CtrPanel1` initially enabled and CtrPanel2/3 and Effect disabled.
That does **not** establish which objects remain visible after entry completes.

The full converted source `lyt-S_Play_D-arc-LZ.json` makes an important distinction:
`S_Play_D-CtrPanel1` has no textures or drawable picture/text panes. Its only child
is the `-L-C_SldH_L` attachment pane, translated `(0,-39,0)`, size `(30,40)`.
The Default, In and Out clips have 20, 9 and 9 frames. Simply publishing or drawing
this parent would produce no visual correction. Its child binding and settled
entry state need evidence before a control can be added.

The full English message bank contains `S/P_BR_00` “Record & Edit Sounds”,
`S/C_T_06` “SD Card” and `S_dlg/P_Bro_000` “Checking SD Card...”. Their presence
alone does not establish the current empty-library screen's row set or an SD
status overlay. Do not add them solely because they appear in the source bank.
Recording and device storage operations remain outside the portfolio scope.

The currently selected title entrance clip ends at frame 5 (`frames: 6`), so
its frame-5 binding is not a partially completed title animation. The selected
`S_BG_D-Grid_Default` clip has one constant alpha key; advancing it would not
produce the missing entry screen either. These are not supported fixes.

## Verification and next gate

- Source audit: 58 assertions passed; all 12 visualiser model identities found.
- Full converted layout source SHA-256:
  `56f103796b2c1fc9a1f17fbc2d7f506bfae2d73f20044b9c658727017be2ef20`.
- The private report is
  `/Users/paramveer/.codex/artifacts/sound-entry-comparison-2026-09-25/playback-audit.json`.
  The coordinator approved home-disk scratch after the SSD refused new worktree
  writes. Raw firmware remains in its existing private location.
- No browser or native session was operated. The coordinator's isolated native
  profile was not read, changed or launched. No application rebuild is required
  for this documentation-only result.

A matched Sound entry capture must identify whether the specimen is first-run,
returning, SD-present or SD-absent, and whether it is before or after the entry
transition. Then compare it to the same route in the web app, and resolve only
the visible source child/layout bindings needed for that discrepancy. Until
then there is no sufficiently evidenced entry-screen correction in this slice.
See [Sound source validation](sound-source-validation.md) for existing playback
composition and its separately documented gaps.
