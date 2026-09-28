# Health and Safety continuous-scroll source audit

The [rich-text continuation](health-richtext-source-audit.md) adds original
parser/buffer replay with English tokens and pane-switch boundaries. Native font
measurement, clipping and combined input ownership remain unverified.

This audit does **not** replace the current eight-line pagination adaptation.
It establishes the native article controller's movement and pane writes, but
not a complete article/input implementation. Strict 1:1 remains unproven.

## Source and replay

EUR title `0004001000022300`, version3077, content `00000008`, product
`CTR-N-HACP`, decompressed executable mapped at `0x100000`:

- Code SHA256: `74c813cc1f00a67c06ad85e10723b1440949b2d448e2e1f5532d2a61fb57600c`.
- Private code: `assets/stock-ui/extracted/health-and-safety/exefs/code.bin`.
- Converted source: `assets/stock-ui/health-and-safety-converted-styles/packs/health-and-safety/`.
- Replay output: `reference/health-scroll-source/replay.json`.

These paths are relative to the private artifact root
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/`.
Run [replay_health_scroll.py](../scripts/replay_health_scroll.py) with absolute
`--code` and `--output` arguments, using Python with `unicorn==2.1.4`.
The executable stays private and its hash is checked before execution.

The replay executes the complete event callback, controller dispatcher,
movement arithmetic, scrollbar setter/getter and output-pane writer. It supplies
synthetic object memory (100 measured rows, eight visible rows, 20px line pitch,
100px scrollbar travel). Only the layout-name resolver `0x1290c8` and sound
dispatch `0x12f4f8` are intercepted. These fixtures are not source article
measurements, native screen captures or scheduler timing evidence.

## Confirmed scene and input wiring

Article constructors `0x158cd0`, `0x156b80`, `0x156a80` select `article_1..3`
and `article_title_4..6`, sharing `SafeText_D_00` and base `0x127fac`.
Initialization `0x157e88` builds article text, scrollbar, touch control and
scroll controller. Running update `0x157c88` advances the controller at
`0x153868`, then checks whether the visible long-text buffer must change.

`0x1573ec` passes measured count `scene+0xcc`, viewport8, computed line pitch
`scene+0x158`, scrollbar, touch and two key controls into `0x153c9c`.
That constructor copies the descriptor into `controller+4`, so descriptor
flags `+0x19/+0x1a` become controller `+0x1d/+0x1e`; do not confuse the offsets.
The two key masks at `0x1641fc` are `0x40/0x80` (Up/Down). Their descriptor is
created by `0x154a44` and selectively overwritten by the scene; tracing the
common control scheduler remains necessary before assigning wall-clock timing.
The later [key audit](health-key-clip-consumer-audit.md) establishes that Health
overrides the generic 20/5 repeat defaults with delay 0/interval 1 update.

The event1 callback `0x157df0` dispatches to request mapper `0x127bb4`:

| Scene control | Request | Controller state | Update path |
| --- | --- | --- | --- |
| `+0x8c`, scrollbar | 2 | 1 | `0x1532b8`: normalized thumb position |
| `+0x90`, `G_Touch` article drag | 3 | 2 | axis gate `0x15d2c0`, then `0x1286ec` |
| `+0x94`, mask0x40 | 4 | 5 | signed circleY or digital Up delta |
| `+0x98`, mask0x80 | 5 | 6 | signed circleY or digital Down delta |

Requests are rejected while either optional controller animation is in state1
or2. The Back control has its own scene-exit branch; it is not a scroll step.
The article touch control is built at `0x157684` from `G_Touch`, whose
`B_Touch` pane is 294×180 at `[-12,0]`. The scrollbar is a separate owner;
touch capture, cancellation and simultaneous-input priority are not replayed.

## Confirmed movement, in update counts

`0x153960/0x1539dc` read signed circleY through `0x154f80`. Up uses −4px
when Y≤0; otherwise −0.05×Y through80, or −0.1×Y above80. Down uses +4px
when Y≥0; otherwise the symmetric negative-Y calculation. This is a per-call
displacement, **not** a verified pixels-per-second speed.

`0x1286ec` splits movement into nearest-row index and signed residual,
clamps to `[0, max(count+extra−viewport,0)]`, and writes scrollbar position
from `(row×pitch+residual)/extent`. With the scene's flags, the interior
branch returns the controller to state0. Held-key behavior therefore requires
repeated control activation; setting state5 once is insufficient.

`0x128e0c` writes `row×pitch+residual` to `N_TextArea.translation.y` and
clears transform-dirty bits `0x30`, preserving unrelated pane flags.
`0x1532b8` reconstructs the nearest row and signed residual from the thumb
ratio. State9 at `0x153a24` drains residual toward0 by8px/update. The other
generic smooth paths are state7 (`0x1533c4`) and state8 (`0x1535c0`);
they must not be selected merely because their easing looks suitable.

The replay asserts:

- all four callback mappings above;
- digital ±4px and circle ±2px/±8.1px samples;
- −7px direct article drag through the native axis gate;
- ratio0.375 → row35/residual−10 → paneY690 with the synthetic metrics;
- eight explicit Down callbacks → +32px, without assuming their cadence;
- both document boundaries and state9 residual19 →11 →3 →0.

The `SlideBar_Select` resource is a two-frame material-selection recolor,
not the article scrolling animation. `0x15724c` creates the scrollbar from its
own layout and attaches it at `N_SlideBar_00` (`[148,0]`, size8×152).
The current renderer does not load this pack.

## Why moving the current pages would still be wrong

Native parser `0x157724` prepends/appends line breaks, preserves message
control runs, changes line height for inline size tags and accumulates a
measured document height. It replaces U+25B3 markers with U+3000 spaces and
calls `0x156db0` to position warning-icon panes using measured preceding text.
The `TextArea_00..04` source panes have 15×18 text, lineSpacing3, size284×105
and translation `[-10,92]`; these template dimensions are not the final
article extent. `0x156c80` computes the line unit passed to the controller.

For long articles, parsing builds five overlapping buffers around200-line
boundaries. Update `0x157c88` reads `N_TextArea` position, divides by the
computed line pitch and200, then changes the visible text pane. These are
rendering buffers for one continuous document, not user-facing pages.

In contrast, [stock-native-health.ts](../src/os/stock-native-health.ts) slices
plain text into eight lines, forces `TextArea_00` height168, hides the other
text panes and all five warning icons, and adds Previous/Next/Done and a page
counter. [stock-health-layout.ts](../src/os/stock-health-layout.ts) correctly
labels this as a portfolio adapter. Sliding those fragments would retain
incorrect text geometry, maximum scroll extent and warning positions.

The implementation blockers are therefore specific:

1. Replay article metric/tag handling and icon placement with actual English
   source styles and the browser font renderer; establish the final line pitch,
   total extent, clipping and buffer origin behavior for all three articles.
2. Trace shared control scheduling from physical/touch sampling to event1,
   including repeat, release, touch ownership and cancellation. Keep this
   Camera-independent and do not change HOME repeat behavior.
3. Compose the native scrollbar and measured document, then have the
   coordinator compare top/interior/end, held Up/Down, drag/release and thumb
   movement in the browser against native evidence.

## Verification status

The hash-pinned replay passes with Unicorn2.1.4. Python compilation and
`git diff --check` pass. No application code or delivery assets changed, so
no application build was required. No browser interaction, new source render,
or native screenshot comparison was performed in this isolated audit task.
