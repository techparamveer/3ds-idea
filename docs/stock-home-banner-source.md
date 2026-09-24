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
requires a title-keyed resource request, native application-banner type4/5
lifecycle and clip behavior, exact HOME camera/frame composition, and a matched
browser/native capture. The existing folder/default primary should not be
silently reused for an application title. Texture-only CBMDs need the native
`Banner2D_LZ.bin` path and its UV/layout rules before they can render. Neither
path is established by successful SPICA conversion alone; no stock upper HOME
banner is enabled by this converter change.
