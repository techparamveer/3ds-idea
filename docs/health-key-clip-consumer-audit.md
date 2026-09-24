# Health held keys, touch ownership and rectangle consumer

This continues the [font/clip audit](health-font-clip-source-audit.md) from
integration `3c6280a`. It resolves Health's key-repeat descriptor override and
replays an isolated graphics rectangle consumer. A prescribed key/touch sequence
also demonstrates why simple cancellation is insufficient. Live pagination is
unchanged: article-specific clip production and outer input ordering remain open.

## Health overrides the generic repeat defaults

[replay_health_key_clip.py](../scripts/replay_health_key_clip.py) executes original
scene setup `0x1573ec`, capturing the two descriptors at the key constructor
boundary. Allocation, owner lookup and final key/scroll construction are supplied;
descriptor initialization and scene overrides execute source instructions.

Generic constructor `0x154a44` supplies delay20 and interval5. But Health writes
**delay0, interval1** to descriptor+0x3c/+0x40 at `0x15745c`. Constructor copy+0x30
places these at key+0x6c/+0x70. The masks remain Up0x40 and Down0x80. Using20/5
or the application's browser repeat timings for this article would be wrong.

The original key dispatcher `0x154a6c` and its key-start, held, release and
shared-gate functions run with synthetic HID memory and a callback event sink:

- Initial key press emits event1, enters state1 and claims the shared gate.
- Each subsequent held update increments key+0x78 and passes the repeat
  predicate `(counter−delay) % interval ==0` in `0x15461c`.
- Press plus8 held updates emits9 event1 callbacks. There is no20-update wait.
- A second non-owning key is blocked by `0x128278` while the first owns the
  gate. This does not establish which control the outer traversal visits first.
- Release emits no extra scroll event, clears repeat count and ownership,
  and enters state3. The next idle update returns it to state0.
- Clearing key+0x14 (enabled) while it owns the gate makes the dispatcher
  skip it; that operation **alone does not release ownership**.

The existing scroll replay establishes event1→request4/5→digital±4px arithmetic.
These two facts support one displacement per accepted held-control update, but
this replay intercepts the callback sink. It does not establish the complete
sampling→all controls→scene update order or measured pixels per second.

## Touch acquisition and reset require outer ordering

Original `0x157684` supplies the article touch descriptor captured at `0x154560`.
It sets movement threshold0, disables X and enables Y. The new replay starts
from an explicitly **already hit-tested**, pending touch state1; it does not
synthesize or claim the initial group hit test.

In a prescribed sequence with an existing held-key owner:

1. With stylus-held input, that key's source update pauses without releasing
   ownership or emitting a new event (Health keys have no touch pane).
2. Original pending-touch update `0x154284` reaches its zero movement threshold
   even with unchanged coordinates. It claims touch ownership, enters state2
   and emits event1. This threshold branch does not use the lower-threshold
   optional shared-busy check at `0x154324`.
3. The prior key's own flag remains set, as does the shared gate. These flags
   are not a mutually exclusive browser pointer-capture token.
4. Calling original touch reset `0x154530` clears touch state/coordinates but
   leaves its own ownership flag and the shared gate set in this fixture.

This is executable evidence that reset/disable alone is not cancellation, not a
claim that the native scheduler leaves controls stuck. Trace the outer owner
reset, control-list ordering, callback eligibility, hit test and release paths
together before implementing browser cancellation or simultaneous-input priority.

## The graphics rectangle consumer is now located

The original block **`0x1153b8–0x1154b8`** reads enable byte state+0x648,
rectangle words+0x5e4/+0x5e8/+0x5ec/+0x5f0 and target extents+0x698/+0x69c.
It writes three command pairs with register headers **0x000f0065/66/67**.
The duplicated consumer at `0x106434–0x106530` has the same state fields.
This is below the generic draw path, rather than in the Health article parser.

The isolated consumer replay supplies a command buffer and320×240 target:

| Supplied fixture | Register65 mode | Packed start (x,y) | Packed end (x,y) |
| --- | ---: | --- | --- |
| enabled (0,28,320,186) | 3 | (0,28) | (319,213) |
| enabled (−10,−5,40,30) | 3 | (0,0) | (29,24) |
| disabled | 0 | (0,0) | (319,239) |

The enabled path derives endpoints using origin+size−1, applies its source
clamps against target extents, and packs Y into the upper16 bits. Disabling
selects mode0 and the whole target. Original instructions write all six words;
no command writer is stubbed. The supplied (0,28,320,186) rectangle is **only a
fixture**, not the claimed Health article crop. In particular, the title/touch
rectangle evidence from the prior audit does not establish these state values.

The unresolved clip producer must connect the Health layout draw pass to those
state fields and enable bit, with screen rotation/projection and restoring of
prior state. Locating the consumer alone does not prove an article clip box.

## Verification

The new replay passes using `unicorn==2.1.4` and absolute `--code`/`--output`
paths. The executable SHA256 is checked. Private report:
`reference/health-clip-owner-source/replay.json` under the firmware artifact root.
Python compilation, documentation links and `git diff --check` pass. No runtime
or public assets changed; no source screen render, application build, browser
inspection or native frame comparison is claimed.

Remaining live prerequisites are the **article-specific rectangle producer and
projection, full control traversal/cancellation, and rich-text draw equivalence**.
The per-update repeat cadence and rectangle consumer are now concrete; the
complete native frame sequence remains unverified.

Follow-up: the [article draw audit](health-article-draw-source-audit.md) traces
a more direct layout initializer which writes mode0/full-screen rotated bounds.
It also replays pane order, text-cache dispatch and local transforms. This
consumer's fixture must not be mistaken for that initializer's article state.
