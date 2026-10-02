# HOME Power menu settled comparison

Base: `ff6ffe24999ef1b162da0652279a8385d78b5ba5`

Branch: `codex/home-power-compare-20261002`

Feature: L-01. This is a read-only comparison and source-contract handoff. It
does not change runtime code, assets, the private matrix, or scenario status.

## Pre-integration HOME capture identity and result

The coordinator entered Power from settled HOME in both programs. Native used
one own 400x480 PNG after a 500 ms held Power input; the production browser used
raw 400x240 and 320x240 targets after a 200 ms held `p`. The semantic path is
the same, but input cadence and presentation epoch are not matched.

| Input | SHA-256 |
| --- | --- |
| Native `_02.10.26_11.05.45.816.png` | `a585889277da13c28f9b184c279c9775997859a7dbbdd64a946016dc0dfd4a3e` |
| Browser upper, runtime `5de1f3812d3e7061738c6a5e9caee3b9d1f81479` | `ce26398c660badd79e6c631e1bb1279dcf7e664942d9e5efb2b35991235c2d99` |
| Browser lower | `c19085b7739ceb7605cc1e97b9660017daf0333c736c5dc60fda3148fd28c023` |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` |

The existing native comparison tool crops native lower `(40,240,320,240)` and
applies no mask. The whole-LCD result remains `unexplained-differences` and
therefore **fail**:

| LCD | Pixels above 2 | Mean RGB error | Maximum RGB error |
| --- | ---: | ---: | ---: |
| Upper, 96,000 compared | 7,848 | 8.954611 | 220 |
| Lower, 76,800 compared | 668 | 0.174926 | 85 |

The inspected sheets are `upper-contact-sheet.png` SHA-256
`79f68b104ddb859bdad6bec34906b1bbfcb4739b672ea0dd1f9377f7d5a4681e`
and `lower-contact-sheet.png` SHA-256
`c6553aae9bede7ffaeb70efabb125b58aa2b216ec24c45d174870fe146e42043`.
The empty-mask `report.json` SHA-256 is
`6c3833806c94371ddfbdb5660d0a958889d4b9a7a6b802992a1cba01b3f2463c`.
All are under
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/power-native-20261002/compare/`.

## Pre-integration named regions

[`compare-home-power-menu.mjs`](../../scripts/compare-home-power-menu.mjs)
records source-pane-based empty-mask regions and bounded placement diagnostics.
Its `power-regions.json` is SHA-256
`a4476d87703800a585d5da64ee2106ed08991891f0a8619e49cdc48b3b416690`.

| Region | Pixels above 2 / compared | Mean RGB error | Finding |
| --- | ---: | ---: | --- |
| Upper heading | 16 / 13,600 | 0.204681 | Settled heading is effectively aligned; the few high pixels are isolated coverage residuals. |
| Upper list | 7,845 / 30,912 | 27.683931 | Dominant mismatch; do not treat as a whole-layout offset. |
| Upper divider | 0 / 3,200 | 0.015417 | Pixel-threshold match. |
| Upper footer | 3 / 24,800 | 0.056895 | Three isolated high pixels; no geometry change supported. |
| Lower background before the button | 0 / 51,200 | 0.000039 | Pixel-threshold match. |
| Lower button artwork and label | 668 / 7,680 | 1.733637 | Every lower high pixel is inside the label subset. |
| Lower label subset | 668 / 2,688 | 4.899926 | Glyph coverage/style residual, not a translated label. |
| Lower divider | 0 / 2,560 | 0.003385 | Pixel-threshold match. |
| Lower HOME footer | 0 / 7,680 | 0.014063 | Pixel-threshold match. |

White-text masks fit the browser first upper list block at native offset
`(0,-16)`, the middle block at `(0,0)`, and the third block at `(0,+15)`.
Their IoUs are respectively 0.769906, 0.664265 and 0.749840. This alternating
placement rules out one safe global offset and points to message-flow handling,
which the separate source worker owns. The lower dark-label mask is best at
`(0,0)`, IoU 0.877976: the remaining lower mismatch is coverage/shape, not a
position correction.

## Pre-integration app-origin Power evidence

