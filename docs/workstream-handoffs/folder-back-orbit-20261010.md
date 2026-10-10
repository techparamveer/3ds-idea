# Ordinary folder Back orbit retirement

10 October 2026. Worker base `bd0927e35e797baeadb516822725e41cac8b260f`,
branch `codex/folder-back-orbit-20261010`, assigned checkout
`/Users/paramveer/.codex/worktrees/folder-back-orbit-20261010/3ds-idea`.

## Captured defect

Private evidence root:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion`.

| Evidence | Relative path under private root | SHA-256 |
| --- | --- | --- |
| Native audit | `matched-regressions-20261010/folder-native-v3/offline-movie-audit/report.md` | `1a6080c3fe1449b52d6c253a79c73c9c872c55137d489815c48e3bf7063fd12d` |
| Browser audit | `live-lcd-verification-20261010/offline-audit/folder-empty-v3/report.md` | `929fde842cb729368a32eb1d8fe98934b762cec39bd4d9d24246caa6e027a64c` |
| Frozen selection | `live-lcd-verification-20261010/offline-audit/folder-empty-v3/selection/selection.json` | `1c20002e308b147a68f06df51890eaef999b9736c70864aef3e54a925b43af6c` |

The worker rehashed these three files and inspected the native
`repeat-back-chronological-LOSSY-DIAGRAM.png` plus the browser selection sheets
`first-recorded-back-semantic-chronology.png` and
`repeat-back-semantic-chronology.png`. The first browser selected-root cursor
at sequence116 coexists with the upper orbit through117; repeat cursor415
coexists with orbit through416. The native lossy repeat diagram shows wallpaper
at requested sample19.3s before exposed root and selected cursor at19.4-19.5s.
These establish the ordering target, not aligned clocks or a duration.

## Implemented boundary correction

The actual [scene commit](../../src/scene/console-scene.ts) already supplies an
explicit `{kind:'clear'}` when a new ordinary folder close starts.
`observeFolderBanner` discarded it whenever `homeFolderBannerRequestReady`
was false. The real [screen readiness](../../src/os/screens.ts) is false while
the folder is opened and closing, because `folderEntryEligible` excludes close.
The retained default primary therefore received no replacement until lower
root restoration admitted the selected-folder request.

The observer now forwards an explicit clear even when entry readiness is false.
Content requests still use the existing entry gate. The host's existing clear
request, native hide producer, manager/scene order, loading gates and selected
root resolver perform the retirement and reacquisition. No new delay, renderer
visibility override, primary reset, wallpaper reset or clock is introduced.

The original native request caller/epoch has not been recovered in this slice.
Forwarding the existing browser Back boundary is a capture-fitted adaptation.
It must not be reported as recovered native dispatch or timing.

## Verification

The new [behavior regression](../../tests/home-folder-back-banner-scene.test.mjs)
executes the actual scene `dispatch`, `commit`, `observeFolderBanner` and
`advanceBeforeMutation` functions, the actual screen readiness functions, and
real OS close/navigation and banner host/service code. Browser-only audio,
resource readiness and rendering side effects are fixture dependencies.

Before the runtime fix, four normal/reduced and visible/offscreen-root cases
failed because the actual commit retained `{kind:'default'}` instead of clear.
After the fix, all nine new cases pass. Coverage includes Back-tab down/up
dispatch through the real native input gate, unchanged hide-track
visibility, entry request/activation gating, idempotent clear, root reacquisition,
repeat Back, batch equivalence, suspension and context cancellation.

Focused command, exit0,119pass,0fail:

```sh
node --test --test-reporter=dot tests/home-folder-back-banner-scene.test.mjs tests/home-folder-entry-host-scene-policy.test.mjs tests/home-folder-entry-banner-live.test.mjs tests/home-folder-entry-banner.test.mjs tests/home-banner-host.test.mjs tests/home-folder-close-system.test.mjs tests/home-folder-close.test.mjs tests/applet-entry-scene-policy.test.mjs
```

`npm run typecheck` exits0. Existing generation, owner, stale-resource,
paired-publication, cancellation and entry-receipt guards pass in those suites.
Full tests, production build and muted GUI recapture belong to the coordinator.
No server, browser or Azahar session was operated by this worker.

## Evidence limits and next verification

No native graphics, fonts, audio or asset mappings changed. Existing decoded
default/folder tracks and provenance remain in use. The capture-fitted Back
request boundary and existing portfolio/root-population differences remain
non-native adaptations. Browser root slot22 differs from native28; both use
child0, and configured density is not attested. No new static pixel comparison,
mask or diff report was produced. No private matrix was changed.

Coordinator recapture must inspect first/repeat ordinary Back, confirming orbit
retirement before readable root/cursor and later folder graphic growth. Recheck
folder entry receipts and the adjacent Notes/Notifications return behavior.
Native raw intermediate poses, held Back, matched fixture, exact input/motion
timing and muted audio acceptance remain open. Whole-scenario fidelity remains
unaccepted. Integration must update the progress record and feature map.
