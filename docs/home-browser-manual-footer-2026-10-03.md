# Browser HOME Manual/Open - 3 October 2026

## Correction

Runtime `b3e03f32` integrates worker `69041167`, based on `27733b05`.
Browser toolbar focus4 now displays the native-source Manual/Open split.
Manual launches the Browser-owned electronic manual, not the retained Camera
grid title or Browser search. Open and physical A keep opening Browser.
Other toolbar applets retain their single Open footer. Existing contact
ownership, x100 boundary, out-and-back restoration and non-transfer apply.

Browser manual Contents and Health & Safety page0 reuse the existing manual
applet renderer. The Browser neighbor pack provides the adjacent Introduction
preview only. Other pages, Language and Enlarge are still unsupported; this is
not a claim that the entire Browser manual is implemented. The shared
`manualPageZeroAvailable` capability guards action, hit targets and painting.
Settings still supports page0; Camera remains index-only.

## Source and Delivery

Browser title `0004003000009d02`, version9232, content index1/`0000001d`,
`romfs/Manual.bcma`, SHA-256
`9f04453f23476615912972530a99abccaee22361cc69bc80052d47acf907831b`.
The manifest resolves Browser-owned
`packs/browser/contents/0001-0000001d/manual-EUR_en.json` and
`manual-EUR_en-neighbor.json`. The base has eight layouts and three textures;
the neighbor has three layouts and the HOME button texture. Converter
`application-manual-bcma` version2, script SHA-256
`4fd4c7e1e0c5623b04437cb05a7052612951082748600abe7f1a3eaf1fc75333`.
Generated pack and shared-texture provenance retain this source identity.

HOME footer graphics reuse existing `N_BtnW_L_03` / `N_BtnW_R_02`, native
Manual/Open messages and existing source-atlas text sampling. No graphics,
fonts or sounds were reconstructed. Existing HOME resource identities remain
in the [footer record](home-applet-footer-2026-10-01.md). Browser heading and
icon use the existing pinned title metadata/ExeFS icon of content `0000001f`.
Footer manifest key `home.launcher` resolves `packs/home/launcher.json`,
layout `LncBtmBtn_02`, from HOME `0004003000009802` v24576/content0
`00000082`, `romfs/launcher_LZ.bin` / `blyt/LncBtmBtn_02.bclyt`, source SHA
`826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`,
existing `ctr-native-web`1.2.0 / CTRTool1.3.0 conversion.

## Native Evidence

Private root `A` is
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001`;
run root `R` is `A/home-browser-manual-footer-20261003`.
Silent isolated clones under `native-browser-manual-20261003` and
`native-browser-manual-page0-20261003` use original hardware, English, EUR,
factor1, null audio and volume0. Both preparation bundles' eleven files and
five source anchors were independently rehashed. Executable SHA-256
`3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`;
HOME content `c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.

| Own400x480 capture under A | SHA-256 | Role |
| --- | --- | --- |
| `native-toolbar-sweep-20261003/screenshots/_03.10.26_07.38.08.778.png` | `6de76f9e43f740d4a6863297e3d4767e3924bf9e722d3d0858c5257b8a764cd1` | Immutable primary Browser footer |
| `native-browser-manual-20261003/screenshots/_03.10.26_07.57.41.099.png` | `99f022857d8be450756d76de9c7ac28cf766f3ddf21b152501f5e7a0bd836514` | Supplemental selection |
| `native-browser-manual-20261003/screenshots/_03.10.26_07.58.17.873.png` | `6fba7f711c44a62139559d8e3371fa8ca097f39fe7dc775f5f985c3252cc1697` | Manual Contents |
| `native-browser-manual-page0-20261003/screenshots/_03.10.26_08.04.06.504.png` | `a28e9f437a0c78bfef3204e343189cdec89ac00e004e8d6082ecc7dff26870b4` | Health & Safety page0 |
| `native-browser-manual-page0-20261003/screenshots/_03.10.26_08.05.42.742.png` | `932216296656086941269b83c936ee5811af68dc818baf024cb7dd308d20ad5d` | HOME return after playback |

Replay1 CTM SHA-256
`4dd843adff326166b88326c9d33843f0083e9cb5aa638053d53dcb665109e978`;
replay2 `b15a9636ed33aa6074ee3b908b80acdc9dfb8ef080553353fcef1641f24954ee`.
Input sequence selects Browser at10s, Manual45s, page0 at60s, Back90s and
Close105s. Replay1 ends after the manual index; replay2 supplies page0/return.
Intermediate Contents-return native PNG was missed, so it is not a matched
pair. The early replay2 `_08.02.56.449` is selection, not page0. Captures were
opened and inspected. Nearby AX frame observations do not establish exact
capture epochs. Both native processes exit0; PIDs1904/8975 are absent.

## Checks and Limits

