# Primary cursor across ordinary mode3 boundaries

2026-09-23. The primary cursor remains shown during ordinary grid scrolling,
retains its previous root position, and continues its Loop on the later2D
pass. Entering mode3 writes show/position request0, not hide request2. On
completion, the common footer positions the primary only if pending replay
has not re-entered mode3. A completion-boundary overlay skips that footer and
preserves prior visibility; an already-visible cursor still advances Loop.

This is source evidence only. It extends [host ordering](HOME_HOST_ORDER_EVIDENCE.md),
[request generation](HOME_BANNER_REQUEST_GENERATION_EVIDENCE.md),
[primary Loop eligibility](CURSOR_LOOP_CLOCK_EVIDENCE.md), and the separate
[toolbar/primary-position audit](TOOLBAR_CURSOR_EVIDENCE.md). No application,
public asset, browser, emulator or previous evidence file is changed.
Browser selected-slot culling does not establish native cursor visibility.

## Source, reproduction and limits

Owner-supplied EUR HOME `0004003000009802`, version24576, mapped at
`0x100000`. Executable SHA-256:
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.

Run [home_primary_cursor_boundaries.py](home_primary_cursor_boundaries.py)
with Unicorn2.1.4 and Capstone5:

```sh
python scripts/firmware/home_primary_cursor_boundaries.py \
  --code /private/path/exefs/code.bin \
  --output /private/path/native-primary-cursor/verified
```

