# Camera browse Settings third 630 — 5 October 2026

HOME-fidelity Camera worker on `codex/camera-settings-630-20261005` from
fidelity `d6ce9913`. One leftover: the browse Settings footer third after
the dump-backed X-scale bind. Slideshow and Shoot stay 0. Date pane
**1006**, slider strip **1992**, photo crop, gallery selection, Welcome
page 5, Parakeet, and Sound are untouched. No Azahar. No production
browser. No preview 3021. No CDP. No recapture. Capture stays inert.

This is not a 1:1 claim. The painter is unchanged. Tests, this note, and
the reused still do not close pixels, input, motion, or audio.

## Assigned defect

Frozen native combined PNG
`reference/scenario-matrix/v1/captures/camera-populated-browse-global/native/combined.png`
SHA-256 `cae793c31bdf9f13d44f0834582bf99fead5bb8d652321913993bedde7ae1652`.
Mac-screen browser lower after the Settings X-scale recapture `d6ce9913`:
`home-fidelity-20261001/camera-settings-footer-recapture-20261005/browser/lower.png`
SHA-256 `3f5ead625db013831b6a47af7648202865811d5ec6982b2f10b2e98ad59fc169`.
Report `468e6340389f8e0d74b577c9df0a0f004698dc4733d759aea29f8dc5ef43b34e`.
Empty mask `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`.
Threshold any RGB channel >2/255. Whole lower **10158**.

| Third | Rectangle | Count |
| --- | --- | ---: |
| Slideshow | `[0,105) × [212,240)` | 0 |
| Shoot | `[107,213) × [212,240)` | 0 |
| Settings | `[215,320) × [212,240)` | **630** |

The 630 pixels occupy x 241–307, y 216–236. Maximum delta is 83 at
`(253,227)`: native `(70,65,58)`, browser `(153,148,140)`. The previous
maximum `(240,217)` is now `(241,239,236)` on both sides. Button face
`(275,214)` is `(243,242,238)` on both sides. Every integer shift of the
browser word by ±2 columns or rows scores higher than 630. Shift `(0,0)`
is the unique best.

## Dump identity

EUR Camera `0004001000022400` v4097, content index 0 / `0000001a`. Image
base `0x100000`. Converter **ctr-native-web 1.2.0**. Private executable
SHA-256
`3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`.

| Element | Manifest / pack | Dump source | SHA-256 |
| --- | --- | --- | --- |
| `exefs/code.bin` | title `0004001000022400` v4097 | `contents/0000-0000001a/exefs/code.bin` | `3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c` |
| Browse archive | `lyt-P_Brws_D-arc-LZ.json` | `lyt/P_Brws_D.arc.LZ` | `ed22962fa35a3019457302e059ddc19709fa07e36ae1d67b506a58e9d317181a` |
| `P_BrwsMenu_D` | `resourceSources.layouts.P_BrwsMenu_D` | `lyt/P_Brws_D.arc.LZ/blyt/P_BrwsMenu_D.bclyt` | `58af2008d3112977f2a1b9f0a8aad2584b3f3f20a397f0fd5072bdfc764d5e01` |
| Settings button | `P_BtnDW_90x30.bclim` | `lyt/P_Brws_D.arc.LZ/timg/P_BtnDW_90x30.bclim` | `bbb8d1ad7cab3d04509febd46bb619bfaf371346b621fa30e86fc6a6e38a6cdf` |
| `P.msbt` | `resourceSources.messages.P` | `msg/EU_English.LZ/P.msbt` | `c7c8333e0d051725c45a27bac7f239a6e36699044053b5013cd4edd4cc80be05` |
| `RI.mstl` | `resourceSources.styles.RI.mstl` | `msg/EU_English.LZ/RI.mstl` | `f2505d2077a5c90de9ba222d1e12d82d23168f44216f3e21dfdc1e005570ef1a` |
| Shared font | `fonts/shared/font.json` | `cbf_std.bcfnt` | `95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581` |