Integrated suite:1964pass/0fail/23skip/1TODO, production build and typecheck
pass. Direct Python converter suite:10pass. An initial unittest module-style
invocation failed import; the direct supported invocation above passed.
Independent exact-commit review:172 scoped JS tests,10 converter tests,
typecheck and diff check pass, no remaining findings. The reviewer caught and
resolved an initially Settings-only document-paint guard before integration.
Worker sparse fixture/build limitations are superseded by coordinator checks.

Before runtime `6d6e29a2` under `R/browser-before` visibly opened Browser search
when Manual was touched. That image is wrong-route evidence, not a manual-index
pixel pair. The primary footer baseline remains the previous toolbar sweep's
`browser-after-desktop-v2/browser-selected` with1391 pixels above2/max152.

Existing manual body/header placement is a capture-fit adaptation. Remaining
HOME wallpaper/HUD epochs, cursor phase, portfolio tile population and toolbar
front-pose/browser-time animation are not corrected here. Browser app content
remains the local portfolio adaptation. Exact input cadence, motion and audio
are unverified; all sessions remain muted without changing system audio.
Whole1:1 remains unproven and no private matrix entry is promoted.

## Production Replays

Accepted `R/browser-after-desktop-v2` and `R/browser-after-mobile-v2` ran
strictly sequentially and each completed seven raw LCD pairs, errors[] and
mute with no native-screen failures. Both viewport images and manual raw
screens were opened; all28 LCD image dimensions and14 mute/failure records
were independently checked. Manual opens Browser Contents, page0 opens,
Back returns to Contents, Close restores HOME Browser focus4, and Open enters
the Browser app. Source request records confirm both Browser manual packs.
Viewport sizes are1150x690 and390x844; input cadence/native epochs are unmatched.

The initial `browser-after-desktop` is preserved but excluded: its resource
timing assertion did not retain the manual request entry. V2 uses a request
listener from before navigation; no runtime or input change. Its collector
`A/browser-manual-browser-v2.mjs` SHA-256 is
`fb282c968adee9e536197b6b25f5a3c08577635dcebe23e6b4e8a906001d4fc9`.
The comparator froze these revised roots before reading completed results or
metrics; desktop was already started at freeze, narrow was absent.

`R/browser-controls-complete` completes18 raw pairs with errors[], no
native-screen failures and mute. It verifies both cross-footer cancellations,
Manual outside/re-entry, correct Browser manual ownership, Close, direct Open,
physical A/Open/Close, and first selection of Notes/Friends/News/Miiverse.
Their full Open footers remain intact. The initial `browser-controls` is
incomplete/excluded: a fixed650ms check sampled Loading. The completed v3
collector waits for ready/non-loading app state instead; no runtime change.
`R/browser-controls-v3.mjs` SHA-256:
`aec47f12cae87388b65522bdde79f61fca50235eb996ca6e443ea0693952c088`.
Owned browser exits0, PID752 absent; production preview remains on3021.

## Native Comparison

The final combined sheet was opened. The coordinator independently rehashed
all76 manifest records and recomputed all60 native/browser and20 browser-internal
metrics. Empty masks, delta2, no registration or phase selection. Native lower
crop is40,240,320,240; HOME footer is0,212,320,28 with Manual/Open split at100.

| Pair | Desktop upper/lower pixels above2 | Narrow upper/lower pixels above2 |
| --- | --- | --- |
| Browser-selected primary | 53247 / 9672 | 53250 / 9638 |
| Browser-selected supplemental | 47078 / 9676 | 46633 / 9644 |
| Browser manual Contents | 761 / 4521 | 761 / 4521 |
| Browser manual page0 | 2665 / 2680 | 2665 / 2680 |
| HOME return supplemental | 35753 / 9422 | 35559 / 9430 |

The primary HOME footer improves1391/max152 to0/max2 on both sizes; its Manual
and Open subregions separately have0/max2. Supplemental selected/return footer
regions agree at the same tolerance. This closes the captured static footer
defect, not whole HOME. All22 semantically comparable whole-LCD measurements
remain fail. The report also includes two whole wrong-route diagnostic
measurements, explicitly non-equivalent, for24 failing whole comparisons total;
their pixel totals are not a valid before/after manual fidelity improvement.

Manual Contents retains547 header,4259 lower-body and262 lower-footer pixels
above2. Page0 retains1473 header,746 lower-body and1934 lower-footer pixels
above2. These shared renderer/text/footer residuals need a source-backed
correction, not a guessed redraw. Browser Contents-return is byte-identical to
the initially opened index, but no native Contents-return image exists.
Native motion/epochs/cadence and audio are still open.

`R/comparison/report.json` SHA-256:
`668d163985f69f48bd94f426a539424fe403ab6dfc79acdfe48192739f096321`;
`sheet.png`: `a94538f8a17a5296ca000f49a02bc1cac6c0731c69ebd63e7dfc9b47eeacc96a`;
`manifest.json`: `3200bef1c5a9ebb53e7c5f7d4aa4646e3e7cee1b86d70e8b4f6d4e2986b5058f`.
