# Health upper background: source TopLoop frame fit

At `7221619`, Health's upper `Bg_U_00_TopLoop` binding is frozen at frame 0
and the paired-screen publication key contains no Health animation pose. This
slice samples the delivered source animation through Health instance-local
elapsed time and includes that source frame in the pair cache. It does not
change native assets, title text, lower screens or input.

## Source and clock adaptation

The native element is Health title `0004001000022300`, version 3077, content
index 0 in the pinned EUR 10.7.0-32E dump. Manifest key
`packs/health-and-safety/bg.json` is converted with `ctr-native-web` 1.2.0.
The unchanged resource mappings are:

| Resource | CIA-internal RomFS path | SHA-256 |
| --- | --- | --- |
| Source loop | `bg_LZ.bin/anim/Bg_U_00_TopLoop.bclan` | `c0fa9a144892bf146eedf53edd34ba13edc9622294a8ad2fbe38c5024f402ff6` |
| Upper layout | `bg_LZ.bin/blyt/Bg_U_00.bclyt` | `5826095e575969d981da5b6d48e2fa970759b906e2103d130bf2a2a00b32839c` |
| Moving artwork | `bg_LZ.bin/timg/safe_00.bclim` | `3b39b6bcd0e176deb13ed1d2770ddfaa841ee52c725f192b5bda8880f9255dbb` |
| Moving artwork | `bg_LZ.bin/timg/safe_10.bclim` | `4d6483b055cc4836a641ea0ab25a636b66d8a4013a7684cbd31e820bee8c42c9` |

The source clip has 720 frames and loops. Its position, scale, rotation and
alpha tracks are sampled without altered keys. The browser uses the existing
Health VBlank rate `268111856 / 4481136` and active Health-local milliseconds.
**The 18-frame origin is a capture-fitted adaptation.** It makes the existing
12,000 ms comparison sample use source frame 15: `(717 + 18) % 720 = 15`.
The native screenshot has no measured entry-to-capture interval. The original
12,000 ms was a global browser harness value; assigning it to Health-local time
is a synthetic source-render diagnostic, not a matched native elapsed sample.
This does not recover native launch time or prove animation timing. Reduced
motion preserves the previous static source frame 0. Invalid or negative host
time uses the ordinary zero-time pose, frame 18.

## Exhaustive offline fit

The private [fit script](/Users/paramveer/.codex/3ds-artifact-overflow/presentation/health-toploop-fit/fit.mjs)
and [all 720 frame scores](/Users/paramveer/.codex/3ds-artifact-overflow/presentation/health-toploop-fit/render/scores.json)
compare raw 400×240 upper pixels against
`reference/scenario-matrix/v1/captures/health-entry/native/combined.png`,
SHA-256 `162aeccd2327c04f3eb466ed182537dfbe689d3aa24dd9a140ceb117aa49abe6`.
Every integer frame 0 through 719 was rendered from the current source pack,
with no mask, offset, resampling or color fit.

| Source frame | Pixels above 2/255 | RGB MAE |
| --- | ---: | ---: |
| 0 / 360 | 7,264 | 0.611125 |
| 14 / 374 | 464 | 0.168601 |
| **15 / 375** | **203** | **0.140538** |
| 16 / 376 | 451 | 0.162563 |

The clip's repeated poses produce the same minimum at 15 and 375; this is
phase equivalence, not proof of which half of the native loop was captured.
The published production frame-0 pair remains 7,196 upper / 0 lower, while
the fresh offline baseline is 7,264 upper. These are distinct renderer
checkpoints and are not presented as identical baseline evidence.

The offline Health presenter with a synthetic **local** 12,000 ms reproduces
**203 upper / 0 lower** pixels above 2/255. Upper PNG SHA-256:
`aafc1e19bba13f578cac6da40eef6d9a6b9c0ac7bb3fc5ac4f8c3c8ba5206bc6`.
Lower PNG SHA-256:
`66d5adfe846f296fb38361cf86ca2d19bc5424e81c3f693b2c6e191ce15be962`.
The best source frame and amplified difference were visually inspected;
small edge/sampling differences remain unexplained. No fractional frame search
or corrective source-asset alteration was made. This is a clear visible
improvement in the offline diagnostic, not a passing production pair.

## Regression and next capture

[Comparison evidence](/Users/paramveer/.codex/3ds-artifact-overflow/presentation/health-toploop-fit/comparison.json)
shows all eight Health lower source views unchanged, including article
scrolling and pressed/released thumb poses. The Settings verifier passes five
main and 44 subpage pairs; all 100 Settings PNGs are byte-identical to the
preceding endpoint-fix source renders. The Health-only runner and its scope
are described in the [endpoint audit](native-glyph-endpoint-coordinate-ownership-2026-09-26.md).

All 51 focused Health-scroll and paired-publication tests pass, along with
TypeScript checking and `git diff --check`. New tests cover source-frame
advancement, loop wrap, reduced motion, invalid input and paired cache
invalidation; no repaint occurs within an unchanged source frame.

The coordinator should record Health-local elapsed time and capture multiple
explicit source-frame checkpoints alongside a timed native sequence. A global
`captureScreensAt` time does not advance or replace Health instance state.
The native entry input/history and initial source phase must be recorded to
replace the fitted origin with a verified clock. No browser or Azahar session
was operated in this lane. The 203 unexplained pixels, live motion/input/audio
and all application acceptance remain open.


## Clock ownership correction after review

`930a33a` initially consumed global presentation time. The corrected reducer
initializes `healthElapsedMs` to zero on each Health creation, accumulates valid
active-app tick durations on both menu and article pages, and preserves it while
navigating within the same instance. Existing app-host suspend/sleep ownership
stops active ticks; lifecycle events alone do not advance the local clock.
Closing and reopening creates a new clock even when saved state is supplied.
The renderer and cache consume this field, and raw milliseconds are excluded
from the cache key so only source-frame changes repaint.

Reduced motion freezes the source frame at zero, preserving the prior static
pose. The active local clock continues, so switching reduced motion off resumes
its current pose; this is an accessibility adaptation, not native pause timing.
A regression verifies that changing global page time cannot alter Health's
frame and that local time within one source frame reuses the paired LCDs.

The repeated offline eight-view render sets local elapsed to 12,000 ms while
setting global presentation time to 987,654 ms. Every upper/lower result is
identical to the preceding fitted source render: 203 upper / 0 lower on entry.
The runner/output are retained under `health-toploop-fit/verify-health-local-clock.mjs`
and `health-toploop-fit/local-clock/` in the private artifact directory. This
preserves the source-render improvement only; production/native timing remains
unverified and the fitted origin cannot be treated as recovered launch phase.
