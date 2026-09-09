# Reference and fidelity record

**Update, 2026-09-09:** Read `3ds-xl-research.md` and `../GOAL.md` first. The user rejected the current appearance. The measurements below describe the existing prototype; Nintendo's published active LCD dimensions supersede its diagonal-derived screen values. Matching the outer envelope is not evidence of visual identity.

The hardware target is the **original 2012 silver/black Nintendo 3DS XL (SPR-001)**, not the 2015 New Nintendo 3DS XL. The supplied firmware archive is labelled NEW; that does not change the physical model target shown by all seven supplied photographs.

The seven user reference images were inspected in full. Additional photographs were inspected in the browser, including:

- [TechRadar front reference, 1794 × 1009](https://cdn.mos.cms.futurecdn.net/0584727e6f39c0e334d6e9537772f9fa-1794-80.jpg): screen proportions, controls, hinge segmentation and button legend placement.
- [The Register closed top reference](https://regmedia.co.uk/2012/07/30/3ds_xl_3.jpg): straight hinge edge, front corner radii, camera spacing and silver lid extent.
- [SlashGear original hands-on review](https://www.slashgear.com/nintendo-3ds-xl-review-01241159/): the same silver unit as supplied image 1; several close details were opened separately in the browser.
- [Circle pad and D-pad close-up](https://www.slashgear.com/img/gallery/nintendo-3ds-xl-review/DSC00847-580x385.jpg).
- [Charging connector and hinge close-up](https://www.slashgear.com/img/gallery/nintendo-3ds-xl-review/DSC00852-580x385.jpg).
- [Right controls and switch close-up](https://www.slashgear.com/img/gallery/nintendo-3ds-xl-review/DSC00846-580x385.jpg).
- [Camera recess and front lip close-up](https://www.slashgear.com/img/gallery/nintendo-3ds-xl-review/DSC00850-580x385.jpg).

No downloaded review photographs are shipped as website textures. Geometry, material maps and the temporary screen graphics are authored in this project.

## Verified physical constraints

`model/dimensions.json` records evaluated mesh coordinates. The actual exported GLB is also checked by `tests/model.test.mjs`, including hierarchy transforms and UVs.

- Closed mesh envelope: 156 × 93 × 22 mm.
- Upper screen: 106.287963 × 63.772778 mm; diagonal 4.88 in. Physical aspect ratio 5:3; 800 × 240 storage includes two 400 × 240 eye views.
- Lower screen: 84.9376 × 63.7032 mm; diagonal 4.18 in; 320 × 240 texture.
- Hinge axis: X at Blender (0, 42, 15.5) mm. Runtime clamped to 0–155°.
- Native Blender model uses millimetres; glTF root converts to metres.

## Remaining fidelity work

This is a photographic reconstruction, not manufacturer CAD or a scan. Exact visual identity has **not** been established. Back-panel typography and regulatory markings, detailed port interiors, and some small molded features still need closer reproduction. The early and refined renders are retained to make the iterations reviewable.

The HOME Menu is an authored plain placeholder and input implementation. It is **not firmware-rendered** and does not yet use the supplied encrypted assets. Firmware inspection and the pending asset dependency are recorded in the OS worktree.
