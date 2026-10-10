# Health retained-LCD dimming - 10 October 2026

## Scope and captured defect

Worker base `a5a6c11d46ebb1caab877a1f7340ffb62ab4f95f`, branch
`codex/health-suspend-dimming-20261010`. Runtime and tests are committed as
`f6e83c4cc49df868cad035f774b1a0eb242ec42f`. Adjacent test-only correction:
`b955d8c0a4c4b03bc62a7e9c9b9cba6eaa7574d2`.

The coordinator's sealed ordinary Health audit contains 914 paired browser
frames from frozen production `5dab027`, build `AbU0doePk5fpJYzR19WW_`.
First/repeat frames 105/142 show dimmed retained lower Health with bright upper
Health. Lower HOME appears at 106/143, upper status at 109/146 and suspended
dialog at 111/148. Native own PNGs retain dimmed Health on both LCDs before
HOME; repeat `_10.10.26_15.09.19.841.png` exposes faint upper HOME while lower
still retains Health. The input routes and clocks are not aligned.

Audit root:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/folder-back-verification-20261010/offline-audit/health-home-v4/`.
Sealed selection SHA-256:
`a562df7daa50d2ef9c6c2cea63e18757036ef309d99b1cdd625d86c389eae855`.
Native audit SHA-256:
`5e78d3327ea54ff262e1678f696c3c1d7a1da58604616a96354807884aafb495`.
No worker capture pair, mask or pixel diff was produced.

## Diagnosis and correction

Before runtime edits, a regression ran actual `createScreens`, validated
`drawHomePauseLower`, decoded `poseNativeLayout`, and real
`createFirmwareModel`/`suspendedBackgroundPlayback`. Ordinary touch launch and
HOME reached receipt-backed elapsed update 8: upper SceneIn/AppPause frame 8,
lower fade frame 23, lower HOME alpha 15. Lower retained tint was already
`[102,115,128]`; upper material constant0 was `[.7888,.8064,.824]` instead of
its pinned endpoint `[.4,.45,.5]`.

Ranked hypotheses were inconsistent host source-phase mapping, incorrect upper
material binding, then stale capture/cache/receipt ownership. A separate real
player probe at shared source phases 0, 3, 8, 14 and 20 found the upper/lower
retained RGB tracks agree within the layout's byte quantization. The minimized
fresh-model failure therefore identifies the mapping inconsistency without
requiring a stale capture or cache. The presenter regression also checks that
material-only changes invalidate its raster cache while preserving geometry,
capture binding and generation separation.

Pinned code caller inspection confirms upper AppPause start at `0x1ed4fc`
before lower controller +0xe28 start at `0x1e1dcc`. It does not recover their
live epochs or cadence ratio. The existing [lower release source review](home-pause-release-20261009.md)
and [banner lifecycle](../native-banner-lifecycle.md) remain authoritative.

The bounded correction is an explicit **source-phase alignment adaptation**:
upper `BannerBG_AppPause` selects `min(20, lower fadeFrame)` from the already
selected lower presentation, retaining frame 20 after lower release. Both
retained color tracks end at source frame 20. No new ratio, delay, tint,
curve, timer, owner or state system is introduced. The existing lower
source-to-receipt mapping remains fitted; exact native timing is unproved.

The complete authored AppPause material sample follows that phase, including
constant0/constant1 tint and both texture-coordinate scale channels. Upper UV
insetting therefore follows the aligned material phase too. SceneIn geometry
keeps its independent original 0..20 sample. HUD, window, lower fade, footer,
two terminal lower holds and total 22-receipt lifecycle are unchanged.
`entryMotion.pauseFrame` continues reporting the original SceneIn sample.

The presenter drops only the old equal-frame coupling between independent
SceneIn and AppPause clips. Their names, integer bounds 0..20 and all source
validation remain strict. Close still requires settled SceneIn20/AppPause20
followed by bounded AppQuit in its existing override order. Generation, owner,
readiness, paired publication, frozen pending candidates and disposal guards
remain unchanged. No assets, manifest, firmware, shaders or system.ts changed.

## Source identity

Both resources belong to HOME EUR `0004003000009802`, version 24576,
`CTR-N-HMMP`, content index 0 / CIA-internal content `00000082`.

| Element / manifest key | CIA-internal resource | SHA-256 |
| --- | --- | --- |
| Upper retained material / `models.homeBackground` | `romfs/3D/BannerBG_LZ.bin` | `27d58c2113d2c2d46e3bcc36bb2ae56c35e19d9823488287b6759df998108711` |
| Decoded CGFX / `BannerBG_AppPause` | Decoded BannerBG container | `092c8682d0cfabf0a1823a8e3a2c12556515c437afba2aa6f6ac7fc4d5e34595` |
| Delivered upper model | `models/home-background/model.json` | `45b3c6a470f681a10443f90fc73aff016b97a077b977b62649465524dffd3615` |
| Lower retained layout / `home.launcher` | `romfs/launcher_LZ.bin/blyt/LncPauseFade_D_00.bclyt` | `87acf2364346072552cc48761184e8b98f61b3f9231e57703af48808cf509f2e` |
| Lower dim/entrance track | `romfs/launcher_LZ.bin/anim/LncPauseFade_D_00_SceneIn.bclan` | `11a82f19bb21c3da0ccb67039ddf86b5feb90d8c7aafe4f3d57a77f49fd3b25f` |
| Delivered lower pack | `packs/home/launcher.json` | `f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044` |
| Lower archive | `romfs/launcher_LZ.bin` | `826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834` |
| Native caller code | `exefs/code.bin` | `243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9` |

Upper converter: `ctr-cgfx-web` 1.1.0, SPICA
`bd29a7828595d7839cda2ac61c76bb63f9071250`, wrapper
`6377be3d3670b6ed7c9bf6a947d0f3bd7c02a5970788d4f5f27446b8fa14fe1f`, exporter
`946ff91fae009fd667a66cf528e40e6b52ba2a76e04d7d1fe73da9c383ef258e`.
Lower converter: `ctr-native-web` 1.2.0; extractor CTRTool 1.3.0.
Delivered model and pack hashes were verified; no re-extraction occurred.
Unchanged mask, fonts, textures and capture-slot/padding provenance remain in
the [upper source record](../home-suspended-background-2026-10-02.md) and
[lower transition record](home-pause-lower-transition-20261008.md).

## Checks and remaining work

Private logs:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/health-suspend-dimming-20261010/`.

