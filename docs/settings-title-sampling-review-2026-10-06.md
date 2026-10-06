# U23R review — Settings `CommonBG_U_00` title LCD sampling — 6 October 2026

Reviewer U23R (Claude Opus 5.5, independent; worker U23 was Grok 4.6).
Reviewed `git diff 4bb5d136..8312f167` on
`codex/settings-title-sampling-review-20261006`. I did not touch Azahar or the
production browser on `:3000`.

**Verdict: APPROVE-WITH-NITS.** The source change is one line. It drops the
`screen==='other'` gate so every Settings subpage `CommonBG_U_00` draw gets the
`textSampling:'lcd'` and `textCoverageAdaptation:'azahar-12p4-fit'` options
(`src/os/stock-native-settings.ts:255`). The adaptation is labelled, has no
per-screen constants, and the worker's offline numbers reproduce. Nothing is
marked pass.

## Independent checks

### 1. Adaptation policy, labels, and sourcing

- **`lcd` is sourced.** It is the existing direct-writer path. Eligibility is
  checked in `src/os/native-renderer.ts:158`: alpha atlas, single line,
  alignment 3/4, lineAlignment 0, spacing 0, identity scale. It falls back to
  the default raster under scaled `SceneIn` transforms. It samples the
  unchanged A4 atlas at LCD pixel centres, as described in
  `docs/settings-other-direct-text-sampling-2026-09-26.md`. The new tests pin
  the eligibility inputs for `TextBoxTitle_00`: alignment 3, lineAlignment 0,
  spacing 0, `cbf_std` SHA `95d5a675…`
  (`tests/settings-title-centre.test.mjs:80-82`).
- **`azahar-12p4-fit` is labelled as a capture-fit everywhere it appears.**
  That covers the code comment (`stock-native-settings.ts:247-253`), the U23
  note's Decision, "Still non-native", and Evidence split sections, and the
  three back-linked design notes.
- **It is a global rule.** There is one shared option, no screen table, and no
  title-specific offset. The fit was derived from the Other and Health
  captures. Applying it to four more independent pages with no retuning took
  Software, Internet and Parental to 0 and left Data at one column. That is
  evidence the rule generalises, not that it was tuned per screen.
- **Policy.** AGENTS.md allows fitting decoded native resources to the Azahar
  capture with a label when the original path is unresolved. The original path
  here is Azahar OpenGL subpixel precision, which is still untraced. Reusing
  the same labelled fit on the same pane, font and upscale path is within that
  allowance. See F2 for the screens where it is still unmeasured.

### 2. Scope of `cf3776f0` and `b5543c40`

`git show` confirms both commits changed only the `CommonBG_U_00` line in
`stock-native-settings.ts` behind `screen==='other'`:

- **`cf3776f0`:** added `textSampling:'lcd'`. Its note says a trial enabling
  every eligible text pane changed a DS Profile lower pane, so that trial was
  dropped.
- **`b5543c40`:** added `azahar-12p4-fit`. The same commit also touched Health
  `BtmBtn_White`.

Neither commit gives a native reason to exclude other `CommonBG_U_00` titles.
The worker's claim that the gate was slice scope is accurate.

### 3. Regression surface

- **Other titles.** Other p1, p3 and p4 title ROI is 0 in my offline renders.
  `Null_Title` is still 95.2.
- **Untouched layouts.** These draw calls are unchanged, so the edit cannot
  reach them:
  - Settings main `TopText_U_00`
  - DS Profile `LsCommonBG_U_00`, which returns before the edited line
  - Manual `SoftTitleHeader` / `lcd-source-size`
  - the helper `CommonBG_U_00` layouts for updater, transfer and extrapad
    (`stock-native-helpers.ts:127,159,173`), which are separate packs and calls
- **Icons.** The icon attachments are separate `renderer.draw` calls with
  default options. The verifier loop (`scripts/verify-stock-settings.mjs:160-163`)
  is not vacuous because the call log records `Icon*` layouts.
- **Text-cache key.** It already includes `phase`, `direct` and `coverage`
  (`native-renderer.ts:163`), so mixed adaptations cannot collide.

### 4. Commands

