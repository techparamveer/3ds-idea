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
controller's first submitted frame, 600-to-0 wrap and visible scene cadence.
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
