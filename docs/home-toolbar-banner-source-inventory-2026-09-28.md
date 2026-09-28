# HOME toolbar banner source inventory — 28 September 2026

Pinned source: EUR 10.7.0-32E HOME Menu title `0004003000009802`, content
index 0 / `00000082`, extracted RomFS `3D/`. These are HOME resources, distinct
from the applets' ExeFS banners. The registry identifies the corresponding
toolbar applet title IDs.

| Toolbar selection | Applet title ID | HOME RomFS resource | Compressed SHA-256 |
| --- | --- | --- | --- |
| Friend List | `0004003000009f02` | `BannerAppletFriend_LZ.bin` | `4b99060b220166bdf158a5949ab00d509d29a34fc1701249fa1865c5d141af10` |
| Game Notes | `0004003000009c02` | `BannerAppletMemo_LZ.bin` | `ac476f4901148b4ca1dbd85db9d8c6780945539f40cddab47e11d3dfe96097e0` |
| Miiverse | `000400300000be02` | `BannerAppletMvs_LZ.bin` | `940fef25ab00fac61ffb8d1d8132da8adb7a2d26da094a7ddb1c71d4b6306180` |
| Notifications | `000400300000a002` | `BannerAppletNews_LZ.bin` | `5170a1c67eed6dd6536a85c0a83689552fe335ad9fa51d88085d0c5084c1a931` |
| Internet Browser | `0004003000009d02` | `BannerAppletWeb_LZ.bin` | `ac0c64bcb701cfec67a85c5055d0538b20ab6594f90cd024a2f09e61bb2cdd17` |

Notifications is already published and visually compared in
[its source audit](home-notifications-banner-source-2026-09-28.md). The public
manifest also names converted Settings, Health, Camera, Sound and eShop banner
models. Nintendo Zone remains blocked by the converter's animation mismatch,
as [the resource audit](remaining-home-banner-resource-audit.md) explains.

No Friend, Memo, Miiverse or Web model is published here. Their resource names
and title mapping are direct, but the preserved native scenario matrix has no
HOME selection upper LCD for those four toolbar states. The available native
screens are stock title selections, Notifications, or already launched applets;
they cannot validate these four banner renders. A production/browser visual
check against a captured native selection is the missing gate for this bounded
pass. No private binary or CGFX was added to the public tree.
