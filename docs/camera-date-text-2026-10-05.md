# Camera date-cell text — 5 October 2026

HOME-fidelity Camera worker on `codex/camera-date-text-20261005` from
fidelity `e6bcca9f`. One leftover: `TxtThmb` coverage on the large date
cell. No Azahar. No production browser. No preview 3021. No CDP. No
recapture. Capture stays inert. `PicL_Op`, `ThmbBase`,
`cameraDateGroupOrange`, the browse-slider strip, and the upper photo
crop are untouched.

This is not a 1:1 claim. The painter is unchanged. Tests, this note, and
the reused still do not close pixels, input, motion, or audio.

## Assigned defect

Frozen native combined PNG
`reference/scenario-matrix/v1/captures/camera-populated-browse-global/native/combined.png`
SHA-256 `cae793c31bdf9f13d44f0834582bf99fead5bb8d652321913993bedde7ae1652`.
Mac-screen browser lower after the `PicL_Op` recapture `1da03426`:
`home-fidelity-20261001/camera-date-group-recapture-20261005/browser/lower.png`
SHA-256 `0265b51095b1051f94424eea9cf2b2c31ad23da3ed6a1137d4cc9a9a31d05616`.
Empty mask `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`.
Threshold any RGB channel >2/255.

Date pane `[52,49,66,52]` (exclusive `[52,49,118,101]`) scores **1006**.
Mismatch bounding box is x 56–110, y 58–92. Maximum delta is 255 at
`(60,59)`.

| Sample | Native | Browser |
| --- | --- | --- |
| Fill `(85,75)` | `(255,161,0)` | `(255,161,0)` |
| `(60,59)` | `(255,255,255)` | `(255,161,0)` |
| `(70,85)` | `(255,161,0)` | `(255,225,173)` |

`(255,225,173)` is partial white over UserBG orange. The fill centre
already matches. The 1006 pixels are glyph coverage: native white where
the browser is still orange, and browser pale text where native is still
orange. A single translation of the browser ink onto the native ink is
not the owner. Whole-pane overlap is already best at shift `(0,0)`
(1109 of 1462 native ink pixels, threshold 20). The year band
y 79–92 stays best at `(0,0)` (recall 0.72). The `DD/MM` band y 58–73
does not exceed recall 0.54 under any shift of ±8 rows and ±16 columns.

## Dump identity

EUR Camera `0004001000022400` v4097, content index 0 / `0000001a`. Image
base `0x100000`. Converter **ctr-native-web 1.2.0**. Private executable
SHA-256
`3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`.

| Element | Manifest / pack | Dump source | SHA-256 |
| --- | --- | --- | --- |
| `exefs/code.bin` | title `0004001000022400` v4097 | `contents/0000-0000001a/exefs/code.bin` | `3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c` |
| Browse archive | `lyt-P_Brws_D-arc-LZ.json` | `lyt/P_Brws_D.arc.LZ` | `ed22962fa35a3019457302e059ddc19709fa07e36ae1d67b506a58e9d317181a` |
| `P_BrwsFld` | `resourceSources.layouts.P_BrwsFld` | `lyt/P_Brws_D.arc.LZ/blyt/P_BrwsFld.bclyt` | `b12a383b73d75d331f2c1278c17ddeab82ba2cdf6503348ff0c9959e296877b0` |
| `P.msbt` | `resourceSources.messages.P` | `msg/EU_English.LZ/P.msbt` | `c7c8333e0d051725c45a27bac7f239a6e36699044053b5013cd4edd4cc80be05` |
| `RI.mstl` | `resourceSources.styles.RI.mstl` | `msg/EU_English.LZ/RI.mstl` | `f2505d2077a5c90de9ba222d1e12d82d23168f44216f3e21dfdc1e005570ef1a` |
| `cbf_std.bcfnt` | `fonts/shared/font.json` | shared system font | `95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581` |

