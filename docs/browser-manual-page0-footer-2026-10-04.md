# Browser Manual page-0 footer - 4 October 2026

Worker on `codex/browser-manual-footer-20261004`. Visible source-backed correction. Unused Wait/Choice/focus clips were probed first and do not uniquely own lower-footer **1934**. Close and Enlarge now sample with the same `lcd-source-size` path already used on page Back and Contents Close/Language. Header origin38 / centre20 was not retuned. Enlarge stays inert. Not 1:1.

## Pair

Frozen native `_03.10.26_08.04.06.504.png` SHA-256 `a28e9f437a0c78bfef3204e343189cdec89ac00e004e8d6082ecc7dff26870b4`. Official lower crop `(40,240,320,240)`. Footer ROI `[0,212,320,240)`. Hashed browser `home-browser-manual-footer-20261003/browser-after-desktop-v2/manual-page-0` upper `147e6c159e4f44186240dc5f0a1a8789ec4f1a34e132c2631a95af46974c2713`, lower `75546d9c0a0e6870cb69d2010436b74cfbb12913daa8c9b3cdef37f39e2cb8da`. Report `668d163985f69f48bd94f426a539424fe403ab6dfc79acdfe48192739f096321`. Empty mask. Threshold any channel >2/255. Hashed production footer stays **1934** (max 199 at `(83,233)`); whole lower **2680**. That pair is the before capture.

## Source

Footer chrome is Manual applet `0004003000009b02` v5120 RomFS SHA-256 `1ad09a3d260fbc7da5c91ab5a6bfa93944459a9b181f3ad92b0560b7eec6e657`, packs `packs/manual/layout-BtnClose01.json`, `layout-BtnBack00.json`, `layout-BtnTextSize00.json`. Page body remains Browser `0004003000009d02` v9232 content `0000001d` `romfs/Manual.bcma` SHA-256 `9f04453f23476615912972530a99abccaee22361cc69bc80052d47acf907831b`. Live converter `ctr-native-web` 1.2.0 / CTRTool 1.3.0. Private `manual-native14` is the same title/version/source SHA with converter 1.4.0; layouts and published SceneIn tracks are byte-equal.

BtnClose01 text is icon-only U+E071. Close SceneIn group `G_Scene_00` -> `BtnClose01`. Close Select/Decide/Invalid group `G_Btn_01` -> `Bounding_00` only. Back/Enlarge animation groups are empty. Footer clips have no Wait/Choice.

## Probe

Select frame 0 matches SceneIn frame 20 for idle colours and settled translation. Close Select cannot paint chrome. Decide/Invalid/KeyDecide/SceneOut are press, disabled or exit. Residual 1934 is glyph weight/placement.

## Correction

`drawApplicationManualPage` sets `textSampling:'lcd-source-size'` on `BtnClose01` and `BtnTextSize00`. Back already used that sampler. No snap, CSS, colour, font, lcd or `azahar-12p4-fit` guess.

Offline `scripts/verify-stock-helpers.mjs` Browser page-0 vs hashed native (canvas native-darken-canvas, shared font.json). Offline before matched hashed footer at 0 over 2.

| ROI | Before hashed / offline | After offline |
| --- | ---: | ---: |
| lower whole | 2680 / 2684 | **2430** |
| footer `[0,212,320,240)` | **1934** / 1938 | **1684** |
| Close `[0,212,40,240)` | 189 / 193 | **54** |
| Back `[40,212,210,240)` | 862 / 862 | **846** |
| Enlarge `[210,212,320,240)` | 883 / 883 | **784** |

Remaining **1684** is glyph AA plus a Close hairline at `(0,212)`. Header 1473 and body 746 are labelled capture-fit leftovers.

## Recapture

Coordinator only: re-run `browser-manual-browser-v2.mjs` SHA-256 `fb282c968adee9e536197b6b25f5a3c08577635dcebe23e6b4e8a906001d4fc9` after integration. Do not recapture natives. Do not drive Azahar or preview 3021 / CDP 9320 from this worker.
