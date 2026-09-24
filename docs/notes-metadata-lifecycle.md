# Game Notes owner-bound title metadata acquisition

Notes now acquires the delivered long description and expanded icon for its
suspended application as one presentation-owned resource. The result is bound
to the Notes instance, application instance and frozen LCD capture generation.
It is not drawn yet: `W_TextPanel` remains hidden, and existing Notes UI/input
and suspended-capture drawing are unchanged.

## Source contract and supported selection

The [accepted entry trace](native-notes-accepted-home-entry-audit.md) establishes
that Notes acquires its capture and application `0x300` identity before scene
startup, reads the matching SMDH through `0x1053a0`, and prepares the description
and icon through `0x103608`. Completed HOME exit frees the Notes context; sleep
retains it. The recently implemented [HOME owner boundary](notes-home-owner-exit.md)
now provides a distinct browser owner for subsequent Notes entry.

The loader accepts the eight audited application IDs already published in the
manifest. It requires the existing English long-description conversion at
SMDH offset `0x288`, the source Notes 64×64 expansion conversion, matching
ExeFS/icon hash and optional content ID/index on both fields, exact versioned
firmware/region/locale, and the manifest-owned Notes icon URL. It snapshots the
selected primitive fields, checks the delivered icon's size and SHA-256, then
uses the existing unpremultiplied PNG decoder at 64×64. It does not fetch SMDH,
firmware binaries or application packages.

Seven descriptions/icons are usable. System Transfer's original `???` is
retained in delivery but yields `unusable-description` and no icon fetch.
Missing metadata, unsupported application IDs and portfolio applications have
explicit unavailable states; current HOME labels are never substitutes.
Malformed or mismatched selected resources produce an error. These unavailable
and error statuses are browser resource policy, not reconstructed native error
screens. Full native no-capture/startup/error route coverage remains open.

## Lifetime and publication

`portfolio-screens.ts` synchronizes `createNotesMetadataSession` before screen
preparation/painting and disposes it during graphics teardown. The helper does
not add reducer state or change the existing native view/pack session. Its
lifetime differs from that session: it belongs to one Notes context, independent
of note selection or a sleeping renderer.

- A request key contains Notes owner, suspended application owner, capture
  generation and lowercase title ID. Without a valid frozen application pair,
  acquisition remains unavailable.
- Selection is snapshotted before asynchronous work. Both description and icon
  come from one validated source identity; the published result includes that
  immutable selection and the same frozen LCD pair.
- Each synchronized key change aborts the previous request, invalidates its
  generation and disposes its ready icon. Late success is disposed; late failure
  cannot replace the new state. Synchronous change callbacks may dispose or
  replace the request safely.
- Sleep and list/drawing navigation preserve the same metadata context.
  Completed HOME exit, another system applet, power-off, application replacement
  or capture-generation change invalidate it. Application capture bytes remain
  borrowed and are never disposed by metadata cleanup.
- Failures remain explicit without an automatic per-frame retry loop. A fresh
  Notes owner starts fresh acquisition. No metadata is persisted in app saves.

Owner safety is checked against the latest context supplied by the normal
screen synchronization path; it is a presentation resource contract. Consumers
must synchronize before reading/painting a result. The live panel is deliberately
not a consumer yet.

## Remaining visible-panel work

The independent native title controller starts during scene initialization,
not at the current browser's note-open event. Its ordered overlap with HUD,
list/open/return, switch and applet-exit controllers is still missing. The
[31 component specimens](native-notes-icon-panel-validation.md) prove supported
text fit and source poses, not startup time, scene ordering or native LCD
comparison. A future controller must consume this metadata only for its matching
Notes/application/capture context and define all unavailable startup branches.
No settled specimen has been inserted as a substitute for that controller.

## Verification

Eleven metadata tests validate all eight manifest entries, decode all seven
usable original icons, reject corrupted bytes/provenance/locale/selection,
and exercise HOME/reopen, application replacement, capture-generation changes,
sleep, unavailable capture/portfolio metadata, wrong-title results, synchronous
disposal and late success/failure disposal. Existing Notes owner, capture,
switch and native-title-session tests are also run.

The original title-panel source-render verifier reproduces 31 component PNGs
with seven fitting descriptions and unchanged source-group/mask assertions.
They remain isolated component specimens. No browser or native session was
driven by this worker. Logs/renders are in:
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/notes-metadata-owner/`.

Validation at this commit: **36 focused tests pass, zero skips; typecheck and
production build pass**. The initial build rejected the shared dependency
symlink; a local clone of dependencies resolves it. Full suite: 1,106 pass,
39 model/GLB failures caused by skip-smudge LFS pointer files, and 21 skips.
All 31 regenerated PNG files are byte-identical to the earlier validated
component specimens. Integration/browser verification remains the coordinator's
next step; no claim of native timing or strict 1:1 acceptance is made.
