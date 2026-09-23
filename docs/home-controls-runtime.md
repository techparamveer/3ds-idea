# Live counted HOME controls

2026-09-23. Native HOME presentation now enables `System.homeControls` after
saved settings and native assets load. Keyboard directions, physical D-pad,
accessible direction buttons and the primary circle-pad axis feed the same
browser adapter and native sampler/producer. The missing-asset fallback and
application/overlay input retain their existing generic latch.

## Counted host and effects

`tickHomeNavigationClockObserved` returns one journal per eligible shared count.
The ordinary pass samples held input, produces native events, consumes input,
advances the lower navigation/close task, applies the primary footer, then
submits primary Loop/Scale and the two departure controllers. Native20/5 poll
repeat and mode3's first-five10/later5 update behavior now reach the live page.
Release/cancel resets horizontal acceleration without seeking Loop phase.
The clock's nominal60Hz wall-time conversion and delivery of several counts
after a delayed browser frame remain browser policies, not measured hardwareHz.

The scene consumes every journal exactly once. Its upper banner manager runs
before applying the journal's lower resolver snapshot; attached-scene work
follows. A completion/replay request therefore resolves the recorded old slot,
even if the same pass selects the next slot. Resource tickets are acknowledged
after that pass and cannot retroactively make its manager ready. Selection
requests are no longer inferred after every direction mutation. Close clear
remains an explicit action boundary. Unsupported application/toolbar banner
categories retain an explicit fallback handoff.

Ordered cue observations play native `select`, `scroll-invalid` and
`toolbar-select` once. Ordinary direction changes do not also trigger the generic
selection-difference sound route. Deferred input and lower replay use the same
observation path. Audio transport and synthesis retain their separate owners.

## Retained cursor and close

Primary position/visibility are independent of selected-tile culling. Ordinary
grid mode3 retains the prior primary root; departed grid effects follow their
slot geometry. Toolbar focus uses source anchors and raw Scale10/11/12.
Painting samples submitted controller frames outside the grid clip. The source
only proves primary-before-effects within this group; the surrounding native
layout order still needs broader visual verification.

Normal close requests hiding at setup. Root restoration at C+18 shows the
primary and resumes its Loop on that same later layout pass. With offscreen
root selection, mode3 retains the previous child cursor position until C+23 or
C+28, then moves it to the root selection. Banner readiness remains separate.
See [the combined source execution](../scripts/firmware/CLOSE_PRIMARY_RESTORATION_EVIDENCE.md).

Reduced motion changes drawing: primary Loop0 and omitted departure effects.
Logical input/navigation/close counts remain unchanged, including zero-update
action boundaries. Browser verification waits for counted density completion
instead of assuming two animation frames settle it.

## Explicit adapter boundaries

- Initial cursor poses come from restored mature geometry; this is not a native
  boot-controller trace. Controllers, producer and held sources are never saved.
- A browser down/up between polls survives one eligible sample. The raw native
  sampler remains unchanged; see [the input adapter](home-input-adapter.md).
- Overlay/app ownership changes and blur/sleep explicitly cancel held input.
  Gesture-origin restoration precedes cancellation so it cannot restore stale
  horizontal markers. Hidden intervals rebase the clock instead of catching up.
- Existing drag/scroll/press recognition remains an adapter. Grid gestures hide
  the retained cursor group; chrome gestures preserve it, including disabled
  density buttons. Full native stylus capture/press/drag layout behavior remains
  unfinished.
- An accepted grid touch from toolbar focus clears its active/current/saved
  column fields, preserves remembered focus, seeks primary density and emits
  the departed toolbar effect before viewport correction. The consumer follows
  the five original accepted-fragment cases. Earlier raw touch eligibility is
  still supplied by the browser recognizer; it is not proved by that fragment.
- Toolbar activation hands off to existing feature entrypoints. These stock
  applets and their banners remain incomplete. Physical D-pad pointer hit testing
  still chooses a cardinal direction; keyboard/axis masks support the sampler's
  proved combinations. Secondary analog channels are not hosted.
- The active browser HOME predicate supplies the ordinary producer/service
  gates. This does not reproduce the complete firmware service/overlay graph.

## Verification

The combined integration suite passed812 tests out of814, with zero failures
and two existing optional audio-diagnostic skips. The native Canvas dependency
was enabled. Primary/footer, sampler/producer,
consumer/controller, captured resolver and phased-banner tests retain their
independent original-resource/source fixtures.

`scripts/verify-home-live-controls.mjs` uses actual browser keyboard, accessible
buttons and projected physical D-pad pointer events. Read-only diagnostic traces
confirm toolbar focus/center/Scale, one movement per quick activation, mode3,
accelerated Loop, visible departure effects and release reset. Real circle-pad
drags produce native up0x40/down0x80 candidate masks and their corresponding
focus transitions. The pad's pointer-down establishes a neutral origin; the
verification therefore moves it while held, and samples native repeats during
the hold instead of assuming release preserves the first focus transition.
It restores empty
folder child0 for reference comparison. Root inspected the toolbar and restored
lower-screen PNGs; these are browser checks, not a new Azahar parity claim.

Artifacts are under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/`,
including `live-native-controls-complete.json`, its toolbar/restored PNGs and
`live-controls-final-tests.log`. Typecheck and production build passed.
`live-native-cursor-preservation.json` confirms48 normal shared updates,
read-only paint stability, overlay/sleep freezes and retained resume phase.
`live-native-density-preservation.json` confirms disabled press/tap preservation,
enabled pressed pose and an exact settled density round trip. All nine static
regions in `live-native-controls-preservation-comparison.json` match the prior
comparison metrics exactly. The comparison still excludes unmatched parent
artwork, HUD and cursor phase; it does not establish whole-screen parity.
`live-native-close.json` observes real keyboard Back through a read-only DOM
diagnostic observer: primary hidden during closing, root restoration atC+18,
same-pass Loop resume, completed close and reopening the same folder. This
browser path has an in-viewport parent; offscreen close remains covered by the
combined original-ARM and System fixtures rather than injected browser state.
The later accepted-toolbar-touch integration passed39 focused consumer/System/
painter tests and typecheck. `live-accepted-toolbar-touch.json` adds an actual
projected grid touch from toolbar focus, observing the departed focus1 effect
at applied Scale11, while repeating the keyboard, accessible, circle-pad and
held D-pad checks. Earlier hit/press eligibility remains a separate gap.
The same complete controls script also passes at a390×844 viewport; the console
stays fully framed in `live-native-controls-mobile-console.png`. Blocking the
exact presentation-manifest URL verifies missing-asset fallback: native controls
are absent, legacy Right/Left remains usable, and removing the route restores
native presentation. See `live-controls-fallback-script.json` and the repeatable
`verify-home-controls-fallback.mjs` script. These checks retain the existing
fallback's behavior; they do not make its graphics native.
Fresh Azahar interaction remains unavailable
while the Mac is locked. Existing captures and bounded original-ARM evidence
remain available; the complete requested firmware/application acceptance is
not finished.
