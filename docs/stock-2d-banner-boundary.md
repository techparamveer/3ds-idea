# Stock texture-only HOME banners: bounded EUR source audit

The owner-supplied decrypted EUR 10.7.0-32E HOME `Banner2D_LZ.bin` decompresses to
CGFX SHA-256 `0f99a730271b0f16c9a409f63da3d02a88a6b44e5ad39da88119be6a06c2a666`.
The existing pinned SPICA exporter yields one `Banner2D` model: one 24 × 12
quad at local Z = 6.5, full 0–1 UV rectangle, a 16 × 16 `Dmy_00` dummy
texture, and native billboard mode 5. There are no skeletal, material or
visibility clips. This is a reusable geometry resource, not title artwork.

The hashed HOME code has a static branch at `0x1f9324`: the type switch subtracts
3, jump-table index 5 (type 8) reaches `0x1f9474`, which reads resource-table
entry `0x32ed24`. That entry names `Banner2D`. The branch and table are checked
by `scripts/firmware-cgfx/audit_stock_2d.py`. This establishes **type 8 →
Banner2D resource**, but does not yet establish when an ordinary type-1 title
with a texture-only CBMD is changed to or uses that type-8 model.

The same audit selects EUR English from each private `exefs/banner.bin` CBMD,
converts its CGFX with the pinned exporter, checks source and PNG hashes, and
records alpha occupancy in [the audit fixture](evidence/stock-2d-banner-audit.json).
All five title CGFX files have zero models:

| Title | Selected textures | Observed artwork |
| --- | --- | --- |
| Camera | `COMMON1` and `COMMON2`, each 512 × 128 | Opaque black/white title layer and separate translucent accent layer |
| Sound | `COMMON1` and `COMMON2`, each 512 × 128 | Opaque black/white title layer and separate translucent accent layer |
| Health and Safety | `COMMON1` 512 × 128, `COMMON2` 128 × 128 | Text and separate safety symbol |
| eShop | `COMMON1` 512 × 128 | Translucent title artwork |
| Nintendo Zone | `JPN_JP` 256 × 32 | Every pixel transparent in the selected EUR-English CGFX |

The second Camera, Sound and Health textures have distinct image content; simply
replacing `Dmy_00` with the first texture would drop that content. Zone's
selected image cannot yield a visible banner by itself. The current code does
not bind any of these images to the live HOME primary.

To reproduce the audit, run `scripts/firmware-cgfx/convert.py` once for the HOME
`Banner2D_LZ.bin` and once for each private title `exefs/banner.bin`, keeping
intermediates outside the repository. Then pass the six converted directories
to `audit_stock_2d.py` as `--template`, `--camera`, `--sound`, `--health`,
`--eshop`, `--zone`, plus the private HOME `--home-code` and `--output`. The
script embeds only approved source hashes, names and derived measurements; it
does not copy firmware, sound or executables into the repository.

Before a renderer can claim source fidelity, the native worker path must show
how the type-1 title resource uses `Banner2D`, which texture names/layers it
binds, their UV/layout and alpha rules, and the resulting scale, pose, camera,
stencil and timeline. Matched native and browser upper-screen captures are still
needed. The existing type-1 worker trace proves CBMD selection and title
resource staging, but not these composition facts. The transparent Zone result
also needs a native selected-title capture or a separate source path before it
can be presented as a visible stock banner.
