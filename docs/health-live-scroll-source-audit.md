# Health glyph stream, article composition and held-input frames

This continues the [rich-style and cancellation audit](health-glyph-stream-source-audit.md)
from integration `2442723`. It resolves that audit's three named gates with
executable evidence: the **cached GPU glyph-stream emission**, the **effective
article clip and composition**, and the **held-input cadence and
cancellation**. **Live pagination is unchanged.** Continuous scrolling still
depends on native touch-release and scrollbar behaviour that this audit does
not establish (see the next gate below). Browser inspection and native
comparison remain coordinator work.

## Replay and pinned inputs

[replay_health_live_scroll.py](../scripts/replay_health_live_scroll.py) runs
with `unicorn==2.1.4` and checks three input hashes:

| Input | SHA-256 |
| --- | --- |
| Private Health `code.bin` (EUR `0004001000022300`, v3077) | `74c813cc1f00a67c06ad85e10723b1440949b2d448e2e1f5532d2a61fb57600c` |
| Shared font JSON (`public/os/firmware/10.7.0-32E/fonts/shared/font.json`) | `d48b661f446e3e581abeceb62b86312a6fea6c8120cd1214ba76b298f94c9f27` |
| Converted `health-and-safety/messages-and-loose.json` | `cb2cb2c1b396c80c9ccfed2352f0e8082f05a51f94e6091a4a1c83ae4ad5b5e1` |

It takes absolute `--code`, `--font`, `--pack` and `--output` paths. The
private report is `reference/health-live-scroll/replay.json` under the firmware
artifact root, SHA-256
`b296549fdbcf0152fee989e5dacdd1b7c8e78cdec9904badeed0ba78b6a6cddf`. Two runs
produce identical bytes. Scratch disassembly helpers are in the same private
directory. No firmware bytes, decoded article text or glyph records are
committed.

Intercepted leaves are limited to the following:

| Section | Supplied or intercepted |
| --- | --- |
| Glyph stream | Font virtual methods `+0x08/+0x0c/+0x10/+0x24/+0x38/+0x40/+0x48/+0x4c` (decoded metrics), a converted 1024 px atlas and fake sheet addresses, the sheet texture-parameter method `+0x64`, and renderer uniform indices `0/6/0x20/0x40` (the constants at `0x113dbc…0x113df0`, whose instruction words are pinned) |
| Native parser | Message lookup `0x133154`, length `0x12e658`, allocation `0x13864c`, copy/clear `0x133ed8`/`0x1338e0`, free `0x1385d4`, text assignment `0x13317c`, icon writer `0x156db0`, owner `0x127eb4` and pane lookup `0x1290c8` |
| Pass setup | Command submission `0x138164` (captured, not altered) |
| Frames | Allocation/free `0x139598`/`0x139588`, owner and resource lookups `0x127eb4`/`0x127ec0`, pane lookup `0x1290c8` (zeroed panes), animation lookup `0x1332e8`, the SlideBar layout wrapper/build `0x1334f8`/`0x1333bc`, attachment `0x123f8c`, the G_Touch group lookup `0x112630` (empty group), and sound `0x12f4f8` |

HID memory at `0x174a88` stands in for sampling routine `0x13a5d0`. Every other
function executes as original ARM.

## Glyph stream: the original emitter draws unclipped quads

The replay runs the complete rebuild `0x14b3ec` with these original pieces:

- the Health processor from `0x127afc`;
- the renderer constructor `0x10d4c4`;
- the cache constructor `0x152e60`;
- text loop `0x1629fc` and stream builder `0x152638`.

It runs for the whole normalised document of each article (the leading
newline, the source control runs, the two trailing newlines and △ replaced by
U+3000). It also runs for each native buffer, which original parser
`0x157724`/`0x1570f4` produces. All 15 buffer hashes match the
[rich-text audit](health-richtext-source-audit.md).

| Article | Rows | Maximum scroll | Document glyphs | Stream words | Widest line |
| --- | ---: | ---: | ---: | ---: | ---: |
| `article_1` | 95 | 1827 px | 2326 | 33100 | 283.8 px |
| `article_2` | 334 | 6846 px | 9292 | 130098 | 283.2 px |
| `article_3` | 208 | 4200 px | 5195 | 74090 | 283.8 px |

The cache is marked ready and the dirty bit cleared after each rebuild. The
decoded words write only these register groups:

- texture unit: `0x80`, `0x82`, `0x83`, `0x85`, `0x8e`;
- combiner: `0xd8`–`0xdc`, `0xf0`–`0xf4`, `0xf8`–`0xfc`;
- blend `0x100`/`0x101` and alpha test `0x104` (value 0);
- framebuffer flush `0x111`;
- draw and primitive setup: `0x227`, `0x228`, `0x22e`, `0x231`, `0x245`, `0x253`, `0x25e`, `0x2b1`;
- vertex uniforms `0x2c0`/`0x2c1`.

