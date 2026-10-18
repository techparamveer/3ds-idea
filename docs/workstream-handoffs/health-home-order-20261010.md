# HOME suspension upper reveal order, 10 October 2026

## Scope and evidence

Worker base `8b36555dbe901d03ed1c8ddbab6be5bbd77b1406`, branch
`codex/health-home-order-20261010`. Source and tests are committed as
`8112d4797d035fe6e3b96ed123e10bb395e224f3`. The four changed paths are
`src/os/home-entry-motion.ts`, `src/os/home-suspended-window.ts`,
`tests/home-pause-window-entry-live.test.mjs` and
`tests/home-suspended-window-entry-policy.test.mjs`.

The closed dimming candidate audit, SHA-256
`8241e7baef8fd913ef703cca2cd5eaaaef3e3a5f120d0e087ca3f6b89a68de2e`,
records both retained Health LCDs dimming at browser pairs 126..131, lower
HOME first at 132, upper status at 135 and upper dialog at 137. Its sealed
selection is `1df6558df40cb52f16eb5c67be40780a306390353f3c20397ddb11272e49d929`.
The selected native repeat own PNG `_10.10.26_15.09.19.841.png`, SHA-256
`bfc55f7daa8221bd626f1a3eb428ca387bf5903b9966a856af21c2e35171bfd1`,
shows faint upper status/dialog while the lower LCD still retains Health.
These observations support order, not equal phases, epochs or duration.

