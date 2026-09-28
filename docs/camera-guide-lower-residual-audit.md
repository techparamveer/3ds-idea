# Camera Welcome lower LCD residual audit

The diagnostic pair at integration `8312cfc` has 2,690 lower pixels above
2/255 maximum RGB-channel error, with RGB MAE 2.4886545. This audit localizes
that error; it does not change the runtime or claim a matched scenario pass.
The guide body is not the dominant defect.

## Captures and measurements

The native combined 400×480 image is
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/scenario-matrix/v1/captures/camera-first-run/native/combined.png`,
SHA-256 `52a6dcf75c85d9be6cdc9e245f5767acfcf4373400a06c584f5dbd3a915bdf6b`.
The lower LCD crop is `(40,240,320,240)`. The browser 320×240 lower is
`/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260926/reference/scenario-matrix/v1/captures/camera-guide-page1-child-hud-8312cfc/browser/lower.png`,
SHA-256 `20fee3a6ec40686a1620bd42c48d339411a8c747f700565ea21bb3e0d502c6a4`.
The adjacent `diff/report.json` and `diff/lower-contact-sheet.png` were read and
visually inspected. Direct RGB pixel counting agrees with the report.

Coordinates below use half-open rectangles, with the lower LCD origin at its
upper left. Counts use the same maximum-channel threshold of 2.

| Region | Rectangle | Pixels above threshold |
| --- | --- | ---: |
| Left exposed shoot scene | x 0–6, y 56–204 | 888 |
| Right exposed shoot scene | x 314–320, y 56–204 | 888 |
| Top shoot controls | x 80–240, y 0–6 | 638 |
| Next button rectangle | x 104–232, y 184–224 | 195 |
| Remaining pixels | Outside those four regions | 81 |

The side strips account for 1,776 pixels, or 66.0% of the residual. Every pixel
in both rectangles differs. The most common native side RGB is `(115,111,103)`
(511 left pixels, 523 right); browser black occupies 650 left and 618 right.
At `(0,80)`, native is `(115,111,103)` and browser is `(0,0,0)`. At `(0,120)`,
native is `(123,117,111)` and browser is `(125,125,125)`. This is a warm,
low-contrast native backdrop versus a high-contrast grid rendered onto black.
A uniform dimming of the browser image cannot recover the nonzero native
background. Grid registration also remains unresolved.

## What the source establishes

Delivered `models/camera-shoot-background/model.json` has SHA-256
`fbcf4aefc917396979cef9a4993508e5bdb2e68dbf5f0e34e34e717cc1a7bafe`,
from source CGFX `728ff7412764350ab15fd978236e29dfc0a5bd850803b7a2f343ad82ca0294a1`.
Its `P_Shoot_D` model has three meshes: Grid1 and two target meshes. Grid1's
vertex alpha values are 0 and 0.5019608. Its LA8 grid texture and primary alpha
are multiplied by the original TEV stage, and the material blends using
SourceAlpha / OneMinusSourceAlpha. There is no opaque base plane in this model.
This does not establish what native surface lies beneath it.

The existing `camera-shoot-background.ts` clears the offscreen target to opaque
black, blends this model into that clear, then explicitly copies its readback
with alpha 255. Consequently the OS painter cannot supply a backdrop beneath
the grid afterward. This behavior is an explicit existing adaptation; it is
not a traced native compositor operation. The earlier
[underlay state audit](camera-welcome-underlay-state-audit.md) still leaves the
native viewport, final camera, draw traversal and guide attenuation unbound.

A read-only inspection of Camera `lyt/C.LZ` confirmed its table members
`ColConf`, `Dlg`, `Err`, `Home`, `Hud`, `Icon`, `IconWait`, `Opt`, `Pane`, `Sld`,
`SWKB`, `Titl_U` and `Tran_U`. `Pane` contains `Pane.bclyt` and `C_Dmy.bclim`;
its presence alone does not bind a Welcome backdrop. Neither an archive name
nor a sampled screenshot color supplies the missing runtime binding.

The top strip still depends on capture-fitted `P_Shoot_D_Disable` and
`P_CamBtn_Disable` frames plus the authored `P_CamIcon_IconPtrn` default.
The present audit does not establish the native active camera/clip selection.
Next-button residuals are localized to glyph pixels; its broad background
colors and the guide panel are already shared between captures. This does not
prove font sampling or animation phase equivalence.

## Handoff

Trace the settled Welcome lower framebuffer clear/background and modal
compositor before changing the CGFX clear or alpha transfer. Then bind source
state for the top controls and compare fresh raw captures. Do not paint sampled
warm-gray rectangles over the exposed strips: that would hide an unbound scene
and fail as the guide moves or closes.

This lane used an isolated worktree from `8312cfc`, read source data and existing
captures, and changed documentation only. It did not drive the shared browser
or Azahar. Direct pixel counts and `git diff --check` pass. Application tests,
typecheck and build were not repeated because no application files changed.

## Page-2 follow-up at `1b697af`

The native replay screenshot
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/camera-guide-replay-20260926/screenshots/Nintendo 3DS Camera_26.09.26_19.32.20.509.png`
(SHA-256 `fd4a660ef47879a3535ec6fa9f83fffe1caaa9c1973bd0580ca9cbced4dacc21`)
and the private `camera-guide-page2/browser/lower.png`
(SHA-256 `48e1e709376a3e00771c4c7077d1e3b304904a89e7c19eecb5673d14b5e7c3e8`)
have **2,726** lower pixels over 2/255, RGB MAE **2.5065408**. The existing
contact sheet was visually inspected; direct crop counting confirms 888 pixels
in each side strip and 638 in the top rectangle used above. Those browser crops
are byte-for-byte unchanged from the page-1 diagnostic. Native `(0,80)` remains
`(115,111,103)` against browser black. Thus 2,414 of 2,726 differing pixels
are the same persistent underlay areas, independently of the changed guide body.

A further static inspection rechecked the pinned executable SHA-256 and freshly
decoded the guide wrapper construction with Capstone. `0x273664` creates two
0x254-byte objects through `0x21c240`, retained at inner owner `+0x3fc` and
`+0x440`. It assigns masks 6 and 8 to their `+0x33` fields, propagates these
through `0x25941c`, and registers them under the incoming parents with insertion
argument 0. Both objects receive the word at `0x44015a` into their `+0x181`
field (`0x2736e4–0x2736e8`, `0x2737e8–0x2737f0`). That word is zero in the
on-disk image. These constructor writes do **not** establish a settled mask
colour or framebuffer clear: the field semantics, subsequent runtime writes
and draw method still need tracing.

The string `C_BkMask` occurs at `0x4239aa`, with a direct pointer at `0x4407b4`.
A resource-name pointer is insufficient to bind this resource to the two guide
objects. This follow-up did not establish that binding, the draw pass beneath
Grid1, the final viewport, or the source state selecting the top button clips.
There is therefore no sourced compositing fix to promote. The precise next
source evidence required is the settled lower render-owner draw path (including
its clear/base and any modal mask) and the active `P_Shoot_D`, `P_CamBtn` and
`P_CamIcon` clip/frame selections. Preserving CGFX alpha alone would expose the
OS painter's current black fill and cannot resolve this missing base.

This follow-up used only the isolated lower-residual worktree and read existing
captures/source. No browser, emulator or shared server was driven. No runtime
or asset files changed; `git diff --check` passes and application tests were not
rerun for this documentation-only result.
