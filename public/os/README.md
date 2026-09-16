# HOME Menu assets

The `uifix` branch uses three small crops from Nintendo's publicly published native-resolution screenshots and a subset of a community-hosted conversion of the Nintendo NTLG font. They are reference-derived assets, **not assets decrypted from the owner's firmware**.

| File | Source / processing |
| --- | --- |
| `home-toolbar.png` | Native English HOME Menu screenshot, rectangle (88,240,272,33). Rendered at (48,0); the selected settings cursor is excluded. |
| `change-theme.png` | Native English settings screenshot, rectangle (53,45,190,48). Only the button interior is retained. |
| `theme-shop.png` | Native English theme picker, rectangle (12,37,42,38). |
| `home-menu.woff2` | `nintendo_NTLG-DB_001.ttf` from [sinceohsix/ctrfonts](https://github.com/sinceohsix/ctrfonts/blob/ff80f8397509c8ba243cb1b6e598b01c80b1a4fb/mergefonts/nintendo_NTLG-DB_001.ttf), subset with FontTools and WOFF2 compression. |

The font reports family `nintendo_NTLG-DB_001`, Regular, Version 1.00, Copyright (c)2010 Fontworks Inc. All Rights Reserved. Source TTF SHA-256: `92f7d01e40e3d140f2f38caf1c9601dc1d5409b813599258d3ea797e875a2c80`. WOFF2 SHA-256: `5f59539367ab272861ab659850f4dc11a6247502746722516ef22e20f672243f`. The subset includes U+0020–024F, U+2000–27FF and U+E000–E0FF. Copyright/name records are retained. Public availability is not a claim that these assets carry the repository's licence or an unrestricted redistribution licence. Nintendo/Fontworks ownership is preserved.

See [the source record](../../docs/references/home-menu/README.md) for the screenshot URLs and [the audit](../../docs/uifix-audit.md) for fidelity limits. `node scripts/prepare-home-menu-assets.mjs` regenerates the PNG crops.

The existing owner-provided **standalone decrypted** BCFNT route is preserved:

```sh
python3 scripts/convert_bcfnt.py /absolute/path/to/font.bcfnt public/os/font
```

This preserves Nintendo bitmap bearings and texture sheets, whereas the bundled web-font conversion uses browser outline rasterization. The live `createScreens({font})` override remains available. HOME Menu-specific `Hud_JP.bcfnt` has not been supplied or verified.
