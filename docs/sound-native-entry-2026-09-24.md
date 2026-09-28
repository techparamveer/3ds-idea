# Sound settled entry chrome against a native capture

## Reference and bounded change

The coordinator captured EUR Nintendo 3DS Sound after the first-run Welcome
pages cleared, with no SD music. The raw 400×480 image is
`Nintendo 3DS Sound_24.09.26_10.52.20.238.png`; SHA-256:
`9071f0d1a3fa47bbc8e407245906a2efa9a90cac9f1c91ecb92c3b15eb809485`.
The native upper crop is `(0,0,400,240)` and lower crop `(40,240,320,240)`.
The native profile and browser were operated only by the coordinator.

Previously the empty production track manifest produced a plain upper screen
with one bird and a lower grid with Close. The empty-track main view now composes
three source birds, upper title/status/time, the Record & Edit Sounds row and
slider, and the source StreetPass/Open/Add/Back/Settings controls. Supplied-track
library and player views keep their existing behavior. The empty entry is
read-only, including the native-disabled Back; HOME remains the exit route.
Its accessible description identifies the display-only controls. It requests
no recording, StreetPass, storage, settings-write or network operation.

## Source composition

The existing private `sound-native14` conversion supplies the added layouts and
clips through `stock-ui-sound.json`. New publication affects only Sound's title
selection and its dependent resources, adding 15 resource URLs and removing
none. Independently integrated Sound Notes long-description/icon metadata is
preserved. HOME, shared assets and other title identities are unchanged.

- `S_Common-BrwCursor` puts `CurBarP0` at source y `+71`, hence LCD row centre
  `120−71=49`; its blue strip starts around y 32, not y 0. The speech/heart icon
  and English `S/P_BR_00` label mount at x 43 and 56 on that centre.
- `C_SldH_L` mounts at `(160,159)`, matching the `-L-C_SldH_L` parent at
  `(0,−39)`. Its Default endpoint and zero Rate give the leftmost slider.
- OpL/OpR, Open, Set and Back keep the original parent translations and bounds.
  `S_BG_D-Ctr` supplies the footer backing already present in public delivery;
  this change does not rewrite the `S_BG` resource pack. Add and Back use the
  source Disable clip's last frame 1.
- StreetPass (`C_B_04`) and Settings (`C_B_03`) surround their whole strings with
  group-1/type-0 80% and restore-100% tags. Entry bindings apply this scale to
  both font axes, fixing clipping while keeping the original pane widths.
  This is a bounded full-label binding, not a general rich-text implementation.
- The title and row use their original CLYT cell sizes. The title's English
  left edge and wider text pane are fitted to this capture, so Sound is not cut
  off. Header/cursor/footer cyan theme register 5 is replaced on an owned pose
  with the source `S_ColConf_D` reset blue `(42,113,235,255)`. Source packs remain
  immutable. The theme-controller binding itself is not claimed as traced.
- Bird instance mounts and the clock text fit come from the native reference.
  Bird artwork remains at Wait frame 0. Source HUD speaker pattern 0 and battery
  pattern 4 reproduce the captured static indicators; these are presentation
  defaults, not device telemetry. The HH MM clock uses local browser time,
  with minute changes included in paired-LCD cache identity.

## Verification and remaining differences

55 focused entry, playback, reducer and native-session tests pass. Typecheck
passes. The complete stock source verifier emits 57 specimens with no renderer
diagnostics; it fixes Sound entry's comparison clock to 10:52. The public-delivery
audit passes with no errors (existing unsupported-resource warnings remain).

`scripts/compare-sound-entry.mjs` reproducibly crops the native image and records
RGB differences without declaring a pass threshold. Current bounded regions:

| Region | Mean absolute RGB difference (0–255) | Exact RGB pixels |
| --- | ---: | ---: |
| Upper title, 400×32 | 4.011 | 0.4% |
| Lower Open, 124×60 | 2.737 | 89.8% |
| Lower footer, 320×62 | 6.058 | 51.2% |
| Lower slider, 320×24 | 3.797 | 18.3% |

The source renders and native crops were visually inspected. Labels are complete,
row and footer placement agree at this bounded level, but colours, glyph edges,
clock formatting and bird poses still differ. The green bird body reaches the
same bottom row, but native upper/lower body bounds start roughly six/five pixels
higher than the selected Wait-frame specimen. No native motion equivalence is
claimed. The first-run Welcome sequence is not reproduced.

The lower vinyl is the original **2D `S_BG-Record`** layout, now integrated
below; the upper room is a separate CGFX model. The Record layer draws after
both S_BG clears and before title, birds, row, status bar and footer. The
earlier claim that all vinyl was CGFX was incorrect. The upper room and other
differences still prevent strict 1:1 acceptance.

## Integrated record-layer check

The original `S_BG-Record` layout is now published and drawn on both LCDs in
the captured settled, empty-track entry state. The combined 57-specimen source
verifier passed with zero diagnostics, and the production browser showed the
record arc on both screens, the restored controls, and a working HOME return;
warning/error logs were empty. Cropping the same raw native screenshot to its
400×240 and 320×240 LCDs gives full-screen RGB mean absolute differences of
**18.61** upper and **10.80** lower (0–255), compared with **23.40** upper and
**75.54** lower before the record layer. On the lower LCD, 86.7% of pixels
are within 10 levels in every channel. This measures one static source pose;
the upper room is still missing, and the residual lower differences include
colour, lettering, checkered background, clock and bird pose. It is not
whole-screen 1:1 acceptance.

Private reports, source LCDs and cropped comparisons are under
`/Users/paramveer/.codex/artifacts/sound-entry-comparison-2026-09-25/` in
`tests.log`, `delivery-audit.json`, `render/verification.json`,
`render/sound-main-{top,bottom}.png`, and `comparison/comparison.json`.
Home-disk scratch was authorized after the SSD refused new worktree writes.
No raw source binary or native screenshot is published.