The coordinator also entered Power after opening Health and holding Power until
the native UI displayed `Software closed.`. Native own capture
`_02.10.26_11.11.07.761.png` has SHA-256
`238fb53e0d74c29ac914235e7b12016803ff5383a8f7e10ac9cd64d898cd7ad0`.
The browser-before upper and lower captures have SHA-256
`2dadfbf37316221b261a7d63aba2edda2b04dee841dbbfe574beb5409f5c2c02`
and `90e4243f64914d5b044f8ef9fcdc7c34cedcdbdb58c664454cf78ee66ce6736b`.
The empty-mask whole-LCD result remains fail:

| LCD | Pixels above 2 | Mean RGB error | Maximum RGB error |
| --- | ---: | ---: | ---: |
| Upper, 96,000 compared | 9,845 | 9.059177 | 220 |
| Lower, 76,800 compared | 668 | 0.174926 | 85 |

The inspected app-origin sheets are `upper-contact-sheet.png` SHA-256
`0630c9302bcef4f864ecc8cf2802a5972a2ba3fcc12714fce4c89ea741b8b140`
and `lower-contact-sheet.png` SHA-256
`3a4088fcf3f94921e9260be0a5aa1e56dc565a9a694c6b173074e350b601441c`.
The empty-mask report is
`fd748c3370aa03d0bc29320c2f1f4711c80f157a3145d7ccf0cb807c651ecc5d`;
the named-region report is
`2e96ded08d453b9031cba23b05ba1e321aa91b67a29fd95e587f35b22aff87ee`.
They are under the same private `compare/app-before/` root.

The lower `Software closed.` rectangle `(40,86)-(280,136)` is an exact RGB
match: 12,000/12,000 pixels exact, maximum delta 0. The lower background,
button, label, divider and footer metrics otherwise equal the HOME-origin
capture exactly, including all 668 high-delta pixels remaining inside the Power
Off label. The app-origin list still fits `(0,-16)`, `(0,0)`, `(0,+15)` and the
label still fits `(0,0)`; therefore this route adds no supported geometry
correction.

The two native upper LCDs are byte-identical after RGB extraction. By contrast,
the browser app-origin upper differs from the browser HOME-origin upper at
4,303 pixels above threshold 2 (mean RGB delta 0.288094, maximum 20), and the
app comparison has 1,997 more high-delta upper pixels than HOME. The extra
coverage is visible in the upper footer as well as text areas. It is browser
route/presentation variance, not evidence of native route variance, and its
cause is unresolved; no runtime correction is authorized from it.

For the source contract, `returnPhase: 'app'` selects
`Slp_U_00_SceneInApp` and `Slp_D_00_SceneInApp`. Their paired delivered source
has SHA-256
`2135ca9b57e21752670e279c7668b9c6b6b171eeac4d21f812dc75410ff0a179`.
The animation has 31 poses over source frames -30 through 0; its `P_Mask`
alpha is 255 at pose 10 and reaches 0 at pose 30. Lower pane `T_Top_00` uses
message `lau_press_pow0` (`Software closed.`), style 502. The pane is text-only;
the one lower touch boundary remains `B_Btn_01`, so app entry does not add a
footer touch target.

## Integrated source-spacing and footer result

The coordinator integrated the source-spacing correction and footer touch
geometry at runtime `82d26a8b`, then captured settled HOME-origin and app-origin
Power again. Both after upper PNGs are byte-identical, SHA-256
`735ffe942e43b7b8f641a99b9ef483f4254cf8fa61b9776a10c7f46a4acb134a`.
The HOME lower remains byte-identical to its before capture at SHA-256
`c19085b7739ceb7605cc1e97b9660017daf0333c736c5dc60fda3148fd28c023`;
the app lower likewise remains byte-identical at
`90e4243f64914d5b044f8ef9fcdc7c34cedcdbdb58c664454cf78ee66ce6736b`.

Against each named native own capture, HOME and app after results are identical
per LCD:

| LCD | Pixels above 2 / compared | Mean RGB error | Maximum RGB error | Change from before |
| --- | ---: | ---: | ---: | --- |
| Upper | 4,334 / 96,000 | 1.748302 | 211 | HOME: -3,514 high pixels; app: -5,511 high pixels |
| Lower | 668 / 76,800 | 0.174926 | 85 | No pixel changed in either route |

