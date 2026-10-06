# Settings `CommonBG_U_00` title-group centre — 6 October 2026

Worker U22 on `codex/settings-title-centre-20261006` from fidelity
`d9d1ce9d`. Assigned defect: Settings Data Management sub-page upper
headers (icon + title, y≈30–62) are horizontally centred as a group in
native and left-pinned in the browser. No Azahar. No production browser.
No recapture.

This is not a 1:1 claim. Tests and this note do not close pixels, input,
motion, or audio.

## Assigned defect

On Software Management the native combined PNG
`/Volumes/Sandisk1/3ds-fidelity-artifacts/settings-data-parental-20261006/software/native/azahar-software-empty-400x480.png`
SHA-256 `9c5cb75cda80fd2bcbc377da0372f83a1bf435182d06a9c2c3ed2182afdf7881`
centres the green stacked-box icon with `Software Management`. Recaptured
browser upper
`/Volumes/Sandisk1/3ds-fidelity-artifacts/settings-open-blocks-20261006/browser/upper.png`
SHA-256 `216085713472131d2c1f5dfa3515b96fa94d34a9b6ba8b54d0837321880c8101`
pins the icon at x≈12–43 and the title at x≈55. Report
`/Volumes/Sandisk1/3ds-fidelity-artifacts/settings-open-blocks-20261006/diff/report.json`
upper **6011**; title ROI `[20,25,380,65]` **3924**. Native green ink in
y 24–62 spans **66–334**; browser ink spans **12–279**.

The same left-pin appears on Extra Data Management (upper **6989**), Data
Management root (upper **4956**, native green ink **88–312** vs browser
**12–236**), Parental intro (upper **4595**), and Internet Settings
(upper **4760**). Other Settings page 1 already runs this helper (upper
**217** HUD only) and must not regress.

Remaining whole-upper residuals after a later recapture still include the
HUD clock/date (`lcdDate` vs live clock). That is not this slice.

## Dump identity

EUR System Settings `0004001000022000` v9220, content index 0 /
`0000003d`. Title `sourceSha256`
`876c57b6fe77c57fbcc113f357b6fc31fe1d3a7e31e424e0d34fe41b17d1f37f`.
Shared-font conversion **ctr-native-web 1.2.0** /
`scripts/convert_bcfnt.py`
`a88bc088b04c383658f83ed9712f4accff10dc08b4929500ec7c7c7900cd8375`.
Pinned Settings `exefs/code.bin` SHA-256
`1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5`
(mapped at `0x100000`). The private `code.bin` blob is not on a
reachable path in this worktree; the instruction range below is the
existing [Other Settings source centering](settings-other-source-centering-2026-09-26.md)
audit. This slice does not invent a second centering function.

| Element | Manifest / pack | Dump source | SHA-256 |
| --- | --- | --- | --- |
| `up_LZ.bin` | `packs/settings/contents/0000-0000003d/up.json` | `up_LZ.bin` | `28cb896701472d0756397d9a6a65d3defa02d692a3f8e5204f9327ab025decbf` |
| Parent layout | `resourceSources.layouts.CommonBG_U_00` | `up_LZ.bin/blyt/CommonBG_U_00.bclyt` | `a298448098578ecbbaf195fc5b87a76ac7483a363ad5196aaa212b351362f56d` |
| Data icon layout | `resourceSources.layouts.IconDataMa` | `up_LZ.bin/blyt/IconDataMa.bclyt` | `35218f9d8c29ca72a12644964dfae919d0aa041584057954913baca60b6c5aa0` |
| Internet icon layout | `resourceSources.layouts.IconNet` | `up_LZ.bin/blyt/IconNet.bclyt` | `a97ad840acc835dc55279002686ab01a719b4589efa66d09173d3a4989993b95` |
| Parental icon layout | `resourceSources.layouts.IconParental` | `up_LZ.bin/blyt/IconParental.bclyt` | `30dc8ba7b1b70e4085fcbec995d86709d5608645c006ce4acb915828df47a10b` |
| Other icon layout | `resourceSources.layouts.IconBasic` | `up_LZ.bin/blyt/IconBasic.bclyt` | `5d9360b36dd40db93ba43c8edefad7df8aedaf9ec567d1b138eab19b642d7c48` |
| English `mset` | `message_EU.json` | `message_EU_LZ.bin/message_mset/EU_English/mset.msbt` | `fc91dc60b6db7fe7e2eb4d510ca6c63864eacf150bd72dc02d5541444233cbae` |
| English `mset` styles | `message_EU.json` | `message_EU_LZ.bin/message_mset/EU_English/RI.mstl` | `ed972145483634e3a9b8205ff3d17afb7b7c1adc84bf1de47c499fc1a1139d9f` |
| Shared font | `fonts/shared/font.json` | `cbf_std.bcfnt` | `95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581` |

