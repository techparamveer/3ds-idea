# Health rich-style binding and article-close cancellation

This continues the [glyph/owner audit](health-glyph-owner-source-audit.md) from
integration `c1624d7`. It closes that audit's two named gates: the **actual
Health-installed tag processor, its initialization and lifetime**, and the
**scene-specific input cancellation path**. Both now have executable replay
evidence. **Live pagination is unchanged.** The generated GPU command stream,
the final rotated screen projection and the effective article clip/composition
boundary remain the open gate, and browser/native comparison is coordinator-only.

## The installed rich-style processor is a distinct class, embedded per scene

The generic glyph-cache audit left open which tag processor Health installs at
writer+0x60 (copied from pane+0xf4 by `0x14b230`). It is not the default
tab/newline processor. The Health article scene class (vtable `0x16cb34`,
constructors `0x158cd0`/`0x156b80`/`0x156a80` selecting `article_1..3` and
`article_title_4..6`, all sharing `SafeText_D_00.bclyt`) **embeds its own rich
processor**. Base article constructor `0x127fac` places it at object+0x70;
`0x127afc` builds it by deriving from the generic default constructor `0x1631a0`
and then installing the distinct Health vtable `0x16c734`:

| Slot | Base `0x16c520` | Health `0x16c734` |
| --- | --- | --- |
| +0x08 dispatch | `0x162f4c` (tab/newline) | `0x155bc4` |
| +0x0c dispatch | `0x162ff4` | `0x155c1c` |
| +0x10 handler | 0 | `0x155abc` |
| +0x14 handler | 0 | `0x155824` |

[replay_health_glyph_owner.py](../scripts/replay_health_glyph_owner.py) runs the
original constructor `0x127afc` and confirms the installed vtable and these four
overridden slots. Three source sites construct this class: base article
`0x127fbc` (embedded at object+0x70), a scene subobject at `0x158954` (+0x7c),
and the global default-configuration instance `0x1c2014` at `0x15e534`.

## Its installation into text panes and lifetime are now traced

Layout build `0x1333bc` installs a processor into every text pane through
`0x12fce8`, which delegates to the recursive walker `0x12fcf4`. For each pane it
calls the pane's type query (vtable+8); when the type equals the txt1 descriptor
`0x181de0` it writes the processor to **pane+0xf4** and sets rebuild dirty bit 2
at pane+0xfd. The replay constructs a minimal pane tree with one real txt1 pane
(vtable `0x16bedc`, whose query `0x15a228` returns `0x181de0`) and one non-txt
pane, runs the original `0x12fce8`, and asserts only the txt1 pane receives the
processor and dirty bit; the non-txt pane is untouched.

Two install routes exist. The generic auto-install inside the layout-wrapper
constructor `0x1334f8` is gated on enable byte `0x174908` (field +0x38 of the
render manager global `0x1748d0`), whose initial value in the private
`code.bin` is 0. The article does not rely on it: the scene explicitly calls
`0x12fce8` with its embedded processor at `0x1571f4` and `0x158464` right after
building the layout. Text rebuild `0x14b230` then copies pane+0xf4 to writer+0x60,
so the glyph loop `0x1629fc`/`0x162a58` dispatches control tags to this
processor. The scene destructor `0x127f08` frees the embedded processor with the
object. This is the full init → install → use → teardown lifetime the prior
audit required.

## The size control run scales the glyph transform

The glyph loop reads a unit through `0x143ad8`; a decoded value below `0x20`
enters the processor. The loop calls dispatch slot +0x0c (`0x155c1c`) for the
advance/measure query and slot +0x08 (`0x155bc4`) for the emit query. For
control 14 `0x155c1c` routes to `0x155824`, which scales the current glyph
transform at writer+0x24/+0x28 by `tokenValue × float32(0.01)`, with an axis
selector (0 both, 1 X, 2 Y), and saves the prior scale to `0x174db8` for the
control-15 reset. The replay executes `0x155c1c → 0x155824` on real size-run
tokens and asserts:

| Size run | Prior scale (X, Y) | Percent | Result (X, Y) |
| --- | --- | ---: | --- |
| both axes | (1.0, 1.0) | 150 | (1.5, 1.5) |
| X only | (3.0, 5.0) | 200 | (6.0, 5.0) |
| Y only | (3.0, 5.0) | 50 | (3.0, 2.5) |