The audit is under
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/health-suspend-dimming-20261010/offline-audit/candidate-home-v1/`.
No worker capture, mask, pixel diff or new native comparison was made.

## Diagnosis and implementation

The first red regression ran actual `createScreens`, `createFirmwareHome`,
decoded `poseNativeLayout`, `drawHomePauseLower` and the real firmware model
player. Ordinary touch Health launch followed by HOME exposed lower HOME at
receipt 8 with alpha 15, while upper status/dialog were zero. The original
test first found nonzero upper status and inherited dialog alpha at receipt
11, when lower HOME alpha was already 147. The final regression requires a
nonzero byte-quantized inherited dialog alpha, rather than any positive float.

Ranked hypotheses were inconsistent host source-phase mapping, independent
SceneIn/Appear epochs, then stale capture or receipt ownership. Fresh source
players reproduce the failure before owner reuse, so the bounded correction
changes only phase selection.

Read-only pinned caller inspection confirms normal return invokes upper entry
at `0x1e1da8..0x1e1db0` before starting the lower controller at
`0x1e1dc0..0x1e1dcc`. The upper request invokes HUD mode 1 at
`0x2a5d04..0x2a5d14`; `0x1d79e0` changes the mode only when needed and calls
`0x1eedec`. That mode path operates controller +0x74; it does not establish
the SceneIn +0x8c live epoch. Upper SceneIn +0x298 starts at
`0x1ed4b4..0x1ed4c0`, followed by Appear request `0x1ed4e0..0x1ed4e8` and
AppPause `0x1ed4ec..0x1ed4fc`. The existing lower release investigation was
not repeated. Its [two terminal holds](home-pause-release-20261009.md) remain
unchanged. No live numeric offset or cadence ratio was recovered.

This correction is an explicit **capture-supported source-phase adaptation**.
Upper HUD and launcher SceneIn use the already selected lower source phase,
except at lower frame 20. There, both retained dim tracks have finished and
lower HOME still has authored alpha zero. Upper selects source frame 21,
the first integer pose with positive alpha in both original upper SceneIn
roots. This is a semantic phase jump fitted to the captured ordering, not a
traced native controller advance. No new clock, delay, ratio, alpha curve or
graphic is introduced. At the following receipt, upper and lower SceneIn
again use the same selected lower source frame 23.

The separate G_Wndw Appear binding now selects the already aligned AppPause
material phase, capped at its source endpoint 10. This removes the former
late `elapsedUpdates - 10` fit. Appear runs behind the transparent launcher
root, then the original root reveals it. All Appear channels remain source
samples; expanded/compact ScaleUpDown, Sleep, WhiteBlack, metadata, source
validation and ordinary/dialog/close composition stay intact.

| Accepted receipt | Upper SceneIn | HUD alpha | Launcher root alpha | Window alpha | Lower fade | Lower HOME alpha |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 6 | 17 | 0 | 0 | 255 | 17 | 0 |
| 7 | 21 | 13 | 2 | 255 | 20 | 0 |
| 8 | 23 | 43 | 15 | 255 | 23 | 15 |
| 14 and 15 | 40 | 255 | 255 | 255 | 40 | 255 |
| 16 | 40 | 255 | 255 | 255 | released | 255 |
| 22 | 40 | 255 | 255 | 255 | released | 255 |

These are decoded source states in a compositor test, not captured GPU pixels
or native timing. Upper 3D SceneIn geometry and complete AppPause material
samples, including both UV channels, retain the prior dimming correction.
Lower source mapping, terminal/no-footer publications at 14 and 15, release
and footer 0 at 16, footer endpoint at 22, and `pauseFrame` diagnostics are
unchanged. The upper-first candidate must receive its existing paired receipt
before lower HOME can enter. Pending, failed and diagnostic paints do not
spend it. Owner/generation/readiness/retry/disposal and reduced endpoint
guards still use the same state and receipt path. `system.ts` is untouched.

## Source identity

HOME remains EUR `0004003000009802`, version 24576, `CTR-N-HMMP`, content
index 0, CIA-internal content `00000082`. The retained `ctr-native-web` 1.2.0
converter produced these layout resources. No conversion or extraction ran.

| Element and manifest key | CIA-internal source | SHA-256 |
| --- | --- | --- |
| Status layout, `home.hud/layouts.HudMenu_00` | `romfs/hud_LZ.bin/blyt/HudMenu_00.bclyt` | `c27b927db06ec234601e3fc1bfa3f55f1c9570353ac8016c5ad9812ebaab28de` |
| Status entry, `home.hud/animations.HudMenu_00_SceneIn` | `romfs/hud_LZ.bin/anim/HudMenu_00_SceneIn.bclan` | `dd44a8b153374128fa7737e1663aafe52fb2d8c45f0bc9f8526e8b48b0c0c7f2` |
| Suspended composition, `home.launcher/layouts.LncBase_U_00` | `romfs/launcher_LZ.bin/blyt/LncBase_U_00.bclyt` | `b1afe7bece548a4ffad1211d011b4822349f61b002616e3a173e2923f06f6a50` |
| Launcher entry, `home.launcher/animations.LncBase_U_00_SceneIn` | `romfs/launcher_LZ.bin/anim/LncBase_U_00_SceneIn.bclan` | `784a355f31faa9a43aea6bc5c8a1c3ecb0b4b54060ebb8f114748caecdb5e47a` |
| Window entry, `home.launcher/animations.LncBase_U_00_Appear` | `romfs/launcher_LZ.bin/anim/LncBase_U_00_Appear.bclan` | `2984f92736035fec7a9475b6840fc2ba27763a8dd5081cd883ab32651d6fb427` |
| Pinned controller code | `exefs/code.bin` | `243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9` |

Delivered `packs/home/hud.json` is
`76df2ed42d3bbe09bef599bc242ac2946b811a3c5ee362a8776483a257b4c775`;
`packs/home/launcher.json` is
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`;
`models/home-background/model.json` is
`45b3c6a470f681a10443f90fc73aff016b97a077b977b62649465524dffd3615`.
All were rehashed unchanged. The inspected existing disassembly is
`656187735b0ac3f3352e060308bf65ff54d0c460c581d6ee6c851cbaadd770b5`.
This was static inspection, not original ARM execution.

Unchanged upper model and lower fade source mappings, native fonts, textures,
messages and converters are recorded in the
[dimming handoff](health-suspend-dimming-20261010.md),
[upper HUD handoff](home-pause-upper-transition-20261008.md), and
[window handoff](home-pause-card-alignment-20261008.md).

## Checks and handoff

