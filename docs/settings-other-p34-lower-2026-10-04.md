# Settings Other pages 3 and 4 lower glyph-edge source gap — 4 October 2026

Worker `3ds-settings-other-p34-lower-20261004` /
`codex/settings-other-p34-lower-20261004` from HOME fidelity `584d21d3`.
Sparse worktree; `node_modules` linked from HOME fidelity. No `model/`.
No runtime change. No Azahar. No preview 3021. No CDP 9320. No recapture.
No compositor snap, CSS, unused font, mip or invented HUD previous-seconds
write. The [HudMset previous-seconds](settings-hud-prev-seconds-2026-10-04.md)
upper 169 and constructor `+e5` gap stay labelled and are not reopened.

This follows the [pages 3/4 recapture](settings-other-p34-recapture-2026-10-04.md).
Those pairs remain **169 / 8** and **169 / 35** over 2/255. The entire upper
169 is `HudMset_00` colon / Bat. Remaining this slice: page 3 lower **8** and
page 4 lower **35**. Evidence: source-identified and tested. Not
browser-inspected here. Not native-compared here. Not 1:1.

## Pair (reused, not recaptured)

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/settings-other-p34-20261004/`.
Empty mask. Threshold 2/255. Official lower crop of each native 400×480 PNG
is `(40,240,320,240)`.

| Item | SHA-256 |
| --- | --- |
| Page 3 native `R/natives/page3.png` | `76ff09145c2883225368be33d32986322e3cb3d733556d81bb994292a7b4daac` |
| Page 4 native `R/natives/page4.png` | `3250974938fec12396178767df9f526d314c524978c962a3584a80a4d92d15d3` |
| Page 3 browser upper | `1548bfb7a2ea07c1cbf13649e741ff1f392be8ce858e591d5444d6860a0e1a3f` |
| Page 3 browser lower | `5ebc1404c08c9cded1183d748090dc849d1282d208919979050782769cec2548` |
| Page 4 browser upper | `fceaa771716c952e3c975801eb4c6f9acbd7ef1d3ac17ecec19c1f41726b06d3` |
| Page 4 browser lower | `a2a473ec5819df679bfd4377916e8d59e46911dc2c12591a7c5cd9c36443c0d2` |
| Page 3 report | `eeabf42ad7cf2108294327e10ec1405239a3c1c0018fcca25f1589d0a7ff466b` |
| Page 4 report | `95d837a87c9046de109d92d2b65f607803c4c52a6bff4de3e39fdff01cd3b147` |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` |
| Page 3 lower contact | `5566c418319b9cae92e38fd942424729a3dd31ae582996186782bdff29e2a407` |
| Page 4 lower contact | `754238954029a315c111f2b1fba781c926495b00c813f84bbab261e76ab98b68` |

Inspected both lower contact sheets. Tabs 3 / 4 are raised. Residuals are
faint one-pixel label edges, not page-arrow, tab-identity or Back-footer
errors. Outer Cameras and Circle Pad have **0** lower pixels over 2.

## Cluster identity

Button centres stay the source rows `[160,76]`, `[160,124]`, `[160,172]`.
Each current-page layout has one text pane `TextBox_00` (200×38 at local
`[16,0]`, except Format 204×38). Screen origin is x76 (Format x74),
y = centre − 19. Shared font `cbf_std.bcfnt` (font 0). English styles use
scale `0.8500000238418579` except Format `0.7055000066757202` × `0.85`.
The painter already binds those labels through `child()` /
`TextBox_00:message(label)`.

| Pair | Cluster | Pixels | Visual | Owner |
| --- | --- | ---: | --- | --- |
| Page 3 | `(107,179)` 5×1 | 5, max 38 | System Transfer **y** descender | Writer-local already owns local y26. Native darker than button fill `(209,205,183)`. |
| Page 3 | `(117,163)` 1×3 | 3, max 35 | same **y** right stem | Writer-local right `117.49999618530273` excludes column 117. |
| Page 4 | `(164,83)` 8×1 and `(202,83)` 8×1 | 16 | Language both **g** descenders | Writer-local already owns local y26. |
| Page 4 | `(111,131)` 5×1 | 5 | System Update **y** descender | Same as Transfer y26. |
| Page 4 | `(121,115)` 1×3 | 3 | Update **y** right stem | Writer-local right `121.49999618530273` excludes column 121. |
| Page 4 | `(196,131)` 3×1 | 3 | Update **p** descender | Writer-local already owns local y26. |
| Page 4 | `(152,179)` 4×1 and `(268,179)` 4×1 | 8 | Format System / Memory **y** descenders | Writer-local already owns local y26. |

