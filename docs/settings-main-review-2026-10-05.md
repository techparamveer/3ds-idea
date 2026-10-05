# Independent review — Settings main 0/20 — 5 October 2026

Grok 4.7 on `/Users/paramveer/.codex/worktrees/settings-main-review-20261005`
(`codex/settings-main-review-20261005`), base `cb324a43`. Docs only. No
Azahar, production `:3000`, preview 3021, or CDP. Painter unchanged.

**Verdict: APPROVE-WITH-NITS** of integrated `74ac999e` and
[the 4 October residual](settings-main-residual-2026-10-04.md).

Frozen `settings-app-open-live-v85` stays **0 upper / 20 lower**, maximum
channel error 51, empty mask, threshold 2/255. The 20 coordinates and the
dump owners below hold. One cluster letter in that note is wrong. This is
not 1:1. Input, motion, and audio were not compared.

## Assigned leftover

Queue §2 ([leftover queue](feature-map/leftover-queue-2026-10-05.md)):
Settings main **0/20**, commit `74ac999e`, no independent review on record.
Worker note: [Settings main residual](settings-main-residual-2026-10-04.md).

## Pair recount

Report SHA-256
`43c3b0c95ac5419130f8bd9f8e8e47a0beaee403cf11a3bb8731411bb1576b9b`.
Empty mask `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`.
Commit recorded on the report: `566c989`. Threshold any RGB channel >2/255.

The isolated native
`/Volumes/Codex3DSIsolated/camera-guide-replay-20260926/screenshots/_27.09.26_03.00.59.899.png`
(declared SHA-256 `7e030f8120c3b338d3df3a113b8a9370837296fe208bc6213271004b446505f9`)
is unmounted here. Recount used the lower contact sheet, pad 8, left pane
`(8,8)` 320×240, the same crop the residual saved. That crop's raw pixels
match `native-lower-from-contact.png`
`b77d014319acd4bec782c64d7f5e841ed655941c1ba8f9947896a562c0f87d7a`. The
sheet's browser pane matches `browser/lower.png` byte for byte.

| Item | SHA-256 |
| --- | --- |
| `diff/report.json` | `43c3b0c95ac5419130f8bd9f8e8e47a0beaee403cf11a3bb8731411bb1576b9b` |
| `diff/lower-contact-sheet.png` | `1f240504602a46e63a219759b345423bcb7f7f175635b2d97bfddb3647aef0cf` |
| `diff/lower-heatmap.png` | `091b56326cf8247586a4107ca03332f88897307f18e39b5062fbac861f6bbd8c` |
| `browser/lower.png` | `708211ad94247bc6c87f740c0e1961befea4cec5fdb1e57b4cfc342952e189d0` |
| `browser/upper.png` | `118a8adc23a2d55bb2bcb479dced47f5c3ba5829bf785eab5e3cac7b13658536` |
| Native lower crop | `b77d014319acd4bec782c64d7f5e841ed655941c1ba8f9947896a562c0f87d7a` |

Recounted the crop against `browser/lower.png`: lower **20**, max **51**,
mean `0.17821614583333334`. Upper contact crop against `browser/upper.png`:
**0**, max **2**, mean `0.09655902777777778`. Heatmap red channel lists the
same 20 coordinates. These match `report.json`.

| Pixels | Coordinates | Max Δ | Owner |
| ---: | --- | ---: | --- |
| 9 | `(273,175)`–`(273,183)` | 51 | Other Settings **n** right `273.49999237060547` |
| 2 | `(259,174)`–`(259,175)` | 5 | Other Settings second **t** right `259.49999618530273` |
| 2 | `(259,182)`–`(259,183)` | 36 | same **t** |
| 2 | `(294,180)`–`(294,181)` | 20 | Other Settings final **s** right `294.49999237060547` |
| 2 | `(76,191)`–`(76,192)` | 41 | `Data\nManagement` **a** before **g**, screen right `76.49999922513962` |
| 1 | `(20,45)` | 3 | `I_TopLTs` left cap `I_User_L_02` / `I_TopML78.bclim` |
| 1 | `(18,105)` | 3 | same left cap |
| 1 | `(22,110)` | 3 | same left cap |

