# Health article draw order and local transform

This continues the [key/clip consumer audit](health-key-clip-consumer-audit.md)
from integration `f7e7de1`. It locates a more direct layout rendering path and
replays screen command setup, pane traversal, text-cache dispatch and the text
pane's local transform. **Live pagination remains unchanged.** A generic
rectangle consumer is not evidence that Health installs an article scissor.

## Screen command setup is full-screen, with clipping disabled

Registered-layout manager `0x13a820` calls `0x13978c` at `0x13a8f0` before its
first eligible layout, then invokes registered object vtable+0x0c. Layout wrapper
vtable `0x16c754` maps that slot to `0x155c74`, which calls `0x14a7b8` with its
embedded layout. That function checks the root's visibility and enters pane
traversal `0x158fac`.

[replay_health_draw.py](../scripts/replay_health_draw.py) executes **all of
`0x13978c`**, intercepting only command submission `0x138164`. It captures a
40-byte command packet followed by a 72-byte packet. The first packet starts
with a consecutive-register command for `0x65`, `0x66`, `0x67`:

| Screen argument | Width | Mode | Packed start | Packed end |
| --- | ---: | ---: | --- | --- |
| 0 | 320 | 0 | `0x00000000` | `0x013f00ef` |
| 1 | 400 | 0 | `0x00000000` | `0x018f00ef` |

The header is `0x802f0065`. Mode0 disables clipping; the endpoint stores239 in
its low16 bits and width−1 in its high16 bits. This screen setup has rotated
endpoint packing relative to the unrelated generic consumer fixture from the
prior audit. It does **not** install an article rectangle such as(0,28,320,186).

This is the state initialized before eligible layouts. It does not prove that
later draw commands never change that state. In particular, the prior
`0x1153b8` consumer is still valid code, but its presence must not be used as
proof that the Health layout path uses its fields or a proposed article crop.

## Text, warning icons, frame and title have explicit draw ordering

Original `0x158fac` calls each pane's vtable+0x68 **before** walking its child
list. Each child must have visibility bit0 at pane+0xb7. The list uses link
pane+4 and parent sentinel+0x14. Hiding a parent skips all descendants. There
is no scissor push/pop in this traversal routine itself.

The replay constructs only these list links and visibility bytes from the
actual `SafeText_D_00` resource and intercepts pane draw methods. It first
checks resource-default ordering, then supplies a prescribed article fixture
with buffer2 and warning1 visible. The resulting callback order is:

1. `RootPane`, `N_TextArea`, `TextArea_02`, `SafeIcon_01`.
2. `W_TextFrame_00`, its child `P_Bg_D_00`.
3. `SBBaseWhite_00`, `N_SlideBar_00`.
4. `TitleBG_00`, `TitleBgGrd_00`, `TextBoxTitle_00`.
5. `B_Touch`.

The replay does not repeat the buffer/icon updater; their established source
behavior is described in the [rich-text](health-richtext-source-audit.md) and
[font/icon](health-font-clip-source-audit.md) audits. It proves traversal order
for the supplied visibility state, not final pixels or warning visibility at
an arbitrary article offset. A bound pane callback also need not draw pixels.

The frame/title are **later siblings**, not clipping ancestors of the article.
`TextArea_00`'s284×105 size and `B_Touch`'s294×180 bounds cannot therefore be
promoted to a crop just from hierarchy. Later frame/title drawing may cover
text, but its exact mask, alpha and registered-layout composition need a real
source render or a complete command-stream replay.

## Native text drawing uses cached geometry

The layout factory's `txt1` constructor is `0x14b630`, vtable `0x16bedc`; its
pane-draw slot+0x68 is **`0x15a234`**. The `pic1` constructor `0x14b08c` is a
different path and must not be mistaken for the text renderer.

Original text draw dispatch executes in the new replay, with downstream calls
intercepted and recorded:

| Fixture | Original dispatch result |
| --- | --- |
| text length0, missing font, or missing cached buffer | no downstream calls |
| dirty text with pending quad batch | flush quads→rebuild cache→draw text stream |
| clean but unready cache | rebuild cache→draw text stream |
| clean ready cache | draw text stream |

The relevant fields are text length+0xfa, font+0xe0, cached buffer+0x100,
cache metadata+0x104, dirty bit4 at+0xfd and ready byte metadata+8. Pending
quads are renderer+0x24. Flush is `0x12aad4`, rebuild `0x14b3ec`, stream draw
`0x149ef4`. The source dispatch orders these calls; it is not browser canvas
text rendering or a proof of glyph visual equivalence.

Static continuation of the rebuild is now located: `0x14b3ec` initializes a
writer, configures it through `0x14b230`, and uses `0x1629fc` for dirty text
before clearing the dirty bit. `0x14b230` copies pane width+0x48 to writer+0x4c,
font/size/spacing and alignment/color state. It does not copy the pane height
as a clipping bound in that routine. `0x1629fc` delegates to `0x162a58`.

`0x149ef4` uses `0x15a168` to build the text transform, configures the renderer
and sends the cached text stream through `0x15237c`. That function updates
color/alpha words and copies cached command words via `0x13b1b0`. The contents
of those generated streams and the complete rich-text style callback remain
unreplayed here. Absence of a scissor write in the outer wrappers is not proof
that generated commands or later layout composition cannot constrain pixels.

## Local text origin and Y direction are replayed

Complete original transform `0x15a168`, its matrix copy and origin helpers
`0x12796c`/`0x15a098` run without interception. The fixture supplies the source
text pane's284×105 size, origin1, text alignment0, and an identity world basis
translated to the resource's(−10,92). Parent scroll displacement is prescribed,
not reconstructed by the world-matrix builder in this replay.

For supplied parent displacement `s`, the resulting matrix maps glyph
coordinates `(x,y)` to **`(x−152, 92+s−y)`** in layout coordinates. Fixtures
`s=0`,21 and4200 yield Y origins92,113 and4292. The source routine does not
clamp the origin to the105px text pane height. These are layout coordinates;
the test does not execute the complete rotated screen projection, framebuffer
orientation, glyph baseline or pixel rasterizer.

## Verification and remaining implementation gate

The new replay passes with `unicorn==2.1.4`. It checks executable SHA256
`74c813cc1f00a67c06ad85e10723b1440949b2d448e2e1f5532d2a61fb57600c`
and converted safehealth pack SHA256
`ca9646e2d7f8630f256d87761d171ceee458efe6ee1607a52bfa98dd87671c5b`.
Both inputs stay private; the script accepts absolute `--code`, `--pack` and
`--output` paths. Private output is
`reference/health-article-draw-source/replay.json` under the firmware artifact
root. Python compilation, documentation links and `git diff --check` pass.
No application code/public assets changed, and no application build, new source
screen render, browser inspection or native frame comparison is claimed.

The next rendering task is narrower: execute `0x1629fc`/`0x162a58` with the real
style processor and font geometry, record the generated cached stream, and
combine it with frame/title materials and registered-layout order. That will
establish whether the effective article boundary comes from graphics clipping,
covering artwork, or both, including the final screen transform. Do not force a
rectangular crop from an input hitbox or text pane size.

The independent input gate also remains: run the actual outer owner/control
traversal through press, held-key+touch, release, scene close and cancellation.
The earlier replay proves that simple reset/disable leaves ownership flags, so
substituting browser pointer capture is not sufficient. Continuous live scroll
must wait for these geometry and cancellation links; native per-update motion,
font metrics, buffer selection and this draw order alone are not end-to-end
acceptance.
