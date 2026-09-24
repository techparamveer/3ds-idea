# Decrypted stock HOME banners: source audit

The owner-provided EUR 10.7.0-32E extraction contains clear ExeFS
`banner.bin` files. These are CBMD containers, which select a common or
region/language-specific LZ11 CGFX and include separate BCWAV audio. The
language index and common fallback follow the [CBMD format](https://www.3dbrew.org/wiki/CBMD).
This audit selects EUR English and does not publish CBMD, BCWAV or executable
content. The source root below is private:

`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/assets`

| Title | Relative source `exefs/banner.bin` parent | CBMD SHA-256 | Selected CGFX SHA-256 | SPICA result |
| --- | --- | --- | --- | --- |
| System Settings `0004001000022000` | `multicontent/verified/extracted/settings/contents/0000-0000003d` | `5804ba5a7768d2ae9b7487e4d277923502646d89768668b19d666e3e4d30fbac` | `96ea28f70671cf2b62aded3e3ef203cdf365929ae9422798255c628499c0910d` | Model `COMMON`, 12 meshes, five textures, one 600-frame skeletal clip |
| Camera `0004001000022400` | `stock-ui/extracted/camera/contents/0000-0000001a` | `e4808dcf84e490c73200ee5f9cb2ba72d096c93d6ccdf08d88d733988fd66280` | `21f8723b955b36b9575d0a92b942889bd978f868163c9b75063528f561105ccb` | Two textures, no 3D model |
| Sound `0004001000022500` | `stock-ui/extracted/sound/contents/0000-0000000b` | `fb5ee57657e781fadef6d90261f6eebae185996f82428d60ff439a9d568da3f7` | `9924a70685eab60a05c669da0cab75c0ffdbd9e21852bc82497cab2bccc862e1` | Two textures, no 3D model |
| Health and Safety `0004001000022300` | `stock-ui/extracted/health-and-safety` | `bb810ecddba00bf196d7f480d8c1c13fc569a707416fded522b78ae5679f0755` | `97a1a31d289451077579c641c3826968907c2e16f6bf3855afbbf55f9653ea21` | Two textures, no 3D model |
| Nintendo eShop `0004001000022900` | `stock-ui/extracted/eshop/contents/0000-0000006b` | `c810cc2e10769f26a857bc5edd35acc17cee0372c1f775be02ed407b9e4678de` | `9c07477aca53fcafa2f76359fee39640d27228f75924739b44be0960bf88d94b` | One texture, no 3D model |
| Nintendo Zone `0004001000022b00` | `stock-ui/extracted/nintendo-zone` | `258aa3167be080eacb396539c5c3d76001d5ca12dc9d8b87955f7a977c4b2ec3` | `57b8a0b278379dad8619d6eecc71a9354881b988775404d5dfc8b61485bbb992` | One texture, no 3D model |
| Nintendo Network ID Settings `000400100002C100` | `stock-ui/extracted/nnid-settings` | `4b8171abfcf0150c1f976291f85ba0de37a5e858a05ed670bb3d784badc3c7c8` | `ca758608ca8cd3198eb51b0793703c992316e3675f4d026785acef0d3a81e0c2` | Model `COMMON`, one mesh, one texture, no clip |

`scripts/firmware-cgfx/convert.py` now selects and validates the CBMD model
before invoking the pinned SPICA exporter. For System Settings, the English
entry is zero and common CGFX starts at `0x88`; the clear model is 137,792
bytes. A local conversion produced a 279,683-byte model JSON and five PNGs
under `/tmp/settings-banner-converted/`. The converter records the CBMD hash,
selected block hash, clear CGFX hash and language. The pinned exporter DLL SHA-256
was `0a450efe7fbdba7a3bda05635c7abe9448080b719f9703e728efd46cc189a7d4`;
the execution used .NET runtime 8.0.31 installed under `/tmp`. This establishes
format decoding and source identity, not visual fidelity.

The live HOME host currently treats application selections as unsupported and
the public manifest has no stock CBMD banner models. Presenting System Settings
requires a title-keyed resource request, native ordinary-application **type 1**
activation and clip behavior, exact HOME camera/frame composition, and a matched
browser/native capture. Types 4/5 in the current service are manager states,
not the Settings target type. The existing folder/default primary should not be
silently reused for an application title. Texture-only CBMDs need the native
`Banner2D_LZ.bin` path and its UV/layout rules before they can render. Neither
path is established by successful SPICA conversion alone; no stock upper HOME
banner is enabled by this converter change.

## Next implementation contract for System Settings

The converted Settings model is authentic source data, but the present renderer
throws `Unsupported native billboard mode 1` when it updates the `p_title`
bone. That bone drives two of the twelve meshes. The pinned SPICA enum has no
name for raw mode 1; assigning it another mode or turning it off would change
the source animation. A diagnostic run changing only that field to zero **in
memory** allowed the current `createFirmwareModel` to update all 12 meshes / 1,454
vertices at frames 0, 1, 150, 300 and 599. This proves the rest of that CPU
model path accepts the converted structure; it is not a correct rendering or a
reason to publish the modified model.

The next bounded pass needs to establish these facts before live wiring:

1. Trace raw CGFX billboard mode 1 through the original HOME renderer, including
   bone/world/view matrix order and its result at several camera and clip frames.
   Implement that mode in `cgfx-billboard.ts` with numeric source fixtures. Keep
   the current mode-5 folder behavior independent.
2. Trace the ordinary available application path for Settings' title key. The
   source target mapping in [native banner targets](native-banner-targets.md)
   yields **type 1**, with the five-count normal gate; it does not establish the
   title's worker completion, state-3 activation branch, model attachment,
   visibility update or `COMMON` clip start/loop. Record those observations
   before extending `home-banner-lifecycle.ts` and `home-banner-host.ts`; today
   app selections are intentionally unsupported and app motion is `null`.
3. Register only converted model JSON and five PNGs under a title-specific model
   key in the public firmware manifest, with the CBMD/title/content hashes and
   relative `exefs/banner.bin` source path. Never publish CBMD, BCWAV, code,
   ticket or CIA. Load it with a generation/request-scoped ticket and separate
   readiness/failure so a pending Settings request cannot draw a former folder
   or acknowledge another title's resource.
4. Sample the title's proven motion and `COMMON` skeletal clip independently,
   then draw its model as the group-2 primary with the authored `BannerFrame`
   stencil sibling and `BannerCamera`. Preserve the source model bind matrix,
   texture pixels, native material state and the existing render-state cleanup.
   Do not assume folder/default scale, yaw, frame rate or material clips apply.
5. Verify Settings selection and departure in the real browser, including
   readiness, stale-request cancellation, scene resource disposal and the
   actual 400×240 upper pixels. Compare matched frames with a native EUR 10.7
   capture before claiming appearance or timing parity.

The current source-derived camera and Frame can be reused after those gaps are
closed. They do not by themselves determine the Settings title animation.
