# First Camera Resume text diagnosis

## Disposition

No runtime correction. This bounded slice did not reproduce the production
residual in the real renderer on the installed offline CPU Canvas. The runtime,
assets, controllers and existing tests remain unchanged. No candidate build was
created. The frozen worker `23b7546` and its build remain read-only.

The fixed production HOME1 versus first Resume600 difference remains open:
252 upper and 623 lower changed RGB pixels, with 1 and 333 above delta 2,
respectively. Maximum RGB deltas are 3 and 20. First Resume238 through600 is
stable; that does not make its first baseline mismatch acceptable. The earlier
production audit `759fecd1` and independent review `f4269e39` remain authoritative.

## Evidence and checks

Private output is
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/toprow-current-20261010/camera-first-resume-text-v1`.
Its `report.md`, `manifest.json` and `checksums.sha256` identify the commands,
originals, source files, logs and generated outputs.

`reproduce.mjs` uses the actual Camera reducer view, native asset loader,
renderer, texture decoder and original bitmap fonts. The font Image adapter
decodes the delivered PNGs with installed `@napi-rs/canvas`. It does not mock
renderer success or glyph/picture rasterization. Three fresh asset sessions,
each painted cold and cached, produce identical complete RGBA LCDs. Each session
creates new destination canvases and reuses them for its two paints. Guide
warming uses separate destinations. This does not reproduce the long-lived
production backing-canvas history. A deliberate one-pixel readback-byte control
exits 1; it is not a renderer defect. Actual guide-before-main paints and a
read-frequent target variant remain identical on this CPU backend.

Disabling destination smoothing is a positive perturbation in this CPU probe:
it changes 0 upper and 214 lower pixels, with lower maximum 54 confined to the
folder-count region. It does not reproduce the production 252/623 signature
and does not identify or exclude Chrome smoothing behavior.
All 119 selected delivered resource files match the frozen worker. The four
fixed original PNGs pass CRC and independent full pngjs/Sharp decoding; their
hashes and exact production difference counts reproduce.

Existing focused renderer/font/Camera checks pass 80, fail 0, skip 2. The skips
retain absent historical code.bin and browse-pair references. Full suite,
typecheck and build were not run because no runtime or test code changed.
The known missing historical Camera date-group fixture was not manufactured.

## Relevant path and remaining hypotheses

`stock-screen-presentation.ts:232` retains its two backing canvases while
`:242` resets the asset session on owner/view replacement. A complete fresh
render publishes at `:416`. `native-title-assets.ts:183` distinguishes borrowed
shared fonts from content-owned fonts. Reload owns a fresh HudNOTES LA font and
borrows the original shared alpha font.

`native-renderer.ts:158` chooses direct versus Canvas text sampling, caches the
result at `:177`, and uses an existing ink readback at `:199` before material
coloring and `putImageData`. `bitmap-font.ts:341` and `:414` use Canvas atlas
blits; the direct alpha path at `:347` samples the original glyph mask itself.
The affected areas correspond to Photos/count, folder counts and Shoot.
Slideshow and Settings use the source-size direct sampler at
`stock-native-camera.ts:210` and lie outside the observed changed rows/columns.
This correspondence narrows the investigation but does not establish a cause.

Ranked remaining hypotheses are Chrome glyph-resampling/backing-store history,
unobserved destination Canvas state, and unexported in-memory font/view changes.
The CPU tests disfavor deterministic loader, shared-font warming and cache
mutation explanations in the exercised route. They cannot rule out Chrome
GPU/CPU migration or the exact production history.

## Smallest next production probe

The coordinator can declare a diagnostic-only fresh browser run using the same
gallery preparation and HOME, Manual, Close, Resume inputs. At the nine Camera
text calls, record the existing ink byte arrays before/after material coloring,
full text cache key, font source identity, and destination transform/smoothing
and context attributes. Hash existing arrays only; add no Canvas readback,
replacement destination or timing-controller change. For a cache hit, reference
the prior cache-fill hash instead of reading the canvas again. Record cold versus
cached status, then compare the fixed first main publication and first settled
Resume.

Different source ink with identical resources/options localizes the change
before text compositing. Identical colored source ink with different final LCD
pixels localizes it to destination compositing/publication. Changed keys or
font identities instead require a resource/view investigation. This probe was
not implemented or run in this lease. Its instrumentation and receipt cadence
would remain diagnostic adaptations, not native timing or fidelity evidence.

All whole-flow/native moving-pixel acceptance remains unproven. Audio remains
unverified and muted. No GUI, server, profile, original or old-build changes.