`P_BrwsMenu_D/TxtSet` is `RootPane/-B-Set/Set/TxtSet`. Parent `-B-Set` is
`(+115,-105)`. `TxtSet` is origin 4, size `[76.8, 24]`, alignment 4, line
alignment 2, font size `[20, 24]`, font `cbf_std.bcfnt`. `TxtSShow` and
`TxtShoot` use the same alignment and font. Their materials match
`TxtSet`: no texture map, no colour blend. `P_BrwsMenu_D_Brws` frame 0
moves `-B-Set` and `Set` and leaves `Set` scale X at 1. It does not
scissor `TxtSet`.

## Already bound

English `P/setting` is style 19. Its tokens are group-1/type-0 argument
`5000` (80), the text `Settings`, then group-1/type-0 argument `6400`
(100). `P/Brws_02` and `P/Brws_03` are plain `Slideshow` and `Shoot`.

Draw tag `0x2717c8` indexes group 1 to `0x2718c8`. Type 0 sign-extends the
argument, multiplies by float32 `0.01` at `0x271a7c`, and stores two
floats at writer `+0x24` and `+0x28`. When the saved scale object is
present, X is `argument×0.01` times object `+0x1c` and Y is a copy of
object `+0x18`. When it is absent, X is `argument×0.01` and Y is `1.0` at
`0x271a80`. Style `+0x1c` / `+0x18` are the style font scales. The 100%
run follows the glyphs.

`cameraBrowseSettingsLabel` already sets browse `TxtSet` font scale X to
float32(`0.8399999737739563 × 0.7999999523162842`) =
`0.6719999313354492` and leaves Y at `0.8399999737739563`. Welcome
`TxtSet` stays on plain `setting`. That bind is the `d6ce9913` painter.
This slice does not change it.

## Why the leftover is not a second bind

| Candidate | Dump fact | Why it does not own the 630 |
| --- | --- | --- |
| Extra writer | `P/setting` has only the 80% run, `Settings`, and the 100% run | Group 1 type 0 stores the two scales and returns. No outline or shadow tag. The button face already matches |
| Clip | `Brws` frame 0 keeps `Set` scale X at 1 | Diffs sit inside the word, not on the pane edge. Rows 212–215 match |
| Style word 0 as pane width | Style 19 word 0 is 80. Date binder `0x21f7ec` writes style+0 into a pane width | `Brws_02` word 0 is 152 against pane 134.4, and `Brws_03` word 0 is 176 against pane 96. Those thirds score 0, so that installer is not this draw. A Settings width of 80 is a 1.5px nudge, and `(0,0)` is already the best shift |
| Absent scale object | Y becomes `1.0` | The present-object path copies style Y. A unit Y cell is about 16% taller and would enter the matching rows above the word |
| Both-axis size span | Group 1 type 0 copies Y | `glyphScaleSpans` would also shrink Y. The X-only font scale is the store this handler writes |

`cbf_std.bcfnt` on the shared non-direct blit already matches Slideshow
and Shoot at style scale 0.84 within 2/255. The 80% X scale is the only
Settings-only input, and it is already applied. `(253,227)` is native
ink against a paler browser edge. No unused pane, clip, frame, or second
scale uniquely closes that edge. An atlas fit or a Settings-only sampler
would be a screenshot fit.

## Labelled gap

The Settings third's remaining **630** lower pixels are a **source-gap**
on already-bound browse `TxtSet`. The painter stays the X-only scale
`[0.6719999313354492, 0.8399999737739563]`. Slideshow and Shoot stay 0.
Date pane **1006**, slider strip **1992**, the upper HNI crop, gallery
selection, and Parakeet stay with their owners.

## Evidence

| Tier | Result |
| --- | --- |
| Source-identified | Group-1/type-0 store at writer `+0x24`/`+0x28`; no second Settings writer, clip, or width install on this draw |
| Delivered | Existing menu, button, message, and shared-font packs |
| Implemented | Painter unchanged |
| Tested | `node --test tests/camera-settings-630.test.mjs` |
| Browser-inspected | Not run. Preview 3021 and CDP were out of scope |
| Native-compared | Not recaptured. Frozen third stays **630**. Not 1:1 |

## Checks

`tests/camera-settings-630.test.mjs` locks the frozen hashes, the 630-pixel
third, the `(253,227)` and `(240,217)` samples, the sibling thirds at 0,
the `(0,0)` shift minimum, the style word-0 values, and the unchanged
X-only painter. `git diff --check` is clean. Application typecheck and
build were not rerun. This lane did not drive Azahar or the production
browser.
