# Game Notes lower startup publication

The owner-bound composer already produced the source lower `ApltBoot_D_00`
pose and scene-9 draw flag. The live presentation discarded both, exposing the
settled list throughout entry. The painter now draws this applied lower pose
last while scene 9 draws, and removes it on the existing completion pass.
Painting does not advance the controller. The presentation cache also includes
the independent scene-9 flag.

## Original evidence

- [Ordered startup audit](native-notes-ordered-startup-audit.md): scene-9 event 0
  at `0x13b488–0x13b514`; reset/start at `0x13b8e0`; independent advance at
  `0x13bbec`; draw-clear at `0x13b93c`. The priority-0 scene draws after the
  priority-6 list under the manager's reverse draw traversal.
- [Published intro contract](native-notes-intro-publication.md): original
  `ApltBoot_D_00` resource, SceneIn binding and existing 21-pass owner clock.
- Game Notes `code.bin` SHA-256
  `8a2feea02c2a6ef62c8a8d3e4cc20faa5639fe5af47d3876f8a5d3ea43064cc6`,
  loaded at `0x100000`: `0x13b730–0x13b788` finds `T_Aplt_00`, allocates
  capacity 32, resolves `lau_title_memo` through `0x152180`, then sets the
  text through virtual `+0x78`. The original label literals are at
  `0x1aa2a0` and `0x1aa2b8`. The delivered message is **Game Notes**; the
  Japanese BClyt placeholder must not be displayed.
- `ApltBoot_D_00_SceneIn` keeps `P_Home_00` hidden throughout (single step
  key at frame -10, value 0). The pending ready-but-unstepped presentation
  samples SceneIn frame 0 without consuming an owner update. It replaces
  `T_Aplt_00` with the same native message. No HOME-label return route is
  introduced; that source route also needs `lau_title_menu`, which is absent
  from the delivered Notes message table.

## Verification and limits

`tests/notes-lower-intro.test.mjs` verifies exact applied-pose identity, final
lower draw order, independent scene-9 draw completion, localized text, pending
frame 0, the source HOME-pane visibility track, and the unchanged no-metadata
fallback. Together with intro publication/clock tests: **16 passed**.
`npm run typecheck` passed.

`scripts/verify-notes-lower-intro.mjs` runs the actual live painter with original
layout, texture and shared bitmap-font assets. It compares the previously
omitted-cover path to the corrected path at source updates 1, 10 and 21.
The first two lower LCDs differ; update 21 is byte-identical. All asset
loader diagnostics are empty. The six frames and side-by-side sheet were
visually inspected at `/Users/paramveer/.codex/artifacts/notes-lower-intro/`.
Reproduce with absolute `--artifact-dir`, `--asset-root`, and `--canvas-module`
(the last points to an installed `@napi-rs/canvas` entry point).

The worker did not claim a matched physical-console capture or browser result.
The parent integration task owns live browser QA. Native raster differences, the settled
lower list's own SceneIn adaptation, and the no-metadata tutorial route remain
outside this correction. The existing provisional 60 Hz clock is unchanged.

## Integration browser check

After integration, the production build at `http://localhost:3000/` was
operated through Work → HOME → Game Notes → HOME. The settled Notes lower grid,
suspended Work upper capture and HOME return were visible; browser warning and
error logs were empty. The brief lower cover was validated in the source-frame
render above, not captured at a matched browser animation frame. Native timing
and whole-screen comparison remain open.
