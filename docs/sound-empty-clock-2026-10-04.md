# Sound empty/first-run clock: HudTime separator phase and 12/10 pitch

Worker slice on `codex/sound-clock-rework-20261004`. It reworks the rejected
`codex/sound-empty-residual-20261004` (tip `7535d6b5`). That branch joined
both type-47 strings into `"HH: MM"` and dropped the source group-5 12/10
tags. Songs stay unsupplied. Azahar and the shared production browser were
not operated, and nothing was recaptured.

## Native evidence

Both overflow stills are the matrix native references:

| Still | SHA-256 | Matrix role | Clock |
| --- | --- | --- | --- |
| `Nintendo 3DS Sound_25.09.26_22.27.14.541.png` | `9dea0cc2fa7022ccd032c5a94ae59c2dbe37e6b7e800fbf8668b356fc9e5ce69` | `sound-first-run` native combined | `22 27` (seconds 14, even) |
| `Nintendo 3DS Sound_25.09.26_22.31.31.595.png` | `65fc5f8819d31c49622d9e2a8ee7ba79c0675fd7dd3a73f783255eb7efe3b4cd` | `sound-empty-entry` native | `22:31` (seconds 31, odd) |

The stills are under `/Users/paramveer/.codex/3ds-artifact-overflow/reference/screenshots/`;
measure the hashed originals above, not a derived crop.
Column maxima over rows 219–235 (upper LCD x) give:

| Glyph | `22:31` ink x | `22 27` ink x |
| --- | --- | --- |
| hour 1 | 130–137 | 130–137 |
| hour 2 | 142–149 | 142–149 |
| separator | colon 156–157 | none |
| minute 1 | 163–171 (`3`) | 164–171 (`2`) |
| minute 2 | 176–180 (`1`) | 176–184 (`7`) |

The hour digits are 12 px apart. The second hour digit and the first minute
digit are 22 px apart, so the separator cell is 10 px. The colon and the space
occupy the same cell.

## Source trace (one bounded pass)

The Sound title is EUR `0004001000022500` v3088, content 0 `0000000b`,
`exefs/code.bin` SHA-256 `3c57f2c4091c1bec6b3834609f1e2a6488712e21775d7548b441c69c60b3e5a9`, base `0x100000`. The Capstone
listing is
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/sound-clock-rework-20261004/trace-hudtime-separator.txt`.

- `0x22afa4` expands message text. A `0x0E` control with group 3 calls
  `0x2066fc`; other groups pass through to the writer.
- `0x2066fc` calls a provider getter for group-3 types below `0x26`. Types
  `0x26`–`0x2f` go through a jump table. Type 47 (`0x2f`) is slot 9, at
  `0x206c3c`.
- `0x206c3c` loads byte `[0x3c9a7c+0x2c]` and runs `tst #1`. **If bit 0 is
  set, it emits the first length-prefixed alternative (`:`). Otherwise it
  emits the second (` `).** It never concatenates them.
- `[0x3c9a7c+0x2c]` holds the **seconds** value. `0x238890` reads `+0x2a`,
  `+0x2b` and `+0x2c` as `h*3600 + m*60 + s`. `0x25e108` reads `+0x2a`/`+0x2b`
  as `h*100 + m`. `0x1e1634` copies the calendar struct's hour, minute and
  second bytes to `+0x2a`, `+0x2b` and `+0x2c` of the `+0x24` struct.
- The struct is refreshed by `0x27cc60` (GetNow `0x22b298` → calendar
  `0x228fa4` → `0x1e1634`). That function is called only from `0x17e930`,
  which is a virtual method (vtable words at `0x31ef40`, `0x31efc0` and
  `0x322c78`). Initial setup is `0x2bc868`.

**Result:** the separator is `:` on odd wall-clock seconds and ` ` on even
seconds. Both stills agree. The vtable slot for `0x17e930` was not resolved to
a named per-frame update, so the refresh cadence is untraced. A one-second
toggle needs at least one refresh per second, and the stills are consistent
with that.

## Runtime change

`soundHudTimeOverride` (in `src/os/stock-native-sound.ts`) now reads the
HudTime tokens in order:

| Token | Handling |
| --- | --- |
| group 5 / type 0, float | Start a fixed character pitch of that width (12, 10, 12) |
| group 5 / type 1 | End the pitch |
| group 3 / type 3, type 4 | Zero-padded hour and minute |
| group 3 / type 47 | `soundHudTimeAlternatives` decodes `[":", " "]`; select index `seconds & 1 ? 0 : 1` |
| any other | Explicit error |

