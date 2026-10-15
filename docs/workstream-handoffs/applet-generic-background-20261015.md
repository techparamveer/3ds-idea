# Applet generic-background candidate handoff

## Status

This is one bounded experimental source candidate based on
`fa963ae5cf7833bebeb53c479cf166baf081609f`. It is not adopted and does not
establish a performance improvement. No production browser measurement, native
comparison, GUI inspection, audio check or scenario-matrix change was performed
in this worktree. The Friends and Notifications whole native flows remain
fail/unproven.

Independent source review `cf22e0da5ce9bcd2c956d04140aef595afc75fe4fa69912fc0fa03af14c8a697`
found no production source bug. Its one P3 test finding is corrected: the
cache-identity check now redraws visible upper frame 0, asserts that its full
background reaches destination composition, and then proves that switching to
the compiled-eligible request adds neither a raster nor a cache entry.
Follow-up review report
`077fb86e2c8feb73419c91bfbb5330a434d0c0d8842bcde8a7a73f10ee5b95e2`
(review identity
`96ba8cf9b9f23b33905fb7625078f396b47539ca248a26c6ccb9864742280142`)
closes that finding with no remaining source or test issue.

The candidate follows the reviewed browser probe at
`applet-cold-browser-probe/review/review.md` (SHA-256 `272dad8a922d7f82dd99876b67f186d85edb4b753f379409e3261b75149b6d76`).
That probe's lower cold first-draw samples justify only a production A/B. Its
higher later medians and higher 21-draw totals remain explicit rejection gates.

## Implementation

- `NativeDrawOptions.opaquePictureAlphaBaseRaster` is an explicit per-draw
  generic-loop opt-in. It is rejected unless the existing opaque-picture alpha
  allowlist is present and non-empty.
- The choice travels only through an allowlisted pane's existing
  `opaquePictureAlphaPanes` route and its recursive alpha-1 source render.
  All other pictures, including `P_Belt_00`, retain the compiled-eligible
  default path.
- `drawAppletTitleEntry` enables the choice only after its existing complete
  source validation, for the validated `P_Bg_U_00` and `P_Bg_D_00` panes in the
  Friends and Notifications incoming packs. Its measured and unmeasured paths
  make the same choice while preserving the original validation, upper draw and
  delayed lower-override timing boundaries.
- Raster choice is absent from the existing cache key because generic and
  compiled output are required to be byte-identical. The candidate therefore
  does not retain a duplicate base raster. The 8 MiB LRU, texture-identity keys,
  mutable alpha scratch, eviction and disposal behavior are unchanged.

No assets, clocks, poses, input, HUD, publication guards or native resource
validation were changed. No non-native visual or audio element was added.

## Focused evidence

Fixtures decode the selected firmware textures through
`nativeTextureSamplePixels`, matching the production PICA normalization path.

- `node --test tests/applet-title-entry-assets.test.mjs tests/applet-title-entry-raster.test.mjs tests/native-renderer.test.mjs tests/manual-cover-raster.test.mjs`:
  51 pass, 0 fail, 1 optional real-Canvas skip. The comparison covers both apps,
  all 21 incoming poses, 200 prepared Canvas sources and 34,109,440 RGBA bytes
  exactly against an explicitly compiled alpha-1 base control. It also covers
  default belt routing, invalid source/texture/option failures, shared cache
  identity, the 8 MiB bound, smaller-cache eviction, disposal, measured and
  unmeasured calls, and Manual cover regressions.
- The same title-raster test with
  `NATIVE_CANVAS_MODULE=/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/eshop-idle-source/canvas-runtime/node_modules/@napi-rs/canvas/index.js`:
  9 pass, 0 fail, including the optional real-Canvas retention comparison.
- `node --test tests/native-raster-compiled.test.mjs tests/native-raster-kernel.test.mjs`:
  15 pass, 0 fail. The compiled default, scalar equality, real decoded resources
  and unsupported inputs retain their prior behavior.
- `npm run typecheck -- --incremental false`: pass.
- `git diff --check`: pass.

## Full source checks

Checks ran from source commit
`5e1dec9a2c1b9ae248f1dbaa73fd7d77e7845387`. The candidate checkout had its
own copy-on-write `node_modules`; no external dependency symlink was used.

- `npm test`: 3,098 tests; 2,993 pass, 1 fail, 103 skip, 1 todo, 0 cancelled;
  88,782.405875 ms. The sole failure is the preserved Camera fixture gap at
  `tests/camera-date-group.test.mjs:44`: the private
  `camera-3d-badge-sdmc-recapture-20261005/browser/lower.png` is absent. This is
  not a green full-suite result.
- The first diagnostic run encountered 41 failures because this checkout still
  held Git LFS pointer GLBs. Only this checkout's required model paths were
  hydrated, and the authoritative run above reduced the result to the known
  Camera failure. Both logs are retained.
- `npm run typecheck -- --incremental false`: pass, exit 0.
- `npm run build`: pass, exit 0, using Next.js 16.3.4 with Turbopack. Build ID:
  `qrqJDhOcclmu2RuyNXUMi`.
- Logs, exit files and checksums are under
  `/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261015/applet-generic-background-candidate/source-checks`.
  `SHA256SUMS` has SHA-256
  `e0a58ecb69b15e6462ead61749db34bab237b42296d238b8907cfa1dde131eda`;
  the authoritative test log is
  `06005138ca885db3db2f5ef9bdddf7a6fd6b393aebf8a0571d38bf975a144f18`,
  the nonincremental typecheck log is
  `4fc0605d19e61064e88aacb22f7ce2f8e4f6fb7310ec41794d4c846765c72382`,
  and the build log is
  `38ac9fa3aa40fc51eb0acca76e6d81d9d854205779b13e69b6b0be908b98c90f`.

There was no shader or material change, so `npm run check:shader` was not
applicable. No server or browser was started.

## Remaining gate

The source review and its focused follow-up are complete. After integration,
the coordinator must run the declared isolated production A/B with separate
cold renderers/pages. Reject this candidate if the complete opening or later
frame cost is worse or inconclusive. Source-byte equality, tests and a build do
not establish cadence, input timing, native fidelity or a performance win.