`CommonBG_U_00` canvas is 400×240 origin 1. `Null_Title` starts at
`(0,0)`. Child `Icon` is `(-174,82)`, size 32×32, origin 4. Child
`TextBoxTitle_00` is `(-150,82)`, size 340×26, origin 3, text alignment
3 (middle-left). `CommonBG_U_00_SceneIn_01/03/04/05` change only the
title material colour (orange / blue / green / pink). None has a
`Null_Title` translation track. Every attached section icon layout is
32×32 at the same mount.

## Native rule

`0x2232b4..0x223374` finds `Icon` and `TextBoxTitle_00`, measures the
bound string through `0x19ff04` (right-minus-left equals advance width
for this single-line zero-spacing path), then writes `Null_Title`.X
while preserving Y/Z:

```
extent = (textX - iconX) - iconWidth * 0.5
extent = textWidth + extent
extent = iconWidth + extent
extent = extent - iconWidth
Null_Title.X = groupX - (iconX + extent * 0.5)
```

All steps are float32. The existing `settingsTitleGroupX` helper
preserves that instruction order. The 26 September slice applied it
only when `screen==='other'`. That gate is the captured left-pin: Data /
Internet / Parental / Profile / Clock / identified Other details bind
the same layout and the same function.

EUR English title advances at style scale `0.8500000238418579`
(styles 102, 107, and 285 for these labels; character spacing 0):

| Screen | `mset` label | Text | Width | `Null_Title`.X |
| --- | --- | --- | ---: | ---: |
| Other p1–p4 | `settings_title` | Other Settings | 149.60000610351562 | **95.19999694824219** |
| Data / Nintendo 3DS | `dat_title_u` | Data Management | 187.85000610351562 | 76.07499694824219 |
| Software Management | `dat_sof_title_u` | Software Management | 231.1999969482422 | 54.399993896484375 |
| Extra Data Management | `dat_opt_title_u` | Extra Data Management | 247.35000610351562 | 46.32499694824219 |
| Parental / restrictions | `parental_title_u` | Parental Controls | 180.1999969482422 | 79.9000015258789 |
| Internet | `net_top_title` | Internet Settings | 173.4000244140625 | 83.29998779296875 |
| Connection Settings | `net_set_title` | Connection Settings | 210.8000030517578 | 64.5999984741211 |
| Profile / nickname / birthday | `user_info_title` | Profile | 66.30000305175781 | 136.85000610351562 |
| Date & Time / date / time | `date_time_title` | Date & Time | 127.5 | 106.25 |
| Sound | `sound_title` | Sound | 67.1500015258789 | 136.4250030517578 |
| Language | `language` | Language | 102 | 119 |

LCD icon-pane left is `Null_Title`.X + 10; title-pane left is
`Null_Title`.X + 50. Software predicts icon pane x **64.40** and title
pane x **104.40**, matching native green ink 66–334 (visible icon
padding and glyph bearings sit inside the 32×32 / 340×26 panes). Data
predicts 86.07 / 126.07 vs native ink 88–312. Extra predicts 56.32 /
96.32 vs native ink 58–342. Other Settings stays at the already-accepted
95.19999694824219.

## What changed

`stock-native-settings.ts` now writes `Null_Title` on every
`CommonBG_U_00` draw, measuring the same `TextBoxTitle_00` override that
is bound (source `mset` + style for identified pages). No per-screen x
table, no CSS position, no new graphic. Other Settings keeps
`textSampling:'lcd'` and `textCoverageAdaptation:'azahar-12p4-fit'`;
those raster fits are not copied onto Data / Internet / Parental.

Settings main still uses `TopText_U_00`. DS Profile still uses
`LsCommonBG_U_00`. Neither takes this group.

## Screens that do not use this header

| Surface | Header | Why this slice does not move it |
| --- | --- | --- |
| Settings main | `TopText_U_00` | Different layout; `top_sysset_title` style 579 |
| Nintendo DS Profile | `LsCommonBG_U_00` | Legacy chrome; no `Null_Title` / `Icon` pair |
| Settings Manual | applet `SoftTitleHeader` / `P_Icon_00` / `TextBoxTxt_00` | Manual `0004003000009b02`, not Settings `CommonBG_U_00` |
| System Transfer | transfer `CommonBG_U_00` + `T_title_00` | Title `0004001000022a00`; different pane names and `CommonBG_U_00_in_00` |
| System Update helper | updater `CommonBG_U_00` | Different title pack; not the Settings Data/Internet residual |

