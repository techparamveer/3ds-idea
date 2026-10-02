# HOME cursor phase replay audit — 2 October 2026

## Scope and result

This is a source-only audit from coordinator checkpoint `7404afd2`. It does
not change runtime code, assets, clocks, input, or capture behavior, and it does
not operate Azahar or a browser.

The lower-screen paint diagnostic already identifies the exact primary cursor
Loop frame that was drawn. `screenPaint.cursor.sampledFrame` is not a nearby
wall-clock estimate: it is the same retained `appliedFrame` passed to
`LncCsr_00_Loop` during the immediately preceding `screens.paint` call.
Conversely, the more general `data-home-cursor` diagnostic is updated on HOME
ticks even when the idle LCD paint is throttled, so it must not be used to
label pixels already present in `screenCanvases.bottom`.

There is no captured, stable cursor defect yet. The coordinator has now
completed the named production-browser phase replay at runtime commit
`a751b2dd`; no capture API or runtime change is needed. The next safe step is
to compare those named browser cursor ROIs with native captures, not to adjust
geometry or materials first.

## Exact frame path

The relevant call path is:

1. `advanceHomeCursorLoop` submits `currentFrame` to `appliedFrame`, then
   advances the current frame. At step 1, the steady relation is
   `appliedFrame = (currentFrame + 59) % 60`.
2. `getHomeCursorLoopFrame(state, reduced)` returns `appliedFrame`, or frame 0
   for reduced motion. It never advances state.
3. `screens.ts` calls `getHomeCursorLoopFrame` and passes the result directly
   to `nativeHome.cursorAt`.
4. `firmware-presentation.ts` binds that argument unchanged to
   `LncCsr_00_Loop`; there is no rounding, multiplication, or second clock.
5. `paintScreens` calls `screens.paint`, then `recordScreenPaint` without a
   state mutation between them. `cursorDiagnostic().sampledFrame` calls the
   same getter, so `data-screen-paint` describes the completed draw.

`captureScreensAt` is also synchronous: it paints the supplied current state,
records `cursorDiagnostic()` in its return value, encodes both LCDs, and only
then restores a live paint in `finally`. Its `elapsedMs` argument does not seek
or advance the retained cursor. Therefore the returned bottom PNG and returned
`homeCursor.sampledFrame` are one atomic diagnostic sample. Other time-driven
surfaces may be synthetic for that call and must not be promoted as live.

## Authored resource and geometry

The public manifest maps `home.launcher` to `packs/home/launcher.json`. Its
source is EUR HOME Menu `0004003000009802` version 24576, content index 0 /
content ID `00000082`, `romfs/launcher_LZ.bin`. HOME CIA SHA-256 is
`2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`;
the delivered pack SHA-256 is
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`.
Conversion is `ctr-native-web` 1.2.0 with CTRTool 1.3.0.

| Resource | Source path | SHA-256 / delivered identity |
| --- | --- | --- |
| Layout | `blyt/LncCsr_00.bclyt` | `72f59f9f3d0a327c6c1e3e012a1aa9f1a1a84ab3d0c829772ae4a2a43ecd0738` |
| Density geometry | `anim/LncCsr_00_Scale.bclan` | `74277ac0ec8debf4f035b6e4c629fb9605c897fcb50e6b5ed2447250c671c2dd` |
| Idle loop | `anim/LncCsr_00_Loop.bclan` | `0bf11061be32b1af39749b8ae8342b8010b65ed9dfd257dbce76e38618b76744` |
| Press offset | `anim/LncCsr_00_Select.bclan` | `ecdf8761f6e0c07c9405dc12f9d4d65f1b97b4c70bb110da4a0afc52fdc46e02` |
| Mint texture | `timg/LncCsr_41.bclim`, LA8 32×32 | source `22956cfb74b6a47883d65e262f940952bd8c6732bf56c105c08066e933daff9a`; delivered PNG `b0e5663eefaf8932212a7168ac85bcfe3a5e0a3612a307db4af2c83320bdb3f7` |
| Light/shadow texture | `timg/LncCsrShdw_44.bclim`, A8 32×32 | source `3887e11905c6b27b1965aee3fea6e0caae0a2af9666e839388a2d85c05f6b57e`; delivered PNG `6c54cfb3fb3ff74995a23a9a7a6b7e908d4a97171e82964d2f447893f7d6941b` |

The 60-frame looping clip changes `W_CsrLgt_00` alpha and the two cursor
materials' texture translations. It does not change cursor geometry. Scale
frames 0–5 change the two window panes' authored sizes/scales. Source pose
evaluation gives the following maximum pane spans before a two-pixel sampling
margin:

| Rows | Scale frame | Maximum span | Browser Health center `(x,y)` | Browser lower ROI `(x,y,w,h)` |
| ---: | ---: | ---: | --- | --- |
| 1 | 0 | 117.00 | `(76,161)` | `(15,101,122,122)` |
| 2 | 1 | 117.00 | `(76,82)` | `(15,22,122,122)` |
| 3 | 2 | 85.84 | `(52,178)` | `(7,133,90,90)` |
| 4 | 3 | 68.68 | `(40,64)` | `(3,27,74,74)` |
| 5 | 4 | 57.62 | `(32,156)` | `(1,125,62,62)` |
| 6 | 5 | 49.58 | `(34,110)` | `(7,83,54,54)` |

The centers are browser Health-slot diagnostics from the six descending
density captures. Adding the raw own-PNG lower-LCD offset `(+40,+240)` would
only express these same **browser** rectangles in a 400×480 packing; it does
not produce native Health cursor coordinates. Native and browser title
populations differ, so their selected Health slot can occupy different cells.
For example, the fresh native rows-6 cursor center is `(34,54)`, while this
browser atlas uses `(34,110)`. Derive the native center independently from each
native input and use center-normalized comparison when the placements differ.
Each experiment must assert its source's live center and applied Scale frame
instead of silently trusting this table. These browser rectangles intentionally
enclose the full authored light pane; the earlier density comparator's smaller
selected-neighborhood rectangles remain useful historical controls but can cut
off the outer halo.

## Completed production-browser replay

The coordinator collected the production-browser atlas under
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-cursor-phase-20261002/browser/`.
The root `result.json` has SHA-256
`896627e802b5e770aa95f73f5cd0e3d17b4cb06bac202f99f32f67c5c3618364`,
identifies runtime commit `a751b2dd`, and reports no errors. It contains six
row summaries, each with 60 distinct phase labels covering 0–59. The archive
contains 360 `capture.json`, 360 `lower.png`, and 360 `upper.png` files.

