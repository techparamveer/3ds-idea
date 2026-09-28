# Camera final cell publication: complete writer replay

Based on `955062d`, this closes one verifier boundary from the
[renderer generation audit](camera-scene-generation-source-audit.md): the
original final cell writer `0x2d804c` now executes through return, including its
position, clipping, retained-state and native pane-field writes. It is no longer
only an intercepted leaf or an executed prefix in this **separate** verifier.
The connected request/rebind replay has not yet adopted this object graph.
The later [property setter replay](camera-property-publication-source-audit.md)
executes `0x25a618` through return with synthetic property bytes, while
recording its downstream material call. It also remains separate from this
cell fixture and does not produce pixels.

**Live gallery paging and folder/photo transitions remain unchanged.** Complete
SceneBrowse replacement and final photo pixels are still not demonstrated.
Capture and editing remain absent.

## Source and scope

[replay_camera_cell_publication.py](../scripts/replay_camera_cell_publication.py)
uses EUR Camera `0004001000022400`, content `0000-0000001a`, SHA-256
`3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`.
Input bytes must match before Unicorn loads. No executable bytes or new assets
are committed.

The source cell writer and helpers `0x2d7e68`, `0x1fb100`, `0x1fd060` and
`0x1fd178` execute when reached. Only two services are recorded leaves:

- `0x25e6d8`: attach a child control to the retained control tree.
- `0x231500`: bind a layout resource to the control. The fixture records the
  supplied synthetic handle; it does not create a native layout or material.

The fixture supplies separate current/previous controls, three synthetic pane
children, model-owner flags, a settled transition fraction of 1, and the
`0xff7f` no-special-selection sentinel. This is bounded ordinary-cell output,
not full transition interpolation or proof of photo texture binding.

## Executed cases

Twelve cases all return from the original writer. Coordinates below are source
coordinates, before the 320×240 lower-screen coordinate adapter.

| Case | Observed retained output |
| --- | --- |
| Ready 0 and ready 1, fresh cell at `(0,33)` | Both attach the current control and mark its position dirty. Their recorded attachment/layout requests match; the readiness byte differs. Readiness alone is not evidence of different photo pixels |
| X = −192 or +192 | Current control remains attached |
| X = −192.01 or +192.01 | Current control is not attached; position is still written |
| Previously attached control moves to X = 193 | Source clears its attachment bit and `+0x34`, sets control flag `0x80`, and clears parent flag `0x200` |
| Fresh padded blank or out-of-buffer item | No current/previous control is attached in these fresh-state cases. This does not establish a prior photo's blank-transition fade |
| Either model owner disabled, previous record at `(12,22)` and ready 1 | The record is unchanged; the complete writer publishes position `(12,22)` and retains readiness 1 despite incoming `(99,33)` and ready 0 |
| Both model owners enabled again | Position advances to `(99,33)` |

The disabled-owner cases make the generation requirement concrete: calling this
writer with an ineligible owner does not clear its retained photo/pose state.
Teardown or replacement setup must retire that state before a new gallery is
allowed to consume it. The existing browser URL cache reset does not by itself
prove native scene ordering.

## Remaining integration gate and visual differences

Before replacing the live six-cell adapter, connect original SceneBrowse
retirement, replacement construction and complete control setup in one replay;
join its new request/completion and two presentation passes to the now-executed
cell writer; resolve real layout/material/photo upload and lower-LCD composition;
then compare the native and browser sequence through coordinator-owned captures.
The two recorded service leaves above remain explicit boundaries.

The live differences are unchanged:

- Selection still jumps between six-item pages; source horizontal strip motion,
  padded blank transitions and the source counted input cadence are disconnected.
- Folder/gallery/photo changes still use the existing immediate portfolio view
  navigation. The complete native Finder preview and image fade lifecycle is not
  connected to those transitions.
- Images enter the browser pair after URL decode, without measured native
  resource/consumer publication delay.
- The upper screen stretches portfolio photos into 400×240 as a framebuffer
  replacement. Native image/capture-buffer composition is not reproduced.
- The Back/Open footer is a declared read-only portfolio adaptation. Native
  Shoot/Settings/Slideshow controls would expose functionality outside this scope.
- Date/count binding, neutral background selection and widened empty-message
  pane retain the qualifications in [gallery validation](camera-gallery-source-validation.md).

No native/browser pixel comparison was performed in this worker. It made no
runtime changes because the evidence does not yet authorize live strip wiring.

## Reproduction and validation

```sh
python scripts/replay_camera_cell_publication.py \
  --code /absolute/private/camera/exefs/code.bin \
  --output /absolute/artifacts/cell-publication-replay.json
FIRMWARE_CAMERA_CODE=/absolute/private/camera/exefs/code.bin \
  python tests/test_camera_cell_publication.py
node --test tests/camera-browse.test.mjs \
  tests/camera-gallery-lifecycle.test.mjs tests/stock-native-camera.test.mjs
```

Python needs `unicorn==2.1.4`. Source checks pass all 12 cases; the two Python
tests cover those outputs and executable-hash rejection. The focused Node suite
passes 28/28, and typecheck passes. The first build attempt rejected a dependency
symlink outside the project filesystem root; dependencies were then copied into
this isolated checkout. The production build then passed, including static page
generation. No browser appearance claim follows from that build.

The orchestrator assigned home-disk artifacts because the SSD is full:
`/Users/paramveer/CodexArtifacts/firmware-10.7.0-32E/camera-live-gate/`.
`cell-publication-replay.json`, `cell-publication-source-tests.log`,
`cell-publication-focused.log`, `cell-publication-typecheck.log` and
`cell-publication-build-local-deps.log` identify this bounded pass.
