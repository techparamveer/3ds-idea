# Sound remaining residual after HudTime clock match — 4 October 2026

Worker slice on `codex/sound-remaining-residual-20261004` from HOME fidelity
`87b65a41`. Uses only the HudTime-phase recapture pairs. No Azahar. No preview
3021. No CDP 9320. Songs stay unsupplied. The 12/10 HudTime pitch adaptation is
unchanged.

Private recapture root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/sound-clock-recapture-20261004/`.
This slice's notes and crops:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/sound-remaining-residual-20261004/`.

## Pairs (not recaptured)

| Still | SHA-256 | Role | Local clock |
| --- | --- | --- | --- |
| `Nintendo 3DS Sound_25.09.26_22.27.14.541.png` | `9dea0cc2fa7022ccd032c5a94ae59c2dbe37e6b7e800fbf8668b356fc9e5ce69` | `sound-first-run` combined | `22 27` (seconds 14, even) |
| `Nintendo 3DS Sound_25.09.26_22.31.31.595.png` | `65fc5f8819d31c49622d9e2a8ee7ba79c0675fd7dd3a73f783255eb7efe3b4cd` | `sound-empty-entry` combined | `22:31` (seconds 31, odd) |

Hashed originals under
`/Users/paramveer/.codex/3ds-artifact-overflow/reference/screenshots/`.
Browser LCDs and empty-mask compare reports are the HudTime-phase recapture.
Threshold 2/255. Clock ROI `[95,216,194,240]` is **0** on both uppers (max 1).

| File | SHA-256 |
| --- | --- |
| `R/browser-first-run/upper.png` | `16565d8e586edce659beadb9e7f7d72bcd8e2b81479a85bca424480d4294ceab` |
| `R/browser-first-run/lower.png` | `b9d1093ab9641460de6e9e0490707ae12d41008085ee8f7c9995d12fd504fbb9` |
| `R/diff-sound-first-run-hudtime-phase/report.json` | `cb06bed5902eb0bf42f409ad3f3445799e7273fbc53dd1081101490184c3ba45` |
| `R/diff-sound-first-run-hudtime-phase/upper-contact-sheet.png` | `a37bd43b49408e3a729029355fbd191e45b29d0714d282e80eb2d10eac4e8356` |
| `R/diff-sound-first-run-hudtime-phase/lower-contact-sheet.png` | `64148ff1b2f83946e0a0f97105ee6e88eb2033a68192f4f8fb5bc97804600b29` |
| `R/browser-empty-entry/upper.png` | `8d76f568cf79522a1febc689c44ac6b6f8328971e86e4dc4e535c1fe0a7216d0` |
| `R/browser-empty-entry/lower.png` | `ee103d93d744f5037fd36f24ad93403bf57298b2e1d74752da09d542023ea38d` |
| `R/diff-sound-empty-entry-hudtime-phase/report.json` | `d28688a4a28c3c5cabc303cc6fb824045ee4a074f4f25fffcacc07944e5425f2` |
| `R/diff-sound-empty-entry-hudtime-phase/upper-contact-sheet.png` | `40a99fb8dfa25654332816161d24293d70f3a4ec37cb600fe61fddfd311a4996` |
| `R/diff-sound-empty-entry-hudtime-phase/lower-contact-sheet.png` | `4cd485a1adcb1a0d66afb2b7b911b92037262896e6d085df92fed320de31b9f4` |
| this-slice `cluster-pixels.json` | `29a262476c44ccfba89d46af517f81afa1dfe560dcc9139d237bc01b08e11ec2` |
| this-slice `trace-hud-battery-volume.txt` | `59fcb11b1cf9ef3f9e411737f6fdc3a6a270e7f53cdfdf0fa7c8ee77a39d5170` |

Inspected all four contact sheets and heatmaps. The clock band is black on both
uppers. Remaining red is title/Span/birds (both uppers), volume `C_HudSndB`
(both), battery plug (empty-entry only), the guide perimeter and Next (first-run
lower), and the empty-main row/slider/footer.

## Clusters (existing recapture, empty mask)

Half-open rectangles. Counts are pixels with any RGB channel delta greater than
2. Regions overlap, so they do not sum to the whole LCD.

