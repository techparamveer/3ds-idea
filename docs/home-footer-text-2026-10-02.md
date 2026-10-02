# HOME Create Folder footer coverage adaptation — 2 October 2026

## Scope and result

Runtime commit `39deef8cc2f55aab75960f0523ad76be47d1e7bb`, integrated as
`f031cca9336ca0ed6f7a2e1f6b3697ca911f5491`, applies the existing
`azahar-12p4-fit` glyph-coverage mode only when the settled one-button HOME
footer action is `Create Folder`. The `Open` centre label and all two-button
footer labels retain the direct LCD sampler without coverage snapping. No
glyph position, advance, atlas interpolation, layout, material, colour or
shared renderer rule changed.

The immutable pre-change comparison under
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-footer-text-20261002/`
uses the lower-LCD ROI `(0,210,320,30)`, threshold 2, empty masks and no
image-space fit or offset. Three independent native/browser pairs have the
same 19-pixel residual: six pixels at `x174, y227..232` and thirteen at
`x188, y221..233`, with maximum channel delta 66. Its `report.json` SHA-256 is
`ac10e30b4f053c946a4508919a0da05667da6de71d4851e0a62e7f972e8643e1`;
the inspected 4x sheet SHA-256 is
`72a460995f5da25db716f5244257ce4cb92f5af76448627f8c90df6e128c0b37`.

The coordinator's production replay at the integrated commit reduces that
same fixed ROI against native own-PNG `19.03.27.675` from 19 pixels above
threshold / maximum 66 to zero pixels above threshold / maximum 2. This is a
static pixel-tier match at the declared tolerance, not byte identity or whole
HOME acceptance. The coordinator owns the final production capture, report
and sheet identities and will append them to the integrated evidence record.

## Native source mapping

No new visual asset is introduced. The rendered button and text continue to
come solely from the pinned EUR 10.7.0-32E HOME Menu title
`0004003000009802`, version 24576, content index 0 / content ID `00000082`.
The CIA SHA-256 is
`2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`;
decrypted `code.bin` is
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`;
and `launcher_LZ.bin` is
`826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`.

| Element | Manifest / pack key | Decrypted dump source | SHA-256 |
| --- | --- | --- | --- |
| One-button layout and centre panes | `manifest.home.launcher` → `layouts.LncBtmBtn_02` | `romfs/launcher_LZ.bin/blyt/LncBtmBtn_02.bclyt` | `1be988eda6f3d2374d8445d0773688fa1c6dd118590cb986d526c0dc4f326a44` |
| Settled pose | `animations.LncBtmBtn_02_SceneIn` | `romfs/launcher_LZ.bin/anim/LncBtmBtn_02_SceneIn.bclan` | `9b19c054cbb84c89a4b0c8669a2c05566f386dc7fd681410864065b8dee44a4e` |
| English label | `home.messages` → `menu_msbt_LZ/lau_1b_make_folder` | `RomFS/message/EU_English/menu_msbt_LZ.bin` | `1df2193c64e8d08b3b670923617ea1f0461537397b3da671d394304a664b4350` |
| Style 182 | `home.messages` → `styles[message/EU_English/RI_mstl_LZ.bin][182]` | `RomFS/message/EU_English/RI_mstl_LZ.bin` | `224aec428f67f35e0a23b3e7de464b2b4fe1d18dd1cf07fa9b0b53d5ad3db555` |
| Shared alpha glyph atlas | `manifest.fonts.shared` | system-font title `0004009b00014002`, `cbf_std.bcfnt.lz` | `95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581` |

Delivered launcher, message and font-manifest SHA-256 values are respectively
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`,
`3df11ee9ad6b57e4c043da636c4b606f52e41fbf0a57022cc2696f8b895817d2`
and `d48b661f446e3e581abeceb62b86312a6fea6c8120cd1214ba76b298f94c9f27`.
Conversion remains `ctr-native-web` 1.2.0 with CTRTool 1.3.0.

## Adaptation and verification boundary

`azahar-12p4-fit` rounds the existing glyph quad coverage endpoints to the
nearest 1/16 before sampling the original alpha atlas. It was selected from
the captured residual and is therefore a fitted portfolio adaptation. It is
not evidence of the native GPU's raster rule, and it must not be generalized
to other HOME text without independent comparison evidence.

Focused HOME-control, bitmap-font and native-renderer tests pass 99/99; the
coordinator's integrated full suite passes 1,827 tests with zero failures,
23 skips and one TODO, and the production build and typecheck pass. These
checks plus the fixed ROI establish this scoped static improvement only.
Whole-LCD differences, exact input and motion cadence, native cues and other
recorded HOME residuals remain open; the whole scenario remains `fail`.
