# U24R2 review — Settings Software/Extra Data "SD Card" LCD sampling — 6 October 2026

Reviewer U24R2 (Grok 4.7 Extra High, independent; worker U24 was Grok 4.6).
A previous Claude review round stopped on a rate limit before writing a note.
Reviewed `git diff 3b2655a1..20c20b14` on
`codex/settings-sdcard-label-review-20261006`. I did not launch or click
Azahar, and I did not open the production browser on `:3000` or `:3001`.

**Verdict: APPROVE-WITH-NITS.** The source change is the Software / Extra
Data `SMng_U_01` draw. It opts `TextBox_03` into the existing writer-0x101
`textSampling:'lcd'` allowlist and does not pass `azahar-12p4-fit`
(`src/os/stock-native-settings.ts:272`). The pane qualifies. The coordinator
pair drops Software upper from 521 to 6 and leaves Data, Parental, Other, and
the Software lower unchanged. Nothing is marked pass.

## Independent checks

### 1. Allowlist origin, and whether `TextBox_03` qualifies

The allowlist is sourced. Commit `54d7d0b8` ("Sample allowlisted Notifications
row titles once on the writer-0x101 direct path") introduced
`textSamplingPanes` because other titles were not shown to share
Notifications' writer. The note is
`docs/notifications-list-direct-2026-10-04.md`. The predicate is still
`src/os/native-renderer.ts:157`: an explicit allowlist entry, plain `lcd`
(not `lcd-source-size`), alignment 3, lineAlignment 2, no colour or cursor
spans, no block-origin override, and every glyph `left >= 0`. Direct sampling
also needs an alpha font, one line, spacing 0, an integer pane size, and an
identity transform (`native-renderer.ts:158`). Flags `0x101` for alignment 3 /
line alignment 2 come from `nativeTextWriterFlags`
(`src/os/bitmap-font.ts:29-48`). The addresses `0x16b080` and `0x18fe2c` are
the Notifications `000400300000a002` trace already recorded on that path.
This slice does not add an mset disassembly. `TextBox_03` qualifies because
its BCLYT flags match that predicate.

Verified from Settings content 0 / `0000003d`
`up_LZ.bin/blyt/SMng_U_01.bclyt`
(`a644e5620b65fbae9cc8ce47fcb17ddb7466afb49362f942a49955ba5b4f60c5`) and
`tests/settings-sdcard-label.test.mjs:23-51`, which passed here:

| Input | Value |
| --- | --- |
| Pane | origin 4, size `[269,24]`, translation `[-30,34,0]` |
| Alignment | 3 / lineAlignment 2, `nativeTextWriterFlags(3,2) === 0x101` |
| LCD box | left `200 + (-30) + (-269 * (4 % 3) / 2) = 35.5`, top 74 |
| String | `dat_sd_u` "SD Card", spacing 0, `cbf_std` alpha, every glyph `left >= 0` |
| Neighbours | `TextBox_04` alignment 5 / 0 at integer left 98; `TextBox_05` alignment 4; `TextBox_00` alignment 4, multiline, integer left 21 |

`SMng_U_01_NonSD` does not move `TextBox_03`. English style 491 sets the
string and the 0.75 scale; it does not change alignment. The half-pixel left
is why this pane was filtered twice. It is not what admits the pane. Whole-layout
`lcd` leaves 3/2 on the pane raster: worker `measure.json` `lcdWhole` software
SHA matches the baseline SHA, and `lcd` matches `lcdFit`
(`00736e862105f0a9fc3596fc3f389fa5f7d229581b11752ef3efd2c3275e56f7`). Data's
SHA is the same in every mode. Preview `70c4b070` has the same tree as
`20c20b14` (`2cff37b878da796a999421ed2afa757406e1bf15`) on base `3b2655a1`.

Pane-name allowlisting is the right shape. A rule "every alignment 3 / line
alignment 2 pane whose origin is on a half pixel" would contradict the
Notifications gate (`docs/notifications-list-direct-2026-10-04.md:71-74`) and
would miss panes the predicate already names. Converted packs contain 25
alignment-3 / line-alignment-2 text panes. Half-pixel ones not added by U24:

- Camera `C_DlgGuid1BtnW` / `C_DlgGuid2Btn` `TxtNumber0` (top 211.5). Drawn
  with whole-layout `lcd-source-size` and no allowlist
  (`src/os/stock-native-camera.ts:351`), so `explicitPane` stays false.
  `native-renderer.ts:156` already keeps this pane off writer 0x101.
- Sound copies of those two `TxtNumber0` panes. The guide draw allowlists
  `Guid1TxtW` only (`src/os/stock-native-sound.ts:223`).
- Sound `S_Inf_U-TitleBar` `TitlTxt` (top 4.5). One call overrides translation
  and size (`stock-native-sound.ts:173`); the other passes the message only
  (`:233`). Neither sets `textSampling`.
- Notifications `NewsWndwNews_U_00` `T_NewsTitleB_00` (top 129.5). Not drawn.
  The drawn `NewsWndwNews_D_00` titles are already allowlisted
  (`stock-native-personal-tools.ts:196`), including `T_NewsTitleF_00` at
  top 128.0007. That fractional part is not 0.5, which is why a half-pixel
  rule cannot replace the flag predicate.
- Settings `SMng_U_00` `TextBox_00` (left 37.5) and `TextBox_03` (left 35.5).
  Unpublished.

Integer 3/2 panes a half-pixel rule would also skip: HOME theme-shop titles
and prices (not drawn), `SMng_U_02` `TextBox_00` / `TextBox_03` (left 35,
unpublished), and Sound `S_Common-Text` `Null` (drawn with size and
translation overrides, no `textSampling`, `stock-native-sound.ts:192`).

### 2. No CSS, hand drawing, or per-pane numeric tuning

`git diff 3b2655a1..20c20b14` changes one runtime file,
`src/os/stock-native-settings.ts`. The new options are
`textSampling:'lcd'` and `textSamplingPanes:['TextBox_03']`. There is no new
coverage constant, no CSS, and no glyph bitmap. The comment at
`stock-native-settings.ts:263-271` labels `lcd` as the existing sampler and
keeps `azahar-12p4-fit` on `CommonBG_U_00` only. Tests pin
`textCoverageAdaptation === undefined`
(`tests/settings-sdcard-label.test.mjs:71`,
`scripts/verify-stock-settings.mjs` assertion added in this diff). The worker
note's evidence split says browser-inspected no and native-compared no. This
review does not mark the scenario pass.

### 3. Regressions, and the six remaining Software pixels

Other `textSamplingPanes` callers are outside the diff: Notifications
`T_NewsTitleB_00` / `T_NewsTitleF_00` and `T_EndB_00`, sleep `T_Btm_00` and
`T_BtnB_01` / `T_BtnF_01`, Camera `TxtSShow` / `TxtSet`, Sound `Guid1TxtW`.
`CommonBG_U_00` still draws `lcd` plus `azahar-12p4-fit`
(`stock-native-settings.ts:255`). Coordinator reports, empty mask
`dc4b320b…`, threshold any RGB channel >2/255, commit `70c4b070`:

| Pair | Before (dated, `3186f1ec`) | After U24 |
| --- | ---: | ---: |
| Software | 521 / 22 | **6 / 22** |
| Data root | 14 / 177 | **14 / 177** |
| Parental | 169 / 0 | **169 / 0** |
| Other page 1 | 117 / 0 | **117 / 0** |

I recounted the Software upper against
`settings-data-parental-20261006/software/native/azahar-software-empty-400x480.png`
with `@napi-rs/canvas`. Pre-change browser upper: 521 pixels, max 61, of which
500 fall in `[36,74) × [74,100)`. Post-change browser upper: 6 pixels, max 39,
and that SD Card box is 0. The six pixels are byte-identical in the pre-change
and post-change browser uppers:

| Pixel | Native RGB | Browser RGB | Channel delta |
| --- | --- | --- | ---: |
| (319,195) | 210,202,146 | 220,212,153 | 10 |
| (319,196) | 214,206,148 | 220,212,153 | 6 |
| (179,212) | 181,173,128 | 220,212,152 | 39 |
| (179,213) | 212,204,147 | 220,212,152 | 8 |
| (179,218) | 193,186,135 | 220,212,152 | 27 |
| (179,219) | 186,178,131 | 220,212,152 | 34 |

Those coordinates are the three regions in
`settings-sdcard-label-20261006/software/diff/report.json`. All six sit inside
`TextBox_00` (left 21, top 182, 358×44) and outside `TextBox_03` (left 35.5,
top 74, 269×24, which ends near x 304.5 and y 98). The browser values are the
flat cream already present before this bind. They are description-edge
differences, not leftover "SD Card" softness. Software lower stays 22. I did
not recapture.

### 4. Commands

| Command | Result |
| --- | --- |
| `node --test tests/settings-sdcard-label.test.mjs tests/settings-open-blocks.test.mjs tests/settings-title-centre.test.mjs` | 9 / 9 pass |
| `npm run typecheck` | pass |
| `npm test` | 2216 tests: 2082 pass, 37 fail, 96 skipped, 1 todo. Every failure is `ENOENT` (sparse `model/` GLBs, plus one missing Camera overflow PNG). None is Settings |
| `scripts/verify-stock-settings.mjs` | `@napi-rs/canvas` at `/Users/paramveer/.codex/artifacts/canvas-verifier/node_modules/@napi-rs/canvas/index.js`, asset root `public/os/firmware/10.7.0-32E`. Passed five main and 47 subpage paired renders. Output: `/Volumes/Sandisk1/3ds-fidelity-artifacts/settings-sdcard-label-review-20261006/verify-u24r2/` |

## Evidence split

| Gate | Status |
| --- | --- |
| Source-identified | yes — BCLYT 3/2, flags 0x101, LCD left 35.5, existing writer-0x101 allowlist from `54d7d0b8` |
| Delivered | yes — already in `up.json` and `fonts/shared` |
| Implemented | yes — `textSamplingPanes:['TextBox_03']` on Software and Extra Data only |
| Tested | focused 9/9, typecheck pass, `npm test` 2082/37 ENOENT, verifier 5 + 47 |
| Browser-inspected | no — this review did not drive `:3000` or `:3001` |
| Native-compared | coordinator pair `70c4b070` exists (Software 6/22). This review re-counted the published PNGs and did not recapture. Not 1:1 |

## Findings

1. **Nit — `SMng_U_01` `TextBox_00` is not a 3/2 pane.**
   `docs/notifications-list-direct-2026-10-04.md:67` lists `TextBox_00` and
   `TextBox_03` for `SMng_U_00/01/02`. `SMng_U_01` `TextBox_00` is alignment 4
   / lineAlignment 2 and multiline
   (`tests/settings-sdcard-label.test.mjs:50-51`). The 3/2 panes are
   `SMng_U_00` `TextBox_00`, `SMng_U_00` and `SMng_U_01` `TextBox_03`, and
   `SMng_U_02` `TextBox_00` / `TextBox_03`. The same table row is right that
   only `SMng_U_01` `TextBox_03` is drawn and allowlisted.
2. **Nit — description residual is not 0.**
   `docs/settings-sdcard-label-2026-10-06.md:31-32` and the dated-residual
   cell at `:47` say the description already matches at 0. The six Software
   pixels above are inside that pane's LCD box and are unchanged from the
   pre-change browser upper. The prediction at `:104` already places them
   outside `TextBox_03` and forecasts 0–6. The residual column should name
   those six description-edge pixels.
