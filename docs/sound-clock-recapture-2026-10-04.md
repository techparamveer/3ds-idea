# Sound HudTime clock recapture — 4 October 2026

Worker recapture on `codex/sound-clock-recapture-20261004` from HOME fidelity
`bcb655b8`. Runtime on exclusive production preview 3021 is Sound clock
`605f39fe`. No product change. No Azahar. Follows the
[clock rework](sound-empty-clock-2026-10-04.md).

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/sound-clock-recapture-20261004/`.

## Why these pairs

The rework selects type-47 `:` on odd wall-clock seconds and ` ` on even
seconds, with labelled 12/10 fixed-pitch spans. Earlier first-run was
**6,627 upper (533 in the clock)** before that change. These stills are the
matrix natives, not a new Azahar pass.

| Still | SHA-256 | Role | Injected `lcdDate` | Local clock |
| --- | --- | --- | --- | --- |
| `Nintendo 3DS Sound_25.09.26_22.27.14.541.png` | `9dea0cc2fa7022ccd032c5a94ae59c2dbe37e6b7e800fbf8668b356fc9e5ce69` | `sound-first-run` combined | `2026-09-25T21:27:14.000Z` | `22 27` (seconds 14, even) |
| `Nintendo 3DS Sound_25.09.26_22.31.31.595.png` | `65fc5f8819d31c49622d9e2a8ee7ba79c0675fd7dd3a73f783255eb7efe3b4cd` | `sound-empty-entry` combined | `2026-09-25T21:31:31.000Z` | `22:31` (seconds 31, odd) |

Hashed originals under
`/Users/paramveer/.codex/3ds-artifact-overflow/reference/screenshots/`.
Matrix copies with the same SHA-256:
`.../scenario-matrix/v1/captures/sound-first-run/native/combined.png` and
`.../sound-empty-entry/native/combined.png`.

## Capture

Muted Chrome CDP 9320, preview `http://127.0.0.1:3021/?lcdCapture=1`, empty
song manifest. `lcdElapsedMs=12000` (historical Sound sample, not a recovered
native epoch). `captureScreensAt(12000, lcdDate)` with
`calendarSampling=verification-settings-local-replay`. Empty mask
`scripts/native-compare/empty-mask.json` SHA-256
`dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`.
Official compare `scripts/native-compare/compare.mjs`. IndexedDB prefs
restored byte-identically. Browser process left open.

Route: HOME Sound slot 7 selected → A → settled guide page 1 (`Nintendo 3DS
Sound`) → A through Next / Next / OK → empty main (`No songs available.`).
The empty-entry date was injected on the second `captureScreensAt` in that
same session.

## Scores

Clock ROI `[95,216,194,240]` (99×24). Threshold 2/255. Empty mask.

| Pair | Whole upper / lower | Clock ROI | Clock max | Official result |
| --- | ---: | ---: | ---: | --- |
| `sound-first-run-hudtime-phase` | **6,094 / 6,267** | **0** | 1 | `unexplained-differences` |
| `sound-empty-entry-hudtime-phase` | **6,404 / 16,021** | **0** | 1 | `unexplained-differences` |

First-run upper dropped 6,627 → 6,094, which is exactly the old 533-pixel
clock box. Lower 6,267 is unchanged from the source-counter / title-blue-fit
guide page 1. Empty-entry lower 16,021 and lower PNG SHA-256
`ee103d93d744f5037fd36f24ad93403bf57298b2e1d74752da09d542023ea38d` match the
historical matrix empty-main lower; HudTime is upper-only.

Separator columns 154–159 (rows 219–235) agree: first-run max 64 (no colon
ink, `22 27`); empty-entry native/browser both 64 / 64 / **237** / **225** /
64 / 64 (colon at 156–157, `22:31`).

## Artifacts

| File | SHA-256 |
| --- | --- |
| `R/browser-first-run/upper.png` | `16565d8e586edce659beadb9e7f7d72bcd8e2b81479a85bca424480d4294ceab` |
| `R/browser-first-run/lower.png` | `b9d1093ab9641460de6e9e0490707ae12d41008085ee8f7c9995d12fd504fbb9` |
| `R/diff-sound-first-run-hudtime-phase/upper-contact-sheet.png` | `a37bd43b49408e3a729029355fbd191e45b29d0714d282e80eb2d10eac4e8356` |
| `R/diff-sound-first-run-hudtime-phase/lower-contact-sheet.png` | `64148ff1b2f83946e0a0f97105ee6e88eb2033a68192f4f8fb5bc97804600b29` |
| `R/diff-sound-first-run-hudtime-phase/report.json` | `cb06bed5902eb0bf42f409ad3f3445799e7273fbc53dd1081101490184c3ba45` |
| `R/browser-empty-entry/upper.png` | `8d76f568cf79522a1febc689c44ac6b6f8328971e86e4dc4e535c1fe0a7216d0` |
| `R/browser-empty-entry/lower.png` | `ee103d93d744f5037fd36f24ad93403bf57298b2e1d74752da09d542023ea38d` |
| `R/diff-sound-empty-entry-hudtime-phase/upper-contact-sheet.png` | `40a99fb8dfa25654332816161d24293d70f3a4ec37cb600fe61fddfd311a4996` |
| `R/diff-sound-empty-entry-hudtime-phase/lower-contact-sheet.png` | `4cd485a1adcb1a0d66afb2b7b911b92037262896e6d085df92fed320de31b9f4` |
| `R/diff-sound-empty-entry-hudtime-phase/report.json` | `d28688a4a28c3c5cabc303cc6fb824045ee4a074f4f25fffcacc07944e5425f2` |

Inspected all four contact sheets and both clock crops. The clock band is
visually `22 27` / `22:31` as expected; the upper heatmaps are black on the
digits. Remaining red is title/Span/birds (both uppers), the guide perimeter
and Next (first-run lower), and the empty-main row/slider/footer/icon fill
(empty lower). Volume `C_HudSndB` still flags on empty-entry.

## Remaining

Clock ROI pixel-tier (max delta 1) is not byte-identical and is not a
whole-scenario pass. Group-5 12/10 pitch remains a labelled adaptation.
`0x17e930` refresh cadence is untraced; a 1 Hz separator toggle needs a
sequence capture. Span deformation, bird phase, volume pattern frame, guide
compositor, settled-row fill and footer blend are unchanged. HOME prefix is
six-row slot 7 + A, not a matched native navigation log. Motion and audio
remain open. Matrix unchanged. No 1:1 claim.
