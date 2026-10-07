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
The Notes no-software upper interior still differs from the browser tutorial;
this is an unexplained native mismatch, not an intentional adaptation.

Baseline checks: build passes; capture script syntax and all eight runs pass.
Full tests: 2167 pass, 1 fail, 96 skip, 1 TODO. The failure is the unchanged
`camera-date-group` private-pair check: its historical browser `lower.png` is
absent. Logs are retained as `baseline-tests.log`; do not hide this failure.
