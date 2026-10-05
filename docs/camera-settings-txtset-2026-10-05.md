# Camera browse Settings `TxtSet` source size — 5 October 2026

HOME-fidelity Camera worker on `codex/camera-settings-txtset-20261005` from
fidelity `6db7e7ef`. One leftover: the browse Settings third after the
Slideshow `TxtSShow` source-size sampler closed the header. No Azahar.
No production browser. No preview 3021. No CDP. No recapture. Capture
stays inert. Slideshow, Shoot, the bound Settings X-scale, date pane
**1006**, slider **1992**, photo crop **33522**, gallery selection,
thumb interiors, Welcome, and Sound are untouched.

This is not a 1:1 claim. Tests, this note, and the frozen still do not
close pixels, input, motion, or audio.

## Assigned defect

Frozen native combined PNG
`reference/scenario-matrix/v1/captures/camera-populated-browse-global/native/combined.png`
SHA-256 `cae793c31bdf9f13d44f0834582bf99fead5bb8d652321913993bedde7ae1652`.
Mac-screen browser lower after the Slideshow source-size recapture
`04f3d6bf`:
`home-fidelity-20261001/camera-browse-header-recapture-20261005/browser/lower.png`
SHA-256 `e14e44c3be89c969627b20807b13c4714de5fe240dde3d1edaefcc0943794c82`.
Report `099bc01e592243be129e83a815a20269c734d3a64c8ddbd2fe9d4eacd62cfd3f`.
Empty mask `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`.
Threshold any RGB channel >2/255. Whole lower **8121**. Header y<32 is
**0**.

| Third | Rectangle | Count |
| --- | --- | ---: |
| Slideshow | `[0,105) × [212,240)` | 0 |
| Shoot | `[107,213) × [212,240)` | 0 |
| Settings | `[215,320) × [212,240)` | **630** |

Maximum delta is 83 at `(253,227)`: native `(70,65,58)`, browser
`(153,148,140)`.

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

`P_BrwsMenu_D` has three text panes. `TxtSet` is
`RootPane/-B-Set/Set/TxtSet`, origin 4, size
`[76.80000305175781, 24]`, alignment **4**, line alignment **2**, font
size `[20, 24]`, font `cbf_std.bcfnt`. Ancestors `RootPane`, `-B-Set`,
and `Set` are scale `[1, 1]` and rotation 0. `P_BrwsMenu_D_Brws` frame 0
leaves `Set` scale X at 1. `TxtSShow` is the same alignment class at
`[134.39999389648438, 24]`. `TxtShoot` is the same class at the integer
`[96, 24]`.

## Owner

`code.bin` `0x1cdb2c` loads the line-alignment byte at pane `+0xff`.
Value 2 takes `mov r0, #1` at `0x1cdb78`. Alignment 4 is horizontal
centre (`orr #0x10` at `0x1cdba0`) and vertical middle (`orr #0x100` at
`0x1cdbc0`). The store at `0x1cdbd0` writes flags **0x111** to writer
`+0x5c`. The setter reads those pane bytes. It does not test a pane name.

The only consumer is `0x329160`, called once from `0x329554`. It masks
`+0x5c` with `0x30` and compares with `0x10` (`0x3291f8`, `0x3291fc`),
then calls `ceil` at `0x23b804` and subtracts that half from the pane
float. The menu stores `TxtSet`'s width as float32 **76.8**, and
`ceil(76.8)` is **77**. That is the same float-versus-ceil split already
bound for `TxtSShow`'s **134.4**. `TxtShoot`'s **96** is already an
integer, so this writer does not move it off the matching ceil path.

The host direct sampler for alignment 4 / line alignment 2 runs only
when the caller passes source size. Browse `P_BrwsMenu_D` already passes
`textSampling: 'lcd-source-size'`. Adding `TxtSet` beside `TxtSShow` is
that caller. The X-only font scale from group-1/type-0 stays
`[0.6719999313354492, 0.8399999737739563]`. Welcome `TxtSet` stays on
plain `setting`. `TxtShoot` stays off the allowlist.