Logs are under
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/health-home-order-20261010/`.

- `red-upper-order.log`: original real-compositor ordering regression,
  0 pass / 1 fail, expected lower alpha 0 at first upper reveal, actual 147.
- `green-upper-order.log`: ordering, retained dimming and shared-source track
  checks, 3 pass / 0 fail before the stricter byte-alpha assertion and receipt
  boundary regression were added.
- `focused-before-fixture-update.log`: 180 pass / 9 fail, all nine failures
  assert the superseded upper phase map. Lower and geometry checks passed.
- `focused-after-fixture-update.log`: final 190 pass / 0 fail across nine
  files, including the finalized ordering regression, ordinary touch launch,
  same-owner Resume then HOME with a fresh capture generation, full SceneIn
  alpha/scale and Appear source poses, compact/expanded, failure/pending/retry,
  exact terminal holds, reduced motion and total receipt lifetime.
- `npm run typecheck -- --incremental false` passed in `typecheck.log`.
- `git diff --check` passed. Dependencies were copied into this worker using
  APFS clones from the frozen dimming tree; that tree was never mutated.

Focused command:
`node --test tests/home-entry-motion.test.mjs tests/home-pause-lower.test.mjs tests/home-pause-window-entry-live.test.mjs tests/home-suspended-window-entry-policy.test.mjs tests/home-pause-window-entry.test.mjs tests/home-suspended-background.test.mjs tests/home-application-transition.test.mjs tests/native-home-controls-paint.test.mjs tests/animation-flow-pause-compact.test.mjs`.

Source-identified, delivered, implemented and tested evidence is reported here.
The post-review production gate below supersedes the initial focused-only
handoff. First/repeat ordinary Health HOME suspension recapture and affected
regressions on the muted MacBook remain coordinator work.
The served dimming source/assets/tests/build and earlier exports remain frozen.
No worker server, browser, Azahar, audio comparison or native capture ran.

Still non-native in this composition are source-phase alignment and the
existing lower mapping, capture-slot/padding assembly, paired-receipt cadence,
status/calendar profile, reduced motion and portfolio content adaptations.
These remain necessary host or portfolio choices, not native fidelity proof.
No new non-native artwork is introduced. Exact native epochs, cadence, input
equivalence, retained-image bounds, endpoint pixels, audio and shortcut Resume
remain open. This slice does not accept a scenario or resolve Resume.

## Reviewed production candidate

The coordinator reports exact independent approval
`5ef3143c99627a8d601162f21b6b357c6d9dcd4be0ff48b231dc9474094da300`
for source/tests `8b36555..8112d47` and initial handoff `f7c6d9d`.
The reviewer ran 190 focused and 15 supplemental tests plus typecheck.
Runtime integrates/pushes as `2ea5068`; the initial handoff integrates/pushes
as `cf91eb97550ffc4532a93180a958b3a31a924812`. The coordinator then authorized
full worker checks and a production build without further source changes.

- `glb-preflight.log` verifies all 77 tracked GLBs have valid glTF magic and
  SHA-256 hashes equal to HEAD's LFS oids. All were already hydrated; no
  hydration or asset edit was needed. The three production GLB hashes match
  the preceding frozen dimming candidate.
- `npm-test.log`: 2,667 pass / 1 fail / 101 skip / 1 TODO, 2,770 tests,
  29.40 seconds. The sole failure is the unchanged absent private Camera PNG
  at `/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/camera-3d-badge-sdmc-recapture-20261005/browser/lower.png`,
  required by `tests/camera-date-group.test.mjs:44`. This is a failed full
  suite, not an all-green gate. No test was weakened, skipped or changed.
- `typecheck-full-gate.log`: `npm run typecheck -- --incremental false`
  passed after review.
- `check-shader.log`: `npm run check:shader` passed with required validation
  attempted and OK, no diagnostics. Shaders and materials were not changed.
- `build.log`: `npm run build` passed with Next.js 16.3.4/Turbopack. Build ID
  is `MHwPOu1oLhQcWrZ9Ke1TE`. This used this worker's locally copied
  dependencies, with no dependency symlink or temporary root override.
- Source/assets/tests remain byte-identical to reviewed `8112d47`; git diff,
  whitespace and relative-link checks pass. The committed source/public/tests
  trees are `6e1d38772865730397e48a4ce607a15ea3776552`,
  `7c838c9ca5e672dacea4c2484f69ca8c3426d5f4` and
  `589b05f3353a5b986263416996657ea321e2c4a6`, respectively.

The serving lease is released for this worker's build
`MHwPOu1oLhQcWrZ9Ke1TE`. Source, public, tests and `.next` are frozen for
coordinator-only recapture. No worker server was started. Private `freeze.json`
records the final handoff HEAD, tree identities, build-manifest and full `.next`
hashes, production GLB hashes and failed-suite details. All finite worker
command handles are reaped. The old dimming tree/build and all original
exports remain untouched. Browser/native inspection and strict whole-scenario
acceptance remain open; passing source checks do not establish native fidelity.