All upper list mask fits are now `(0,0)`: first IoU 0.771409, second 0.757480,
third 0.780662. The correction removed the earlier alternating vertical
placement. The remaining 4,331 list pixels above threshold are glyph
coverage/style differences at native positions, not evidence for another
offset. The only other upper high pixels are three isolated footer pixels; the
heading, quiet background and divider have none. On lower, all 668 high pixels
remain inside the zero-offset Power Off label; the app `Software closed.` pane
remains exact.

The tool's optional `--baseline` comparison records the direct browser
before-to-after change. HOME upper changed at 7,709 pixels above threshold
(mean RGB delta 8.739122, maximum 220); app upper changed at 9,777 pixels
(mean 8.842611, maximum 220). Both lower LCDs are exact before/after RGB
matches. The app-only before variance is not present in this after pair: the
browser upper is the same for both origins, matching the observed native route
invariance. These settled samples do not distinguish an effect of the source
change from presentation-epoch variability, so no stronger cause is assigned.

The inspected after contact sheets are identical for upper, SHA-256
`77411db94109150c359d19550476d60b040c4af7a4fc4cc2c60f018460ab9d67`.
HOME lower is
`c6553aae9bede7ffaeb70efabb125b58aa2b216ec24c45d174870fe146e42043`;
app lower is
`3a4088fcf3f94921e9260be0a5aa1e56dc565a9a694c6b173074e350b601441c`.
They were opened and visually inspected. The reports are:

| Route | Empty-mask report | Named-region and before/after report |
| --- | --- | --- |
| HOME | `8bb9954f1ecaf48ab4714eff9d40419374ba3f75d9624175eec96b45a8c97ac3` | `582a97ecefd4f79d2d2b8abe6f6f3d9ebed4ce5abdf4e1ae4520079297406a59` |
| App | `90250144955d42ae63a32c933fc508939e2389aadde83d7156097e4ea1bf62e3` | `5d61c1f54e8976c5901ac443b1d603660ea775862e7853850fc418f76730da2a` |

They are under private `compare/home-after/` and `compare/app-after/`. The
coordinator's production pointer check at footer `(160,226)` remained in Power
for both origins; physical `h` returned HOME; central Power Off pointer then
reached off, power boot, and HOME without an error while muted. This is positive
browser behavior evidence for the removed footer adaptation, but it is not a
matched native physical-button or motion/audio acceptance run. Both whole
scenarios remain fail because the empty-mask comparisons retain unexplained
text residuals and cadence, motion and audio are still open.

## Native element and source contract

The visible screens are not the generic portfolio fallback. They use HOME
title `0004003000009802` v24576, content index 0 / ID `00000082`, converted by
`ctr-native-web` 1.2.0 with CTRTool 1.3.0.

| Element | Delivered key | Decrypted source and SHA-256 |
| --- | --- | --- |
| Upper layout/background/divider/text panes | `manifest.home.sleep` -> `packs/home/sleep.json` -> `Slp_U_00` | `romfs/sleep_LZ.bin/blyt/Slp_U_00.bclyt`, `4b2d4f32afdb368996a9d9f6e5947a3b0155bfad802d4c9e9b9696b5a1344027` |
| Lower layout/background/button/divider/footer panes | `manifest.home.sleep` -> `packs/home/sleep.json` -> `Slp_D_00` | `romfs/sleep_LZ.bin/blyt/Slp_D_00.bclyt`, `1609d6b1bd27a954da7c65be5782b77320e8a5faedca5f3dd1f25d3eea95d56d` |
| HOME-entry panel reveal | `Slp_U_00_SceneIn`, `Slp_D_00_SceneIn` | paired `sleep_LZ.bin/anim/*_SceneIn.bclan`, `ba664a8d6cf819f00fdc86012b9f5ff5d735ef40fbaeef254680d4db57d19e1c` |
| English labels `lau_press_pow_u0/u1`, `lau_press_pow1`, `lau_b_shutdown`, `lau_press_pow5` | `manifest.home.messages` -> `menu_msbt_LZ` | `RomFS/message/EU_English/menu_msbt_LZ.bin`, `1df2193c64e8d08b3b670923617ea1f0461537397b3da671d394304a664b4350` |
| Relevant message styles 499, 501, 503, 504 and 505 | `message/EU_English/RI_mstl_LZ.bin` | `RomFS/message/EU_English/RI_mstl_LZ.bin`, `224aec428f67f35e0a23b3e7de464b2b4fe1d18dd1cf07fa9b0b53d5ad3db555` |
| Shared native font | `manifest.fonts.shared` -> `fonts/shared/font.json` | shared-font title `0004009b00014002`, `cbf_std.bcfnt.lz`, `95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581` |

