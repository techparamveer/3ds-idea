# Camera first-run guide resource completion

26 September 2026. Asset-lane delivery for guide page 1, pending runtime
integration and the coordinator's matched native/browser comparison.

The additive `stock-ui-camera-first-run.json` selection now merges `C_DlgChA`
into Camera `lyt-C-Dlg.json`, and `P_Finder_U` into the existing finder pack.
It also publishes `C_IconSD` from `lyt-C-Icon.json` for the finder SD mount.
It preserves browse layouts and adds `P/Finder_Pho_00_00` to the message bank.
The character panel is intended for the `C_DlgGuid1BtnW/-L-DlgGuid` mount.

All resources come from EUR 10.7.0-32E Camera title `0004001000022400`,
version 4097, content `0000-0000001a`. Internal read-only source:
`/Users/paramveer/.codex/3ds-artifact-overflow/assets/stock-ui/reader-extracted/camera/contents/0000-0000001a/romfs/`.
The existing `camera-native14` conversion (converter 1.4.0) was published through
`stock_ui.py --additive`. The publisher now accepts a font already bound under
the exact content namespace, allowing `HudNOTES.bcfnt` without an invented alias.

| Source | SHA-256 |
| --- | --- |
| `lyt/C.LZ` | `2826fc506af8c423d55e34514e9fdd07bfa97e432750b3102e591ca7269ca008` |
| nested `Dlg` archive | `101e184056296119b5b17021ff148211b49090a5729c727d1113fc27b3f47957` |
| `Dlg/blyt/C_DlgChA.bclyt` | `4d35e4b38ae75fa7ad8c8f2d2484bd200856b562ee4c493b13adbc765c5eb8d7` |
| `lyt/P_Finder_U.arc.LZ` | `5c75b6dc90e688adbf6b986833d6dc126b4c66b5eef2f7d6919c8e19a206cbb5` |
| `blyt/P_Finder_U.bclyt` | `49746852aac6835d7666872460b621b028098f14de694ff2af7e9f139d01d71e` |

Raw nested layout and referenced BCLIM hashes were checked against the published
resource-source records. `C_DlgChA` references `C_DlgChBase`, `C_DlgChBirdA`,
`C_DlgChBirdAlph` and `C_DlgChLay6`; their content-addressed PNG files were already
delivered. The manifest and Camera pack now identify their Camera provenance.
No source graphics were reconstructed.

Validation: 12 converter tests and 37 title-loader tests pass, including real
PNG decoding and NativeLayoutRenderer preparation of the character panel, finder and SD layouts.
Typecheck and production build pass. Full application suite: 1,310 pass,
40 fail, 23 skipped, one todo. Failures include absent model fixtures in this
lane and an existing Notes test attempting an artifact write to the full SSD
(`ENOSPC`); this is not a clean full-suite result. Logs are in internal `/tmp/3ds-camera-assets-*.log`.

This delivery does not prove browser appearance, guide input, persistence,
Parakeet animation or native pixel fidelity. Those remain coordinator/runtime
checks. Portfolio media and read-only behavior remain intentional adaptations.
