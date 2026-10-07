# Animation fidelity workflow

## Goal and base

The 7 October request narrows the active UI work to four incomplete animation
flows. GitHub fetched successfully. `main` and `origin/main` both resolve to
`5ee6fd7a42b0239c5f55f375f85593289a0ff532`. The former fidelity checkout is
absent. Preserve this version and all existing designs. Current checkout and
seats are in [STATUS](../STATUS.md), with the objective in [GOAL](../GOAL.md).

| ID | Flow | Required variants | Current acceptance |
| --- | --- | --- | --- |
| AN-01 | Open top-row app | Notes, Friends, Notifications, Browser, Miiverse; touch and physical A; return and repeat | fail: user reports incomplete motion; current sequence must be captured |
| AN-02 | Open Manual | HOME Manual footer, app-origin Manual where supported; Close and reopen; suspended owner retained | fail: user reports incomplete entry motion |
| AN-03 | Enter folder | empty and populated; root scroll/density aligned; repeated entry; Back control | fail: user reports incomplete entry motion |
| AN-04 | Suspend with HOME | native deterministic app, Camera/Sound where available, portfolio app; repeated HOME and Resume | fail: user reports incomplete pause motion; portfolio interior is an adaptation |

## Worktree and agent ownership

One coordinator integrates in `codex/animation-fidelity-20261007`. Use at most
two workers in separate worktrees and branches based on the fetched commit.
Workers use GPT-6.1 Sol with extra-high reasoning. A reviewer uses a different
model under the repository seat rule. Speed selection is not exposed by the
delegation tools, so no Fast-mode setting is claimed verified.

Worker A traces AN-01 and AN-02 and owns only separately assigned helpers,
focused tests and its handoff. Worker B traces AN-03 and AN-04 with the same
restriction. The coordinator reserves `system.ts`, `screens.ts`,
`firmware-presentation.ts`, `console-scene.ts`, the goal, status, feature map,
and progress. A worker must request an exact narrow reservation before changing
one of those files. No worker GUI, shared server or competing production build.

## Capture, correction and acceptance

1. Capture the current visible defect before editing. Record title, owner,
   selected item, folder viewport/density, input and entry state. Keep native
   service gates separate from local portfolio adaptations.
2. Trace the pinned decrypted firmware's original animation/resource binding.
   Record manifest key, title/version, content index, internal path, SHA-256,
   converter version, frame count and any unresolved scheduling rule. Do not
   draw substitute native UI or guess easing, fades or duration.
3. Drive the identical scenario in isolated Azahar and the integrated production
   browser. Verify isolated volume zero before launch. Use a dedicated muted
   browser. Capture Azahar's own 400x480 PNGs and raw 400x240 upper / 320x240
   lower LCDs throughout the transition, not only its settled endpoint.
4. Declare the input epoch and chronological frame selector before comparing.
   Log holds, frame advancement, emulation speed, host delay and capture gaps.
   Slow-motion observation supports ordering; it does not prove real-time
   duration. A closest-pose search is diagnostic, not timing acceptance.
5. Hash named native/browser pairs. Diff full LCDs with an empty mask first.
   Any justified content mask is recorded separately and cannot hide animated
   chrome, cursor, backdrop, alpha, ordering or timing errors. Open the sheet
   and inspect pressed feedback, first change, intermediate stages and terminal
   publication. Preserve failed runs.
6. Implement one source-backed visible correction. Keep pure state, owner and
   generation guards, native readiness, paired-LCD publication and disposal.
   After a bounded source-only slice, make a visible correction or record an
   explicit source gap. Commit explicit owned paths only.
7. Review and integrate sequentially. Run focused tests, `npm test`,
   `npm run typecheck`, `npm run build`, and shader validation only if relevant.
   Recapture the changed flow and affected regression flows in production.
8. Update [feature map](feature-map.md), [progress](progress-2026-09-24.md),
   STATUS and private LOG with commit, source identity, capture pair, mask,
   diff report, inspected sheet, defects and next action.

Each flow remains fail while an unexplained animation mismatch exists. Record
source gaps, adaptations and blocked native routes explicitly. Report
implemented, tested, browser-inspected and native-compared separately. Muted
audio stays unverified and prevents a global audiovisual 1:1 claim.

## Captured baseline

Runtime `5ee6fd7`, workflow `81f09bf`, production port 3021. The coordinator's
`scripts/verify-animation-flow.mjs` records ordinary projected touch/keyboard
inputs, chronological raw LCD paints, hashes, viewport and browser errors.
Eight successful baseline runs cover all five top-row apps, Settings Manual,
empty-folder entry and Health HOME suspension. These are browser evidence,
not native acceptance. Invalid folder-creation-only and failed Health shortcut
experiments remain retained separately.

Artifact root: `/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/`.
`baseline-index.json` identifies all eight runs. `notes-native-index.json`
identifies the copied muted Azahar executable, HOME content, configuration,
CTM and 99 own PNGs. The CTM holds A at samples 2340..2348 from a selected
Notes seed; playback counter and emulation speed were observed. At 25% speed,
the own PNGs show cover over outgoing HOME, held cover during pipeline loading,
then cover clearing over Notes. Cold pipeline stalls prevent duration acceptance.
The baseline Notes no-software upper interior differs from the browser tutorial.
The reviewed correction and current residuals are recorded below.