Private `checked.json` and20 source excerpts remain under:
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/audio/native-primary-cursor/verified/`.

| Artifact | SHA-256 |
| --- | --- |
| Fixture | `c1d11e146e3fd3413acce21114474d7e6b18f5e8592171c8cd8c7f5d7b6ac62c` |
| `checked.json` | `d46f07f0b5a0ed2bcf5317d004a2f17da554bf46876b5c463fd46b1ae262a45a` |

All four entry-through-completion sequences and eight completion cases pass.
The inherited bounded task-registration check also passes. The report groups
are `entries` and `completions`, with primary snapshots, writes, helper calls,
request events, original host traces and recorded service endpoints.

The fixture reuses the mature task setup from request fixture
`7b1be990ca14d0a5b650f8260647d64c4682e02a793f0fb8bbcfa597fb5d6b23`.
It enables original grid generation, motion preparation/interpolation, idle
grid refresh and primary positioning that were endpoints in that earlier
request-only audit. Platform acquisition, unrelated HOME/upper services,
widget work, scroll-layout notifications, banner resource/instance work,
rendering and sound remain explicit endpoints. Departed effects are supplied
hidden objects; their trigger remains an endpoint. Their lifecycle belongs
to the separate effect audit.

Named resource lookup verifies `N_IconPos_00` and supplies its original local
Y0. This value is supported by the earlier toolbar resource report
`05b378c0534019c8ea8d22a966d23ea3bdfd1ac265d8b70d07fc21308f6eaa86`, whose
`LncBase_D_01.bclyt` hash is
`787e6b58e0455130ae1f7f4f35a5edf4472c8a21151a53bbce782e813fab5adf`.
Resource parsing is not repeated here. Native constant-table initialization
`0x2f4124..0x2f43f8` and coordinate generation execute; positions are not
supplied from a screenshot or browser layout.

## Fields and order

Let `S` be HOME, `C=*(S+0x820)` its primary cursor, and `P=*(C+0x38)`
the cursor root pane. The independently tracked fields are:

| Field | Meaning in these checks |
| --- | --- |
| `S+0x3a88` | Cursor request:0 show/position,1 show without position,2 hide |
| `S+0x3a4e` | HOME's retained shown flag |
| `C+0x60` | Actual layout visibility used by global2D eligibility |
| `P+0x28/+0x2c/+0x30` | Retained primary root X/Y/Z |
| `S+0x3a28` | Current native grid scroll offset |
| `C+0x8c` | Primary Loop controller |

The four entry sequences use actual input production/callback within host
`0x102288`, not a separately simulated direction event. A snapshot at task
traversal`0x1067dc` records the completed input phase. It shows mode3 elapsed0;
the same pass's lower task advances elapsed to1 before the2D Loop submission.

Mode3 entry`0x2a3600` writes request0 at`0x2a3678`. It preserves primary
shown/layout visibility and root position during input. The lower common
footer at`0x2b8490..0x2b8568` consumes that request after mode work:

1. With both overlay pointers null and mode outside185/186, request0 shows
   the layout if HOME's shown flag was clear. The actual writes are shown1
   at`0x2b8500` and layout visibility1 through`0x232234`.
2. It invokes primary positioning`0x1d914c` at`0x2b8524`.
3. For an ordinary grid in mode3, that helper leaves `P` unchanged. Its
   other branch follows eligible departed effects; this audit leaves those
   separate layouts hidden.
4. The later global2D pass sees `C+0x60=1` and advances the primary Loop.

Thus an initially hidden primary can become eligible during this lower
footer and submit its retained Loop frame in the same pass. Mode3 itself
neither resets Loop nor freezes its phase. A retained step3 takes effect
before that same pass's submission/advance.

## Representative entry sequences

The root/folder rows below use zero-based density indices. Root context is−1;
the child context is2. Each sequence starts from a natively generated primary
position for its selected slot/current viewport.

| Context, density | Direction, old→new slot | Initial counter/shown | Duration | Held primary X,Y |
| --- | --- | --- | --- | --- |
| Root,0 | Right,2→3 | 0 /1 | 10 | 84,−41 |
| Root,0 | Right,2→3 | 5 /0 | 5 | 84,−41 |
| Root,2 | Right,12→15 | 5 /1 | 5 | 108,50 |
| Child2,2 | Left,2→0; old left2 | 5 /1 | 5 | −108,11 |

Every lower pass with mode3 remaining retains the original primary position.
The initially hidden case becomes shown on the first pass. Each eligible
Loop submits its previous current value, then advances by the retained step.
For the fast root case, input changes step1→3 without changing current17.25;
its first2D update submits17.25 and advances to20.25.

Native `0x297b20` copies transition coordinate arrays, stores the current
scroll in `S+0x3a2c`, and derives target scroll `S+0x3a30` from target-left
coordinates. `0x1d7b50` performs the original interpolation and rounding.
The five-update root density0 sequence produces scroll `[17,34,51,68,84]`;
the10-update version produces `[9,17,26,34,42,51,59,68,76,84]`. Root density2
produces `[11,22,33,44,54]`; the tested child left transition gives
`[44,33,22,11,0]`. These are actual numeric results. The existing integration `sampleHomeGrid`
already applies the matching positive-ceiling/nonpositive-floor scroll rule;
see [the narrow arithmetic check](SCROLL_SCALAR_ROUNDING_EVIDENCE.md).
These counts do not imply a wall-clock rate.

On ordinary idle completion, `0x1d914c` uses current selected coordinates:
X=`S+0x1868[slot]−S+0x3a28`, Y=`S+0x1e08[slot]`, Z0, then the real pane
setter`0x1d9f38` writes the root. In these edge-scroll examples the final
position numerically equals the held edge position. The write trace proves
that idle positioning executed; numeric equality alone would not prove it.

## Completion, replay and overlay matrix

Eight cases first reach ordinary root density0 mode3 elapsed4/duration5 by
actual input handling and host updates. Right pending replay is optionally
queued. Prior HOME shown and layout-visible flags are then supplied together
as0 or1 at the mature completion boundary; this does not claim to reproduce
the event that previously hid the cursor.

When requested, `S+0x3fd0` is injected at lower branch`0x2b709c`, after earlier
HOME service processing. It remains present through completion/footer/2D.
This precise injection avoids inventing an overlay's construction or lifetime.
The other overlay pointer stays null.

All eight cases enter idle and resolve slot3 before possible replay. Idle
entry writes request0 at`0x29a204`. Then:

| Overlay at completion | Pending right | Final selection/mode | Common primary positioning | Final visibility / same-pass Loop |
| --- | --- | --- | --- | --- |
| Absent | No | 3 /0 | Writes selected-grid position | Shown1; advances, for either prior visibility |
| Absent | Yes | 4 /3 | Helper runs after replay but retains root | Shown1; advances, for either prior visibility |
| Present | No | 3 /0 | Footer skipped; root retained | Preserves prior visibility; advances only if prior1 |
| Present | Yes | 3 /0 | Replay blocked, footer skipped; root retained | Preserves prior visibility; advances only if prior1 |

Without overlay, pending replay starts a second mode3 **before** the common
footer. The primary must not be positioned using the transient idle state or
the final selected slot's moving coordinates. The after-replay mode3 branch
retains its existing root. The idle-entry banner observation still belongs
to slot3, independently of the final slot4.

With overlay, original `0x2968fc` returns at its overlay guard and the lower
branch clears the serviced pending/direction markers after the call. There
is no new mode3. Request0 still exists, but the common visibility gate skips
it: it does not imply that a previously hidden cursor was shown.

Immediately before the completion pass, Loop current is29.25 and submitted
is26.25. Every visible completion submits29.25 and advances to32.25. A hidden
completion with overlay retains current29.25/submitted26.25 and never enters
the Loop updater. Primary position stays `[84,−41,0]` in all these selected
edge cases; helper and memory-write traces distinguish retain from rewrite.

## Integration boundary

Keep primary shown/request state and root position separate from selected
slot, departed effects, banner resolution and viewport culling. Apply the
ordinary common footer after mode completion and pending replay, then evaluate
the2D layout gate from actual visibility. This is why a browser helper that
returns no selected cursor slot during scrolling cannot determine native Loop
eligibility.

The checked layout has status0. Earlier Loop evidence separately proves the
inner status2 inhibition; shown state is not the only possible update gate.
This note proves eligible native layout updates, not raster visibility,
clipping, alpha, occlusion, a complete overlay/toolbar lifecycle, or universal
frequency of all layout update paths.
