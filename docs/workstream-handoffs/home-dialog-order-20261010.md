# HOME dialog pixel-order diagnostic, 10 October 2026

## Scope and outcome

Worker base `f0768c43cda47924275a9a9733ad600377b2905d`, worktree
`/Users/paramveer/.codex/worktrees/home-dialog-order-20261010/3ds-idea`,
branch `codex/home-dialog-order-20261010`. This slice adds only
`tests/home-pause-dialog-pixel-order.test.mjs` and this handoff. No runtime,
asset, existing test, served build, native reference or private audit changed.

The suspected missing upper-dialog-before-lower-HOME stage was **not
reproduced** by the actual Canvas/native-renderer diagnostic. The baseline is
GREEN. An intentional test mutation is rejected, demonstrating that the
pixel-order assertion can detect the suspected ordering loss. This mutation
is not a baseline bug reproduction. No runtime correction is justified.

The native own PNG `_10.10.26_15.09.19.841.png`, SHA-256
`bfc55f7daa8221bd626f1a3eb428ca387bf5903b9966a856af21c2e35171bfd1`,
shows faint upper dialog/status with lower retained Health. It supports order,
not a native alpha threshold, controller epoch, duration or host cadence.
The existing [source-phase adaptation](health-home-order-20261010.md)
remains an adaptation; this test does not establish native pixel acceptance.

## Actual raster and controls

The test drives ordinary Health touch launch and HOME through the real
reducers, `createScreens`, `createFirmwareHome` and `NativeLayoutRenderer`.
It loads decoded delivered HOME textures, native bitmap-font sheets,
messages and native title icons into actual `@napi-rs/canvas` surfaces.
There are no synthetic marker bytes or positive-alpha-only assertions.

For each accepted pair the upper counterfactual starts with the exact
pre-window Canvas destination, draws the same `LncBase_U_00` pose with only
`N_Wndw_00` hidden, then draws the same HUD. All other launcher panes remain.
The lower counterfactual starts with the exact pre-fade destination and draws
the same `LncPauseFade_D_00` pose with only `P_Lnc_00` hidden. Its retained
Health, dimming and other fade content match the tested pair. RGB comparisons
use any nonzero byte difference, without a fitted visibility threshold.

| Accepted receipt | Dialog-only changed RGB pixels | Maximum channel delta | Lower HOME changed RGB pixels |
| ---: | ---: | ---: | ---: |
| 0..6 | 0 | 0 | 0 |
| 7 | 45,480 | 3 | 0 |
| 8 | 46,554 | 17 | 76,792 |
| 9 | 45,082 | 55 | 76,800 |

A fresh compositor repeat produces the same values. The mutation hides only
the window at the existing upper-first SceneIn source pose 21, leaving HUD
and lower content unchanged. Receipt 7 then has zero dialog RGB contribution;
the first dialog and lower HOME contributions occur together at receipt 8.
The same ordering assertion throws, and the test requires that rejection.

The fixed retained pixels come from native ready Health own PNG
`_10.10.26_15.09.02.612.png`, SHA-256
`f7a9c4f76c27e59320655e96f372049489a8afe35a120f290de87b4d9d8fb457`.
The CPU fixture substitutes that fixed opaque upper destination for the 3D
background callback. Stock-app I/O/capture ownership and unrelated native
chrome are fixture adapters. Native window/HUD/lower rasterization is real,
but actual Three.js retained-image geometry/material/dimming is not exercised.
Therefore the fixture alone cannot attribute actual raw browser pixels at
the same 3D pose or prove a native/browser match.

## Hypotheses and browser evidence

The original ranked candidates were quantization eliminating the upper-first
dialog, inherited-alpha composition eliminating it, then missing/stale paired
publication. The real CPU RGB results contradict the first two for this
destination. Coordinator metadata also records valid upper-first receipt 7
at raw browser first 115 and repeat 143 (lower fade 20), followed by receipt
8/fade 23 at 116/144. Sampling away receipt 7 is contradicted for those runs.

The old footer browser audit classified dialog first at 116/144. Independent
read-only raw diagnostics now find a faint caption-shaped residual at
115/143, consistent with the real-renderer result. This is supporting
attribution, not an exact same-pose 3D counterfactual or native acceptance.
No exact actual-3D no-dialog counterfactual is available in this worker.
Coordinator/reviewer additive evidence may refine the old visual selection;
the original report, selections, captures and seals are preserved unchanged.
No new source-only trace or guessed delay, alpha, curve or graphic was added.

## Checks and reproducibility

All logs are under
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/home-dialog-order-20261010/`.

- `red-01.log` and `red-02.log` are fixture setup failures (missing icon,
  then missing icon decode dimensions), not runtime ordering failures.
- `red-03.log` is the first GREEN raster diagnostic, with the overly broad
  whole-launcher omission. `red-04-window-control.log` tightens omission to
  only the window and remains GREEN.
- `pixel-order-05.log`: baseline, fresh-compositor repeat and required
  mutation rejection, 1 pass / 0 fail / 0 skip. SHA-256
  `8d145cee2ca3f3962190e128b7fcb9f7f581cdc669c86a542d19fb8a24223552`.
- `focused-06.log`: 56 pass / 0 fail / 0 skip across the new raster test,
  pause-window live/policy, entry motion, retained Resume and footer live
  tests. Existing receipt/readiness/owner/lifecycle coverage remains intact;
  the new repeat is a fresh compositor, not a claim of full lifecycle coverage.
- `typecheck-06.log`: `npm run typecheck -- --incremental false`, exit 0.

The raster command is `node --test tests/home-pause-dialog-pixel-order.test.mjs`
with these absolute environment paths:

```text
NATIVE_CANVAS_MODULE=/Users/paramveer/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas/index.js
NATIVE_PAUSE_REFERENCE=/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/matched-regressions-20261010/home-health-native-v3/_10.10.26_15.09.02.612.png
```

Without either private dependency the test is explicitly skipped, following
the repository's optional actual-Canvas pattern. The pinned runs above did
not skip. Dependencies were APFS-cloned into this new worktree from the frozen
footer worker, never symlinked; the frozen tree was not mutated.

Delivered launcher/HUD/messages pack SHA-256 values remain respectively
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`,
`76df2ed42d3bbe09bef599bc242ac2946b811a3c5ee362a8776483a257b4c775`, and
`3df11ee9ad6b57e4c043da636c4b606f52e41fbf0a57022cc2696f8b895817d2`.
The unchanged native element/source mappings and converter identity are in
the linked source-phase handoff and its linked dimming/window handoffs.

This is test evidence only. No worker browser/native operation, server or new
build ran. The known private Camera fixture failure is not skipped or fixed
by this slice. Whole-scenario fidelity, exact native epochs/cadence, input,
audio and other documented residuals remain open.
