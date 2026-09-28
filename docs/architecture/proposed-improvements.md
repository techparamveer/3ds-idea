# Proposed architectural improvements

These are follow-ups, not behaviour implemented at checkpoint `b6fb55e`. They
preserve the current reducer, `AppModule`, native pack and scene/OS boundaries.
Feature-level defects and their owners are tracked in the
[feature map](../feature-map.md). This list covers only architectural changes.

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
6. Give suspended-application snapshots a scene-owned capture boundary. A
   frozen LCD pair would be handed to painters, such as the Game Notes upper
   panes, as a texture binding, and "no suspended app" would stay distinct from
   "capture missing". Resolve the feature-map gaps (Notes, amiibo, NNID, songs)
   before expanding breadth.
7. Capture state counts, presented LCD frames and audio onset on one timeline,
   then compare with native recordings. Keep reduced motion as an explicit web
   adaptation rather than folding it into native timing claims.
