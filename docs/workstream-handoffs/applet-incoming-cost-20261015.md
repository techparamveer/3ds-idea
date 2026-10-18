# Applet incoming paint-cost diagnostic, 15 October 2026

## Scope and result

This bounded diagnostic adds two opt-in fields to the existing per-paint timing
receipt in `src/os/screens.ts`. It does not change animation timing, poses,
state, draw order, resources, raster options, input, publication, recording or
the production unmeasured path.

- `preOverlayMs` is elapsed wall-clock time from that paint's `startedAt` to the
  existing timestamp sampled immediately before `graphics.overlay` is called.
  The same timestamp remains the start of `overlayMs`, so measured mode adds no
  extra clock read at this boundary.
- `titleIncomingMs` starts immediately before and ends immediately after
  `graphics.drawAppletIncoming` in the title-owned incoming branch only. It
  excludes resource lookup, prepared-pair binding, common incoming covers and
  publication. A missing resource still fails before the draw call. A false or
  throwing draw follows the existing failure path.

Both fields initialize to `null` on every measured paint. `titleIncomingMs`
therefore stays `null` whenever that branch is absent, including a diagnostic
paint. `paintTiming()` still returns a copy and disposal still clears the
receipt. With `measurePaint` false, the receipt is `null` and the new code makes
no `performance.now()` calls.

This instrumentation is intended to separate the sustained Friends and
Notifications incoming-paint hypotheses recorded in
`docs/applet-destination-scheduling-2026-10-15.md`: title-owned incoming draw,
pre-overlay HOME composition and encoder cost. It does not itself assign
causality or establish a native or browser pass.

## Behavioral proof

`tests/applet-incoming-paint-timing.test.mjs` drives an actual reduced-motion
Friends opening through `createScreens` with a deterministic clock and
controlled overlay/title draw hooks. On the unmodified base, the focused test
failed because the receipt was `{startedAt:100, overlayMs:3}` rather than the
expected receipt containing `preOverlayMs:7` and `titleIncomingMs:9`. After the
source change it proves:

- exact start/end boundaries and five total measured clock reads;
- overlay then title-incoming draw order and successful incoming publication;
- `titleIncomingMs:null` on the next branch-absent paint;
- per-paint reset, returned-copy isolation and disposal clearing; and
- zero timing reads plus a null receipt when measurement is disabled.

Focused command:

```sh
node --test --test-reporter=spec \
  tests/applet-incoming-paint-timing.test.mjs \
  tests/manual-entry-live.test.mjs \
  tests/applet-title-entry-presentation.test.mjs \
  tests/applet-entry-live.test.mjs
```

Result: 88 passed, 0 failed. `npm run typecheck -- --incremental false` also
passes.

Full `npm test` completed with 2,983 passes, the unchanged missing historical
Camera PNG failure, 102 skips and one TODO. Its private log is
`applet-incoming-cost/npm-test.log` under the continuation artifact root,
SHA-256 `46a1ee3b87ae91723c6bedca1d7d9cec4cab764d1665752d51165bee5566668a`.
`npm run build` passes with worker build ID `xzX--oY_BchQrfOIYENUa`. This is a
worker verification build, not a replacement for the coordinator's frozen
captured build.

Independent review of exact source commit `ce402ac` found no actionable issue,
reproduced the 88-test focused pass and reproduced the new test's receipt
failure against base `a083673`. The review is
`applet-incoming-cost/review/source-review-ce402ac.md` under the private root,
SHA-256 `bee62cc6eb4408da8089eff51a7c03dd4074078470d27e024ea8208653f1925d`.

## Evidence and limits

The source-identified input is the sealed candidate audit under
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261015/applet-opening-cadence/`.
Its replay reports Friends incoming median whole-paint 20/20.4 ms with 11
missing incoming poses in each sampled opening, and Notifications median 34.8
ms with 15 missing incoming poses. Stock-overlay medians are only 0.4/0.6 ms
for Friends and 0.7 ms for Notifications. Pair encoding is separately costly.
Those recorded associations motivated this diagnostic but do not prove a cause.

Root also identified that the current title-owned incoming call does not pass
the existing `NativeDrawOptions.opaquePictureAlphaPanes` option used by common
covers. That observation is deliberately not changed or tested in this
diagnostic slice. Root's Node-only 100-iteration title-asset validation probe
reported a roughly 0.153 ms median for both app packs; it is not browser
evidence.

No GUI, browser, server or Azahar session was run. Root owns the two-opening
Friends/Notifications post-review capture policy. No native comparison, audio
acceptance, cadence improvement or whole-flow pass is claimed. The coordinator
runtime `dcb6fb3` and build `KlvHppEeEH9Xi0W9-2Eux` remain frozen.

This checkout initially had no dependencies. `node_modules` was cloned
copy-on-write from the coordinator checkout as setup only; no package install,
lockfile change or LFS hydration occurred. The historical Camera PNG remains
absent and unchanged. The worker instruction selected GPT-5.6 Sol with high
reasoning at normal speed; the tools expose no service-tier setting, so no tier
is claimed. The final usage check was 60% used / 40% remaining, above the
10%-remaining stop threshold.