The delivered sleep pack SHA-256 is
`bfe9219930b99d475b0ceb0895c086e5854442a1e91fae2f5120feab313f59ef`;
its selected `sleep_LZ.bin` source SHA-256 is
`9af919d002228a156d98be1001c10504a343d7da235f387b46dce643fc6d6a71`.
The sleep pack, both selected layouts and selected animations record no
unsupported conversion entries.

## Explicit unsupported and fallback boundaries

- The active message style table records unsupported `styleFields` at offsets
  0, 4, 8, 12, 16, 20 and 40. Known font scale, character spacing and line
  spacing are applied; the retained `unresolvedWords` are not interpreted.
- `lau_press_pow_u1` contains native group-1 controls 14/15 between its three
  list blocks. Before `82d26a8b`, the override supplied flattened text and the
  decoded style but dropped the controls' line-advance scales. The integration
  now decodes this exact message to `[1,.2,1,.2,1,1]` and passes those scales
  explicitly. General group-1 control semantics remain unsupported and exact
  glyph coverage still differs.
- `lau_b_shutdown` uses style 501. Its label is not translated relative to
  native, but exact coverage remains different. The unresolved style words or
  this bounded text raster path require source-owner review; the matching
  background, button position, divider and footer rule out a lower-screen
  layout move.
- Literal English strings in `native-system-presentation.ts` are missing-label
  fallbacks. They are inactive here because every required source label is
  present. The generic authored Power Options card in `portfolio-screens.ts`
  is also inactive while firmware assets are loaded.
- `Slp_D_00_Select` and `Slp_*_SceneOut` exist in the delivered pack but the
  settled browser overlay binds only SceneIn; the browser shutdown later uses
  Decide plus a common fade. This capture does not establish selection-motion
  or shutdown-motion parity, so it does not authorize a new binding.
- Browser panel/shutdown clocks, power-service behavior, LCD/backlight and blue
  indicator order, exact input cadence, and audio remain adaptations or open.

## Footer touch boundary

`Slp_D_00` contains one and only one `bnd1` pane: `B_Btn_01`, size 188x36 at
translation `(0,-64)`, which maps to lower LCD rectangle `(66,166)-(254,202)`.
The footer `T_Btm_00` is a `txt1` instruction pane with no boundary pane.
Before runtime `82d26a8b`, browser
[`touchSystemAction`](../../src/os/system.ts) matched the central rectangle but
additionally mapped every `y >= 214` touch to Back. Its focused portfolio test
expected `(160,228)` to return HOME. The integration removed that footer touch
route and retained the physical Back/HOME action.

The coordinator's isolated live observation used mapped-touch disabled and the
same 200 ms held direct-touch method for both probes: footer `(160,~227)` left
native Power unchanged, while the positive control at Power Off center
`(160,182)` shut down emulation to the Azahar title list. This supported
classifying the old browser footer touch as an adaptation. The post-integration
production pointer checks above confirm its removal. The native physical B/HOME
route and cadence remain unmeasured.

## Handoff

The integrated source-spacing work resolved the positional residual for all
three upper blocks; the after captures also have equal HOME/app browser output.
The remaining
source-owner facts are 4,331 zero-offset upper list pixels and 668 zero-offset
lower label pixels above threshold, both consistent with glyph coverage/style
rather than layout geometry. No further runtime offset is proposed. Both whole
scenarios stay fail; matched physical input, motion and audio remain open.