| Cluster | Rectangle | First-run | Empty-entry | Owner |
| --- | --- | ---: | ---: | --- |
| Whole upper | 400×240 | **6094** | **6404** | mixed |
| Title | `[0,3,400,30]` | 1774 | 1774 | `S_Inf_U-TitleBar` glyph raster |
| Span | `[0,100,400,114]` | 2314 | 2442 | `S_Vis_Span_U` silent-pose adaptation; native wave deforms |
| Birds | `[15,174,115,216]` | 1558 | 1558 | `ParakeetA_U_Wait` RNG/phase |
| Volume `C_HudSndB` | `[0,216,30,240]` | 130 | 130 | Pattern frame vs CFG volume |
| Battery `C_HudBut_B` | `[45,216,85,240]` | 1 | 183 | Pattern frame vs seconds parity |
| Battery fill 19×10 | `[59,223,78,233]` | 0 | 182 | `ButF_B` plug on odd seconds |
| Clock | `[95,216,194,240]` | **0** | **0** | already matched |
| Playback time | `[230,216,400,240]` | 0 | 0 | already matched |
| Whole lower | 320×240 | **6267** | **16021** | mixed |
| Guide interior | `[20,20,300,220]` | 195 | — | all 195 sit in Next glyphs `[138,196,182,213]` |
| Guide perimeter | complement of interior | 6072 | — | unsupported guide compositor/veil |
| Empty row | `[0,32,320,64]` | — | 1916 | cursor/icon fill; label is **0** |
| Empty icon fill | `[0,38,7,57]` | — | 133 | untraced compositor |
| Empty slider | `[0,144,320,175]` | — | 4271 | `C_SldH_L` Rate/Icon vs native grey handle |
| Empty footer | `[0,178,320,240]` | — | 4707 | StreetPass/Settings/Open glyph blend |

Empty-entry upper is first-run + **310**. That split is Span **+128** and
battery **+182**. Volume is the same **130** on both stills. First-run lower
**6267** is unchanged from the title-blue-fit / source-counter guide page 1.

## Source trace (one bounded pass)

Sound title EUR `0004001000022500` v3088, content 0 `0000000b`, `exefs/code.bin`
SHA-256 `3c57f2c4091c1bec6b3834609f1e2a6488712e21775d7548b441c69c60b3e5a9`, base
`0x100000`. Capstone listing:
`.../sound-remaining-residual-20261004/trace-hud-battery-volume.txt`.

Pane metadata `TYPE=vol` constructs `C_HudSndB` (vtable `0x31ed3c`). `TYPE=but`
constructs `C_HudBut_B` (vtable `0x31ecd0`). Init at `0x2965a8` registers the
`Pattern` / `vol` / `but` / `TYPE` strings and writes the 4-byte records at
`0x33d148`. Only even bytes are stored. Record 0 is `[5,0,4,0]`. Records 1–6
repeat the same even/odd frame (6, 0, 0, 1, 2, 3).

Battery update (but vtable slot 17, `0x17ae6c`) recomputes `+0x4e` from CFG
`0x3771d1`, then `0x17adfc` reads the HudTime seconds byte at `0x3c9a7c+0x2c`
and `tst #1`. Odd seconds take table byte0 as the Pattern frame; even seconds
take byte2. `0x2072f4` looks up the `Pattern` clip and writes that frame.
**State 0 is the only blinking record: odd → frame 5 (`HudBatPlg`), even →
frame 4.** First-run (even, no plug, 1 battery pixel vs hardcoded frame 4) and
empty-entry (odd, plug, 182 fill pixels) uniquely require this state. Other
charge states and the CFG field names are untraced.

Volume update (vol vtable slot 17, `0x17aeec`) maps CFG `0x3771d1+3`:

| Volume byte | Pattern frame | Texture |
| ---: | ---: | --- |
| 0–3 | 4 | `HudSnd_B_04` |
| 4–17 | 3 | `HudSnd_B_03` |
| 18–37 | 2 | `HudSnd_B_02` |
| 38–57 | 1 | `HudSnd_B_01` |
| 58–255 | 0 | `HudSnd_B_00` (three waves) |

