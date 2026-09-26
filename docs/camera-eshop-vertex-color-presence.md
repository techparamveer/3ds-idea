# Camera and eShop banner vertex color presence

26 September 2026, Assets lane. The browser's blank eShop banner and missing
Camera photo meshes exposed a distinction lost in delivery: a missing vertex
color input was serialized as a decoder-initialized zero vector.

Direct inspection of pinned common CGFX vertex buffers finds no streamed or
fixed Color attribute on any of eShop's four shapes or Camera's three photo
shapes. Camera's logo shape has a streamed four-component unsigned-byte Color
attribute. The normal fixed attributes on some shapes are unrelated to Color.

Exporter 1.4.2 now records `hasVertexColor` per mesh by checking both actual
stream attributes and fixed attributes. Camera common delivery records
`[true, false, false, false]`; eShop records `[false, false, false, false]`.
Raw vertex arrays, geometry, materials, texture PNGs and source hashes remain
unchanged. This metadata distinguishes absent input from authored transparent
color and does not itself choose a replacement color.

The freshly built exporter re-converted both common CGFX files, and all
model/texture data compared exactly before adding the presence field. Delivery
retains its existing source names and provenance while updating converter and
resource hashes. Source identities remain Camera
`068d2d09cddc0f9c23f9b3e126f7a4942ce52957910102a831298e14fa1b361d`
and eShop `0d30668534a6bbf1c7a8403b3b83762d6ccae59996775f6822c8ddf9513c7a94`.

SPICA's default vertex shader initializes output alpha from material diffuse
alpha and applies vertex alpha conditionally. That implementation corroborates
the cause but is not the pinned Nintendo shader. Any renderer use of diffuse
color for an explicitly absent input must retain that evidence limitation until
native shader behavior or matched reference output verifies it. Do not change
all zero colors to white.

Validation: exporter build (zero errors); private fresh conversion and data
comparison; public audit passes 1,790 resources with zero integrity errors;
`git diff --check`. Coordinator/L1 own renderer changes and browser/native
comparison. Private diagnostic exports are `delegation/{camera,eshop}-vertex-*`
under the firmware artifact root; raw source remains private.