`P_BrwsFld/TxtThmb` is `RootPane/-B-Thmb/ThmbBase/TxtThmb`. Origin 4,
translation `[-1,-2,0]`, size `[49.92000198364258, 19.19999885559082]`,
alignment 4, line alignment 2, character spacing 0, line spacing 0,
font size `[16, 19.19999885559082]`, both colours white, font
`cbf_std.bcfnt` (cell 25×30, line feed 30, alpha). Metadata
`MSG P/Brws_05_L`. No `P_BrwsFld_*` track targets `TxtThmb`.

The large cell centre is `(84,74)`. `ThmbBase` translation `[1,-1]` puts
its centre at `(85,75)`. `TxtThmb` then sits at `(84,77)`. Under the
current centred two-line writer, pane height 40 with block origin 0 and
the authored height 19.2 with block origin −10.4 place the same glyph
cells. The existing override height 40 is not a separate vertical owner.

## Message owner

Name table `0x4403d8` / `0x4403dc` / `0x4403e0` is `Brws_05_L`,
`Brws_05_M`, `Brws_05_S`. Binders `0x2d3ca4` and `0x2d7c4c` index that
table by the grid size and call `0x21bb7c`. The large grid takes index 0,
`Brws_05_L`. `0x21bb7c` calls the style installer `0x21f7ec`, which writes
style+0 into the pane width and multiplies the font cell by the style
scales. It does not write the pane height.

Full `P.msbt` label `Brws_05_L` is style 5. The published message list
omits that label; style 5 is already in the published `RI.mstl` and
matches the full archive:

| Style 5 field | Value |
| --- | --- |
| `unresolvedWords['0']` | 58 (installed pane width) |
| `fontScale` | `[0.6800000071525574, 0.6800000071525574]` → font size `[17, 20.4]` |
| spacing | character 0, line 0 |
| `unresolvedWords['4']` | 2, not read by `0x21f7ec` |

The message text is `/\n` plus controls, in order:

| Token | Effect |
| --- | --- |
| group 3 / type 2 | `0x21ca20` → getter `0x271db8` reads byte +3; formatter `0x32f1c0` writes two zero-padded digits |
| group 2 / type 0 argument `0200` | `0x27193c` adds +2 to writer cursor X |
| `/` | slash glyph |
| group 2 / type 0 argument `0200` | adds +2 again |
| group 3 / type 1 | getter `0x271e80` reads byte +2; same two-digit formatter |
| `\n` | second line |
| group 3 / type 0 | getter `0x271e28` reads the leading halfword; formatter `0x32f2ec` writes the year |

For the frozen HNI date that expands to `25/09` over `2026`. The painter
already submits that expanded string. It does not install width 58, font
scale 0.68, or the two cursor advances.

## Why that owner is not bound

The cursor add is the same group-2/type-0 handler already used by the
capacity line. The bitmap writer accepts `cursorAdvances` only on its
one-line, alignment-3, line-alignment-1 path and throws for this
two-line alignment-4 / line-alignment-2 pane. Measurement `0x271b98`
includes the same +2 in the line width before centering, so a draw-only
nudge would be a different writer. Welcome `TxtDlg` already rejected
guessing `lcd-source-size` on multiline text. The direct sampler's
multiline gate is writer `0x111`, which requires line alignment 0; this
pane's line alignment is 2.

An approximate atlas blit of width 58, font size `[17, 20.4]`, and the
two +2 advances did not reproduce the browser lower and did not establish
a close of the frozen 1006. Shipping that geometry, or reconstructing
glyphs, would be a screenshot fit. No other unused pane, clip, frame, or
sampler uniquely owns the leftover.

## Labelled gap

The large date cell's remaining **1006** lower pixels are a
**source-gap** on already-bound `TxtThmb`. The painter stays
`DD/MM\nYYYY` (`25/09\n2026`) at `[49.92, 40]`. Fill `(85,75)` stays
`(255,161,0)`. Slider strip **1992** and upper photo crop **33522** stay
outside this slice.

## Checks

`tests/camera-date-text.test.mjs` locks the frozen hashes, the two
samples, the fill sample, and the 1006-pixel pane, and locks the painter
override that this slice does not change. `git diff --check` is clean.
Application typecheck and build were not rerun. This lane did not drive
Azahar or the production browser.
