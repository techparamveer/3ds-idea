# Sound upper residual after title blue fit

Inspected the production `sound-first-run-title-blue-fit` pair at integration
`139df79`. No runtime change follows this diagnostic: the largest remaining
regions require native phase/owner evidence, rather than another static fit.

## Evidence

The private capture root is
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/scenario-matrix/v1/captures/`.

- Native: `sound-first-run/native/combined.png`, SHA-256
  `9dea0cc2fa7022ccd032c5a94ae59c2dbe37e6b7e800fbf8668b356fc9e5ce69`.
- Browser: `sound-first-run-title-blue-fit/browser/upper.png`, SHA-256
  `beb0f46574295ac5dddae396db5248e85ab3ddfe2985a8dabb7c919b8fd0327d`.
- Visually inspected `sound-first-run-title-blue-fit/diff/upper-contact-sheet.png`.

Whole upper: **6,627 pixels** with any RGB difference greater than 2. Counts
below use half-open rectangles in raw 400×240 coordinates, without masks.

| Area | Rectangle x0,y0,x1,y1 | Pixels >2 |
| --- | --- | ---: |
| Span wave | 0,100,400,114 | 2,314 |
| Title | 0,3,400,30 | 1,774 |
| Two upper birds | 15,174,115,216 | 1,558 |
| Footer | 0,216,400,240 | 707 |
| Upper room above wave | 0,30,400,100 | 5 |

Largest connected components from the existing compare report are left bird
`[24,179,35,37]` (1,085 pixels), wave `[38,106,122,7]` (756), wave
`[318,105,82,8]` (562), and right bird `[83,179,23,37]` (469).

## Birds: changing native placement, unchanged source silhouette

Using the vivid green/yellow mask from `scripts/compare-sound-bird-pose.mjs`
in y=174..215, x=15..69 for the left and x=76..113 for the right, each native
and browser bird has **478 masked pixels**. Search integer translations
x=−16..16, y=−3..3: translating browser left by **(+13,0)** and right by
**(+1,0)** produces silhouette IoU **1.0** for each.

The preceding [bird source audit](sound-entry-bird-source.md) used a different,
hash-pinned native still and obtained IoU 1.0 at the current browser centres
(35,192)/(94,192). Its native executable trace establishes extended bird bases,
random horizontal extent, shared RNG and clip-driven idle owners. The new still
therefore does not justify replacing these constants with (48,192)/(95,192).
Doing so would improve this capture while invalidating the previously matched
capture. `ParakeetA_U_Wait` supplies the correct coloured silhouette here; the
live activation, RNG, scheduling and phase gates in that audit remain open.

## Span: static fitted bind pose misses native shape

`src/scene/sound-room.ts` composes `S_Vis_Span_U` from
`models/sound-span/model.json` (source SHA-256
`ff9ce249149f835ecce97f693e3f2e1cabe3a2cfebb6bcdbb124d36d4005cf23`).
Its Base material RGB/alpha and group transform are explicitly fitted to a
silent still. The delivered model has 34 meshes and 35 bones but no clips.

For each x, inspect y=100..113 and retain blue pixels with B > 1.5G and
G > 1.5R. Native blue ranges vary: 227 columns span y106..111, 90 span
105..110, 74 span 107..112, and 9 use other ranges reaching y104. Browser has
354 columns at 106..111 and 46 at 105..111. Example native/browser spans:

| x | Native y range | Browser y range |
| ---: | --- | --- |
| 20 | 104..109 | 105..111 |
| 50 | 107..112 | 106..111 |
| 300 | 105..110 | 106..111 |
| 350 | 107..112 | 106..111 |

A global translation, scale or palette cannot reproduce the changing native
shape. Trace the Span runtime bone/vertex updates and their input/clock before
introducing deformation. A hand-authored wave or sampled screenshot contour
would not establish the native animation.

## Footer: state and glyph residuals

Footer subregions: volume `[0,216,30,240]` has 130 pixels >2; battery
`[45,216,85,240]` has 1; clock `[95,216,194,240]` has 533; playback time
`[230,216,400,240]` has **0**. These subregions do not cover every footer pixel.

The browser hardcodes `C_HudSndB_Pattern` frame 0. The published
`lyt-C-Hud.json` has five exact source textures `HudSnd_B_00..04.bclim`,
selected at frames 0..4. The current native still visibly uses a different
volume indication. Native volume state and the selector mapping must be
established and supplied to presentation before changing the frame; selecting
a frame solely to match this still would hide the state mismatch.

Clock uses `S_Inf_U-Hour` / `TextBox_00` with a browser date, capture-fitted
size/position and source font. Playback time already matches in the measured
rectangle. Inspect the clock's text placement/raster and matched date state as
a separate bounded task; do not shift or recolour the whole footer.

This diagnostic changes neither native assets nor runtime. No application build
is required. Matched native/browser inputs, motion, audio and whole-scenario
acceptance remain open.
