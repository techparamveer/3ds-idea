# Settings upper LCD: seconds ownership and remaining title edges

This bounded source audit starts at `600bf6f` and uses the preserved matrix v32
production captures. It makes no runtime or native-asset change. The private
[reproducible audit](/Users/paramveer/.codex/3ds-artifact-overflow/presentation/settings-upper-seconds-audit/audit.py),
[results](/Users/paramveer/.codex/3ds-artifact-overflow/presentation/settings-upper-seconds-audit/audit.json)
and [bounded source trace](/Users/paramveer/.codex/3ds-artifact-overflow/presentation/settings-upper-seconds-audit/seconds-ownership.asm)
are retained outside the repository. The two amplified raw LCD differences were
visually inspected. No browser or emulator was operated.

## New source result: the charging selector is cached seconds

This resolves the unknown writer in the earlier
[HUD phase audit](settings-hud-phase-boundary-2026-09-26.md). The executable is
Settings title `0004001000022000`, EUR 10.7.0-32E, content 0 / `0000003d`,
`exefs/code.bin`, SHA-256
`1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5`.
The original source clip and texture provenance remain in that earlier audit.

At `0x2389f4..0x238a18`, the HUD obtains time, calls date conversion
`0x1b01a4`, then copies all 12 result bytes into HUD object offset `0xe8`.
The presumed independent phase flag at `0xf1` is actually byte 9 of that date
structure. In the converter, `0x1b02c8..0x1b02f8` computes whole seconds from
milliseconds, takes their remainder modulo 60 and stores it in bits 8..15 of
the word written at result offset 8 (`0x1b0310`). Hence object `0xf1` is seconds.
The reciprocal-multiply arithmetic was replayed for 432,000 samples: every
second of a day at milliseconds 0, 1, 499, 998 and 999. All equal
`floor(millisecondsOfDay / 1000) % 60`.

In the charging branch, `0x238f10..0x238f20` tests that byte's low bit and
writes `s16` for odd seconds or `s18` for even seconds. Literal addresses
`0x238dc0` and `0x238dbc` decode as float32 **4** and **5** respectively.
This establishes source frame 4 for odd cached seconds and frame 5 for even
cached seconds, conditional on the two hardware-status branches reaching it.
It does not establish real browser battery telemetry; the portfolio's fixed
charging/network status remains an adaptation.

There is a cadence boundary. Date refresh executes only when the signed HUD
counter at `0xc8` is nonpositive (`0x2389d4..0x2389e4`). The battery refresh
executes at counter 2 or negative (`0x238e4c..0x238e5c`); note that counter 0
falls through the `bge` and skips battery refresh. The tail
`0x238f7c..0x238f90` decrements the counter, replacing it with 29 when its
previous value is nonpositive. Thus the ordinary counter sequence is
29..0,29..0, with the battery using cached date state at counter 2. A direct
`date.getSeconds()` selector would omit this sampling/retention behavior.
The bounded trace does not establish a frame-indexed native screenshot or
uninterrupted host callback timing.

## Colon phase is also source-controlled

`0x238aec..0x238b10` checks flag `0xcc` and bit zero of `0xe5`, then hides
pane `T_TimeC_00` by clearing visibility bit 0. Its name is the inline string
at `0x238d8c`. Otherwise `0x238c78..0x238c90` makes the pane visible.
The `0xdc..0xe7` structure is the previously displayed date/time, copied at
`0x238bb0..0x238bbc` after the visibility decision. Offset `0xe5` is again
seconds at byte 9. Current time, previously displayed time and HUD counter
are distinct source state; a stateless current-second blink is incomplete.
The latest main capture has the colon hidden; Other has it visible.

## Reproduced current residuals

Using the v32 `settings-other-1-f32-endpoint-browser-20260926` and
`settings-main-f32-regression-browser-20260926` image pairs, with no masks and
maximum channel threshold 2/255:

| Upper region | Other page 1 | Main |
| --- | ---: | ---: |
| Icon, `[95,150) × [20,58)` | 349 | 0 |
| Title glyphs, `[150,305) × [20,58)` | 961 | 0 |
| Network, `[0,142) × [0,20)` | 0 | 0 |
| Clock/date, `[218,368) × [0,20)` | 30 | 59 |
| Battery, `[368,400) × [0,20)` | 137 | 0 |
| Body below y58 | 0 | 0 |
| Whole upper | **1,477** | **59** |

The network pixels were resolved by the earlier horizontal font boundary fix.
It did not reduce the current 349 icon / 961 glyph title residual. Main's
clock count contains 32 visible browser colon pixels at x339..342, y5..8 and
y11..14, where native has only background. Remaining clock edge samples occur
mostly at x310,337,363; they are a separate coverage question. The 32-pixel
colon mismatch should not be described as font sampling.

## Why there is no phase patch from this pair

Both browser inputs force seconds to zero (`01:20:00.000Z` main and
`01:22:00.000Z` Other). Their source native recovery notes record only minute
precision. The original native seconds and prior HUD samples are not present.
The source state explains why equal displayed HH:MM values do not establish
matching charging or colon phase. Replacing fixed frame 4 with even-second
frame 5 for these two inputs would reduce Other upper to **1,340** but regress
main to **196**, before addressing the colon. These figures follow the exact
137-pixel source frame difference verified in the preceding audit; they are
not new production captures.

Next evidence must include native sampled seconds, displayed-date history and
counter/phase, or a frame-indexed sequence resolving them. A replay can then
feed explicit sampled HUD state to presentation, preserving the declared
portfolio hardware-status adaptation. Do not assign seconds from the screenshot
appearance or choose a battery frame by page to make the two stills agree.

Title projection remains separately open: its source pane/group Z and the
capture-fitted 95-pixel translation do not establish native projection or PICA
interpolation. This audit supplies no source-supported fractional adjustment,
font replacement or asset change. All scenario acceptance tiers remain as in
v32; tests or these source arithmetic checks do not make either pair pass.