The 3+3 right-stem pixels are the same just-below-`*.5` class as
[Settings main t/n/s](settings-main-residual-2026-10-04.md). The other 32
are one-row descender AA inside the current upright coverage interval.

## No unused pane / font / sampler

EUR Settings `0004001000022000`, content 0 / `0000003d`, `exefs/code.bin`
SHA-256 `1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5`.

| Resource | Dump source | SHA-256 |
| --- | --- | --- |
| `I_Trans` | `button_LZ.bin/blyt/I_Trans.bclyt` | `901a2755ab558795b62686a7cb5fc2f58b2063212b6b203a8c128d425372c6ce` |
| `I_Lang` | `button_LZ.bin/blyt/I_Lang.bclyt` | `61061e71c759665a40316fd7311f5c89b76af2e7a2da7fed39f4db7b7fa5f072` |
| `I_Update` | `button_LZ.bin/blyt/I_Update.bclyt` | `27cffa4068f2a9e1e5eebeea547be08a7932aee566e6650b417822d48a3204d9` |
| `I_Format` | `button_LZ.bin/blyt/I_Format.bclyt` | `1f00b7c6187d31ff7af41c3384e88705d6a5177b368c795b697917a1e69c07d3` |
| `I_Ocam` / `I_AnalogPad` | `button_LZ.bin/blyt/I_Ocam.bclyt` / `I_AnalogPad.bclyt` | `c22ce6c4ff30e699bfc47ab9cf62b24da55e775d8d3273b38a150d0c18773aa0` / `5e653aff45f6f022d264a96af505c72cf033e3f9dbecc1e278cb5fcd9f67e146` |
| `BasicTop_D_00` | `layout_LZ.bin/blyt/BasicTop_D_00.bclyt` | `1262f71b7b29cc91ac342cc56161f39bbd4dc2a5b8fb1c42aa31e90669943273` |
| English `mset` | `message_EU_LZ.bin/message_mset/EU_English/mset.msbt` | `fc91dc60b6db7fe7e2eb4d510ca6c63864eacf150bd72dc02d5541444233cbae` |
| Shared font | `cbf_std.bcfnt` | `95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581` |
| Published `button.json` | pack | `9a658f4e98b8cb17cc15d2650f55723cd27432cda4524849b7e7ec7efe0a6b3f` |

Each of the six page-3/4 icon layouts lists **only** `cbf_std.bcfnt` and
**only** `TextBox_00`. There is no unused text pane, no shadow text box, and
no second Settings font on these buttons. Camera / eShop / HUD / Zone fonts
are other titles. Icons sit at screen x ≈ 60; residuals start at x107.
Adjacent-page mounts stay at source ±276 (screen x −116 / 436) and do not
own these columns. `child()` draws the current-page buttons without
`textSampling` or `textCoverageAdaptation`. Upper Other `CommonBG_U_00`
keeps its existing lcd / `azahar-12p4-fit` title bind; that is not a lower
label owner.

`azahar-12p4-fit` would include Transfer column 117 and Update column 121.
It is not unique: most residual pixels are already inside writer-local
coverage, and the fit also paints `(117,179)`, `(121,131)` and Format
`(276,179)`, none of which are live. Enabling lcd sampling or a 1/16 snap
on these buttons would be the same rejected guess as main S-01.

## Tests

Focused `tests/settings-other-p34-lower.test.mjs`: Transfer / Update **y**
rights stay just below `*.5`; descender rows stay writer-owned; the rejected
fit is not unique; each layout keeps one `TextBox_00` and `cbf_std.bcfnt`;
page-3/4 button draws do not opt into coverage or LCD sampling.

## Remaining / doubts

Pixel tiers still fail (169 / 8 and 169 / 35). Whole scenarios still fail.
The 32 descender-AA pixels are later atlas/filter intensity, not a missing
pane. The 6 right-stem pixels share the untraced cached-vertex / screen
precision gap with main. Recapture only after a source-backed general edge
rule; do not seed HudMset `+e5` from `lcdDate`. Motion and audio remain
open. No 1:1 claim.