The draw-path flag advances the token cursor by 6 bytes. This is the source
rich-style control affecting **glyph composition**, not merely the parser's
document-height accumulation established earlier. The default processor's
matching slot `0x162ff4` performs no such scaling for control 14, consistent
with the earlier fixture where the default handler emitted a control payload as
a visible glyph. Using the default handler on the tagged article would be wrong.

## Article close destroys and unregisters its controls

The article scene destructor `0x158dac` delegates to base `0x127f08`, which
destroys eight layout objects (+0xc), twelve controls (+0x2c via vtable+4) and
two more (+0x68). The scene-close routine `0x157d48` (vtable+0x2c) first runs
teardown phases +0x60 (`0x156d60`, processor and layout objects), +0x64
(`0x1575a8`, scrollbar and the two key controls), and +0x68 (`0x157644`). Each
control's destructor (key `0x154c20 → 0x1284a0`, base chain `0x128084`/`0x1284d4`)
calls `0x128070`, which unlinks the control from the shared registry `0x1bd0cc`,
releasing its ownership. The replay registers two controls through original
`0x155034`, marks one as owning, then invokes each control's real destructor and
asserts the registry returns to empty with sentinel links restored.

This is the **scene-specific cancellation** the glyph/owner audit asked for. It
is stronger than the earlier reset/disable counterexample, which left ownership
flags set: destroying a control removes it from the registry, so the next
manager ownership scan cannot restore its busy byte. It is scene-scoped, not the
global teardown `0x10154c`. The Back control uses the event callback's own
scene-exit branch at `0x157df0` (request 3 stored at scene+0x64, sets
scene+0x100 and a global flag), distinct from scroll requests 2/4/5 routed to
`0x127bb4`.

## Verification and remaining gate

[replay_health_glyph_owner.py](../scripts/replay_health_glyph_owner.py) passes
with `unicorn==2.1.4`, checking executable SHA256
`74c813cc1f00a67c06ad85e10723b1440949b2d448e2e1f5532d2a61fb57600c`. Its only
non-original behaviour is a single hooked type query for the synthetic non-txt
pane and a font-free scale object; every processor construction, installer walk,
control dispatch, registration and destructor body executes as original ARM.
The input is an absolute `--code` path; private output is
`reference/health-glyph-stream-source/owner-replay.json` under the firmware
artifact root. Python compilation, relative links and `git diff --check` pass.
No application code, public assets, source screen render, application build,
browser inspection or native frame comparison is claimed.

Continuous live scroll is therefore **not** implemented and remains gated on
work that cannot be settled in this source-audit worktree:

1. Replay the generated cached command stream (`0x1629fc` cache →
   `0x15237c` stream → `0x152638` upload) with the installed font geometry and
   record the actual GPU words, then the complete rotated screen projection and
   rasterized pixels.
2. Establish the **effective article boundary**. Screen setup `0x13978c` is
   full-screen, mode 0 (clipping disabled); `W_TextFrame_00`, the title and the
   scrollbar are later siblings, not clipping ancestors. Whether the visible
   extent comes from graphics clipping, covering artwork, or both needs a real
   source render or a complete command-stream replay. Do not force a rectangle
   from the touch hitbox or the text-pane template.
3. Execute the full per-frame input schedule — physical/touch sampling → every
   registered control body → scene update — through press, held key + touch
   overlap, release and article close in one sequence, and measure wall-clock
   pixels per second. This replay proves cancellation ownership release, not the
   complete cadence.

Layers 2 and 3 require the coordinator's browser and Azahar reference session.
Implementing a live continuous painter now would require guessing the clip and
composition, which the evidence does not support.

Follow-up: the [live-scroll audit](health-live-scroll-source-audit.md) resolves
all three items with executable evidence:

1. The original emitter draws every article buffer as unclipped glyph quads.
   There is no wrap, and buffer switching has no pixel effect.
2. No code can enable scissor or stencil test. The lower pass is full-screen
   with depth/stencil access off, so text is bounded by the screen edges and by
   later artwork, in the order background, article, Back bar.
3. Real controls, the manager and scene updates move the text 4 px per VBlank
   while a key is held, with no latency, and article close cancels.

Pagination remains, gated on G_Touch release inertia and scrollbar geometry.
