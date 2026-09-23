# Live ordinary tile touch

2026-09-23. Real touchscreen pointer events now feed the native ordinary tile
widget instead of opening/selecting synchronously on release. Source authority:
[the43-case ARM audit](../scripts/firmware/GRID_STYLUS_EVIDENCE.md),
[pure runtime](home-tile-widget-runtime.md), and
[native pose painter](native-tile-touch-paint.md).

## Behavior and order

The host keeps tile widgets separate from navigation history. Each eligible
shared count first scans capture, then traverses widget input, then processes
native direction events. A new press emits the existing native `touch` cue and
starts tile Select. Release inside starts Decide. Its frames submit in the
later2D phase; acceptance occurs in input at R+3. This does not advance or seek
the primary Select/Decide controllers. Primary position stays at the current
selection through contact, its Loop continues, and the common lower footer
positions it after an accepted selection.

Capture remains held on acceptance. The next widget-idle pass clears its own
capture, but that pass's initial scan already observed it; ordinary direction
input resumes on the following scan. Tile painting samples the last enabled
binding that actually wrote the source pane. It never reapplies a disabled old
Decide frame over a new Select or advances a controller while drawing.

Acceptance reads current selection and content. A different tile selects; a
same vacant tile remains inert, including at the root where the previous
generic Open shortcut created a folder. Footer Create Folder remains available.
An eligible same occupied application uses the existing opening bridge, with
the native `open` cue. Folder opening remains the existing separate bridge.
Ordinary accepted selection adds no guessed selection cue. Native keyboard
selection cues retain their own journals.

Opening ends the bounded HOME pass before lower tasks and2D. System drops
remaining HOME counts in that elapsed batch and rebases time; the scene's
`skipHomeBannerHostPass` records the shared count without running manager or3D
phases. That is an explicit browser handoff policy after the audited endpoint,
not evidence for a complete native application-opening lifecycle.

## Browser boundaries

- The nominal60Hz shared clock, supplied active-HOME service gates and browser
  hit rectangles retain their documented adapter status.
- Down/up edges between eligible samples are preserved for consecutive polls;
  moves use the latest position. This is a browser pulse policy, not a native
  HID event queue. Registered browser widget identity is its active-container
  slot; no emulation of native pool remapping is claimed.
- Blur, cancellation, sleep, overlays, close initiation and container/density
  replacement reset transient widget ownership. Native reset alone retains
  capture; the browser reset additionally uses the enable setter to release it.
  None of these guards is described as native state2 context validation.
- Authored scroll/drag can take over a stroke. The recognizer explicitly reports
  a completed non-tap gesture, including movement first delivered on `up`, so
  clearing its preview cannot leave a queued native tap behind.
- The pure widget reports the source's static held-count boundary20 before its
  unhosted long-press branch. The host resets that ordinary slice and returns
  ownership to the existing authored gesture route. Its450ms lift, drag/drop,
  scrolling and folder-hover timings remain unverified. This checkpoint does
  not claim native long-press parity.
- Primary/effects remain drawable during ordinary grid press. Existing authored
  grid scroll/drag still suppresses that group; toolbar and fallback paths remain
  separate. Reduced motion changes rendering without changing widget counts.
- Native runtime-added transforms, full hit geometry, opening/drag lifecycles,
  all stock app packs and fresh Azahar comparison remain outstanding.

## Verification

All43 frozen source cases replay305 widget input/2D boundaries in the pure
runtime. Combined focused host/widget/banner checks pass99 tests. System
coverage includes R+3, current selection/content changes while waiting, quick
down/up, capture scan lag, same vacancies, stopped opening batches, close/sleep/
overlay cancellation, release-only scroll takeover and separate footer creation.
The full integration suite passes889 of891 tests, with zero failures and the
two existing optional audio-diagnostic skips. Typecheck and production build pass.

Artifacts remain on the SSD under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/`:

- `live-tile-touch-system-tests.log`, `live-tile-touch-full-tests.log`,
  `live-tile-touch-typecheck.log`, `live-tile-touch-build.log`.
- `live-native-tile-touch.json` and its restored native-resolution lower PNG:
  real projected mouse down/up, observed Decide wait, primary position/Loop,
  existing touch cue, repeated vacancy and restored child0.
- `live-tile-touch-controls.json`: existing real keyboard, accessible button,
  D-pad, circle-pad, toolbar departure, repeat/effect and release checks.
- `live-tile-touch-close.json`: actual Back, hidden closing primary,
  C+18 restoration/Loop resume, and folder reopening.
- `live-native-tile-touch-mobile.json` and `-mobile-console.png`: the same pointer
  checks at390×844; the complete console remains framed. Root inspected both
  this screenshot and the restored native-resolution lower screen.
- `live-tile-touch-fallback.json`: blocking the exact native manifest URL keeps
  legacy directions usable; removing that route restores native presentation.
- `live-native-tile-touch-open.json`: actual pointer tap opens Work after Decide,
  HOME count/Loop stop through launch, then HOME/close and navigation restore the
  original folder. This verifies the existing portfolio bridge, not APT parity.

The browser observer only reads existing diagnostics. A quick press may produce
one painted snapshot, so its Loop assertion compares consumed shared counts
instead of requiring multiple rendering snapshots. Exact native controller
phase timing remains covered by source and System fixtures. These are browser
integration checks, not a fresh whole-screen Azahar parity result.
