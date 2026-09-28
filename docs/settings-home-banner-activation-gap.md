# Settings selected HOME banner activation and remaining comparison gap

## Provisional live path — 25 September 2026

The selected `system-settings` tile now requests an ordinary type-1, title-keyed
primary from `home-banner-host.ts`. It has its own service scope and resource
ticket, so a former folder acknowledgement cannot activate it. The renderer
loads the manifest-published Settings `COMMON` model and its five textures,
checks the 600-frame skeletal clip and texture bindings, and draws only after
model, authored BannerFrame and BannerCamera readiness. It samples the shared
HOME update counter, group-2 stencil pass and generic primary pose. A failed
model or texture load leaves the selected title pending with an explicit
`settingsFailure`; it does not paint the former folder or a reconstructed
Settings banner. Retargeting to another app releases the scope and invalidates
the Settings ticket. The real browser path is wired; browser pixels have not
been inspected in this lane.

**Adaptation:** the browser uses the existing six-call normal gate and a
combined resource readiness acknowledgement in place of native title worker,
state 4 presentation worker and state 5 show completion. The generic-primary
scale/yaw and 600-frame `COMMON` clock are source constrained, but first visible
pose and later pose submission cadence are not proved. This is a visible
source-derived adaptation, not a native-match claim. No matched EUR 10.7.0-32E
400×240 capture was accessible during this pass; the reference volume returned
I/O errors. Comparison and camera/timing fit remain open.

The source replay was stopped at the previously recorded original OS service
`0x139008` inside graphics binding. The service needs absent ARM thread-local
state. Repeating a larger synthetic replay would not prove bound native pixels.
The exact next source work is to bind the real `COMMON` candidate, execute the
render owner and compare a matched native/browser frame.

## Earlier gate audit

At the earlier checkpoint, the selected System Settings tile left the upper banner area empty.
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
reproduced below with supplied descriptor and scene membership. The same
controller instance now proves that two attached scene passes advance the
clock without another pose submission.
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
`7457e2566a0aef0883d8f57f08ce15c859c9ceaad65535520de72dfa0d125246`.
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
frame is 0. The callback returns and the same controller completes start.
Two subsequent attached passes through the original scene walker advance its
current frame to 2 without calling that pose callback again; detachment adds
no callback. This follows from the executed scene walker `0x10b3d0` calling
the controller's virtual `+0xc` (`0x24ff10`), which calls only frame clock
`0x1bbd94`. The descriptor, its type result and callback are stubs, so the
replay does not prove a real Settings model is ready or that the first start
submission coincides with visible scene attachment.

The separate path that submits poses after clock updates has not been linked
to a title-driven render pass. Later pose submissions, whether a retained hidden
title remains attached during a particular hide transition, and which native
outer updates are eligible remain unproven. The scene-list membership was set
directly. Keep
the Settings live banner gate and focused test TODO in place until the
title-driven attach/hide path and later pose submission cadence are executed,
then compare matched native and browser 400×240 captures. No browser or native
visual comparison was made in this bounded replay.

## Indirect visibility callback replay (25 September 2026)

The same script and hash-pinned fixture now execute the original visibility
setter `0x1f9e64`, generic primary update `0x1fa344`, and its indirect
visibility callback `0x1f7c78` on one synthetic Settings-labelled scene-1
primary. A show request stores desired byte `+0x9c = 1`; the first generic
update enters native attach helper `0x24f170` through the callback and stores
actual-visible byte `+0x3c = 1`. A later hide request leaves actual visibility
set for one update, then enters native detach helper `0x24f3b0` and clears it
on the second update. This establishes the original callback's show/hide
branch and the two observed generic-update samples for the supplied object.

The attach/detach helpers are **entered but stubbed**. Their scene graph, real
title candidate, CGFX descriptor and pose callback are not bound. The previous
start callback's frame 0 therefore cannot be called the first *visible*
submitted pose. The exact next executable source branch is native attach
`0x24f170`, including its `0x230710` scene-list insertion at `0x24f30c`, with
the title worker's real `M+0x50` candidate and scene/model pointers. Follow it
through the global `0x103808` pass: that pass calls scene walker `0x10b3d0`
and later `0x10a324`/`0x10b770` render work. The current controller replay
proves the walker advances only the frame clock; it does not find a second
pose submission there. Native visible pixels and subsequent pose cadence
remain unresolved, so the live Settings gate stays `unsupported`.