Baseline checks: build passes; capture script syntax and all eight runs pass.
Full tests: 2167 pass, 1 fail, 96 skip, 1 TODO. The failure is the unchanged
`camera-date-group` private-pair check: its historical browser `lower.png` is
absent. Logs are retained as `baseline-tests.log`; do not hide this failure.

## Integrated corrections and recapture

Runtime `8a3238c` integrates source-backed Notes scene-9/10 boot covers and
folder FadeIn/CaptureFade plus suspended-background AppPause. Motion advances
only after valid paired LCD presentation, at most one source pose per receipt.
Recovery revokes pending poses and repeats the last presented pose before
advancing. Failed-folder Back/HOME/touch escape is `c8e1e93`.

Runtime `2169497` replaces only the owned no-software Notes upper fallback
with original `ImageScreenUp` and message `9900NoBreakGameMesList`. It samples
the pane-bound `P_Mask` SceneOut endpoint20 without hiding the list message.
[The source mapping](notes-no-software-list-2026-10-07.md) records exact dump
hashes. Application-present capture and metadata-ready paths remain unchanged.
Reviewed fixture corrections are `6aa654d` and `a779d16`.

Production checks at `2169497`: typecheck/build pass; full tests2224 pass,
1 fail,96 skip,1 TODO. The unchanged failure is the missing historical Camera
date-group PNG. Notes readiness/painter/source tests43 pass. Desktop Notes
two-cycle captures94/96 pairs and reduced physical-A mobile74/74 pairs report
no page errors. Both console views were opened and are nonblank/framed.

All artifacts below are relative to the private animation root above:

| Diagnostic | Declared pair | Empty-mask pixels above delta2, U/L | Meaning |
| --- | --- | --- | --- |
| Notes complete boot cover, `8a3238c` | native `_07.10.26_12.33.23.104.png`, first browser complete cover005 | 0 / 0 | Static source-pose match only; timing/loading departure remains open |
| Notes first ready, `2169497` | native `_07.10.26_12.33.38.755.png`, chronological browser038 | 9198 / 46427 | Upper body matches; Notes-owned HUD missing. Lower tile faces too bright, maximum delta31 |
| Camera Manual baseline endpoint | native `_07.10.26_13.01.11.964.png`, baseline050 | 446 / 1038 | Icon/scrollbar/text/footer residuals; missing entry cover |
| Folder re-entry first terminal, `2169497` | native `_07.10.26_15.11.14.196.png`, first browser folderFrame16, repeat020 | 61126 / 7478 | Native retains folder upper banner longer. Cursor/underlying fixture/HUD and backdrop residuals remain |

Reports and both LCD sheets were inspected in `comparisons/notes-cover-8a3238c`,
`notes-list-2169497`, `camera-manual-baseline`, and
`folder-reentry-frame16-2169497`. Source-pose/semantic selectors do not establish
shared native frame epochs. No nearest-frame replacement or acceptance mask
was used. The unused `folder-reentry-terminal-2169497` selection chose frame15,
not16, and is not comparison evidence.

`folder-continuous-retry-native-index.json` hashes110 Azahar-own400x480 PNGs
from one continuous capture burst. Back and the second tile-tap entry are
visible; the first A entry was already complete before this burst. Native
re-entry uses tile136,160 after B; `integrated-2169497/folder-native-tile` uses
the corresponding projected tile tap after Back, six rows, retained slot28.
Its two cycles have82 pairs each, no page errors. The native fixture's title
population differs from the portfolio fixture. Exact input duration, native
epoch, normal-speed motion and audio remain unaccepted.

Direct-title and HOME-launched Health short-key experiments failed to reach
suspended HOME; keep their captures invalid for AN-04. They do not override
the earlier genuine held-HOME reference. Browser Health and portfolio HOME
two-cycle/reduced captures completed, but cannot pass the native route alone.

Manual source cover commits `3ff5140` and `127da97` are reviewed, integrated,
built and served. Full tests2247 pass,1 fail,96 skip,1 TODO; the same historical
Camera PNG is missing. Typecheck/build pass. Production Camera Manual two
cycles126/130 pairs and Settings Manual125/129 pairs include every outgoing
and incoming source pose0..20. Their console views are inspected.

Camera first outgoing20 at index46 is compared with native
`_07.10.26_13.00.45.247.png` in `comparisons/manual-cover-127da97`: **0/0**
pixels above delta2, empty mask, max errors1/2. The first ready pair index88
versus `_07.10.26_13.01.11.964.png` is still **446/1038**, unchanged from the
baseline. Both LCD sheets for both comparisons were opened. This establishes
the opaque static cover, not matched motion timing or the native caller epoch.