It does **not** use the seconds table. Both stills show one native wave against
the browser's three-wave frame 0. The CFG byte is unsupplied, so frame 0 is
left in place. Selecting 1/2/3 to match the still would hide the state gap.

## Runtime change

`soundHudBatteryPatternFrame` binds `C_HudBut_B_Pattern` to **5** on odd
wall-clock seconds and **4** on even, on the empty-entry/guide HUD path only.
`soundHudTimeKey` already carries `seconds & 1`, so the pair already repaints.
`C_HudSndB_Pattern` stays frame 0. HudTime 12/10 spans are untouched.

This is a source-traced Pattern frame for battery **state 0**. It is not a CFG
dump, a PTM name, or a whole-LCD pass. First-run (even) keeps frame 4. Empty-entry
(odd) should drop the 182-pixel plug cluster after a coordinator recapture; this
worker did not recapture.

## Clusters that stay open

- **Title (1774):** capture-fitted bar blue already applied; remaining is glyph
  raster. No LCD sampling guess.
- **Span (2314 / 2442):** labelled silent-pose adaptation; native deformation
  needs bone/vertex updates. The +128 empty-vs-guide difference is phase.
- **Birds (1558):** Wait silhouette is correct; live RNG/scheduling stays gated.
- **Volume (130):** source-mapped, CFG unsupplied. Native one wave vs frame 0.
- **Guide perimeter (~6072):** unsupported compositor/veil. Interior residual is
  only Next glyphs (195).
- **Empty row / icon fill:** label is 0; left fill compositor untraced.
- **Empty slider (4271):** native grey capsule vs browser red Rate/Icon tick at
  `C_SldH_L_Rate` frame 0. No second source trace; no visual guess.
- **Empty footer (4707):** StreetPass/Settings/Open glyph blend, already noted.

## Tests

- `tests/sound-remaining-residual.test.mjs` rehashes the recapture files and
  recounts the cluster table, including clock **0** and the 310 = 128+182 split.
- `tests/sound-entry-native.test.mjs` checks even → battery frame 4 /
  `HudBatLgt_00`, odd → frame 5 / `HudBatPlg`, volume still frame 0 /
  `HudSnd_B_00`, and the existing 12/10 HudTime spans.

## Coordinator recapture (not done here)

After integrate, muted production pair against the same natives. Report whole
LCDs, clock `[95,216,194,240]`, battery `[45,216,85,240]`, and volume
`[0,216,30,240]`. Empty-entry odd seconds should lose the plug cluster if state
0 is the live CFG. Volume will not move without a CFG volume byte. Motion and
audio remain open. No 1:1 claim.

## Recapture (coordinator, Mac built-in, `0eee41c6`)

User-authorized laptop display. Frozen empty-entry native reused (`65fc5f88…`);
Azahar not relaunched. Production `127.0.0.1:3000`. Chrome `--window-position=80,60`.
Raw LCD `captureScreensAt` after Welcome Next/Next/OK. Empty mask, 2/255.
Artifacts `home-fidelity-20261001/sound-empty-entry-recapture-20261005/`.
Announcement `Nintendo 3DS Sound. No songs available.`

| Region | Before (HudTime `8d76f568…`) | After |
| --- | ---: | ---: |
| Whole upper | 6404 | **6222** |
| Whole lower | 16021 | **16021** (byte-identical `ee103d93…`) |
| Title `[0,3,400,30)` | 1774 | **1774** |
| Row `[0,32,320,64)` | 1916 | **1916** |
| Slider `[0,144,320,175)` | 4271 | **4271** |
| Footer `[0,178,320,240)` | 4707 | **4707** |
| Clock `[95,216,194,240)` | 0 | **0** |
| Battery `[45,216,85,240)` | 183 | **1** (max 4) |
| Volume `[0,216,30,240)` | 130 | **130** |

Upper **6404 → 6222** is the odd-second charging plug in battery
`[59,223,78,233)`: hashed browser `(255,222,115)` versus native/new black.
Title, row, slider, footer and volume labelled leftovers did not move.
Static still only. Not 1:1.
