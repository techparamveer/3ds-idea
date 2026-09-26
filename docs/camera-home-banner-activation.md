# Camera selected HOME banner — provisional live path

Selecting Camera now requests an ordinary type-1 Camera primary in the existing
HOME host. It uses a new request epoch and requires its own prepared resource
acknowledgement. A previous folder/default/Settings ticket cannot activate it.
The shared manager and scene passes own visibility, hide and the 600-frame
skeletal clock. Draw calls only sample that clock.

`firmware-banner.ts` owns `createStockTitleBannerResourceHost`. Camera loads on
selection, validates the published common/EUR model identities and binds the
EUR `COMMON1`/`COMMON2` textures by name. It retains common `COMMON3`, all four
authored meshes and the looping `COMMON` skeletal clip. The existing native
BannerCamera and BannerFrame stencil compose the model in the 400×240 target.
There is no material animation for this title. No native artwork is reconstructed.

The title resource owner uses the host generation and request epoch. It retains
an outgoing Camera through the host's hide, then removes its scene group and
disposes it. Unsupported retargets release it immediately. Late loads cannot
attach to a new ticket or after disposal. Camera draw failures and missing
resources remain explicit; they do not select another primary as fallback.

## Fidelity boundary

This is a **provisional source-derived browser adaptation**. As with the current
Settings path, the browser manager uses combined validated resource readiness
and its normal gate in place of native title-worker and presentation-worker
completion. It does not claim that a fetch is native show completion. The
native first visible Camera pose, attachment cadence and subsequent pose
submission timing remain unverified. Generic yaw/scale and the source clip are
sampled from the existing manager clock; their match to native Camera remains
open. Reduced motion freezes source yaw/pose as an accessibility adaptation.

No Azahar or production browser was operated by this worker. Coordinator must
inspect Camera selection, rapid retarget, folder/default → Camera → Settings,
Camera → unsupported title and Camera launch/return in the integrated production
browser. Then capture identical native/browser inputs at raw 400×240/320×240,
including phase checkpoints. Current native access is blocked; this change
cannot change any matrix status to pass.

## Assets and checks

- Camera common: `models.cameraBannerCommon`, source CGFX SHA-256
  `068d2d09cddc0f9c23f9b3e126f7a4942ce52957910102a831298e14fa1b361d`.
- Camera EUR: `models.cameraBannerEur`, source CGFX SHA-256
  `21f8723b955b36b9575d0a92b942889bd978f868163c9b75063528f561105ccb`.
- Both are delivered from Camera title `0004001000022400` `exefs/banner.bin`;
  full converter, content and CBMD provenance remains in the public manifest.
- Shared camera/frame: HOME `0004003000009802`, `3D/BannerCamera_LZ.bin`
  and `3D/BannerFrame_LZ.bin`.
- Focused tests exercise real delivered model preparation, source phase changes,
  a sole group-2 primary, scene removal, stale-ticket draw rejection, host
  readiness gating and resource-owner retarget/disposal. They establish bounded
  implementation contracts, not rendered native fidelity.

Worker checks: focused banner suite **81 pass / 0 fail / 1 existing TODO**;
typecheck, production build and shader validation pass. Full slim-lane run
reports **1,305 pass / 39 fail / 23 skip / 1 TODO**; the failures are missing
hardware GLBs in this lane, including the model test file which cannot load.
Coordinator must rerun the complete suite in integration with model delivery
files. Logs live under private `delegation/astra-camera-home-banner-*.log`.