- `red-retained-dimming.log`: original minimized regression, 0 pass / 1 fail.
- `red-source-domain-probe.log`: ordinary input regression plus source probe,
  1 pass / 1 fail. The upper material-state mismatch is preserved verbatim.
- `green-retained-dimming.log`: same regression/probe, 2 pass / 0 fail.
- `focused-initial.log`: 103 pass / 7 fail before preserving the existing
  pauseFrame diagnostic contract; retained as investigation history.
- `focused-final.log`: 147 pass / 0 fail across eight focused files, including
  ordinary launch, Resume-then-HOME, fresh capture generations, independent
  material cache keys, invalid clips/frames, close, reduced motion, owner and
  publication/retry guards. `git diff --check` passed.
- Independent different-model review approved exact `a5a6c11..f6e83c4`,
  coordinator-reported 178/178 tests, report SHA-256
  `15f821dcdcae63293d10e5bc999cee14ee35bee4341d0cc55cf84414031fde89`.
- `npm-test.log`: first full run, 2564 pass / 45 fail / 101 skip / 1 TODO.
  Forty failures involved unhydrated tracked hardware GLBs, four adjacent
  tests still equated material and geometry phases, and one requires the
  absent private Camera `camera-3d-badge-sdmc-recapture-20261005/browser/lower.png`.
  No failure log was overwritten or test skipped to hide these failures.
- `lfs-checkout.log`: existing local LFS objects hydrated 77 tracked GLBs.
  The three production GLBs have valid glTF magic and hashes matching HEAD's
  LFS oids; no tracked model or asset change resulted.
- `adjacent-fixture-green.log`: 108 pass / 0 fail. Commit b955d8c preserves
  all prior SceneIn receipt/owner/failure assertions and separately checks
  authored material phases using literal expected values. Exact independent
  follow-up review approved it with coordinator-reported 219/219 tests,
  report `11581308649cba233dcf6ffb5e54ce1ebff92cd7f8c169d1927fba2e80ee03ab`.
- `npm run typecheck -- --incremental false`: passed (`typecheck.log`).
- `npm run check:shader`: passed, required validation attempted and OK,
  no diagnostics (`check-shader.log`). This checks the repository WGSL
  shader; it is not a native CGFX GPU-pixel comparison.
- `npm test`: final 2665 pass / 1 fail / 101 skip / 1 TODO, 2768 tests,
  28.44 seconds (`npm-test-final.log`). Sole failure is the unchanged absent
  private Camera PNG noted above. No runtime change followed review.
- `npm run build`: passed (`build.log`), Next.js 16.3.4/Turbopack,
  build ID `na-t0YK-P1Kxs8zcVSbX_`. Local copied dependencies were used,
  without an external dependency symlink or temporary root override.
- Final relative-link and `git diff --check` checks passed. Source/public/tests
  match b955d8c exactly; committed source/public trees remain byte-identical
  to reviewed f6e83c4. The handoff is committed separately from runtime/tests.

Reproduction command:
`node --test --test-name-pattern="real HOME compositor finishes|pinned upper and lower" tests/home-pause-window-entry-live.test.mjs`.
The eight-file focused command is
`node --test tests/home-entry-motion.test.mjs tests/home-pause-lower.test.mjs tests/home-pause-window-entry-live.test.mjs tests/home-suspended-background.test.mjs tests/firmware-banner.test.mjs tests/home-application-transition.test.mjs tests/home-suspended-window-entry-policy.test.mjs tests/animation-flow-pause-compact.test.mjs`.

The regression verifies real composition dispatch and decoded material/pose
state through recording Canvas/WebGL transports, not GPU pixels. This worker
did not run a browser, server, Azahar, audio comparison or native recapture.
Source-identified, delivered, implemented and focused-tested evidence is
distinct from browser-inspected and native-compared acceptance.

Lower HOME still enters before upper HUD/dialog under unchanged mappings;
the native upper-first partial ordering remains unresolved. Exact cadence,
retained capture epochs, input equivalence, endpoint pixels and audio remain
open. Capture-slot assembly, paired-receipt scheduling, fitted controller
mappings, reduced motion and portfolio content remain explicit adaptations;
no new non-native artwork is introduced. The shortcut Resume loading/blank
failure is separate and untouched. Strict whole-scenario 1:1 remains unproven.

## Frozen verification candidate

Coordinator serving lease is released for
`/Users/paramveer/.codex/worktrees/health-suspend-dimming-20261010/3ds-idea`,
already-built `na-t0YK-P1Kxs8zcVSbX_`. Worker started no server and owns no
listener. Source, public, tests and `.next` are frozen for coordinator-only
recapture; do not rebuild before using this identity. The previous shortcut
tree is untouched. Private `freeze.json` records the final handoff HEAD,
committed tree identities, production GLB hashes and build-manifest hashes.
Owned STATUS reconciliation is the only local uncommitted change. All finite
worker handles are reaped. Integration, push and native acceptance remain
coordinator responsibilities.
