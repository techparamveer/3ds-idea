# Health glyph cache and outer control manager

This follows the [article draw audit](health-article-draw-source-audit.md) from
integration `ca67998`. Original text emission now runs into native glyph-cache
records, and the outer control manager's registration, ownership scan, update
order and global teardown are replayed. **The live article still uses bounded
pagination.** Rich-style installation, final GPU composition and scene-specific
cancellation are not established by these fixtures.

## Original text loop writes geometry, not merely measured widths

[replay_health_glyph_cache.py](../scripts/replay_health_glyph_cache.py) executes
`0x1629fc`→`0x162a58`, original UTF-16 iteration, default tag processing,
`0x1524b0` and the cache-writing branch of `0x15207c`. Font virtual methods
supply decoded source font metrics. This extends the earlier dispatch replay:
the text loop and glyph record writer are no longer intercepted.

The fixture uses the source15×18 font size,3px line spacing and284px width.
Native font baseline/ascent25 and vertical scale0.6 produce the tested origins:

| Input fixture | Original cache output |
| --- | --- |
| `A` newline `B` | A at(0,0), B at(1.2,21); B includes its source left bearing2 |
| 30 copies of A | first27 on Y0, final3 on Y21, wrapping before glyph28 |
| `ABC`, cache capacity1 | all3 glyphs processed, only first glyph cached |

The A advance is17×0.6≈10.20000076. Width overflow is tested before emission
at `0x162e1c–0x162e40`; it substitutes a newline and retries the unconsumed
character. It is not a character-count or literal-line-only layout. Floating
point comparisons/assertions retain the original float32 behavior.

With writer+0x44 nonzero, `0x15207c` writes **44-byte records** starting at
cache+0x20, increments the16-bit count at+4 if below capacity at+0, and stores:

- scaled glyph width and negative scaled height;
- origin including left bearing and baseline adjustment;
- top/bottom colors, four UV values and a sheet-related pointer.

The glyph height is−18 in this record convention. The prior local-transform
replay establishes the subsequent Y-axis inversion; this audit does not claim
that the cached sign is a browser coordinate convention.

UVs use a clearly supplied1024px **converted/repacked atlas fixture**. This
replay proves metrics, wrap and record emission, not original native sheet
coordinates, texture loading, command upload or rasterized pixels. It executes
the cache branch, not the immediate-mode GPU submission branch.

## The default tag processor is demonstrably insufficient

Original constructor `0x1631a0` installs the generic tab/newline processor.
Its newline path at `0x162f4c` resets X, adds the scaled font line feed plus
spacing, and returns dispatch result3. The fixtures execute that processor.

A separate synthetic control payload demonstrates its limitation: the default
processor does not consume Health-style control14 payloads; a printable payload
word `(` reaches the glyph writer. This is intentionally **not** a replay of
an actual Health message or the application's installed rich-style callback.
Using this default implementation on the real tagged article would be wrong.

The source writer has its tag processor at+0x60. Text-pane configuration
`0x14b230` replaces it from pane+0xf4 when nonzero. What remains to trace is the
**Health-installed value and its initialization/lifetime**, or an equivalent
source path that preprocesses the tags before this writer. Then replay actual
English article buffers through that processor, cache command construction and
upload `0x152638` before claiming rich-text equivalence. The cached geometry
records established here are not yet the final cached GPU command stream.

## Outer ownership is reconstructed before control dispatch

The same executable replay runs original control registration `0x155034` and
linked-list insertion `0x133090`. Registration inserts before the first node.
A prescribed registration order labelled Up, Down, Touch therefore updates in
**Touch, Down, Up** order under original manager `0x1015d4`. These are synthetic
control labels; this is not yet the actual creation order of every Health
scrollbar, key and touch control.

At the start of each manager call, `0x1015d4` clears global busy byte0x174848,
then scans every registered control's ownership byte+0xc. Any retained ownership
sets global busy again. It performs this scan even when later dispatch is
suppressed by the argument mask0x107 or global field+0x14. With both clear and
system eligibility true, it calls each control's vtable+8 in list order.

The replay checks suppression and the change from an owning control to no
owners. It intercepts the control update bodies and supplies system eligibility;
it does not repeat the native held-key/touch hit-test state machines inside
this outer loop. It does establish why a reset that leaves own+0xc cannot be
fixed by clearing only the global busy byte: the next scan restores it.

Static caller `0x100d34` invokes this manager at `0x100d5c`, between calls to
`0x1028a8` and `0x102f4c`. Connecting those phases to actual Health scene
updates, touch hit tests and callback changes remains necessary before choosing
a browser event/frame ordering.

## Global teardown is stronger than a per-control reset

Original `0x10154c` disables registration, unlinks controls with `0x1398f8`,
invokes their vtable+4 destructors, clears the global callback/context fields
+8/+0x10/+0x14 and busy byte, then enables registration again. The replay
intercepts destructor bodies but executes unlinking and all global writes.
The registry ends empty with its sentinel links restored.

For the3-node fixture its destructor order is Touch, Up, Down. This is the
observed deletion traversal, not the same as update order and not a proposed
browser teardown order. Destructor effects on each control's internal state are
not simulated.

The only located direct call to this global teardown is at `0x101ee8` in the
larger cleanup routine `0x101ed0`. It must **not** be relabelled as Health's
article-close cancellation path without tracing its caller/lifecycle. Ordinary
scene switches may use a narrower operation. The earlier ownership-reset
counterexample therefore remains relevant to live cancellation.

## Verification and next gate

The hash-pinned executable replay passes with Unicorn2.1.4, as do Python
compilation, local documentation links and `git diff --check`. Inputs are
absolute `--code` and `--font` paths; output is an absolute `--output` path.
Private result: `reference/health-glyph-stream-source/replay.json` under the
firmware artifact root. No application/public asset changes, new source screen
render, build, browser operation or native raster comparison are claimed.

The remaining gate has three concrete parts:

1. Bind the actual Health rich-style processor, replay real article buffers,
   then inspect generated GPU streams and final rotated screen projection.
2. Combine those streams with actual frame/title materials and registered
   layout order. The earlier sibling draw order is proven; effective clipping
   versus covering artwork is not yet established.
3. Populate the real Health control list in its source construction order and
   execute outer manager→native control bodies→scene update through touch/key
   overlap, release and article close. Establish its actual cancellation path.

Neither the generic default tag processor nor global teardown is a substitute
for these application-specific paths. Continuous scrolling remains gated on
those links rather than inferred from otherwise-correct arithmetic.
