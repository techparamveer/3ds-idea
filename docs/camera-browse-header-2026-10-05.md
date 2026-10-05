# Camera browse header glyph strip — 5 October 2026

HOME-fidelity Camera worker on `codex/camera-browse-header-20261005` from
fidelity `76a3635a`. One leftover: the lower-LCD browse header glyph strip
after the Settings X-scale recapture. No Azahar. No production browser.
No preview 3021. No CDP. No recapture. Capture stays inert. Date pane
**1006**, slider **1992**, Settings third **630**, photo crop **33522**,
gallery selection, in-flight thumbs, Welcome, and Sound are untouched.

This is not a 1:1 claim. Tests, this note, and the stills do not close
pixels, input, motion, or audio.

## Assigned defect

Frozen native combined PNG
`reference/scenario-matrix/v1/captures/camera-populated-browse-global/native/combined.png`
SHA-256 `cae793c31bdf9f13d44f0834582bf99fead5bb8d652321913993bedde7ae1652`.
Mac-screen browser lower after the Settings X-scale recapture:
`home-fidelity-20261001/camera-settings-footer-recapture-20261005/browser/lower.png`
SHA-256 `3f5ead625db013831b6a47af7648202865811d5ec6982b2f10b2e98ad59fc169`.
Report `468e6340389f8e0d74b577c9df0a0f004698dc4733d759aea29f8dc5ef43b34e`.
Empty mask `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`.
Threshold any RGB channel >2/255. Whole lower **10158**. Header band
y<32 scores **837**.

Official empty-mask components in y<32, 4-connected:

| Box | Pixels |
| --- | ---: |
| `[182,10,30,13]` | **240** |
| `[108,6,12,17]` | **103** |

Smaller ink in the same band: `[151,10]`, `[122,6]`, `[170,6]`,
`[128,6]`, `[139,6]`, `[133,10]`, `[146,10]`, `[175,11]`. Rows 0–4 and
23–31 of the lower LCD match. The ink is the word `Slideshow`.

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
| Header button | `P_BtnUW_320x30.bclim` | `lyt/P_Brws_D.arc.LZ/timg/P_BtnUW_320x30.bclim` | `862b4b4df4fa91e8d5cf8baa288ffd612a0e924b27d7540bda4d213a24c69b3e` |
| `P.msbt` | `resourceSources.messages.P` | `msg/EU_English.LZ/P.msbt` | `c7c8333e0d051725c45a27bac7f239a6e36699044053b5013cd4edd4cc80be05` |
| `RI.mstl` | `resourceSources.styles.RI.mstl` | `msg/EU_English.LZ/RI.mstl` | `f2505d2077a5c90de9ba222d1e12d82d23168f44216f3e21dfdc1e005570ef1a` |
| Shared font | `fonts/shared/font.json` | `cbf_std.bcfnt` | `95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581` |

`P_BrwsMenu_D/TxtSShow` is `RootPane/BtnMov0/-B-SShow/SShow/TxtSShow`.
`P_BrwsMenu_D_Brws` frame 0 keeps `BtnMov0` at translation Y **105**, so
the bar sits on the top of the lower LCD. `TxtSShow` is origin 4, size
`[134.39999389648438, 24]`, alignment **4**, line alignment **2**, font
size `[20, 24]`, font `cbf_std.bcfnt`. Metadata is `MSG P/Brws_02`.
`SShowBase` is the 322×38 `P_BtnUW_320x30.bclim` picture. Name `-B-SShow`
is the menu table entry at `0x4408c4`.

## Owner

English `P/Brws_02` is style 45. Its only token is the text `Slideshow`.
Font scale is `[0.8399999737739563, 0.8399999737739563]`, character
spacing 0, line spacing 0. Colour word `0xff394045` is already bound.
There is no group-1 size run. Style word 0 is 152. A centre-origin pane
does not move this string when the width changes, and the native and
browser ink already share the same columns, so that width is not this
residual.

`code.bin` `0x1cdb2c` loads the line-alignment byte at pane `+0xff`.
Value 2 takes `mov r0, #1` at `0x1cdb78`. The alignment byte at `+0xfe`
is split by 3. Alignment 4 is horizontal centre (`orr #0x10` at
`0x1cdba0`) and vertical middle (`orr #0x100` at `0x1cdbc0`). The store
at `0x1cdbd0` writes flags **0x111** to writer `+0x5c`.

The only consumer is `0x329160`, called once from `0x329554`. It masks
`+0x5c` with `0x30` and `0x300` (`0x3291f8`, `0x329230`). A centre mask
multiplies the measured extent by float 0.5 and subtracts `ceil` of
that half (`0x23b804`) from the pane float. Low bit 1 adds
`ceil(block/2) − ceil(line/2)`, which is 0 for one line. The pane width
that reaches this writer is the source float **134.4**, not
`ceil(134.4) = 135`.

The browse painter previously ceiled that width and stretched the raster
back, because alignment 4 with line alignment 2 takes the direct sampler
only when the caller passes source size. `TxtShoot` is an integer 96px
pane and already matches. `TxtSet` stays on its X-only scale and is not
on this allowlist.

## Painter

`drawNativeCameraLower` now passes `textSampling: 'lcd-source-size'` with
`textSamplingPanes: ['TxtSShow']` on the browse `P_BrwsMenu_D` draw only.
`Brws` frame 0, the plain `Brws_02` / `Brws_03` styles, the Settings
X-scale, Welcome `TxtSet`, and the rest of the menu stay as they were.

A bounded CPU probe of that writer, composited with colour `(69,64,57)`
over the gap-column button, scores **85** in x 100–219, y 5–23 against
the frozen native. The current browser scores **837** in that box.
Shift `(0,0)` is the unique best of ±3. That probe is not a browser LCD
and does not replace recapture.

## Evidence

| Tier | Result |
| --- | --- |
| Source-identified | `TxtSShow` flags `0x111` at `0x1cdb2c`; only centering writer `0x329160` reads the pane float |
| Delivered | Existing menu, button, message, and shared-font packs |
| Implemented | Browse `TxtSShow` source-size sampler only |
| Tested | `node --test tests/camera-browse-header.test.mjs` |
| Browser-inspected | Not run. Preview 3021 and CDP were out of scope |
| Native-compared | Not recaptured. Frozen header stays **837**. Not 1:1 |

## Checks

`tests/camera-browse-header.test.mjs` locks the allowlist, the plain
`Brws_02` style, the fractional pane, `BtnMov0` at Y 105, the flag and
writer instruction words, and the frozen **10158** / **837** / **240** /
**103** counts. `git diff --check` is clean. Application typecheck and
build were not rerun. This lane did not drive Azahar or the production
browser.
