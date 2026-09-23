# Lazy native title assets

Presentation owns a new isolated `src/os/native-title-assets.ts`, focused loader
tests and a validation note. Keep the verified HOME loader and scene integration
unchanged in this slice. This is reusable loading infrastructure, not acceptance
of a stock application's pixels or workflow.

Expose a typed asynchronous loader taking a manifest URL, title ID, explicit
pack/layout/animation requests, borrowed shared-font map and AbortSignal. A pack
request uses its manifest-listed URL as identity and a caller-selected local
alias for NativeLayoutRenderer. It must name the layouts and animations needed
by the title's current view; do not guess animation ownership from name prefixes.
Validate that every requested URL is listed in the selected title's packs,
every named layout/animation exists, and each decoded pack declares the expected
title ID/schema. Reject missing/unsupported data explicitly.

The result exposes a NativeLayoutRenderer, diagnostics and idempotent dispose.
Load only explicitly requested pack JSON and the union of textures referenced
by the requested layouts/animations. Preserve original PICA format handling and
unpremultiplied PNG decoding used by HOME. Deduplicate texture fetch/decode within
the load. Load title-owned fonts by the source names/URLs in title metadata only
when requested layouts require them; resolve shared fonts through the borrowed
map. Do not dispose borrowed HOME/shared fonts or create alternate glyphs.

Propagate abort through JSON, PNG and font work. A failed/aborted request must
release all owned fonts/renderer allocations, including resources that complete
after another concurrent request fails. Return no partially usable renderer.
Disposal must release owned caches/textures/fonts and remain harmless twice.
There is no global application selection, Three.js, AppModule state mutation or
indefinite cache in this module; the future scene owner will manage generations
and stale async completions using the existing lifecycle patterns.

Read the current converter/manifest types instead of inventing a new public
schema. Multi-content resource identities may add provenance, while public pack
URLs remain the loading boundary. Tests should cover real current decoded
resource dependencies plus missing title/pack/layout/animation/texture/font,
dimension mismatches, shared-font ownership, deduplication, abort/failure races
and disposal. Use private SSD reports. No stock-title broad conversion, browser,
Azahar or hardware work belongs here. The coordinator will connect the loader
after Keyboard's native view contract and validated resource pack are available.
