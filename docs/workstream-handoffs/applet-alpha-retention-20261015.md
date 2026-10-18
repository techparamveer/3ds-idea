# Applet opaque-alpha retention, 15 October 2026

## Scope and result

This bounded repair changes only the existing opt-in
`opaquePictureAlphaPanes` path in `NativeLayoutRenderer`. The renderer still
validates that the selected source raster is opaque, copies its exact RGBA,
replaces only the alpha byte, and synchronously composites the resulting
Canvas in the original order. Instead of retaining a full LCD-sized Canvas for
every animated alpha value, the existing 8 MiB LRU now retains one mutable
scratch Canvas per raster size. The scratch surfaces participate in the same
byte accounting, eviction and disposal as every other cached Canvas.

The implementation does not enlarge the cache, alter source RGBA, change
clips, blends, draw order, clocks, poses, input, HUD invalidation or failure
behavior, or add prewarming or scheduling. The first cold raster cost remains
open. Source commit: `b83b7683aaba2f50ce9a7724e1a7e370deac19bd`
(`Bound opaque alpha raster retention`).

## Reproduced cause and behavioral proof

`tests/applet-title-entry-raster.test.mjs` now drives the actual Notifications
stock composer before and after all 21 incoming title frames. Its only fixture
substitutions are unrelated imports and font ink; pack, texture, renderer,
stock composition, title composition and HUD-time invalidation paths are real.
The ordinary `npm test` route therefore covers the retention regression without
requiring the optional Canvas runtime.

Against base `a7af99ae6d9e631c240a9ad5aa8f2d89b753497c`, the stressed HUD
invalidation rerasterized 19 pictures while its unstressed control rasterized
one. With the candidate, both control and stressed invalidations rasterize one
picture. The ordinary fixture retains 97 entries / 6,251,904 bytes, below the
unchanged 8 MiB budget. The optional real-Canvas route retains 97 entries /
6,253,152 bytes and produces byte-identical native-size output between control
and stressed compositions. Because font ink is stubbed, this is not a full
production LCD equality result.

The focused tests additionally prove:

- all 42 Friends and Notifications title poses preserve the exact prepared
  Canvas sources relative to the original non-reuse path;
- alternating the two independent title packs retains only one upper and one
  lower scratch, without cross-pack pixels;
- a 400 KiB cache still evicts under pressure, and retained scratch/raster
  surfaces are zero-sized by disposal;
- invalid, missing and nonopaque allowlisted pictures remain explicit failures;
- dynamic texture identity and sequential same-size draws remain isolated.

The direct `globalAlpha` shortcut was rejected. A real `@napi-rs/canvas`
comparison of 1,280 color/alpha cases found 466 output mismatches against the
explicit-alpha source route, with maximum channel delta 128. The production
path therefore keeps the existing alpha-byte construction rather than relying
on Canvas opacity multiplication.

Independent review found no actionable issue. It independently reproduced the
base 19-versus-1 failure and candidate 1-versus-1 result, and passed dynamic,
same-size and tiny-limit checks. The report is
`review/report.md` under the private artifact root, SHA-256
`e64b0eb008f2558cb8f65a1a723f6de60d004d7e87f624f9cd764243af19cac4`.

## Verification

Private logs are under
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261015/applet-alpha-retention/`.

Focused source and optional real-Canvas command:

```sh
NATIVE_CANVAS_MODULE=/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/eshop-idle-source/canvas-runtime/node_modules/@napi-rs/canvas/index.js \
node --test tests/native-renderer.test.mjs \
  tests/applet-title-entry-assets.test.mjs \
  tests/applet-title-entry-raster.test.mjs \
  tests/applet-title-entry-presentation.test.mjs \
  tests/stock-screen-preparation.test.mjs \
  tests/applet-incoming-paint-timing.test.mjs
```

Result: 104 passed, 0 failed. Log `source-checks/focused.log`, SHA-256
`87efbcf68bd1f79f32204888296bbb778fa89fc45371ed79317c79e7f2609d79`.

`npx tsc --noEmit --incremental false --pretty false` passes. Its empty success
log is `source-checks/typecheck-source.log`, SHA-256
`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.

After local LFS hydration, `npm test` completed with 2,992 passes, one failure,
103 skips and one TODO. The sole failure is the unchanged missing historical
Camera fixture
`~/.codex/3ds-artifact-overflow/home-fidelity-20261001/camera-3d-badge-sdmc-recapture-20261005/browser/lower.png`.
No test was weakened. Log `source-checks/npm-test-hydrated.log`, SHA-256
`1b99c0e8f17fc99f157de1633e910f854527727ba94836027b336ff51d8b7fc3`.
The initial pointer-only run is retained as `source-checks/npm-test.log`; its 40
additional failures were LFS pointer parse failures and disappeared after
hydration.

The first `npm run build` attempt correctly failed because Turbopack rejects an
ignored `node_modules` symlink that points outside the project root. Replacing
only that worker-local ignored symlink with a copy-on-write clone of the same
existing dependencies allowed `npm run build` to pass with build ID
`g-qLVPFQLrJnvHrbuaS0e`. The successful log is
`source-checks/build-local-deps.log`, SHA-256
`2da55d58da815d559aaf93cf0b27b90dd2e8d8e29a53050e8bef6f6f2f9c9850`;
the setup failure remains in `source-checks/build.log`, SHA-256
`1b7b798f19dd18e81e2627e3cbd4627d2364508b8f9c27591c78d3b093e5ab99`.
The `globalAlpha` probe is `source-checks/global-alpha-rejection.log`, SHA-256
`666a1b07c818d48c4164edcb062ed205df0b003b1dca092835a3d73b008564f0`.

## Evidence boundary

Source-identification evidence is the existing detailed-build timing record:
first Friends / Notifications title draws were 35.9 / 29.9 ms with five
retained entries totaling 852,736 bytes; later nonterminal title medians were
5.9 / 6.2 ms. Notifications incoming18 was 88.5 ms whole-paint, 76.8 ms
overlay and 75.6 ms stock composition while only `notificationsHud` changed.
The base-red actual stock reproduction above supports cache eviction as the
repaired cause; it does not assign every remaining millisecond to this cache.

No GUI, browser, server or Azahar session was run. No browser inspection,
native comparison, audio acceptance, first-cold improvement, cadence
improvement or whole-flow pass is claimed. Root owns the real browser capture
and native comparison. All four whole flows remain failing until that evidence
is reconciled. The frozen builds and original evidence were not changed, and
no native asset, source manifest or provenance mapping changed.