`(273,178)` is native `(180,174,159)` and browser `(228,225,209)`. The
fifteen Other Settings columns are missing ink on the button fill. The
first **t** of "Settings" ends at screen `253.1999969482422` and is absent
from the 20, so a blanket screen snap is still not fixed by this still.

## Dump identity

EUR Settings `0004001000022000` v9220, product `CTR-N-HASP`, content 0 /
`0000003d`. Verified extract
`assets/multicontent/verified/extracted/settings`. Title source SHA-256
`876c57b6fe77c57fbcc113f357b6fc31fe1d3a7e31e424e0d34fe41b17d1f37f`. Content
SHA-256 `79087e9f7f62c616f27167e2623119ffc8350a1fa1a949f28280df9c789cbac0`.
`exefs/code.bin` SHA-256
`1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5`.
Converter on this tree is ctr-native-web **1.2.0** / CTRTool **1.3.0**.
Members were LZ-decompressed and DARC-unpacked, then decoded with
`scripts/firmware/native.py` and `scripts/firmware/texture.py`.

| Element | Dump source | SHA-256 |
| --- | --- | --- |
| `button_LZ.bin` | `romfs/button_LZ.bin` | `4a356ef05cd4b17f330ab78a2c8dfe218749c404f2aaef1e1f8a9e7e48b91f04` |
| `I_TopRBs` | `button_LZ.bin/blyt/I_TopRBs.bclyt` | `ce0fe786449b0efc985f31fc53c4321c4a965af8070cdfb99c3872ec59bd06ce` |
| `I_TopLTs` | `button_LZ.bin/blyt/I_TopLTs.bclyt` | `de4c2118e761c80be6b54f99c5bafca338d8c72b2fc112fb24ddf21d3a0e5c8e` |
| `I_TopLBs` | `button_LZ.bin/blyt/I_TopLBs.bclyt` | `07b00d74a303974bbe18c3b51daff5ebb51aac6132020882a0db6b868259dedc` |
| `Top_D_02` | `layout_LZ.bin/blyt/Top_D_02.bclyt` | `c5bcc6141b2942b445f52508762736c02bb5f13212524fc47c45c1396bbfd9fc` |
| English `mset` | `message_EU_LZ.bin/message_mset/EU_English/mset.msbt` | `fc91dc60b6db7fe7e2eb4d510ca6c63864eacf150bd72dc02d5541444233cbae` |
| English styles | `message_EU_LZ.bin/message_mset/EU_English/RI.mstl` | `ed972145483634e3a9b8205ff3d17afb7b7c1adc84bf1de47c499fc1a1139d9f` |
| `I_TopML78.bclim` | `button_LZ.bin/timg/I_TopML78.bclim` | `e8c859fee13f3754295a633946909a8e5ffc5cd9ad0373cd9e683856b9fe8c11` |
| `I_TopNet.bclim` | `button_LZ.bin/timg/I_TopNet.bclim` | `5ccb051ecefa7bf71b48157d68e521e23e9cdac778192ec0bdf0515e690548ce` |
| `I_UserShdw.bclim` | `button_LZ.bin/timg/I_UserShdw.bclim` | `733c29eb4963a68407295ece4a8a3bb1217339cc70d84154b401c3b3a0ca9abb` |
| Shared font | title `0004009b00014002` `cbf_std.bcfnt` | `95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581` |

Published `button.json`, `layout.json`, and `message_EU.json` pane names,
sizes, translations, English strings, and style indices match this decode.
`fonts/shared/font.json` `sourceSha256` is the decompressed `cbf_std.bcfnt`.
Layout fonts are `cbf_std.bcfnt`. Embedded BCLYT strings are locale
placeholders; English comes from `mset.msbt`.

Decoded English:

| Label | Style | Scale | Line spacing | Text |
| --- | ---: | --- | ---: | --- |
| `top_settings` | 302 | `0.699999988079071` | −3 | `Other Settings` |
| `top_software` | 298 | `0.699999988079071` | −3 | `Data\nManagement` |
| `top_internet` | 300 | `0.699999988079071` | −2 | `Internet\nSettings` |
| `top_parental` | 304 | `0.699999988079071` | −2 | `Parental\nControls` |

