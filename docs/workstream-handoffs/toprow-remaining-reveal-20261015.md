# Remaining top-row HOME reveal

Base: `2ba95e52b33aa77f57c5a2bcd66ce81730a89316`.
Worker branch: `codex/toprow-remaining-reveal-20261015`.
Worktree: `/Users/paramveer/.codex/worktrees/toprow-remaining-reveal-20261015/3ds-idea`.

## Captured defect and scope

The coordinator inspected current Friends incoming and historical Browser and
Miiverse incoming sheets showing the full ordinary grid. Native references
instead retain Camera alone before neighbours and the top-row banner. Toolbar,
footer, empty marks and cartridge placeholder can already be visible; Camera
alone means the only populated ordinary app tile.

The evidence record is
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261015/toprow-remaining/native-triage.md`,
SHA-256 `a6d2027af5c14696ae59be264026f4ae43d5479becd9c60a4393cd66e5f052d9`,
reverified by this worker. It identifies the exact movies and inspected sheets.
Fixed decoded sample brackets are:

| Native route | Camera-only | First neighbour | First banner |
| --- | --- | --- | --- |
| Friends no-Mii OK return | 1892-1912 | 1913 | 1919 |
| Browser update-required OK return | 777-798 | 799 | 805 |
| Miiverse error/close-notice OK return | 1573-1594 | 1595 | 1601 |

These are notice/service-gate returns, not direct footer Close. The Friends
first return is outside its movie. The references are lossy full-window movie
crops, not own-PNG raw LCD pairs; the prior recorder/decoder max-RGB-11
disagreement remains. Ordinals establish sampled order, not native loader
epochs, matched input cadence or exact moving-pixel parity.

## Implemented adaptation

[screens.ts](../../src/os/screens.ts) extends the existing selected-only grid
predicate with guarded `friendsClosePose.kind === 'in'` and
`webClosePose.kind === 'in'`. Browser and Miiverse share the latter controller.
The runtime delta is one predicate line and its explanatory comment.

The retained ordinary tile comes from the existing selection, independent of
toolbar focus. Occupied ordinary neighbours use the existing native empty-slot
renderer during incoming0..20, including reduced-motion incoming20. Handoff
restores the populated grid; only its accepted paired receipt permits the
banner on the next clear paint. No controller, timer, resource, ownership,
generation, publication, disposal, input or logical-layout behavior changes.
Manual, Notes and Notifications keep their existing policy.

This is a cross-route fitted visibility adaptation. Native partial-neighbour
loading, its scheduling and direct-footer equivalence remain unknown. There
is no per-record browser-frame schedule or inferred delay. The earlier Manual
loader investigation is not reopened. Existing portfolio artwork and other
documented compositor adaptations remain non-native; none gains acceptance
from this change. All whole flows remain fail/unproven.

## Reused resources

No asset, extraction or converter changed. Vacancy rendering still uses
`launcher.layouts.LncIconSetSrc_00`, `LncIconSetSrc_00_Scale` and the existing
category-5 overrides in `createFirmwareHome.empty`. The
[Manual provenance record](manual-home-reveal-20261012.md#reused-provenance)
maps this to EUR HOME `0004003000009802`, v24576, content index 0 /
ID `00000082`, `launcher_LZ.bin/blyt/LncIconSetSrc_00.bclyt`, source SHA-256
`1296496b88f41abc6c9382f59bb51927a6b8f049f9cc02454653f27d2730dcaa`,
converter `ctr-native-web 1.2.0`. Delivered launcher SHA-256 remains
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`.
Selected ordinary icons retain their existing manifest-backed source paths.

## Tests and evidence tiers

[manual-home-reveal.test.mjs](../../tests/manual-home-reveal.test.mjs) uses
the real System, close controllers, compositor, firmware helper, decoded
launcher/title textures and material renderer. Public toolbar selection and
applet invocation precede actual touch down/up Close and accepted receipts.
Unrelated app screens, cover drawing and Canvas transport are fixture doubles.
Assertions inspect source-material pixels and placement, not browser raster
or GPU publication. These are behavioral regression tests, not native matches.

New coverage includes first/repeated Friends, Browser and Miiverse returns,
retained Health then Camera with toolbar focus, every incoming0..20 and reduced
motion, unavailable empty graphics/restored artwork, retry, revoked receipts,
cancellation, firmware replacement during incoming and stock-resource
replacement at outgoing20. Firmware replacement preserves these three return
controllers and requires fresh incoming/handoff receipts. Notes/Notifications
keep their existing reset behavior. Every paint checks state immutability.

All logs are under
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261015/toprow-remaining/source-checks/`.

- Baseline: 16/16 reveal tests pass in `reveal-base.log`.
- Before runtime edits: expanded tests report 15 passes and 18 target failures
  in `reveal-red.log`, showing populated ordinary neighbours instead of the
  retained title or bypassed empty-resource failure.
- Final tests against the exact base renderer substituted only in memory:
  15 passes and 18 target failures in `reveal-red-final-tests.log`.
- Candidate: 33/33 reveal tests pass in `reveal-green-corrected.log`.
- Focused footer/entry/compositor/scene-policy checks: 158/158 pass, zero skips,
  in `focused-final.log`.
- Typecheck and hydrated production build pass in `typecheck.log` and
  `build.log`; worker build ID `2T2xqk628oKa29d2gJUgk`.
- Dependencies and local LFS hydration are recorded in `npm-ci.log` and
  `lfs-checkout.log`. No tracked assets changed. `git diff --check` passes.

The initial `reveal-green.log` and `focused.log` preserve three test failures
caused by incorrectly expecting stock-renderer replacement to invalidate
incoming HOME resources. Incoming binds firmware assets; the final tests
exercise stock replacement at outgoing and firmware replacement at incoming.
No runtime change was made for that test correction.

No full suite, GUI, server, browser inspection or native comparison of this
candidate was performed. The coordinator owns independent review, final
integrated checks and recapture. A worker build does not establish visible
delivery or native acceptance. After the explicit-path commit, the worker
relinquishes this checkout to the coordinator; the root-owned STATUS assignment
remains unstaged for that handoff. The prior baseline checkout stays frozen.