They never write viewport, clip-plane, scissor, stencil, depth/colour-mask or
depth/stencil buffer access. The static templates the builder copies
(`0x165c2c`, `0x165c74`, `0x165c84`, `0x165c94`, `0x165cc4`) decode to the same
kinds of register. Each glyph becomes a quad from its 44-byte cache record
(size, origin, two colours, four UVs, sheet). Batches go out through
`0x129164`, and `0x15237c` copies the cached words into the frame command list.

No line wraps: every glyph ends before the 284 px pane width. For every buffer
and its scroll range (`[4200j, min(4200j+4199, max)]`), the buffer's glyph
records in the visible band are identical to the full document's records in the
same band. The band is text rows from 30 px above to 212 px below the offset. So
a single continuous glyph layout of the normalised document reproduces what the
five-buffer switching draws. The 200-row pane switch is an implementation detail
with no pixel effect.

UV values and sheet identities come from the converted atlas, not native sheet
coordinates. The vertex shader and rasteriser are not executed. The glyph
quads use the same renderer uniform path as the other layout panes.

## Effective clip and composition: screen edges plus later artwork

**Nothing in the executable can enable scissor or stencil test.** The replay
scans every word shaped like a command header that touches these registers:

- viewport `0x41`–`0x44` and `0x68`, clip planes `0x47`/`0x48`;
- scissor `0x65`–`0x67`;
- stencil `0x105`/`0x106`, depth/colour mask `0x107`;
- depth/stencil buffer access `0x114`/`0x115`.

It asserts the complete set of sites:

| Writer | Scissor/stencil value |
| --- | --- |
| Layout pass `0x13978c` template | mode 0, stencil 0 (executed) |
| Global default state `0x13e768` | mode 0, `0x105=0xff00ff10` (test off) |
| GL flushes `0x11537c`/`0x1063f8` (scissor), `0x1326ec` (stencil) | Read GL state `+0x648/+0x5e4…+0x5f0` and `+0x64f` |
| Viewport setters `0x13a124`, GL viewport/bind | No scissor or stencil |

Two other matching words are not GPU packets: an IPC header before `svc 0x32`
at `0x13ff2c`, and an unreferenced UTF-16 run. Every immediate store to the GL
scissor/stencil fields lies in the GL-state reset `0x1192f0`. Executing that
reset on a poisoned context leaves scissor enable, rectangle and stencil enable
all zero. The executable has no `GL_SCISSOR_TEST` (`0xc11`) literal, and that
value cannot be encoded as a single ARM immediate.

The per-frame render routine `0x100bf8` does the following for the lower screen:

1. It sets the lower viewport through `0x13a104`. Executed, this gives
   half-extents 120 and 160 on the rotated 240×320 framebuffer, which is the
   whole 320×240 screen.
2. It draws the lower layout list through `0x13a820`, which calls `0x13978c`
   before the first layout.
3. `0x13978c` writes scissor mode 0, stencil off, `0x107=0x3f10` (depth test
   off), no culling and depth/stencil access `0x114=0x115=0`.

Text emission adds none of those registers. The text is therefore bounded only
by the screen edges and by artwork drawn after it.

Draw order is resolved from registration. `0x114230` (executed) inserts before
the first lower priority, so each list runs from high to low priority and keeps
registration order between equal priorities. The draw loop skips priorities at
or above `0x2706`. Health registers the following:

| Layout | Screen, priority | Registered by |
| --- | --- | --- |
| `SafeText_D_00` | lower, 500 | `0x157190`, first in article init `0x157e88` |
| `BtmBtn_White` | lower, 500 | `0x156ef8`, after init in scene create `0x157b44` |
| `Bg_D_00` | lower, 500 | background-scene builder `0x157f0c` (with upper `Bg_U_00`) |
| `SlideBar` | 9999 (never drawn as a list layout) | `0x15724c`, attached at `N_SlideBar_00` |

The lower screen therefore draws the background, then the article traversal,
then the Back bar. The article traversal runs text, warning icons,
`W_TextFrame_00`, `P_Bg_D_00`, `SBBaseWhite_00`, the attached scrollbar, then
the title. `Bg_D_00`'s earlier registration is inferred from the article being
visible over it, not replayed. This order matches the current browser
presentation. The browser renderer, however, clips each text pane to its own
rectangle (`native-renderer.ts`), which the source does not do. A live painter
must draw the article text unclipped.

