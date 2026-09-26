# Sound, Health and eShop HOME banner asset audit

Audited from integration `a53fe45` on 26 September 2026 in the Assets lane.
Complements the [Camera audit](camera-home-banner-asset-audit.md).
No missing resources were found; this slice changes no delivery or runtime code.

## Verified source identity

Independently read each pinned private `exefs/banner.bin`, checked its CBMD
hash against the [binding evidence](evidence/stock-common-banner-binding.json),
then decompressed both the common and EUR-English slot. Both CGFX hashes match
the public JSON and `stock-title-banner.ts` constants. Every public file also
matches its individual manifest SHA-256.

| Title | Title ID | Version | Public resources checked | CBMD SHA-256 |
| --- | --- | --- | --- | --- |
| Sound | `0004001000022500` | 3088 | 8 | `fb5ee57657e781fadef6d90261f6eebae185996f82428d60ff439a9d568da3f7` |
| Health | `0004001000022300` | 3077 | 6 | `bb810ecddba00bf196d7f480d8c1c13fc569a707416fded522b78ae5679f0755` |
| eShop | `0004001000022900` | 21505 | 6 | `c810cc2e10769f26a857bc5edd35acc17cee0372c1f775be02ed407b9e4678de` |

Manifest keys are `{sound,health,eshop}BannerCommon` and
`{sound,health,eshop}BannerEur`. Resource provenance maps each delivered model
and PNG back to the respective title's `exefs/banner.bin`.

## Locale texture replacement

| Title | Material | Replacement | Source common → EUR size |
| --- | --- | --- | --- |
| Sound | `mLogoS` | `COMMON1`, `COMMON2` | Both 512 × 128 → 512 × 128 |
| Health | `lambert16` | `COMMON1` | 8 × 8 → 512 × 128 |
| Health | `mt_iconBack` | `COMMON2` | 8 × 8 → 128 × 128 |
| eShop | `M_logo_00` | `COMMON1` | 8 × 8 → 512 × 128 |

Sound retains `COMMON3` for `mRecord` and `COMMON4` for `mNote0`/`mNote1`.
eShop retains `COMMON2` for `M_bag_00` and `COMMON3` for `M_Shade_00`.
Health and eShop require the existing explicit `allowSizeChange: true`
replacement option. All selected EUR resources contain textures only.

## Animation and renderer capability

Every common model has a looping skeletal `COMMON` clip of 600 source frames.
Sound has three Transform/Bone elements, Health one, and eShop two. Only Sound
also has a looping material `COMMON` clip of 600 frames:

- `mNote0`: RGBA `MaterialConstant0`.
- `mNote1`: RGBA `MaterialConstant0` and Vector2D `MaterialTexCoord0Trans`.

The current renderer evaluates these exact element types. None of the three
models declares visibility or camera animation. All mesh submeshes use
`skinning: None`; all bones use raw native billboard mode 0 or 5. Nonzero
bindings are Sound `Logo`, `note0`, `note1`; Health `pTitle1`, `pTri`; and eShop
`Logo_00`. Mode 5 is handled by the existing native Y-axial billboard evaluator.
SPICA labels it `ScreenViewpoint`, but the runtime intentionally uses the raw
native mode and traced behavior; the enum name is not a camera recipe.
No unhandled animation primitive/target or billboard mode was found in these
selected pairs. This bounded capability check does not prove every material
combiner, light, filter or native presentation parameter renders identically.

## Acceptance limits

The 600 source frames establish clip length and looping only. Native initial
frame, show delay, wall-clock cadence, controller synchronization and phase
still require native/browser motion checkpoints. Texture provenance and
renderer capability do not establish visual fidelity. Source-backed activation
must be followed by raw LCD comparison, retarget/failure handling verification
and visual inspection. No Azahar or browser session was operated by this worker.

Validation: independent private CBMD/common/EUR hash checks; all 20 public
resource hashes; direct animation, texture and billboard metadata review;
`git diff --check`. Documentation-only work requires no application rebuild.