| Command | Result |
| --- | --- |
| `node --test tests/settings-title-centre.test.mjs` | 4 / 4 pass |
| `npm run typecheck` | pass |
| `npm test` | 2214 tests: 2080 pass, 37 fail, 96 skipped, 1 todo. The failures are missing GLB/model files in the sparse checkout plus one missing overflow PNG. All are `ENOENT`, none involves Settings, and the count matches the known baseline |
| `scripts/verify-stock-settings.mjs` | Run with `@napi-rs/canvas` from `/Users/paramveer/.codex/artifacts/canvas-verifier/node_modules/@napi-rs/canvas/index.js` and the asset root `public/os/firmware/10.7.0-32E`. Passed five main and 47 subpage paired renders. Output: `/Volumes/Sandisk1/3ds-fidelity-artifacts/settings-title-sampling-review-20261006/verify/` |

I measured title ROI `[20,25,380,65]` myself. The threshold was any RGB channel
more than 2/255 apart, with an empty mask. Native is the top 400×240 of each
400×480 PNG. These are offline napi-rs renders, not production Chrome.

| Pair | Post-U22 browser | U23R offline | Note |
| --- | ---: | ---: | --- |
| Software empty | 1896 | **0** | |
| Data root | 1007 | **14** | Only column x=248. The post-U22 browser upper also has exactly 14 diffs in that column, which confirms the worker's claim |
| Internet settled | 1256 | **0** | |
| Parental intro | 796 | **0** | |
| Extra Data (native `7c7f2f93…`) | — | **13** | Only column x=129 |
| Other p1 / p3 / p4 | 0 | **0 / 0 / 0** | |

Every value matches the worker's table.

### 5. Docs

- Every note says the result is not 1:1, not browser-inspected and not
  native-compared. Feature-map rows stay `fail` and progress says "Not 1:1".
- No coordinator production-browser recapture exists yet. The directory
  `settings-title-sampling-20261006/` holds only the worker's offline renders,
  `title-roi-estimate.json` and `verification.json`.

## Findings

1. **Nit — false "Only".**
   `docs/health-other-coverage-grid-adaptation-2026-09-26.md:19` still says
   only Health `BtmBtn_White` and Settings `CommonBG_U_00` opt into
   `azahar-12p4-fit`. `src/os/firmware-presentation.ts:372-373` also binds it
   on `LncBtmBtn_02` for create-folder. The claim was already false before
   U23, but U23 rewrote this sentence and kept it. Name the third consumer or
   drop "Only". The same paragraph also has a pre-existing missing space:
   `nearest1/16`.
2. **Nit — unmeasured screens.** The widened bind also reaches screens with no
   native pair:
   - Connection Settings, Data 3DS, Profile, Date & Time
   - Sound, Language, date/time/birthday/nickname details
   - Restrictions, Parental explain and PIN notice
   - unidentified `view.heading` detail cards
   `docs/settings-title-sampling-2026-10-06.md:115-126` predicts only the
   measured pairs, which is honest. Add one line there saying the other
   `CommonBG_U_00` screens now carry the fit unmeasured, so the
   coordinator's recapture list covers them. The fit is global, so this is a
   coverage gap, not a policy breach.
3. **Nit — elided path.** `docs/settings-title-sampling-2026-10-06.md:89`
   shortens the canvas module path to `…`. Give the full path,
   `/Users/paramveer/.codex/artifacts/canvas-verifier/node_modules/@napi-rs/canvas/index.js`,
   and the `--asset-root` / `--font-manifest` arguments so the run can be
   reproduced.
4. **Nit — shared directory.** `docs/settings-title-sampling-2026-10-06.md:90`
   writes offline renders to `settings-title-sampling-20261006/`, the same
   root the coordinator will use for production-browser LCDs. Put the
   coordinator's captures under `browser/` and `native/` subdirectories, or
   move the offline output to `offline/`, so source renders are not mistaken
   for acceptance captures.

None of these blocks integration. The coordinator still owes the
production-browser recapture of Software, Data, Internet, Parental, Extra and
Other p1, with title-ROI and whole-upper reports. Motion is uncompared: the
`SceneIn` frames fall back to the default raster until settled.
