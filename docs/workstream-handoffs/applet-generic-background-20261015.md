# Applet generic-background candidate handoff

## Status

This is one bounded experimental source candidate based on
`fa963ae5cf7833bebeb53c479cf166baf081609f`. It is not adopted and does not
establish a performance improvement. No production browser measurement, native
comparison, GUI inspection, build, full suite, audio check or scenario-matrix
change was performed in this worktree. The Friends and Notifications whole
native flows remain fail/unproven.

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
- `npm run typecheck`: pass.
- `git diff --check`: pass.

## Remaining gate

An independent source review is required before full tests or a build. After
review and integration, the coordinator must run the declared isolated
production A/B with separate cold renderers/pages. Reject this candidate if the
complete opening or later frame cost is worse or inconclusive. Source-byte
equality does not establish cadence, input timing, native fidelity or a
performance win.
