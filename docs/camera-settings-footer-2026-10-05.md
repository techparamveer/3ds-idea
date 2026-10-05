# Camera browse Settings footer — 5 October 2026

HOME-fidelity Camera worker on `codex/camera-settings-footer-20261005` from
fidelity `82a16d1c`. One leftover: the browse Settings footer member.
Slideshow and Shoot thirds already score 0. No Azahar. No production
browser. No preview 3021. No CDP. No recapture. Capture stays inert.
`PicL_Op`, `ThmbBase`, `TxtThmb`, the browse-slider strip, the upper HNI
crop, gallery selection, and the Parakeet centre `(48,158)` are untouched.

This is not a 1:1 claim. Recapture dropped the Settings third **954 → 630**
and whole lower **10482 → 10158**. Tests, this note, and the stills do not
close pixels, input, motion, or audio.

## Assigned defect

Frozen native combined PNG
`reference/scenario-matrix/v1/captures/camera-populated-browse-global/native/combined.png`
SHA-256 `cae793c31bdf9f13d44f0834582bf99fead5bb8d652321913993bedde7ae1652`.
Mac-screen browser lower after the Settings X-scale recapture `e652fb3f`:
`home-fidelity-20261001/camera-settings-footer-recapture-20261005/browser/lower.png`
SHA-256 `3f5ead625db013831b6a47af7648202865811d5ec6982b2f10b2e98ad59fc169`.
Empty mask `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`.
Threshold any RGB channel >2/255. Whole lower **10158**.

| Third | Rectangle | Frozen | Recapture |
| --- | --- | ---: | ---: |
| Slideshow | `[0,105) × [212,240)` | 0 | 0 |
| Shoot | `[107,213) × [212,240)` | 0 | 0 |
| Settings | `[215,320) × [212,240)` | **954** | **630** |

Pre-recapture max was 179 at `(240,217)`: native `(241,239,236)`, browser
`(69,64,57)`. After X-scale that sample matches. Recapture max is 83 at
`(253,227)`: native `(70,65,58)`, browser `(153,148,140)`. Button-face
`(275,214)` stays `(243,242,238)` on both sides.

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

`P_BrwsMenu_D/TxtSet` is `RootPane/-B-Set/Set/TxtSet`. Parent `-B-Set` is
`(+115,-105)`. `SetBase` is the 92×34 `P_BtnDW_90x30.bclim` picture.
`TxtSet` is origin 4, size `[76.8, 24]`, alignment 4, line alignment 2,
font size `[20, 24]`, metadata `MSG P/setting`. Hit pane `BB-Set` is
`[230,210,90,30]`. `P_BrwsMenu_D_Brws` frame 0 moves `-B-Set` and `Set`; it
does not recolour `SetBase`.

## Owner

English `P/setting` is style 19, font scale `[0.84, 0.84]`, colour word
`0xff394045`. Its tokens are group-1/type-0 argument `5000` (little-endian
80), the text `Settings`, then group-1/type-0 argument `6400` (100).
`P/Brws_02` and `P/Brws_03` are plain `Slideshow` and `Shoot`.

Draw tag `0x2717c8` compares the tag group with 6 and indexes the table at
`0x2717fc`. Group 1 is `0x2718c8`. That handler loads the type halfword and
branches to the epilogue unless the type is 0. Type 0 sign-extends the
argument halfword, converts it to float32, and multiplies by the literal at
`0x271a7c` (`0x3c23d70a`, float32 0.01). It then stores two floats at
writer `+0x24` and `+0x28`:

| Path | Writer `+0x24` (X) | Writer `+0x28` (Y) |
| --- | --- | --- |
| Saved scale object present | `argument×0.01` × object `+0x1c` | object `+0x18`, copied |
| Saved scale object absent | `argument×0.01` | `1.0` (`0x271a80`) |

Style `+0x1c` / `+0x18` are the X / Y font scales already installed for
untagged Camera text. `Default`, `Disable`, and `Push` recolour
`SShowBase`, `ShootBase`, and `SetBase` together. None is a Settings-only
clip. The bound `Brws` frame stays.

The browse painter already folds style scale into the font size, which is
why Slideshow and Shoot score 0. The 80% run is the extra X scale on
`Settings` only. The following 100% run has no glyphs. Both-axis
`glyphScaleSpans` would also shrink Y and leave the direct label writer, so
they are not used. Welcome's `TxtSet` stays on the plain `setting` override.

`cameraBrowseSettingsLabel` sets browse `TxtSet` font scale X to
float32(`0.8399999737739563 × 0.7999999523162842`) =
`0.6719999313354492` and leaves Y at `0.8399999737739563`. A delivered
message with any other control sequence throws. No CSS, substitute glyph,
or screenshot fit.

## Evidence

| Tier | Result |
| --- | --- |
| Source-identified | `P/setting` 80%/100% size run; tag `0x2718c8` writes X and copies Y |
| Delivered | Existing published menu, button, and message packs |
| Implemented | Browse `TxtSet` X scale only. Welcome `TxtSet` unchanged |
| Tested | `node --test tests/camera-settings-footer.test.mjs` |
| Browser-inspected | Not run. Preview 3021 and CDP were out of scope |
| Native-compared | Recapture at `e652fb3f`. Settings third **954 → 630**. Whole lower **10482 → 10158**. Not 1:1 |

## Independent review

Grok 4.6 `camera-settings-footer-review-20261005-r1`: **APPROVE**.
Fidelity `99a4362e` is dump-backed X-only browse `TxtSet` scale. Frozen
Settings third was **954** until recapture. `P/setting` 80 then 100;
tag `0x2718c8` writes scale X and copies Y. Welcome `TxtSet` stays plain
`setting`. Not 1:1.

## Recapture (coordinator, Mac built-in, bind `99a4362e` / note `e652fb3f`)

User-authorized laptop display (Sidecar disconnected). Frozen native
reused (`cae793c3…`); Azahar not relaunched. Production `127.0.0.1:3000`
rebuilt and restarted with `CAMERA_FIXTURE_SDMC_ROOT` at
`reference/user/sdmc`. Chrome `--window-position=80,60`. Raw LCD
`captureScreensAt`. `?cameraFixture=hni`, Welcome → folder → gallery
`HNI_0001`. Empty mask `dc4b320b…`, 2/255.

Artifacts `home-fidelity-20261001/camera-settings-footer-recapture-20261005/`.

| Item | SHA-256 / count |
| --- | --- |
| Browser upper | `184bdfdf148d41cecc10d245f14708a38d4afc7c1776c4d9a6bf7eef067694d6` (byte-identical) |
| Browser lower | `3f5ead625db013831b6a47af7648202865811d5ec6982b2f10b2e98ad59fc169` |
| Report | `468e6340389f8e0d74b577c9df0a0f004698dc4733d759aea29f8dc5ef43b34e` |
| Whole upper | **33522** (max 46) unchanged |
| Whole lower | **10482 → 10158** |
| Settings third | **954 → 630** |
| Slideshow / Shoot | **0 / 0** |
| Date pane | **1006** unchanged |
| Slider | **1992** unchanged |

The lower drop equals the Settings drop (**324**). Cube centre stays
`(100,100,100)`. Remaining Settings **630** is leftover glyph coverage
(native ink at `(253,227)` versus browser pale). That is a new leftover,
not this bind.

**Static still only.** Input, motion and audio were not compared. Whole
`camera-readonly-view-photos-page1` stays fail.

## Remaining

Settings third leftover **630**. Date pane **1006**, slider strip **1992**,
upper HNI crop, gallery selection, and Parakeet stay with their owners.
Static still only. Input, motion, and audio were not compared.
