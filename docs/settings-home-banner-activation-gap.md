# Settings selected HOME banner activation gap

The selected System Settings tile currently leaves the upper banner area empty.
`resolveContentAt` in `src/os/home-banner-host.ts` resolves the title as an app,
then `crossHomeBannerBoundary` deliberately releases the folder/default service
and reports `unsupported`. `src/os/screens.ts` paints only active folder and
default primaries. The converted Settings `COMMON` model is therefore delivered
but never requested, prepared or drawn by the live HOME host.

The available source evidence supports a narrow Settings path, but does not yet
support a visibly correct live activation. The selected CGFX is hash-pinned as
`96ea28f70671cf2b62aded3e3ef203cdf365929ae9422798255c628499c0910d`.
Its 12 meshes, five PNGs, `p_title` billboard mode 1 and looping 600-frame
`COMMON` skeletal clip are present. The generic primary's yaw/scale handler,
zero idle displacement, authored Frame sibling and Aim camera are source-backed
by `docs/native-settings-banner-pose.md`. The source worker trace establishes
the title's states 3, 4 and 5 and that matching state-5 identity can request
show. It does not establish a complete asynchronous replacement cycle or the
controller's first frame *at visible attachment* or title-driven scene cadence.
Conditional start submission and the 599-to-0 controller-clock wrap are
reproduced below with supplied descriptor and scene membership.
The browser's material output and 400×240 composition also lack a matched
native capture. Advancing the current folder/default service directly to
`active` for Settings would skip the title worker and show boundary.

`node --test tests/settings-banner-activation-gate.test.mjs` is the focused
resource and handoff check. It reads the delivered PNG headers, verifies every
Settings material sampler resolves to a published texture, checks the title
clip and billboard, and proves a former folder ticket is revoked when Settings
is selected. Its TODO marks the next executable source fixture, rather than
turning decoded clip metadata into an assumed clock.

The next prerequisite is an executed, hash-pinned original HOME controller
fixture for the Settings `COMMON` clip. Record the frame submitted on first
visible attachment, subsequent eligible scene updates, the 599→0 wrap and
hide/retarget behavior, with request/title identity and scene membership at
each sample. Then add a generation-scoped Settings resource owner and a type-1
service path that waits for title and presentation completion plus a matching
show request before it can publish a primary. Draw the model and authored Frame
through the shared camera, and compare matched native/browser 400×240 captures
at the same controller samples. This work is limited to Settings; the dormant
Camera, Sound, Health and eShop packs require their own worker and composition
evidence.

## Bounded controller-clock replay (25 September 2026)

[`replay-settings-banner-controller.py`](../scripts/replay-settings-banner-controller.py)
executes original HOME `code.bin` SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`
through the native scene-list walker `0x10b3d0`, skeletal-controller virtual
update `0x24ff10`, and frame clock `0x1bbd94`. It checks the delivered Settings
model's selected CGFX SHA-256
`96ea28f70671cf2b62aded3e3ef203cdf365929ae9422798255c628499c0910d`
and its 600-frame looping `COMMON` clip before running. The committed
[fixture](evidence/settings-banner-controller-clock.json) has SHA-256
`437d1f9651e297df719721641a20e3333a936e3022e5ea3480d6bf59c4338dfa`.
The scene membership and controller fields are supplied synthetic memory;
`0x25000c` is the source constructor for the controller vtable, but the replay
does not run that constructor or bind the CGFX.

The detached scene pass leaves current frame 0. Attached passes produce current
frames 1, 2, …, 598, 599, then 0 on pass 600. A subsequent detached pass
leaves it at 0. The fixture carries the synthetic Settings request/title label
at each sample, and a synthetic changed request after detachment. Native
request-to-scene attachment and retarget were not executed in this replay;
the separate [worker replay](native-settings-banner-pose.md#follow-up-worker-branch-replay)
covers bounded native hide decisions.

The replay also executes the original controller start method `0x24fe18` into
reset/pose method `0x24ff78`. With a supplied matching descriptor type and pose
callback, the first callback at `0x24ffec` receives **frame 0** while current
frame is 0. This is a conditional first **start** submission. The descriptor,
its type result and callback are stubs, so the replay does not prove a real
Settings model is ready or that its first submission coincides with visible
scene attachment.

Later pose submissions, whether a retained hidden title remains attached
during a particular hide transition, and which native outer updates are
eligible remain unproven. The scene-list membership was set directly. Keep
the Settings live banner gate and focused test TODO in place until the
title-driven attach/hide path and later pose submission cadence are executed,
then compare matched native and browser 400×240 captures. No browser or native
visual comparison was made in this bounded replay.
