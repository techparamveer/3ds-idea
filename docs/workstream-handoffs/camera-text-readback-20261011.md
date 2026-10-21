# Camera temporary text readback candidate

Worker branch `codex/camera-text-readback-20261011` starts at
`00c6423eab4dc61a17dc18bbbeb32ab49a02426d`. The implementation commit contains
this handoff, two context-allocation edits in `src/os/native-renderer.ts`, and
`tests/native-text-readback.test.mjs`. The coordinator owns integration and GUI.

## Captured defect and candidate

The closed production guide/main/HOME/Manual/Close/Resume/repeated HOME/Resume
run compares baseline `live-lcd-59ecd8b6-0f87-4a13-be0d-e2b1bb0a8963-0001`
against first terminal `live-lcd-acfc481e-6128-4b11-a46c-54f1e91f0f83-0241`.
With full LCDs and an empty mask, 252 upper and 623 lower pixels differ.
The repeated comparison is exact. These selectors and results are fixed.

The source triage found seven differing generic text draws representing six
cache fills. Their ink fingerprints differ before material coloring. Both
direct-alpha controls, Slideshow and Settings, agree. Temporary ink context
state and the cause of divergence remain unobserved.

Generic text now requests `{willReadFrequently:true}` on the first 2D context
acquisition. This covers the single-run canvas and the separate mask used by
color spans. Direct-alpha text retains default context options. Existing
sampling gates, geometry, smoothing intent, material evaluation, cache limits,
diagnostics, readback count and controller timing are unchanged. No source
font, native resource, public asset or scene code changes.

This is a falsifiable Canvas allocation candidate. It does not establish a
Chromium, GPU or font-decoding cause. All generic text callers share the change,
so affected native-text regressions remain required after a visible correction.

## Supporting verification

Focused renderer, diagnostic and allocation checks initially pass 36/36.
The allocation cases drive `NativeLayoutRenderer.draw()` with decoded Camera
pane/material data and the delivered shared-font manifest. Canvas transport
and font ink are recorded substitutes. Assertions inspect the first context
request, original `drawNative` sampling/phase/size/range arguments, single-run
and multi-span read/write counts, unchanged borrowed font identity, cached fill
reuse and disposal. They do not establish production raster bytes.

Full tests, standard and nonincremental typechecks, a precommit production build,
and a final postcommit production build are recorded separately in the private
implementation directory below. The final report records actual results and
the frozen commit/build identities. The known baseline full-suite failure is
the absent historical Camera date-group PNG at
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/camera-3d-badge-sdmc-recapture-20261005/browser/lower.png`.
Do not weaken that assertion or interpret fixture absence as a pass.

Only exact SHA-256 and size-verified Git LFS files were hydrated into this
worker for checks. They and local STATUS reconciliation stay unstaged.
An initial dependency symlink caused Turbopack to reject a path outside its
filesystem root. Dependencies were then copied from the frozen diagnostic
worker into this worktree without modifying the source worker or Next config.

## Evidence and remaining work

Private root:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/toprow-current-20261010/`.

- Fixed red audit: `camera-browser-text-run-v1/audit-sol-high-v1/report.md`.
- Source triage: `camera-browser-text-run-v1/source-triage-sol-high-v1/report.md`.
- Candidate checks, command exits, hydration record, final report and freeze:
  `camera-text-readback-v1/implementation/`.

Source-identified font is `cbf_std.bcfnt`, manifest
`public/os/firmware/10.7.0-32E/fonts/shared/font.json`, declared source SHA-256
`95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581`.
Existing title/version/content/path/converter provenance is retained in the
delivered manifests. The candidate adds no native assets or cues.

Implemented allocation and supporting tests are separate from browser and
native acceptance. This worker runs no browser, server, Azahar, audio or new
CPU raster probe. Production recapture must preserve the actual long-lived
font history and fixed baseline selectors, require exact first/repeated LCD
closure, and inspect the existing pre-color diagnostics. Reject an ineffective
candidate without masks, alternate endpoints or a new baseline chosen by
similarity. Independent review precedes recapture.

Camera's read-only main/gallery route, fixture photos/counts and retained
compositor behavior remain existing adaptations. Native pixels, exact input,
motion, cadence and muted-audio acceptance remain open. No whole scenario
passes from this patch, its source tests or its build.
