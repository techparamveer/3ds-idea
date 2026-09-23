# Retained cursor browser and native comparison

The ordinary primary cursor now uses retained System frames, with the source
submission-before-advance order and hidden phase retention. Integration includes
runtime ab61418/49dc412 and presentation7a5cefe. This replaces the elapsed-time
Loop binding; the shared nominal60Hz application clock remains provisional.
Native acceleration evidence is now available in
`scripts/firmware/CURSOR_ACCELERATION_EVIDENCE.md` but is not yet implemented.

## Actual browser behavior

`scripts/verify-home-cursor.mjs` uses actual browser keyboard input to enter and
leave preferences and to close/open the lid. It reads dev-only diagnostics;
it never injects reducer state or advances a controller through capture calls.
The checked browser used a1000×860 viewport, high quality, one-row HOME and
empty folder19, with normal motion and the first child selected.

- Two synchronous screen paints at elapsed1000 and500000ms returned identical
  lower LCD pixels, shared count and cursor state.
-48 shared updates in the sampled normal interval advanced the retained
  current frame by48 modulo60; every observed applied frame preceded it by1.
- Preferences and lid sleep froze both the shared count and cursor phase.
  Closing the overlay and waking retained that phase and resumed advancement.
- A real Back action retained applied1/current2 throughout the observed hidden
  close samples. The close started at9182, restored root at9200, and the same
  ready update submitted2/current3. All330 completed samples followed the
  expected count difference thereafter.

The close still skips visual samples: this run painted16,14,12,9,6,3,0,
with66.7ms maximum RAF gap and72ms longest task. This is a separate development
run under current host load, not a controlled performance regression comparison.
There is no smooth-animation or native timing acceptance claim.

## Native lower LCD capture

The isolated original-3DS EUR Azahar profile was operated through its actual
touchscreen: create folder, open it, pause, Capture Screenshot. Azahar wrote a
native400×480 combined image before the Mac locked. The normal user profile
was not used. The reference's folder is at a different root slot and neighboring
stock artwork differs; cursor and upper-animation phases are not matched.
The browser was moved to matching one-row folder geometry with child0 selected.

`scripts/compare-native-folder-regions.mjs` extracts the centered320×240 lower
native LCD and compares bounded static regions, excluding cursor phase and
parent application artwork. Paths and output prefix are required parameters.

| Region x,y,width,height | RGB mean absolute error | Maximum channel error |
| --- | ---: | ---: |
| Panel interior120,74,150,30 |0|0|
| Back tab25,43,68,21 |0.216853|2|
| Left shadow0,80,20,40 |0.287083|2|
| Upper underlay100,39,180,20 |0.834074|4|
| Captured bottom100,218,180,22 |0.969697|3|
| Second vacancy140,122,41,40 |1.445528|26|
| Third vacancy224,122,41,40 |1.445528|26|

The vacancy mismatch is visible and repeated. For example, at lower pixel
(160,126), native RGB is196,192,188 and browser RGB170,166,162 against the
223,219,215 tray. This suggests a missing final opacity operation; it is not
permission to tune source colors or invent a parent alpha. Original source
tracing is checking the final slot pane separately from its SetSrc artwork.
Notification unread state, HUD connectivity/battery/clock and portfolio content
also differ. These comparisons do not establish whole-screen parity.

## Verification and artifacts

The combined suite passes603 of605 tests, zero failures and two pre-existing
audio diagnostics skips. Type checking passes. Root browser verification found
no error overlay or browser errors. The development-only cursor diagnostic
exposes current/applied/sampled frames and visible slot; each paint record also
records the actual cursor sample. Production does not expose these diagnostics.

All files are under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/`:

- `cursor-clock-tests.log`, `cursor-clock-typecheck.log`.
- `reference/cursor-clock-live.json`: normal, overlay, sleep and capture checks.
- `reference/cursor-clock-close.json` and `cursor-clock-close-cursor-check.json`.
- `reference/native-folder-cursor-clock-before.png`: raw native combined LCDs.
- `reference/cursor-before-matched-folder.json`: browser fixed capture.
- `reference/cursor-before-regions-{native,browser}.png` and
  `cursor-before-regions-comparison.json`: extracted lower LCDs and measurements.

Runtime batching, visibility and lifecycle boundaries are documented in
[the runtime note](home-cursor-loop-runtime.md). Hardware scheduling, offscreen
native updates, mode3 acceleration and full APT lifetime remain outside this pass.
