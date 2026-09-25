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
requests show; a retarget preserves pending. Neither fixture executes the
presentation worker body, proves completion with these four real CBMDs, samples
their `COMMON` clips through native scene updates, or verifies pixels. Those
remain activation gates.