Output for 22:31:31 is `"22:31"` with `fixedWidthSpans`
`[{0,2,12},{2,3,10},{3,5,12}]`. It keeps style 9 (`fontScale` 0.68) and the
existing style word-0 width 72, sets no `fontSize` and leaves the source CLYT
translation `[-36,-112,0]` in place.

`fixedWidthSpans` is a new opt-in field. It is defined in `native-layout.ts`
(`NativeText`, `PaneOverrides`, override application). `native-renderer.ts`
excludes it from the direct path and passes it on. `BitmapFont.drawNative`
supports it only on the generic writer path, for one line with no spacing.
Each glyph is centred on its own scaled advance in its cell, and the cursor
moves by the cell width. Unsupported combinations throw.

`stock-screen-presentation.ts` adds `seconds & 1` to `soundClockKey`, so the
main and guide pair repaints when the phase flips.

The model predicts these ink starts for a pane left of 128: hour `2` 129.6,
hour `2` 141.6, colon 155.6, minute `3` 162.9 and minute `1` 176.3 (still: 130,
142, 156, 163 and 176/177). The offset is consistent at about +0.4 px.

## Adaptation labels

- **Adaptation: group 5 type 0/1 semantics.** Fixed pitch (an NW
  `SetFixedWidth`-style cell with a centred glyph) and type 1 as "end pitch"
  are fitted to the two stills. The group-5 tag processor was not traced. The
  source values 12/10 are kept as they are and are not capture-fitted. Font
  size stays the style 0.68 cell. A 12 px font cell would undershoot the
  ~13-row digit ink.
- **Adaptation: pane width 72.** This is RI.mstl word 0 and carries over from
  the earlier slice. The CLYT pane is 48. The writer's use of word 0 is
  untraced.
- The separator phase itself is **source-traced**, not an adaptation.

## Tests

- `tests/sound-entry-native.test.mjs` checks the HudTime token list and that
  `soundHudTimeAlternatives` returns `[":", " "]`. It checks
  22:31:31.595 → `"22:31"`, 22:27:14.541 → `"22 27"`, even → space and odd →
  colon. It requires length 5, no `": "`, the exact pitch spans, and the
  posed pane value and spans. Unknown controls and bad type-47 arguments must
  throw. The old concatenation (`"10: 52"`, no spans) fails these.
- `tests/bitmap-font.test.mjs` uses the real shared font with the `22:31` and
  `22 27` glyph x positions. It checks 12 px hour spacing, a 22 px hour-to-
  minute gap and the guards.
- The Effect and room sequence stubs load the published English bank, as in
  `7535d6b5`, because empty main now requires S/HudTime.

## Coordinator recapture

Integrate, then run the matched loop with both sessions muted and the empty
song manifest. Inject a browser `Date` whose seconds parity matches each
native:

1. **`sound-first-run`**: settled guide page 1 against native
   `9dea0cc2fa7022ccd032c5a94ae59c2dbe37e6b7e800fbf8668b356fc9e5ce69` (`22.27.14.541`). Use browser time **22:27 with even
   seconds** (for example 22:27:14). The clock should read `22 27`. Suggested
   ID: `sound-first-run-hudtime-phase`.
2. **`sound-empty-entry`**: A through guide OK to empty main against native
   `65fc5f8819d31c49622d9e2a8ee7ba79c0675fd7dd3a73f783255eb7efe3b4cd` (`22.31.31.595`). Use browser time **22:31 with odd
   seconds** (for example 22:31:31). The clock should read `22:31`. Suggested
   ID: `sound-empty-entry-hudtime-phase`.

Report whole-LCD counts and the clock region `[95,216,194,240]`. The earlier
first-run total of 6,627 upper (533 in the clock) predates this change.
Separator motion (a 1 Hz toggle) is a timing claim. It needs a sequence
capture, not these stills.

## Remaining residuals

- Group-5 tag processor and the RI.mstl word-0 writer use are untraced.
- The cadence of the `0x17e930` refresh is untraced.
- Upper Span deformation and bird RNG/phase, the volume
  `C_HudSndB_Pattern` frame, the guide perimeter compositor, settled-row
  icon fill and the footer glyph blend are unchanged.
- The song manifest is empty. No tracks are invented.
