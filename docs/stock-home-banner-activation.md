# Camera, Sound, Health and eShop HOME banners

The Camera path introduced in `a53fe45` now also supports selected Sound,
Health and Safety, and eShop tiles. `home-title-banner.ts` maps application IDs
to the source resource kind (`health-safety` → `health`). Settings retains its
existing renderer. All four source pairs use their authored common model and
name-bound EUR texture replacement, shared HOME BannerCamera, authored
BannerFrame stencil and native-resolution render target.

The host now permits ordinary type-1 requests for these title IDs. Each waits
for its own generation/request/kind resource ticket. `firmware-banner.ts`
retains at most two resource owners: the outgoing primary while it hides and
the incoming request while it prepares. Once the host drops a ticket, the scene
group is removed and its owner disposed. Late completion checks slot identity
before attachment, including replacement with an equal ticket. Draws require
the exact retained ticket. Only one primary group is visible for a render.

All four `COMMON` skeletal clips are source looping 600-frame clips. Sound also
has a looping 600-frame `COMMON` material clip; it samples the lifecycle's
material controller independently from the skeletal controller. The other
three do not receive an invented material clip. Both clocks freeze when the
HOME scene pass is inhibited. Painting never advances either clock. Reduced
motion freezes pose/yaw as an accessibility adaptation.

## Source and acceptance boundary

The published manifest keys are `cameraBannerCommon`/`cameraBannerEur`,
`soundBannerCommon`/`soundBannerEur`, `healthBannerCommon`/`healthBannerEur`,
and `eshopBannerCommon`/`eshopBannerEur`. Source identity, content index, CBMD
hashes and converter versions remain in those resource records. Titles are
Camera `0004001000022400`, Sound `0004001000022500`, Health
`0004001000022300` and eShop `0004001000022900`, all `exefs/banner.bin`.
The resource host validates both selected CGFX hashes before constructing a
model. No source files, transforms, geometry or material values were changed.

This extends the **provisional browser activation adaptation** documented in
[Camera activation](camera-home-banner-activation.md). Combined validated
resource readiness and the existing normal manager gate replace native worker
completion; they do not establish native show completion or first-visible pose.
Source clips and resource delivery do not establish native timing or pixels.
No native or browser UI was operated by this worker. Native access remains
blocked; coordinator must inspect each title and rapid stock↔stock,
stock↔Settings, stock↔folder/default/toolbar, launch/return and sleep behavior,
then capture identical native/browser inputs and phase checkpoints. No matrix
entry is promoted to pass by this implementation.

Focused tests cover source-backed draws for all four titles, retained outgoing
resources, retirement, stale draw rejection, Sound material uniform changes,
manager readiness and inhibited skeletal/material clocks. Worker logs are
private `delegation/astra-stock-home-banners-*.log`.

Checks: focused **83 pass / 0 fail / 1 existing TODO**; typecheck, production
build and shader validation pass. Full slim-lane run: **1,307 pass / 39 fail /
23 skip / 1 TODO**. Failures are the absent hardware model delivery files in
this lane; integration must rerun the complete suite with those files present.
