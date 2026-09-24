# Nintendo Zone paint dispatcher and cached GL state

24 September 2026, base `934e863`. This bounded audit extends the
[placement-input trace](native-zone-placement-inputs-audit.md). No runtime or
public resources change. There is no accepted perspective candidate or claim of
native visual equivalence.

## Paint-origin ownership closed

The actual HTML command dispatcher is `0x1bab2c`. For command type 4, it loads the
callback from command `+4`, user object from `+8`, and calls it at `0x1bab94` with
the paint context and pass mode unchanged. The NW4C component registers
`0x23c990` and itself through `0x268fe4`, as previously traced.

Document paint function `0x1c11e0` constructs the context passed to this dispatcher:
`0x1c12dc`–`0x1c12f4` converts document scroll floats `+0x254/+0x258` to signed
integers and stores them at paint-context `+0x10/+0x14`. The conversion truncates
rather than rounds. It passes mode 2 through `0x1bb948` or directly to
`0x1bab2c`. The paint origin is therefore document scroll, not another
independent viewport offset.

The document constructor calls scroll-state constructor `0x26d720` at
`0x2626bc`. Executing that original routine produces zoom 1, scroll `(0,0)`,
flags `0x10`. Bit 1 is clear, so zoom starts disabled. This establishes initial
state; it does not prove that layout or navigation has not subsequently changed
scroll/zoom when the banner appears.

`replay_zone_placement.py` now executes the original scroll constructor,
paint-context setup block `0x1c12b4..0x1c12f8`, command registration and type-4
dispatch before the original root callback. Only mutex operations are
intercepted. Its synthetic surface dimensions, element rectangle, scroll and
view-buffer state remain explicit. All prior conditional root results are
unchanged. Final DOM element position and live view-buffer viewport still need
resolution before promoting `(0,0,0)` as the actual root translation.

## Executed GL writer behavior

The source scissor emitter reads cached enable byte `+0x578` at `0x13ec1c`.
Enabled state clamps the configured left/top and inclusive right/bottom against
target dimensions `+0x5c8/+0x5cc`, then writes mode 3 and bounds to registers
`0x65/0x66/0x67` at `0x13ecac`–`0x13ed18`. Disabled state branches to
`0x13edf4`, uses mode 0 and full target extents, then reaches the same writer.

The camera/state replay now executes this exact block with three synthetic
cases, asserting complete emitted packets:

| Enable / input rectangle / target | Mode and emitted bounds |
| --- | --- |
| Disabled / (20,5,100,50) / 400×240 | 0; (0,0)–(399,239) |
| Enabled / (20,5,100,50) / 400×240 | 3; (20,5)–(119,54) |
| Enabled / (−10,−20,500,400) / 400×240 | 3; (0,0)–(399,239) |

This fixture deliberately begins after the upstream dirty-mask gates. It proves
the writer semantics, not that a particular packet is emitted for the live
banner or that the live target uses these supplied dimensions.

The original GL depth enable/disable entries, state-save routine `0x1857c8`,
and restore routine `0x186734` also execute without hooks. Starting disabled,
the saved, intermediate and restored depth-test bits all remain zero. Starting
enabled, they are 1, 0 and 1 respectively. Thus the known restoration path does
not spontaneously enable depth after the established pass-entry reset. This
closes that specific concern; it is not a complete replay of all service draws,
material packets, context rebinding or readback synchronization.

## Remaining boundary and verification

Sixteen focused Zone source tests pass: previous source/camera checks plus
constructor/dispatcher ownership, exact scissor packets and depth save/restore.
Private reports are `reference/zone-draw-dispatch/placement-replay.json` and
`camera-replay.json` beneath the firmware artifact root. They remain source
fixtures with synthetic state, not native captures.

No renderer candidate is published or presented as validated. Remaining inputs
are the actual post-layout element box, live buffer viewport, and source state
at the selected banner draw after all relevant pass setup. PICA shader output,
clipping and perspective color/UV interpolation remain unproven. A software
trapezoid or generic perspective transform would not close those gaps. Existing
source LCD renders are unchanged; no build, browser or native title launch was
needed for this audit.
