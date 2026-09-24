# Sound entry record and room source

This slice publishes the original record layout, one ETC1A4 texture and all 12
associated clips. It supplies a standalone resting-layer helper; it does **not**
change live Sound composition, input, playback, camera ownership or visibility.

## Record: one 2D layout, two LCD instances

`romfs/lyt/S_BG.arc.LZ` contains `S_BG-Record`. The source conversion in
`sound-native14` already included this resource; the delivery selection omitted
it. `stock-ui-sound.json` now selects it and its 12 clips alongside the previously
published S_BG resources. Publishing changes only that pack, the new texture and
manifest selection metadata. HOME/shared bytes and provenance are preserved.

The hash-pinned executable audit is reproducible with
`scripts/firmware/sound_record_audit.py`; its safe result is
[evidence/sound-record-construction.json](evidence/sound-record-construction.json).
Function `0x1c3b40` loads `S_BG / S_BG-Record` twice through `0x1e5b90`:

| Instance | Registration channel | Initial clip |
| --- | --- | --- |
| app+0xbc | 6 | U_Default |
| app+0xc0 | 8 | Default |

Both are bound through `0x20b894` and conditionally started through `0x208c80`.
This proves construction and initial binding, not all scene visibility or motion
cadence. Published transition clips must not be played at guessed wall-clock rates.

The layout canvas remains 320×240. Picture `BG_Record_01` is 368×288 at
(26,120), with UV rectangle (0.28125,0.21875)–(1,0.78125), sampled from a
512×512 texture. `Default` keeps parent `BG_Recd` at (0,0), while `U_Default`
keeps it at (0,−332), both unit scale. Using LCD centres (160,120) and (200,120)
puts the lower picture rectangle at (2,−144) and the upper at (42,188).
The actual upper alpha footprint begins at x115 because the record is curved.
The constant resting tracks include keys outside the clip's declared range;
the existing source evaluator correctly clamps those one-key values.

Texture `BG_Record_01.bclim` decodes to PNG SHA-256
`dddc006390df2a4a84fa89a2484e3fae716bbd1b3aa23ca0740c9cda3f919a22`.
No custom geometry, font, shader or inferred vinyl drawing is involved.

## Integration hook

Merge `soundRecordLayoutSelection.layouts` and `.animations` from
`src/os/stock-sound-record.ts` into the existing `sound-bg` request. Do not create
another title session. In a source-appropriate resting entry view, call
`drawNativeSoundRecordBackground(renderer, top, 'top')` and the corresponding
`bottom` call after the base background and before the title/footer/control
layers. The helper returns renderer failure and uses the unchanged source poses.
The coordinator owns the entry view's visibility decision and live verification;
the source upper instance is initially disabled by the constructor. The helper
must not be applied indiscriminately to playback or every Sound screen.

This does not edit `stock-native-sound.ts`, so the Sound chrome worker's runtime
changes remain independent. Union the S_BG selection if both commits change the
publication plan/manifest; do not replace the other worker's additional packs.

## Upper room is a separate CGFX resource

The native entry capture supplied by the coordinator visibly contains a pale
checkered room/window behind the record. Re-extracting the first S.pack entry,
`S_Back_U.bcmdl.LZ` (offset 896, size 26427), identifies the actual artwork:

- `S_BG_U_Tx_A` (128×128) contains the white window lattice and tree/grass.
- `S_BG_U_Tx_BC` (256×128) contains the landscape strip and checkered room walls.
- Model `S_Back_U` has five meshes, six bones and two materials, `lambert1` and
  `lambert2`. It embeds camera1, a perspective Aim camera, and no animation.
- The compressed resource hash is
  `8c7d41fee74034b22bbd39b3a35d24906057f996c9201de51596feb218f504f5`.
  The existing [visualiser audit](sound-source-validation.md#upper-screen-visualiser-audit)
  records the model camera/material fields and exact executable references.

This texture identification establishes artwork identity, not a complete room
render. The prior audit inferred StreetPass-only use from type-0x372190 ownership
and slot-0x70 predicates. That inference must be revisited against the entry
capture: trace the parent/child scene lookup and predicate branch polarity at
`0x272000`, `0x2729a0` and the other app+0x8c toggle sites, including entry mode
and save state. Constructor `0x1c65c8` initially disables this object. Its
`lambert2` alpha reads FragmentPrimaryColor without an embedded light, so native
lighting/alpha ownership is another rendering gate. Do not treat the embedded
camera alone or a converted bind pose as a validated live presentation.

## Verification checkpoint

- `node --test tests/sound-record-background.test.mjs`: 2 passed; asset identity,
  manifest closure for the added resources, source geometry, independent upper/
  lower poses and helper dispatch.
- Focused record + native renderer + Sound visualiser audit tests: 16 passed.
  The first broader run lacked HOME launcher data in the sparse checkout;
  hydrating that existing pack resolved the fixture-only failure.
- `npm run typecheck`: passed. Production build/live composition verification
  remains the coordinator’s integration check.
- `sound_record_audit.py`: code hash, source strings and 16 ARM instructions /
  branch targets verified.
- `verify-sound-record-background.mjs`: both LCD source renders completed with
  zero diagnostics; upper alpha bounds [115,188,399,239], lower [2,0,319,142].
- Source renders were visually inspected alongside the coordinator's native
  `Nintendo 3DS Sound_24.09.26_10.52.20.238.png`; this is a layer comparison,
  not a pixel-diff acceptance or a live browser check. The source vinyl matches
  the characteristic split across both LCDs; other layers were not rendered.
- Artifacts: `/Users/paramveer/.codex/artifacts/sound-entry-background-source/`;
  `render/record-paired.png`, `render/report.json`, `upper-model/converted/`.
  Home-disk artifact placement follows the coordinator's explicit SSD-space
  constraint. No raw executable or CGFX is included in public delivery.

Run the offline renderer with absolute paths:

```sh
node scripts/verify-sound-record-background.mjs \
  --artifact-dir /absolute/output \
  --asset-root /absolute/public/os/firmware/10.7.0-32E \
  --canvas-module /absolute/node_modules/@napi-rs/canvas/index.js
```

The coordinator must verify the integrated entry view in the browser and native
reference. Strict 1:1 fidelity remains open.