The collector observed live `data-home-cursor`, synchronously called
`captureScreensAt(120000, '2026-10-02T11:40:00.000Z')`, retained a result only
when its returned `homeCursor.sampledFrame` matched the observed phase, and
waited across cycles for skipped phases. It did not seek or mutate cursor
state. A read-only audit of all 360 records found:

- filename phase, returned `sampledFrame`, and returned `appliedFrame` agree;
  `currentFrame = (appliedFrame + 1) % 60` and `step = 1` throughout;
- selected and visible slot are 8, theme is white, quality is high, audio is
  muted, and the primary cursor is visible throughout;
- every row uses the center and applied Scale frame in the table above; cursor
  effects, tile touch ownership, pickup, and tile candidate are inactive;
- dimensions are 400×240 upper and 320×240 lower; `synthetic`,
  `cadenceAcceptance`, and `nativeEpochMatched` are all false.

The stored `state.screenPaint` is deliberately not used to label the returned
PNGs. Across this atlas its prior live cursor paint trails the synchronous
capture by 0–3 loop phases. For example, rows 6 phase 59 returns
`sampledFrame=59` while its retained live `screenPaint` describes frame 58.
That is consistent with the 24 fps LCD paint throttle and does not contradict
the atomic `captureScreensAt` return contract.

## Recommended native comparison

First derive the cursor center independently in each native still. If native
and browser have the same selected center and comparable background, compare
the full row-specific rectangle with an empty mask and threshold 2. Otherwise,
crop the full authored extent around each source's own center and use a
center-aligned pair only as a placement-normalized phase diagnostic; it is not
an acceptance mask or a same-coordinate comparison. Compare every native crop
against all 60 named browser phases for the same density, report every minimum
and tie, inspect a source/browser/native contact sheet, and repeat on at least
one second native still. A closest phase is a fitted phase, not proof of a
shared epoch. Only a repeatable same-phase residual is a candidate renderer
defect.

The high-quality runtime paints idle LCDs at 24 fps while the retained HOME
clock advances at 60 updates per second. Consequently `data-screen-paint`
cannot naturally expose every phase. Tick batching or capture cost also skips
some observed `data-home-cursor` phases; the completed collector correctly
waited across cycles instead of seeking state, overwriting controller fields,
changing reduced motion, or synthesizing a 60 fps clock to fill gaps.

## Existing tools and limits

- `scripts/verify-home-cursor.mjs` already proves that repeated
  `captureScreensAt` calls at different elapsed values neither advance the
  cursor nor change the lower result for one retained state. It does not label
  all 60 phases.
- `scripts/firmware/home_toolbar_cursor_resources.mjs` checks decoded-resource
  equality and Scale poses with the current sampler. It explicitly is not a
  native raster comparison.
- `tests/native-cursor-presentation.test.mjs` proves exact Loop/Scale binding
  through the presenter, including fractional values. Renderer raster tests
  cover the generic material/window machinery, but there is no existing
  dedicated 60-frame cursor atlas tool.

Native own-PNGs expose no cursor counter. Matching one native still to the
browser atlas is therefore a fit and may be ambiguous because the Loop is
smooth and partly symmetric. PNG capture latency, emulator cadence, host
refresh, title population, and unrelated cursor effects must remain explicit.
Do not use this experiment to reopen the known plate/footer gaps, fit geometry,
or claim whole-screen, exact-input, motion, audio, or strict 1:1 acceptance.
