# Camera capacity glyph vertical overhang

The original Camera Welcome capture retains text ink above the source
`ShootCapa_Pho` alignment rectangle. The browser renderer previously clipped
both its backing canvas and the final composition to that rectangle. This
change extends the backing and composition vertically using the original glyph
metrics, while preserving the layout size and writer origin.

## Evidence and bounded implementation

Pinned Camera title `0004001000022400`, content `0000-0000001a`:

- `P_Finder_U/RootPane/PhoRem/ShootCapa_Pho` is a 172×16 middle-left
  text pane with explicit left line alignment. Source parent/pane transforms
  place its rectangle at LCD `(5,6)..(177,22)`.
- `P/Finder_Pho_00_00` selects RI.mstl style 110 and the HudNOTES font.
  The delivered font SHA-256 is
  `7b115deda29adce0faccb352d412a3ef9e10247850be6ded7856ba2714d32932`.
  Unit message scale produces size23. FINF ascent19 and TGLP baseline20
  produce the existing writer's local glyph Y `8 - ceil(23/2) + 19 - 20 = -5`.
  The original glyph cell is 24px high, so it ends at local Y19. Relative to
  the 16px alignment rectangle, its overhang is five pixels above and three
  below. These margins are computed, not supplied as Camera constants.
- The preserved original `camera-first-run/native/combined.png` has digit
  and symbol ink at LCD Y5, above pane top Y6. The preserved browser
  `camera-guide-page1-grey-cube-508e0c3/browser/upper.png` truncates that ink
  at Y6. This directly rejects a pane-height scissor for this captured run.

The original capture is beneath the SSD's
`firmware-10.7.0-32E/reference/scenario-matrix/v1/captures/`; the browser
capture is beneath the overflow directory's
`captures-20260926/reference/scenario-matrix/v1/captures/`.

`nativeTextVerticalOverhang` covers only the existing one-line, zero-spacing,
middle-left explicit-alignment luminance-alpha writer branch. Text drawing
continues to receive 172×16 for alignment; the glyph canvas becomes 172×24
and is composited at local Y−5. Original atlas pixels and advances are retained.
The material's text-color interpolation uses the original pane coordinates.
This is not a general trace of native clipping for every text alignment,
transform, multiline run or font.

## Remaining differences and validation

The Camera symbol's native bright footprint starts at X6 versus browser X8.
The source U+E01E glyph has left bearing zero, and the pane begins at X5;
therefore left-edge clipping does not explain that horizontal difference.
No horizontal translation or bearing correction is included. Message controls
and the exact symbol origin remain untraced. Sampling differences also remain.

Tests cover the original font hash/metrics, the computed 5/3 overhang, unchanged
unsupported branches, original alignment arguments, backing size and final
composition origin. The 38 focused bitmap-font/renderer tests, typecheck and production build
pass. `npm test` reports 1,387 passes, 24 skips and 36 failures; all failures
are missing model GLBs excluded from this sparse worktree (ENOENT), including
compact-delivery and historical source-model tests. The coordinator owns the subsequent integrated
browser/native comparison; this source-backed fix does not establish complete
Camera scenario fidelity.
