# amiibo opening UI — English source binding and publication

The original-model EUR applet opening screen now uses published native Header,
PortalSceneCTR and PortalBtnSub resources, alongside the previously published
backgrounds, upper instructions, standard buttons and Close. Both header panes
show the original EU English `amiiboSettings` message. The live title loader and
stock painter use this selection; no new HOME entrypoint was added.

## Header binding, from the original code

The source image remains title `000400300000b902` with SHA-256
`316c8a1cb37c2aab7813a5546f355ab0bdd3f635fe56b606abf91bb191a1d2d9`,
address base `0x100000`. The layout's `IGN_Header` call name is an authoring
placeholder, not a missing English-bank record:

- `0x17dea8` forms the address `0x17df2c`, the literal `amiiboSettings`, and
  `0x17deac` branches to the header setter at `0x17d6e4`.
- The setter resolves the supplied label through `0x17d7a4` (`0x17d708`).
  That routine selects the message bank and calls `0x196e54` with the label.
- `0x17d71c` and `0x17d758` load pane names from `0x212b68/0x212b6c`:
  `T_HeaderTitle_01` and `T_HeaderTitle_00`. Each resolves the named pane via
  `0x16a840` and passes the same resolved text to `0x17d0ec` at
  `0x17d734/0x17d770`. That wrapper reaches the text setter `0x18a078`.
- The supplied `cabinet` EU English bank maps `amiiboSettings` to original
  message index 83, text **amiibo Settings**. The publisher retains its source
  index in `uiSelection`; source layout bytes, including the Japanese authoring
  fallback, remain immutable.

`scripts/audit_amiibo_material_commands.py` now pins this label literal, dispatch
instructions and both pane pointers, in addition to the material evidence.
The source report is under SSD firmware root
`reference/amiibo-opening-live/source-bindings.json`.

## Selection and runtime

`scripts/firmware/stock-ui-amiibo-settings.json` reproduces the title selection.
The source was rebuilt from the original extracted RomFS using converter 1.5.2
and installed CTRTool 1.3.0 provenance, then passed through the normal stock UI
publisher. This worker's converter version is deliberately recorded rather than
pretending the pack used a later integration converter. Integration may rebuild
with its newer converter if it reconciles title provenance.

The publication writes 29 selected/dependency resources (157,918 bytes), adding
three packs and eight content-addressed PNGs. Existing background/button packs
retain their bytes. The message selection adds only `amiiboSettings`; HOME,
shared fonts and unrelated title provenance are preserved by the publisher.
Private conversion and publication report:

- `assets/stock-ui/amiibo-settings-native152-opening/`
- `assets/stock-ui/amiibo-opening-publication-report.json`

`stock-native-amiibo.ts` renders the source upper background, instruction panel
and header, and the lower background plus all five PortalSceneCTR parts. It
binds the header by named panes exactly as traced. The lower buttons use their
unselected source pose and Close uses the settled SceneIn endpoint.

**Portfolio adaptation:** this is a static read-only opening screen. Register,
Delete Game Data, Reset and NFC Reader/Writer Update are visible but inert.
There are no selectable operation rows, generic operation detail screens, NFC
calls, account operations or update/network behavior. Touch Close and physical
Back share the existing close action and preserve the caller's return path.
This does not reproduce operation flows, selection motion or opening timing.
The pre-existing shared-font presentation binding remains explicit provenance.

## Verification and remaining acceptance

- 14 original RomFS converter tests pass.
- Published resources pass the normal delivery audit (1,616 records, no errors).
- Opening input/publication plus title loader/session checks: 48 tests pass.
- Published material/part checks: 8 tests pass without skips. Existing stock
  input/preparation checks: 51 tests pass.
- The stock helper render verification passes all 12 paired-LCD scenarios,
  including the new amiibo screen. It asserts both English header bindings, the
  update part dependency, no hidden portal part, immutable packs and one Close
  target. Typecheck passes.
- Actual published assets were rendered through `loadNativeTitleAssets` and
  `drawNativeHelperFrame`; both amiibo LCD PNGs were visually inspected at
  `reference/amiibo-opening-live/amiibo-settings-main-{top,bottom}.png`.

No browser or emulator was driven by this worker. The paired images are source
renders, not matched native evidence. Browser integration, a matched native
opening frame and font/motion fidelity remain acceptance work for the
coordinator. The earlier isolated build limitation from the shared dependency
symlink still applies; integration must run the production build.
