# Dormant stock HOME common-banner delivery

Camera, Sound, Health and Safety, and eShop each have two distinct public
converted resources: their CBMD common-slot `COMMON` model with its original
textures, and the EUR-English selected-slot texture set. The
[binding audit](stock-2d-banner-boundary.md) verifies the native type-1 path
that replaces matching common material texture names with selected textures.
The browser HOME host still does not render these application selections.

`scripts/firmware-cgfx/publish_common_banners.py` copies only model JSON and
PNG files from the private, pinned converter output. It verifies each CGFX
source hash, model and texture names, texture bytes, selected locale and CBMD
identity against `docs/evidence/stock-common-banner-binding.json` before
registering eight manifest model keys: `{camera,sound,health,eshop}BannerCommon`
and `{camera,sound,health,eshop}BannerEur`. Every one of the **27** new
resources has its own delivery hash and relative `exefs/banner.bin` provenance.
Raw CBMD, CGFX, audio and executable bytes remain outside public delivery.

To reproduce, convert the four private common and selected CGFX slots with
the pinned exporter as described in the binding audit, then run the publisher
with absolute `--repository` and `--converted-root` paths. A second run is
byte-identical. The public audit passes **1,707 resources, 601 layouts and
1,871 animations**, zero integrity errors. Its existing unreferenced-file
warnings concern audio delivery and documentation outside these 27 assets.

The registration does not establish the title worker's readiness, native
material combiner output, pose, animation cadence or matched 400 × 240 pixels.
Nintendo Zone remains excluded from this pack: a bounded static common model
and selected texture mapping are verified, but its Hermite128 animation cannot
yet be decoded. The assets must stay dormant until the
scene host can load the model and selected texture set as one generation-bound
title request, apply the verified name replacement and cancel stale requests.

The Three.js model renderer now permits an explicit `allowSizeChange` for
native title texture replacement. This is required because Health and eShop
common-slot placeholders are 8 × 8 while their EUR artwork is 512 × 128
(and Health's symbol is 128 × 128). The default replacement path still rejects
size changes, protecting the folder's fixed-size text upload. Focused tests
instantiate all four real common models, bind each selected texture name and
exercise both the fixed-size and resized cases. HOME activation remains gated.

`src/scene/stock-title-banner.ts` now owns a dormant preparation path for these
four pairs. It checks the published common/selected CGFX hashes, `COMMON` model
and clip shape, complete common images and exact EUR texture names before
creating one model and applying every locale replacement with the explicit
size override. Its console-session/request ticket drops stale asynchronous
loads and disposes a retargeted model. The HOME screen does not request or draw
these models yet. Resource preparation is not a visibility gate. The
coordinator must verify native worker, animation and pixel behavior before
enabling this path in `console-scene.ts`.

The later [type-1 worker replay](native-settings-banner-pose.md) now reaches
the title worker's completion-byte store after **supplied** successful common
and selected resource operations, and independently executes the post-state-5
acknowledgement helper. Matching identity/type clears the pending request and
requests show; a retarget preserves pending. The fixtures establish these
manager/worker control branches with supplied resource results, not completion
with all four real CBMDs, `COMMON` clip timing or visible pixels.

A subsequent hash-pinned [Camera replay](evidence/camera-banner-worker-replay.json)
loads the private `e4808dcf…66280` CBMD into the original title worker and
executes HOME's real `0x2201cc` size and `0x220070` LZ11 routines twice. The
resulting common and EUR CGFX hashes exactly match the independent conversion
record, and the worker reaches its completion-byte store. Archive I/O,
allocations and candidate constructors are still supplied; successful native
model/controller construction and final presentation are unproved. The early
presentation-worker gate and state-6/2 retarget fragments are replayed, but
they do not establish a complete replacement cycle or clip cadence. Sound,
Health and eShop have no equivalent real-CBMD worker execution in this pass.
The Camera fixture SHA-256 is
`55d2dc3ad8b77b8a8744f9a7a64a53745ce7f68a58021d2d61ee42325c2a5c45`.
Reproduce it with `scripts/replay-settings-banner-workers.py --code
/absolute/private/home/exefs/code.bin --camera-banner
/absolute/private/camera/exefs/banner.bin`; the script rejects changed HOME or
Camera hashes. The private replay and test log are on the firmware SSD under
`presentation/type1-worker-completion/`.

All four published common models declare a looping `COMMON` skeletal clip of
600 source frames; Sound additionally declares a looping `COMMON` material
clip of 600 frames. Those are decoded source metadata. This replay has not
sampled their native controller's first submitted frame, wrap or relationship
to actual display presentation, so a host must not infer wall-clock timing
from the frame count.