## Native scene insertion and global pass replay (25 September 2026)

The follow-up fixture supplies a Settings-labelled candidate at manager
`M+0x50`, then executes the original visibility setter, generic primary update
and indirect callback in one emulator instance. This time `0x24f170` executes
through `0x24f30c -> 0x230710`: the primary's `+4` node is inserted into the
native global scene list, whose count changes from 0 to 1, and its
actual-visible byte becomes 1. Two original global `0x103808` passes traverse
that node through `0x10b3d0` and controller update `0x24ff10`. At the scene-1
render dispatch entry `0x1038c0`, controller frames are 1 and 2. The fixture
stops before calling the supplied render owner.

The `M+0x50` candidate is **synthetic**, as are its empty model-child range,
scene service and 600-frame controller. Resource allocation, scene service and
unrelated graph operations use recorded stubs. The real title worker's archive
result and the bound Settings `COMMON` CGFX object are absent. Consequently,
the actual-visible byte and render dispatch do not establish a submitted
visible pose or native pixels. The remaining source branch begins with the
real Settings title worker `0x24c930` creating `M+0x50`, state 4 preparing
`COMMON` through `0x24def0`, and the scene-1 render owner virtual `+0x14`
at `0x1038cc`. Those must be linked with the real model and sampled pose
before a browser Settings primary can be enabled.

## Real Settings title-worker resource replay (25 September 2026)

[`replay-settings-banner-real-worker.py`](../scripts/replay-settings-banner-real-worker.py)
executes original title worker `0x24c930` with the SHA-pinned Settings
`banner.bin` and checks the published selected `COMMON` model. The committed
[fixture](evidence/settings-banner-real-resource-worker.json) has SHA-256
`f4da26396c7bfb92217ddcdbb59810928715724d1ac66a449ad93fc05082bbc8`.
The Settings CBMD has no separate EUR-English override, so the original worker
takes common offset `0x88` and calls native size/decode routines `0x2201cc`
and `0x220070` once. The resulting 137,792-byte CGFX hashes to the selected
`COMMON` model. With supplied archive and allocation results, the worker
executes both original `0x1fa0fc` generic-primary constructors, installs
vtable `0x3210f0`, stores candidates at `M+0x50/+0x54`, and writes completion
byte 1. The candidates are native constructed base objects, but their backing
allocation and graphics owner are supplied.

On the same constructed candidate, the replay passes the source state-4
`COMMON` arguments to `0x24def0`. It enters resource/model binding at
`0x24ed40` and stops immediately before graphics-object creation service
`0x2354a0`, whose owner state is unavailable. This is the exact remaining
boundary; neither the decoded CGFX nor its skeletal controller has been bound
to the candidate. The first visible Settings pose remains unproved. The live
host stays `unsupported` pending a bound native candidate, render-owner
execution and matched native/browser pixels.

## Graphics-object allocation and initialization probe (25 September 2026)

The follow-up [replay](../scripts/probe-settings-banner-graphics-bind.py) and
[fixture](evidence/settings-banner-graphics-bind-probe.json) start with the
same hash-pinned HOME code, Settings CBMD and delivered model. The title worker
still executes its original archive decode and candidate construction. This
probe supplies the graphics allocator returned by `0x235500`, including its
virtual allocation method; each allocation returns a distinct synthetic
address. Original `0x2354a0` requests 0x150 bytes aligned to four. It then
executes original graphics-object constructor `0x22efb4` and the constructed
object's virtual `+0x24` initializer. That initializer requests two further
20-byte allocations. At `0x24ed94`, candidate `+0x24` holds the constructed
object at `0x500c00` with native vtable `0x31fbd0`.

Continuing the same candidate's state-4 binding reaches OS service `0x139008`.
That service reads ARM thread-local state unavailable in this fixture, so the
replay stops before executing it. The native graphics object now exists in the
bounded replay, but its `COMMON` CGFX model and controller are not yet shown
bound. The next source step is to supply or isolate that service's real result
and follow `0x24ed40` to completion, then connect the candidate to the native
render owner and compare the first visible pose. The browser host remains
`unsupported` for Settings; this source result makes no visual acceptance
claim.
