# U22R review — Settings `CommonBG_U_00` title-group centre (6 October 2026)

Reviewer U22R (Claude Opus 5.5, independent; the worker was Grok 4.6).
Reviewed `git diff d9d1ce9d..a1ba3a85` on
`codex/settings-title-centre-review-20261006`. The review did not launch or
drive Azahar or the production browser. It only read published captures.

**Verdict: APPROVE-WITH-NITS.** The geometry change is sourced and matches
every available native capture to within one pixel. The nits are about
documentation honesty and test strength. None of them blocks integration.

## 1. Is the rule sourced? Why was the gate Other-only?

- `git log -S otherTitleTranslation` gives `f445301c` (26 September). That
  commit replaced a capture-fitted `Null_Title:[95,0,0]` that applied to
  Other Settings only. It kept the `screen==='other'` scope because Other
  was the only pair under test. Neither that commit nor
  [settings-other-source-centering-2026-09-26](settings-other-source-centering-2026-09-26.md)
  gives a reason for excluding other pages. That audit says "not broadened
  by this slice", which describes the slice's scope, not native behaviour.
- The 26 September audit cites the instruction range `0x2232b4..0x223374`,
  its pane-name lookups (`Icon`, `TextBoxTitle_00`), the measurement call
  `0x19ff04` and the float32 sequence. `settingsTitleGroupX` follows that
  order unchanged. The function is keyed on pane names, not on a screen.
- I could not check the call sites independently. The Settings `code.bin`
  (`1f9351cd…`) and `presentation/settings-status-hud/full.asm` are not on
  any path I can reach. The `0x2232b4` that does appear in reachable
  disassemblies
  (`runtime/reference/folder-navigation/native-code.asm`,
  `audio/native-policy-followup/all.asm`) is HOME Menu code, which is a
  different function. The claim that every `CommonBG_U_00` page calls the
  helper therefore rests on two things: the function is generic over pane
  names, and the native captures below agree. The worker's note says this
  openly (`docs/settings-title-centre-2026-10-06.md:182`). See finding F1.
- `CommonBG_U_00_SceneIn_01/03/04/05` have no `Null_Title` translation
  track. I did not independently re-walk the animation tracks. The X values
  are consistent with captures either way.

## 2. Native ink extents compared with the predicted X

Ink is measured in rows y 26–53 of the upper LCD, as the per-row distance
from the background mode (L1 > 60), with gaps of 6 px or less merged. The
pre-change browser draws group X=0 with the icon ink starting at x 12. So
native icon-left minus 12 should equal the predicted `Null_Title`.X.

| Screen | Native icon / title ink | Native − 12 | Predicted X | Post-change browser ink (`settings-title-centre-20261006`) |
| --- | --- | ---: | ---: | --- |
| Software Management | 66–94 / 105–334 | 54 | 54.40 | 66–94 / 105–334 |
| Data Management | 88–115 / 128–312 | 76 | 76.07 | 88–115 / 128–312 |
| Extra Data Management | 58–86 / 98–342 | 46 | 46.32 | not recaptured |
| Parental Controls | 92–118 / 132–308 | 80 | 79.90 | 92–118 / 132–308 |
| Internet Settings (settled) | 95–124 / 135–305 | 83 | 83.30 | 95–124 / 135–305 |
| Other p1 | — | — | 95.20 | 107–134 (unchanged) |

All five native captures match the prediction at integer resolution. In
all four recaptured pairs, the post-change ink runs are identical to the
native ones.

## Coordinator recapture numbers (my own count)

Mask: empty. A pixel counts when any RGB channel differs by more than 2.
Native is the upper half of the 400×480 capture.

| Pair (native / post browser SHA-256 prefix) | Title ROI `[20,25,380,65]` before → after | Whole upper before → after |
| --- | ---: | ---: |
| Software `9c5cb75c…` / `8a846cc5…` | 3924 → **1896** | 6011 → **3803** |
| Data `686d3dfb…` / `360b523d…` | 3435 → **1007** | 4956 → **2381** |
| Parental `98fb3d62…` / `16d45a29…` | 3082 → **796** | 4595 → **2210** |
| Internet settled `f0c5d093…` / `de631ff3…` | 3288 → **1256** | 4760 → **2661** |
| Other p1 `98d0fc9d…` / `ce89afd6…` | 0 → **0** | 217 → 1403 (HUD clock only) |

The "before" counts reproduce the coordinator's reports (3924/6011, 4956,
4595, 4760), which validates this method.

## 3. Regression risk

