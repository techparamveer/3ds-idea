# Proposed architectural improvements

These are follow-ups, not implemented behavior at checkpoint `1be4133`. They
preserve the current reducer, `AppModule`, native pack and scene/OS boundaries.

1. Create a versioned scenario catalog for HOME, transitions and each included
   title. Record starting save state, timestamped inputs, owner/screen changes,
   browser/native captures, intentional differences and hashes. This would make
   distributed evidence auditable without turning partial checks into 1:1 claims.
2. Give initial GLB, HOME resources, banner, IndexedDB and material compilation
   named startup phases with abort propagation, bounded retry and failure
   injection. Stock views already have this shape; initial scene startup does not.
3. Expose development-only resource counts for title sessions, decoded textures,
   raster/pose caches, banner targets, audio owners, effects, workers and storage.
   Snapshot them around launch, HOME, sleep, power, retry and React unmount.
4. Generate the delivery inventory from the public manifest: firmware/locale,
   title/resource counts, bytes, converter identities, exclusions and unsupported
   records. Keep visual/behavioral status a human evidence decision.
5. Add per-view presentation metadata for `native`, `bounded-adapter`,
   `portfolio-content` or `browser-recovery`, with a validation-note link. Use it
   in development reports, not in the product UI.
6. Fix Notes' suspended snapshot, decide how incomplete amiibo materials are
   represented and obtain a defensible NNID entry reference before expanding
   breadth. Supply actual songs before claiming Sound playback acceptance.
7. Capture state counts, presented LCD frames and audio onset on one timeline,
   then compare with native recordings. Keep reduced motion as an explicit web
   adaptation rather than folding it into native timing claims.
