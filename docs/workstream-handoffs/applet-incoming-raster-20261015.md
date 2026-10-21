# Applet incoming background raster reuse — 15 October 2026

## Scope and result

This bounded source slice opts only the validated title-owned incoming
background pictures into the existing opaque-picture raster cache:

- upper `P_Bg_U_00` in `drawAppletTitleEntry`
- lower `P_Bg_D_00` in `drawAppletTitleEntry`

Both options are passed after the unchanged `validateAppletTitleEntryAssets`
call. The existing renderer guard still rejects unsupported geometry,
materials, picture colors, and nonopaque source textures. There are no clock,
pose, draw-order, renderer-guard, resource, cache-policy, state, input, or
recorder changes. The animated belt, icons, text, outgoing clips, and other
applets remain on their prior paths.

Root extended this worker's original reservation by exactly the two stale
expected-option assertions in `tests/applet-title-entry-assets.test.mjs`.
Those assertions now expect the upper and lower allowlists; all surrounding
behavior and assertions are unchanged.

## Why this slice

Root's diagnostic captures measured title-owned incoming rendering as the
dominant same-receipt paint cost. Friends had median title incoming / whole
paint / pre-overlay / encoding times of `17.8 / 20.5 / 1.4 / 9.3 ms`;
Notifications measured `21.8 / 25.3 / 2.5 / 9.8 ms`. The samples remain
browser CPU diagnostics, not native or compositor measurements.

The prerequisite feasibility probe covered every integer SceneIn frame 0–20
for both titles and LCDs: 84 comparisons and 29,030,400 RGBA bytes matched the
ordinary raster byte-for-byte, with maximum channel delta zero. All 16 invalid
controls were rejected. Delivered pack SHA-256 values were
`71aa6906925dc9b04ecea8b666d7360dc9e5f36280c39c275f382346891766f8`
for Friends and
`9137c1da5bdf61584dddfa14a090b9e79d7b1f20dba6736cc33c9fbede231d74`
for Notifications. Full source identities and method are in
`continuation-20261015/applet-incoming-cost/alpha-feasibility/report.md` in the
private artifact tree.

## Behavioral evidence

Before the production edit, the new focused test failed in the three intended
ways: the two allowlists were absent, the Friends upper background rasterized
20 times instead of once, and a nonopaque selected source texture reached the
ordinary path instead of being rejected by the opaque-alpha guard. The bounded
cache eviction/disposal control already passed.

After the edit, the focused test exercises the real pinned Friends and
Notifications packs and decoded textures through the actual title helper for
all 42 poses. The opted-in and opt-out routes produce exactly equal Canvas
source RGBA, source dimensions, draw rectangles, blend mode, and global alpha:
200 sources and 34,109,440 RGBA bytes. Each selected upper and lower background
rasterizes once per title renderer across 21 poses; the animated belt remains
on its original repeated path. A 400,000-byte cache run preserves equality and
its bound across eviction, and disposal empties the cache, zeroes retained
canvas dimensions, and keeps post-disposal drawing false. Invalid pack geometry
is rejected before either draw, and invalid selected source alpha is rejected
by the existing renderer guard.

Focused verification:

```text
node --test --test-reporter=spec \
  tests/applet-title-entry-raster.test.mjs \
  tests/applet-title-entry-assets.test.mjs \
  tests/applet-title-entry-presentation.test.mjs \
  tests/manual-cover-raster.test.mjs \
  tests/native-raster-compiled.test.mjs
34 tests, 34 passed
```

Nonincremental typecheck, full `npm test`, and `npm run build` are recorded in
the final verification section below after the source review checkpoint.

## Limits and remaining work

The focused Canvas transport records prepared source pixels and composition
arguments. It does not implement filtering, destination rasterization, or
native text ink. This is not complete LCD pixel evidence, a production browser
performance result, native comparison, cadence proof, input proof, or audio
proof. It does not establish that the observed missing incoming poses are
fixed. Friends cover ordering remains the existing documented adaptation; this
slice does not add or resolve an adaptation.

The worker did not operate Azahar, a browser, a GUI, or a server. Root owns the
post-review production capture. Dependencies were copied copy-on-write from
the frozen measurement checkout; no install, lockfile change, or LFS hydration
was needed.

## Final verification

Source/test commit:
`7cadf117733f4c0ad74505011e6345a6ae0af8e6`
(base `5e51e22043912b0cdeb2a40733bf91ffa796f0f2`).

- `git diff --check`: passed.
- `npm run typecheck -- --incremental false`: passed.
- Focused command above: 34 passed, 0 failed.
- `npm test`: 3,091 tests; 2,987 passed, 1 failed, 102 skipped,
  1 TODO. The sole failure is the preserved baseline Camera test
  `frozen HNI pair hashes and the ThmbBase date rect stay the recorded
  leftover`, because historical
  `/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/camera-3d-badge-sdmc-recapture-20261005/browser/lower.png`
  is absent. No title-entry or raster test failed.
- `npm run build`: passed; build ID `0gMCf5YkNIK5fheLAfL7o`.

Private logs:

- `applet-incoming-raster/base-red.log`, SHA-256
  `b0b661f2c86632880206280057dcec99e05ecc0db381054df08139feed9f5bfa`.
  An extracted base `5e51e22` produced the intended 3 failures and 1 passing
  cache/disposal control; neither managed worktree was changed.
- `applet-incoming-raster/npm-test.log`, SHA-256
  `a549d7f8410019af2b7ef4dc13b4c741b70f1c4e00b41868bbaa5ab1d632d049`
- `applet-incoming-raster/npm-build.log`, SHA-256
  `347f74dc0435a408edcade532060ae179e33d3127416e660dfe65b8935dab11c`

Independent review of source/test commit `7cadf11` found no actionable issues
and independently reproduced the intended 3-fail/1-pass base result plus the
34/34 focused pass. The review report is
`applet-incoming-raster/review/source-review-7cadf117.md`, SHA-256
`16515c64c9993b6e3222528b8051dfc5d17f08bb96bd725c612e99fb6da33223`.
The later handoff-only commit retains identical reviewed source/test blobs.

The frozen build is `0gMCf5YkNIK5fheLAfL7o` from reviewed source/test commit
`7cadf117733f4c0ad74505011e6345a6ae0af8e6`. At transfer, the worker releases
the `applet-incoming-raster-20261015` worktree, source, test, handoff, and build
reservation to root. Root owns integration and the intentionally small
Friends/Notifications production recapture; the worker will make no further
source or build changes.