- **Other p1:** the title rows (y 25–64) are byte-identical between the
  pre-change `settings-transfer-20261006/browser-other-p1/upper.png` and the
  post-change Other upper. All 1412 changed pixels fall in x 218–363, y 2–17,
  which is the HUD date/clock (live time). The title ROI against native stays
  0. `Null_Title` stays 95.19999694824219, and `lcd` with
  `azahar-12p4-fit` stays Other-only. The worker's tests and
  `scripts/verify-stock-settings.mjs` cover p1/p3/p4. I have no p3/p4
  recapture, but the code path and string are the same as p1.
- **Settings main** binds `TopText_U_00` and does not take `Null_Title`.
  **DS Profile** binds `LsCommonBG_U_00` only. Both are tested.
- **Throw risk:** the real `measureSingleLineText`
  (`src/os/native-renderer.ts:69`) throws on newlines or non-zero character
  spacing. The change makes it run on every subpage, so a throw would blank
  the whole page. I checked all 11 sourced titles (styles 102/107/285 have
  characterSpacing 0, and none has a newline). The `CommonBG_U_00`
  `TextBoxTitle_00` pane has characterSpacing 0. No reachable adapter
  heading contains a newline. The real-renderer harness
  `scripts/verify-stock-settings.mjs` (with `@napi-rs/canvas`) passed: "five
  main and 47 subpage paired renders … passed".

## 4. Hacks and labels

`src/os` has no CSS positioning and no per-screen X table. The X comes from
pane geometry, the bound `mset` text and style, and the shared font. The X
table in `scripts/verify-stock-settings.mjs:139-151` is a regression
expectation, not a production input. Labels are honest: centring the
adapter headings is labelled as "not a native title claim", and the
`code.bin` gap is stated.

## 5. Tests

- `node --test tests/settings-title-centre.test.mjs tests/settings-other-page-tab.test.mjs`: 7/7 pass.
- `scripts/verify-stock-settings.mjs` (real renderer): pass.
- `npm test`: 2207 tests, 2073 pass, 37 fail. All 37 are pre-existing
  ENOENT failures (35 cite ENOENT in the TAP output, and `source-pad` /
  `sourced-rig` fail on a missing `model/candidates/joshua-xl/*.glb`).
- `npm run typecheck`: pass.

## Findings

1. **F1 (nit, provenance)** — `docs/settings-title-centre-2026-10-06.md:217`
   and `:182`. The evidence-split row calls `0x2232b4` broadening
   "Source-identified: yes". The function body is sourced, but its call
   sites were never enumerated. Change the wording to "function sourced;
   call-site breadth inferred from pane-name genericity plus 4 native
   matches (Data, Software, Parental, Internet) and 1 ink match (Extra)".
   Profile, Date & Time, Sound, Language and Connection Settings have no
   native capture yet. List them as native-unconfirmed until a pair exists.
2. **F2 (nit, prediction miss)** — `docs/settings-title-centre-2026-10-06.md:150`.
   The predicted title ROI of 200–900 was too optimistic. Measured values
   are Software **1896**, Internet **1256**, Data **1007** and Parental 796.
   The residual is glyph raster only: the ink extents are identical, the
   Internet icon box has 0 differing pixels, and Software has max Δ 96 with
   mean 17 on text columns. The likely cause is that the non-Other pages
   still use default text sampling at fractional X (54.40, 83.30). Update
   the table with the measured numbers. Track title glyph sampling on
   non-Other `CommonBG_U_00` pages as a separate, labelled follow-up.
   Whether `lcd` / `azahar-12p4-fit` should extend there is a separate
   adaptation decision and was correctly left out of this slice.
3. **F3 (nit, test strength)** — `tests/settings-title-centre.test.mjs:45`.
   The mock `measureSingleLineText` never enforces the real guard (newline
   or non-zero characterSpacing throws, `src/os/native-renderer.ts:69`).
   That guard is now on the path for every subpage. Mirror the guard in the
   mock, or assert that every title style has characterSpacing 0, so a
   future spaced or multiline title fails in the unit test instead of
   blanking the page.
4. **F4 (nit, adapter edge)** — `src/os/stock-native-settings.ts:246`.
   Adapter `view.heading` strings are now centred without a width bound. The
   unreachable restrictions heading "Sharing Images / Audio / Video / Long
   Text Data" (width 510) would give X −85 and push the icon off-screen at
   x −75. "Nintendo 3DS Shopping Services" would give X −3.4. Neither is
   reachable through `settingsNavigate`, because `parental` → `next` goes to
   `parental-explain`, not `restrictions`. The longest reachable heading,
   "Reset blocked-user settings", gives X 24.2 and stays on-screen. Native
   width-fit behaviour (style word 0 = 340) is not modelled. Note this
   explicitly if `restrictions` ever becomes reachable.

No blocking findings. Still non-native elements are unchanged from the
worker's list: the Other title `lcd`/`azahar-12p4-fit` raster adaptation,
adapter detail headings, the HUD clock/date source, and the empty-list
fixtures.