The first reduced mobile Camera Manual run has71 pairs per cycle. Its first
cycle visibly enters recovery with `Manual entry clock moved backwards`;
repeat reaches ready. Preserve those original collector records, which called
the run valid because they checked only the app menu. They are not successful
native-screen evidence. The collector now rejects recovery in any sampled
frame and requires paired native readiness at app destinations. A fresh strict
three-cycle run71/71/70 reached ready, but does not erase the intermittent
first-run defect. Worker and reviewer traced mixed rAF versus post-render clock
samples; its fix and another production recapture are required before moving on.

Normal-speed native Manual observation collected44 own PNGs, all already
settled. A fresh continuous96-command replay instead entered Camera because
the retained HOME selection changed. Its route is invalid for Manual, and no
Camera capture action was taken. Keep both attempts distinct from the existing
successful delayed native Manual evidence. Native timing remains unaccepted.

Runtime `61f8b4e` fixes the Manual clock regression using fresh paint and
receipt samples from the same clock. It does not clamp backwards samples or
advance without a valid render. The original Notes HUD is integrated through
`21d4329`; its custom `%I` token uses the source's 24-hour semantics.
Fixture-only commit `59fb1d5` adds the required export to two unrelated test stubs.
Full tests: 2260 pass, 1 historical Camera PNG failure, 96 skip, 1 TODO.
Typecheck and production build pass.

Production recaptures under `integrated-61f8b4e/` reach paired readiness
without native-screen recovery: Camera Manual mobile normal113/116 pairs,
mobile reduced70/72/72, Settings Manual213/213 with an8-second capture window,
Notes desktop92/95 and mobile reduced74/75. Health physical-HOME79/80 and
six-row folder tile80/81 also complete without page errors. Their console
views were inspected and show the complete nonblank console. These are
browser checks, not native motion acceptance.

The declared first-ready Notes pair035 at704.7ms versus the unchanged native
`_07.10.26_12.33.38.755.png` now differs by1263 upper /46427 lower pixels above
delta2. Both empty-mask sheets in `comparisons/notes-list-61f8b4e` were opened.
The upper body and HUD layout match; live clock/date, antenna phase and battery
parity remain different. Lower empty thumbnails are still too bright.

The collector now accepts a bounded `--duration-ms` and writes raw PNGs,
console and `valid:false` metadata before its behavior assertions. An
intentional1-second Manual collection in `collector-retention-short-manual`
keeps44 raw pairs and its loading failure. The earlier3.5-second Settings
collection also failed while loading; its separate failure record remains.
Neither failed run is acceptance evidence.

Current work: publish Notes empty-thumbnail buffers from the pinned code's
RGB565 initializer, and retain the presented folder banner through the paired
FadeIn terminal receipt. Native dispatch epochs and exact timing remain open.

Reviewed Notes empty-thumbnail commit `61b220a` is integrated as `19ee552`.
The pinned code initializes all16 thumbnail buffers with RGB565 `0xe73c`.
The existing decoder produces231/231/231/255 texels in128x64 storage for the
original68x42 logical panes. The additive pack retains original list geometry
and clips. [The source handoff](workstream-handoffs/notes-entry-residual-20261007.md)
records executable, literal, derived texture and converter hashes. Missing
selected texture is an explicit readiness failure; saved/nonempty thumbnails
remain unsupported, not reconstructed from private notes.

Production `19ee552`: typecheck/build pass; full2266 pass,1 missing historical
Camera PNG failure,96 skip,1 TODO. Six thumbnail source Python tests pass.
Notes normal95/92 and reduced physical-mobile75/74 raw pairs reach readiness
without errors. Both complete-console views and LCD comparison sheets were
inspected. First-ready038 at737.6ms versus unchanged native12.33.38.755 gives
1039 upper /731 lower above delta2, empty mask. Report is
`comparisons/notes-list-19ee552/report/report.json`. Thumbnail interiors match;
remaining lower differences are footer edge/text. Upper differences are live
HUD state. Neither this static pair nor the browser motion passes AN-01.

New native normal-speed Camera HOME Manual replay explicitly selects Health,
then Camera, then Manual. `manual-selected-normal-native-index.json` hashes
140 own PNGs; the chronological sheet shows HOME, source cover and Contents.
The first complete cover at16.15.13.317 and first Contents at16.15.16.62 have
the same bytes as the earlier slowed references. First browser out20 index39
and first-ready77 are declared in `comparisons/manual-normal-cover-61f8b4e`
and `manual-normal-first-ready-61f8b4e`: empty-mask0/0 and446/1038. All four
LCD sheets were opened. Sparse normal-speed snapshots still miss individual
source poses and do not establish a shared input epoch or exact duration.

Notifications native normal-speed touch145,16 then CTM A produces94 own PNGs
in `notifications-normal-native-index.json`. Its inspected chronological sheet
shows the common cover over outgoing HOME before Notifications. Current
browser `integrated-19ee552/notifications-before-common` has71/71 error-free
pairs but skips that common cover. Its console was inspected. Native9 versus
portfolio8 unread items is a content difference, not an animation mask.
Selector bindings are the next bounded source slice; visible caller integration
must follow it before further source-only work.
Remaining applet common-cover callers are Notes0, Friends1, Notifications2,
Browser3, Manual4 and Miiverse7. Miiverse uses its authored logo, not an invented
lower text label. All four whole scenarios remain fail.