`Top_D_02` mounts: `N_I_TopLTs_00` `[-74,43]` 128×78, `N_I_TopRTs_00`
`[74,43]`, `N_I_TopLBs_00` `[-74,-42]`, `N_I_TopRBs_00` `[74,-42]`. Each
icon button's `TextBox_00` is 134×42, origin centre, translation
`[0,-15]`. Other Settings screen left is **167**. Management screen left
is **19**, top **156**.

`I_TopRBs` `TextBox_00` is one line, alignment 4. Writer-local rights from
`cbf_std` at that scale:

| Glyph | Local right | Screen right |
| --- | ---: | ---: |
| second **t** of "Settings" | `92.49999618530273` | `259.49999618530273` |
| **n** | `106.49999237060547` | `273.49999237060547` |
| final **s** | `127.49999237060547` | `294.49999237060547` |

Those three sit just below `*.5`, so upright coverage
`floor(right-0.5)+1` leaves columns 259, 273, and 294 empty. Native has
ink there. `drawNativeSettingsMain` still does not pass
`textCoverageAdaptation`, `textSampling`, or `pictureSampling` on the main
lower layouts, and `Top_D_02_SceneIn_00` stays frame 35.

## Nit: Management letter

`(76,191)` and `(76,192)` are the right edge of the **a** in
"Man**a**gement", screen right `76.49999922513962`. The **g** quad starts
at screen x `77.20`. Its descender is about x 78–85, y 193–194, and those
pixels are inside the threshold. The residual's "**g**" label should be
read as that **a**.

`top_software` is two lines with style line spacing −3, so it stays on the
generic Canvas path. The float32 single-line writer does not own this
column. The **a** edge is the same just-below-`*.5` geometry. It does not
make `azahar-12p4-fit` a proven rule: column 253 is still clean, and main
does not opt into the fit.

## Internet left cap

`(20,45)`, `(18,105)`, and `(22,110)` are on `I_TopLTs`, mount centre
`(86,77)`. `I_User_L_02` is the outer left cap, 16×80, screen left 15.
Decoded `I_TopML78.bclim` is LA8 16×78 with a transparent rounded edge.
Those three samples land on that fringe (linear alpha about 240). Inner
`I_User_L_00` is transparent there. Globe `Icon` / `I_TopNet.bclim` is
about x 66–106, y 38–78. Parental `N_I_TopRTs_00` is centred at x 234.
"Internet" / "Settings" glyphs start at screen x 53.4 / 51.7. Delta 3 is
cap-edge filtering. `Window_01` uses `I_UserShdw.bclim` (A8 24×24) and is
not the opaque pixel at `(20,45)`.

## Count prediction

Frozen pair stays **0 / 20** until a source-backed edge rule and a
coordinator recapture. Regress Other Settings page 1 and Health before any
such rule. Do not enable `azahar-12p4-fit` on main from this still. Not 1:1.

## Still-unreviewed facts

- The declared native 400×480 SHA `7e030f81…` was not rehashed. The volume
  is unmounted. The contact-sheet crop reproduces the report.
- Settings writer `0x1eb35c` was not disassembled again. The residual's
  Capstone note stands: the immediate float32 store matches HOME and does
  not prove later cached expansion, projection, or screen rounding.

## Evidence

| Tier | Result |
| --- | --- |
| Source-identified | Dump messages, styles, mounts, `I_TopML78` fringe, `cbf_std` rights |
| Delivered | Published packs match the decoded panes and English strings |
| Implemented | No painter change |
| Tested | `tests/settings-main-residual.test.mjs` 4/4; typecheck 0; `npm test` 2135 pass / 36 fail (`model/` ENOENT) / 23 skip / 1 todo |
| Browser-inspected | Not run |
| Native-compared | Frozen pair recounted from the contact sheet. Not recaptured. Not 1:1 |

## Checks

`node --test tests/settings-main-residual.test.mjs` **4/4**. `npm run
typecheck` passes. `npm test` **2135 pass / 36 fail / 23 skip / 1 todo**
(2195). The 36 failures are sparse `model/` GLB ENOENT. `git diff --check`
is clean. This lane did not drive Azahar or the production browser.