Unidentified Settings detail cards still bind `view.heading` without a
`mset` style (pre-existing adapter). They now centre that adapter string
through the same helper. That measurement is not a native title claim.

## Predicted title ROI per pair

Empty mask, threshold any RGB channel >2/255. Predictions are source
arithmetic plus the published native/browser ink extents, not a
coordinator recapture.

| Pair | Current title ROI / upper | Predicted title ROI `[20,25,380,65]` | Notes |
| --- | ---: | ---: | --- |
| Software empty (`9c5cb75c…` / `21608571…`) | **3924** / **6011** | **200–900** glyph/icon AA | Offset class (native 66–334 vs browser 12–279) should leave; no Other `azahar-12p4-fit` on this page |
| Extra Data (`7c7f2f93…`) | title share of **6989** | same AA class | Same header; native `?` row is a different defect |
| Data root (`686d3dfb…`) | title share of **4956** | same AA class | Native ink 88–312 vs browser 12–236 |
| Parental intro (`98fb3d62…`) | title share of **4595** | same AA class | SceneIn_05 pink title; lower already **0** |
| Internet settled (`f0c5d093…`) | title share of **4760** | same AA class | SceneIn_03 blue title; lower selected-row mismatch remains |
| Other p1 (`98d0fc9d…` / held `424ffb45…`) | HUD **217** / held **0** | **unchanged** | Same X 95.19999694824219; lcd + 12p4-fit stay |
| Other p3 / p4 | upper **169** | **unchanged** title group | Same Other title string; HUD Bat 4/5 is separate |
| Settings main | not this header | **unchanged** | `TopText_U_00` only |

This prediction is not acceptance.

## Regression checks

- Other p1 `Null_Title` remains **95.19999694824219**.
- Other p1/p3/p4 keep `textSampling:'lcd'` and
  `textCoverageAdaptation:'azahar-12p4-fit'`.
- Data / Internet / Parental / Software / Extra do not opt into that
  Other raster fit.
- Settings main does not bind `CommonBG_U_00`.
- DS Profile still binds `LsCommonBG_U_00` only.

## Remaining residuals / open gaps

- HUD clock/date vs `lcdDate` (Software pair: native `06/10 (Tuesday)
  15:04` vs browser `05/10 (Monday) 18:01`).
- Title/icon edge AA after the group is centred, especially on pages
  without the Other lcd/12p4-fit.
- Extra Data native `?` row vs empty copy (lower **51927**).
- Internet lower selected yellow vs unfocused blue.
- Data root 3DS selected vs unfocused and Reset enabled vs disabled.
- Open Blocks integer remains the empty-SD portfolio fixture.
- Input, motion, and audio remain uncompared.
- Private `code.bin` was not remounted here; call-site broadening is
  the named-pane function plus every `CommonBG_U_00` bind, confirmed by
  the published captures. If a later dump walk finds a screen that
  binds this layout without calling `0x2232b4`, that screen is a
  source-gap and must not keep a capture-fitted x.

## Still non-native elements

- Other Settings title raster: `textSampling:'lcd'` and
  `azahar-12p4-fit` (existing capture-supported adaptation; not extended).
- Unidentified detail headings: local `view.heading` without `mset`
  style, now centred as drawn.
- Open Blocks integer `65536` and EUR comma grouping: portfolio empty-SD
  fixture.
- HUD battery/network frames: reference-session adaptation.
- Empty Software / Extra Data lists: no title-icon buttons, arrows, or
  wait icon.
- DS Profile values remain blank.
- System Transfer eShop-required dialog vs portfolio 3DS/DSi choices
  (labelled helper adaptation; different header).
- No CSS-reconstructed title or substitute font.

## Evidence split

| Gate | Status |
| --- | --- |
| Source-identified | yes — `CommonBG_U_00` / `0x2232b4` / measured `mset` advances |
| Delivered | yes — already in `up.json`, `message_EU.json`, `fonts/shared` |
| Implemented | yes — `settingsTitleTranslation` on every Settings `CommonBG_U_00` |
| Tested | `tests/settings-title-centre.test.mjs` plus `npm test` / typecheck |
| Browser-inspected | no — worker must not drive `:3000` |
| Native-compared | no — coordinator recapture after integration |