## Held input: four pixels per update, one update per VBlank

The replay builds the article's controls with their real constructors, in
this order:

1. scrollbar `0x155664`;
2. G_Touch `0x154560`;
3. Up/Down keys `0x154b48` and controller `0x153c9c` (from `0x1573ec`, using
   334 rows);
4. the scene-create tail `0x127d7c(0x157df0, scene)`, which installs the event
   callback.

The manager therefore updates **Down, Up, Touch, Scrollbar**. The controller
holds 334 rows, an 8-row viewport, 0 extra rows and a pitch of 21. The keys
use delay 0, interval 1.

Each frame executes manager `0x1015d4` and scene update `0x157c88`:

| Scenario | `N_TextArea` Y per frame |
| --- | --- |
| Down press, 9 held, release, idle | 4, 8, …, 40, 40, 40 |
| Down held; stylus held outside the article on frames 2–3 | 44, 44, 44, 48, 48 (key keeps ownership while paused) |
| Up held from 48 | 44 … 0, then clamped at 0 |
| Down held from 0 | `TextArea_01` shown at 4200; clamped at 6846 = (334−8)×21 after 1713 frames |
| Up held, then teardown `0x1575a8` | Registry empty; next scan clears busy; no control events |

The press frame itself moves, so there is no frame of latency. After teardown,
the manager forwards the still-held button as generic event 5 with no control.
The callback returns at `0x157df4` for anything other than event 1, so article
close stops held scrolling.

The schedule is static and its call targets are asserted:

- main loop `0x1007f0` runs update `0x100d34`, then render `0x100bf8`;
- update samples HID (`0x13a5d0`), runs the control manager, then scenes
  (`0x102f4c`, state 6 → `0x157c88`);
- render ends in `0x100ef8 → 0x13a7dc(0x402) → 0x110b40`, which waits until
  both LCD VBlank counters advance.

Digital scrolling is therefore 4 px per VBlank: about 239 px/s at the LCD's
≈59.83 Hz, assuming each frame finishes within one VBlank. Timing under load
is not measured.

Keys also fire from the circle-pad direction bits `[0x174a88+4]` that
`0x13a5d0` derives at ±0.5. The site delivers only digital `up`/`down`, so the
digital path applies.

This corrects an earlier label. The [glyph/owner audit](health-glyph-owner-source-audit.md)
fixture treated `0x1398e8` as "system eligibility". It actually returns the HID
touch-held byte `[0x174a88+1]`. Forcing it to 1 suppressed the manager's
post-dispatch forwarding of unclaimed buttons. The registration order,
ownership scan and suppression facts in that audit still hold. Real scene
eligibility is `0x106068`, which now executes.

## Verification

- The replay passes and is byte-deterministic.
- Python compilation, relative links and `git diff --check` pass.
- No application code or public asset changed, so no application build was
  needed.

Not claimed: browser inspection, a source screen render, native frame
comparison, native sheet texture identity, vertex-shader rasterisation, or
wall-clock timing.

## Next gate before replacing pagination

On this site the lower touchscreen is a primary input, and pagination
currently offers touch navigation. A key-only live article would be a
regression. These pieces remain unproven:

1. **G_Touch drag and release.** Run the touch control through a real `B_Touch`
   hit (294×180 at `[-12,0]`), then drag, release and rest. Establish how the
   descriptor values captured at `0x1576a8`
   (`0.0, 1.0, 0.95, 4.5, 4.275`, threshold 0, Y only) drive post-release
   motion and the controller's settle states 7/8/9. Include touch starting in
   the same frame as a key, given the update order Down, Up, Touch, Scrollbar.
2. **Scrollbar.** Replay `0x155664`/`0x1290dc`/`0x1555a4` with the SlideBar
   panes `B_Groove_00`, `B_Slide_00`, `N_Slide_00` and `SBBtn*`, and the
   descriptor travel `150` and `4.0`. Get the row-to-thumb mapping and the
   thumb drag/tap path (request 2 through `0x1532b8`). The SlideBar pack is
   converted but not loaded by the renderer.
3. **Browser implementation, after 1–2.**
   - A glyph painter that consumes the message tokens: size (control 14, group
     1), colour (control 14, group 0, type 3) and reset (control 15). It uses
     the replayed pen, scale and baseline rules with the native font sheets,
     drawn unclipped before `SafeText_D_00` with its text panes hidden.
   - Warning icons translated with the scroll, and SlideBar attached at
     `N_SlideBar_00`.
   - Module `tick` events converted to VBlank-count updates for held keys.
   - Then coordinator browser inspection and native Azahar comparison of top,
     interior and end positions, held keys, drag and release, and the thumb.
