# Camera HOME banner asset audit

Audited at integration `93741d7`, 26 September 2026, in the Assets lane.
This is source and delivery evidence for the HOME lane activation work;
it does not establish native display timing or matching browser pixels.

## Identity and delivery

Camera is title `0004001000022400`, version 4097, content index 0,
content ID `0000001a`. The pinned private `exefs/banner.bin` hashes to
`e4808dcf84e490c73200ee5f9cb2ba72d096c93d6ccdf08d88d733988fd66280`.
The manifest title record identifies CIA SHA-256
`cd1ce90f98970f2da13ae77b47b0925b9fe37b19c54d56c62fd8606e1b150e6d`.

Independent LZ11 decompression of the private CBMD common slot and its
EUR-English slot reproduces the source hashes in the published models and
`src/scene/stock-title-banner.ts`:

| Slot | Manifest key | Decompressed CGFX SHA-256 |
| --- | --- | --- |
| Common | `cameraBannerCommon` | `068d2d09cddc0f9c23f9b3e126f7a4942ce52957910102a831298e14fa1b361d` |
| EUR English | `cameraBannerEur` | `21f8723b955b36b9575d0a92b942889bd978f868163c9b75063528f561105ccb` |

All seven public resources under `models/camera-banner-{common,eur}/`
match their manifest SHA-256: two model JSON files, three common textures
and two EUR textures. No missing resource was found and none was republished.
The JSON records use converter `ctr-cgfx-web` 1.4.1 and SPICA revision
`bd29a7828595d7839cda2ac61c76bb63f9071250`.

## Exact source bindings

The common resource has one `COMMON` model, four meshes and identity model
transform. `mLogoP` uses `COMMON1` and `COMMON2`; the native selected-language
binding replaces both with the EUR textures. `mPhoto` keeps `COMMON3`.

| Texture | Source format | Size | EUR replacement |
| --- | --- | --- | --- |
| `COMMON1` | L4 | 512 × 128 | Yes |
| `COMMON2` | ETC1A4 | 512 × 128 | Yes |
| `COMMON3` | ETC1 | 256 × 256 | No |

The `Logo` bone is native billboard mode 5 (`ScreenViewpoint`), with bind
translation `(0, 0.6333, 0)`, identity rotation and unit scale. The renderer
already supports this native mode. Other bones have billboard mode 0.
Do not add a guessed model rotation to compensate for the source billboard.
There is no embedded camera; the HOME camera and presentation transform are
separate resources/runtime state.

The only animation is skeletal `COMMON`, looping, 600 source frames, with
three animated bone elements. Exact authored rotation endpoints are:

| Bone | Channel | Frame 0 | Frame 600 |
| --- | --- | --- | --- |
| `p0` | Y rotation | 0.436332 | -5.84685 |
| `p1` | X rotation | 0 | 6.28319 |
| `p2` | X and Y rotation | 0 | 6.28319 |

These are radians. Translation Y curves are also present and must be sampled;
rotation alone does not reproduce the source motion. Bind scale of these
three bones is `(0.78, 0.78, 0.78)`. The common resource has no material,
visibility or camera animation, and EUR contains only texture replacements.
The 600-frame metadata does not prove native frames-per-second, initial
submitted frame, show delay or phase after selection. Those require matched
Azahar/browser checkpoints.

## Validation and limits

Read and hashed all seven public files, checked their manifest records,
verified the private CBMD hash, independently decompressed both CGFX slots,
and inspected source model/clip/binding metadata. `git diff --check` passes.
This documentation-only slice needs no application rebuild. Runtime activation,
retarget cancellation, source material rendering and native LCD comparison
remain HOME/coordinator work. See [common delivery](stock-common-banner-delivery.md)
and [binding audit](stock-2d-banner-boundary.md).
