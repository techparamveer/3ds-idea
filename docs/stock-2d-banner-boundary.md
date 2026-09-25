# Stock HOME banner CBMD slots: common models and EUR artwork

The earlier [selected-slot audit](evidence/stock-2d-banner-audit.json) converted
only the EUR-English CBMD entry of Camera, Sound, Health and Safety, eShop and
Nintendo Zone. Those selected entries contain textures and no model. That fact
did **not** mean their full CBMDs were texture-only. Each CBMD has a separate
common CGFX at offset `0x88`. The new
[common/selected binding audit](evidence/stock-common-banner-binding.json)
converts both slots for the first four titles and verifies source hashes and
the matching material texture names. No application banner is enabled by this
audit.

## Native type-1 path

In the hashed EUR HOME `code.bin` (SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`),
the ordinary title worker `0x24c930` reads the CBMD common offset at `+8`,
decompresses that resource into manager `M+0xcc` at `0x24cb10..cb30`, and
selects the locale offset through `0x244ff8`, decompressing it into `M+0xd0`
at `0x24cb40..cb64`. State 4 prepares the primary from the common resource at
`0x249c7c..8c`, prepares the secondary from the selected resource at
`0x249c98..bc`, then calls `0x24dd2c(primary, secondary)` at `0x249cc8`.
The `0x24dd2c..24de90` loop compares a common-model material texture name
with a secondary texture name and calls `0x1fd914` to replace the matching
texture reference. The offline verifier pins the relevant ARM words. It does
not execute either worker, prove successful allocation for every title, or
measure scene timing.

This establishes a source path for **type-1 common model plus EUR texture
overrides**. It removes the need to infer a type-1-to-type-8 transition for
these four titles. The separate type-8 `Banner2D` resource at `0x1f9474`
still exists, but its dispatch alone does not bind these titles to it.

| Title | Common `COMMON` model | EUR-English replacements | Common textures retained |
| --- | --- | --- | --- |
| Camera | 4 meshes; `mLogoP` uses texture slots `COMMON1` and `COMMON2` | `COMMON1`, `COMMON2` | `COMMON3` photo material |
| Sound | 4 meshes; `mLogoS` uses texture slots `COMMON1` and `COMMON2` | `COMMON1`, `COMMON2` | `COMMON3` record and `COMMON4` notes |
| Health and Safety | 2 meshes; text and symbol materials | `COMMON1`, `COMMON2` | None |
| eShop | 4 meshes; logo, bag and shade materials | `COMMON1` logo | `COMMON2` bag and `COMMON3` shade |

The fixture records each mesh's source UV bounds, layer, priority and billboard
modes. Camera and Sound place both selected layers in distinct texture slots of
one logo material; a single-image swap would discard one layer. The native
material combiner, blend and alpha records remain in the converted common
CGFX. These values are input data for a future renderer pass, not proof of
final 400 × 240 pixels. Each common model has a looping `COMMON` skeletal
clip; Sound also has a `COMMON` material clip. Their native controller cadence,
pose, camera and stencil relationship still need a bounded executed trace and
matched native/browser capture before a strict visual claim.

Nintendo Zone has [static](evidence/zone-common-banner-static.json) and
[full segment](evidence/zone-common-banner-animation.json) common-slot fixtures.
Its common CGFX contains one `COMMON` model with four meshes, four materials
and eight textures. The common `JPN_JP` texture is used by a material; the
separate EUR-English `JPN_JP` replacement is fully transparent. The other
common textures contain visible pixels, so transparency of the selected entry
does not imply an empty common model. The pinned SPICA reader followed only
the first pointer in revision-5 curve groups. A 16-byte constant segment at
that pointer was read as a Hermite128 header, producing the earlier
`EndOfStreamException`. The hash-gated local reader follows every segment
pointer, distinguishes constant records from quantized curves, and adds each
segment's start frame to its local key frames. The source has **37 nonconstant curve
groups, 159 segments**, one 600-frame skeletal `COMMON` clip and one 600-frame
material `COMMON` clip. The existing H3D conversion flattens mixed Hermite,
step and constant segments into one key list, so native pose, interpolation,
timing and final LCD pixels remain unverified. The Zone common conversion is
blocked from delivery-manifest registration. Do not substitute the `Banner2D`
dummy texture or invent a logo.

The [playback boundary audit](native-zone-banner-playback-audit.md) compares
raw segment keys with the current browser sampler. Mixed step bridges diverge
after H3D flattening, and four scalar source curves are missing from that
conversion. These are concrete reasons to keep Zone delivery disabled.

## Reproduction

Use `scripts/firmware-cgfx/convert.py` with the pinned exporter on each
private CBMD's EUR-English selection and on its decompressed common CGFX at
offset `0x88`; keep converted source and scratch outside the repository. Run
`scripts/firmware-cgfx/audit_common_binding.py` with absolute `--home-code`,
`--common-root`, `--selected-root` and `--output` paths. The common root has
`TITLE/common.bcres` and `TITLE/converted/model.json`; the selected root has
`TITLE/model.json`. The audit refuses changed HOME code, CBMD hashes, CGFX
hashes, missing common geometry and unmatched locale textures. The output
contains only hashes, source names and derived measurements.

The [earlier Banner2D audit](evidence/stock-2d-banner-audit.json) remains a
valid record of the selected texture slots and reusable HOME type-8 geometry.
Its former interpretation as the renderer path for these four ordinary titles
is superseded by the common-slot evidence above.

To reproduce the Zone fixture, extract the CBMD common LZ11 CGFX at offset
`0x88` to a private `common.bcres`. Run `convert.py` on that file with
`--zone-static`, and normally convert the CBMD EUR-English entry to a separate
private directory. Run `audit_zone_common.py --common-source ... --common-dir
... --selected-dir ... --output ...` with absolute paths. The static flag
accepts only common CGFX SHA-256
`3e2b2896e8439ea88a767e71fedf6921936a49aae724065ac0bc3701a8a4b83e`.
The static audit checks the CBMD and selected CGFX identities, mesh/material
shape, texture names and transparent selected image. A normal conversion of
the same common source now retains `sourceCurveGroups`. Run
`audit_zone_animation.py` with the same private common source, the full
converted directory and selected directory to reproduce the segment fixture.
The full decoder is source verification; it does not license using flattened
animation as the HOME banner.
