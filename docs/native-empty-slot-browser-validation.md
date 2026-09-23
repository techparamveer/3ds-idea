# Empty-slot opacity: native/browser comparison

2026-09-23. The ordinary final-pane alpha correction in `9984c60` substantially
reduces the visible vacancy contrast difference in the captured empty folder.
This is a bounded static comparison, not complete HOME fidelity acceptance.

The isolated original-3DS EUR Azahar profile uses English, the white theme and
native resolution. Its paused combined400×480 screenshot was captured through
Azahar's screenshot command. The lower320×240 region is centered at(40,240).
The actual browser uses the same one-row folder geometry with child0 selected,
reduced motion, and the fixed capture date2026-09-23T12:06:00Z. Browser capture
reads the existing development hook; it does not inject reducer state.

`scripts/compare-native-folder-regions.mjs` compares RGB in two41×40 vacancy
regions, at(140,122) and(224,122), excluding the unmatched cursor phase. Both
regions have the following measurements:

| Measurement | Before opacity | After opacity |
| --- | ---: | ---: |
| Mean absolute RGB byte error | 1.445528455 | 0.005284553 |
| Largest channel error | 26 | 1 |
| Pixels with any RGB difference | 504 | 16 |

The measured folder interior, Back tab, left shadow, upper underlay and captured
bottom regions remain exactly unchanged by this patch. The panel interior is
byte-exact to native. The other surrounding regions retain their prior measured
differences, up to4 channel values; this correction does not explain them away.
Both extracted images were visually inspected. The overly dark vacancies are
corrected; the remaining16 differing pixels per vacancy are still recorded.

Intentional/unmatched comparison inputs include different parent HOME app
artwork and notification state, clock context, and cursor animation phase.
The browser's minimum-density toolbar icon also remains visibly too saturated;
its native enable/disable binding is under separate investigation. Native atlas
filtering, final-target format and fractional/closing composition remain the
limits described in [the implementation note](native-empty-slot-opacity.md).

Artifacts are under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/`:

- `reference/native-folder-cursor-clock-before.png`: original native capture.
- `reference/cursor-after-matched-folder.json` and
  `reference/cursor-after-regions-comparison.json`: baseline before opacity.
- `reference/empty-opacity-after-matched-folder.json` and
  `reference/empty-opacity-after-regions-{native,browser}.png`: browser capture
  and extracted comparison images after opacity.
- `reference/empty-opacity-after-regions-comparison.json`: parameterized region
  measurements.
- `empty-opacity-integration-tests.log`, `empty-opacity-typecheck.log` and
  `empty-opacity-build.log`:49 focused tests passed with no skips; typecheck and
  production build passed. The optional SSD CPU Canvas runtime was enabled.

No console model, geometry, opening animation or public firmware resource was
changed. Reduced motion fixes the comparison pose; normal cursor phase remains
owned by its retained controller.