The earlier Settings-third note called an unbound Settings-only sampler
a screenshot fit. This entry is the same flag word and the same single
centering writer, selected by the stored non-integer width. No second
scale, clip, or pane-width install is added.

## Painter

`drawNativeCameraLower` now passes
`textSamplingPanes: ['TxtSShow', 'TxtSet']` on the browse
`P_BrwsMenu_D` draw only. `Brws` frame 0, the plain `Brws_02` /
`Brws_03` styles, the Settings X-scale, Welcome `TxtSet`, and `TxtShoot`
stay as they were.

## Evidence

| Tier | Result |
| --- | --- |
| Source-identified | `TxtSet` flags `0x111` at `0x1cdb2c`; only centering writer `0x329160` reads the 76.8 pane float |
| Delivered | Existing menu, button, message, and shared-font packs |
| Implemented | Browse `TxtSet` added to the source-size allowlist beside `TxtSShow` |
| Tested | `node --test tests/camera-settings-txtset.test.mjs tests/camera-browse-header.test.mjs tests/camera-settings-630.test.mjs tests/camera-settings-footer.test.mjs` |
| Browser-inspected | Not run. Preview 3021 and CDP were out of scope |
| Native-compared | Recapture `3bdc3192`: Settings third **630 → 0**. Whole lower **8121 → 7491**. Not 1:1 |

## Coordinator recapture — 5 October 2026

Mac built-in display, production TxtSet sampler (`9580641b` runtime;
HEAD `84d636e3`), `CAMERA_FIXTURE_SDMC_ROOT` (HNI), empty mask, threshold
any RGB channel >2/255. Scenario `camera-readonly-view-photos-page1`.
lcdDate `2026-09-25T21:35:00.000Z`. Artifacts
`home-fidelity-20261001/camera-settings-txtset-recapture-20261005/`.
Inspected the lower contact sheet: the Settings word now sits on the
native word. Remaining red is photo interiors, the gallery cursor on the
wrong cell, date glyphs, and the slider.

| Item | SHA-256 |
| --- | --- |
| Browser upper | `184bdfdf148d41cecc10d245f14708a38d4afc7c1776c4d9a6bf7eef067694d6` |
| Browser lower | `2657bb855667464a806298d1f079a20ec0ac0956f26cc1b73eb8287f0f8e119f` |
| Report | `b7da8109316596bfd6dce6fcd4352c96804343cee899e45b076122f64054fd3d` |
| Native combined | `cae793c31bdf9f13d44f0834582bf99fead5bb8d652321913993bedde7ae1652` |

Upper **33522** is byte-identical with the Slideshow-header recapture
upper. Whole lower **8121 → 7491**. Settings third `[215,320)×[212,240)`
**630 → 0** (max 2). Sample `(253,227)` is `(70,65,58)` on both LCDs.
Header y<32 stays **0**. Slideshow and Shoot footer thirds stay **0**.
Date pane **1006**, slider **1992**, and the labelled thumb interiors
are unchanged. Cube centre `(383,17)` stays `(100,100,100)` on both.

## Checks

`tests/camera-settings-txtset.test.mjs` locks the two-pane allowlist, the
absent `TxtShoot` entry, the unchanged X-only scale, Welcome's plain
`setting` label, the fractional 76.8 pane, the shared flag and writer
words, and the recaptured **7491** / header **0** / Settings **0**
counts. `tests/camera-browse-header.test.mjs` still pins the prior
header-recapture pair at whole lower **8121**.

## Independent review

Grok 4.6 `camera-settings-txtset-review-20261005-r1`: **APPROVE** of
`9580641b` (cherry-pick of `b0e0d3d3`). Browse
`textSamplingPanes:['TxtSShow','TxtSet']` matches dump. Flag setter
`0x1cdb2c` writes **0x111** from pane fields only; the only `bl` to
centering writer `0x329160` is `0x329554`. `TxtSet` width **76.8**
(`ceil` **77**) is the same float-versus-ceil split as Slideshow
**134.4**. Integer `TxtShoot` **96** stays off. X-only Settings scale
and Welcome's plain `setting` label are unchanged. Recapture `3bdc3192`
already closed Settings third **630→0** and whole lower **8121→7491**.
Not 1:1.
