# Shutdown Publication - 3 October 2026

This follows [Power input](home-power-input-2026-10-03.md). It addresses a
production-visible missed native endpoint under delayed rendering, not native
timing or whole-scenario acceptance.

## Implemented

`19376463` (worker `aed859a1`) adds a scene-owned terminal acknowledgment,
keyed by shutdown start, return phase and graphics-context generation. Before
the existing deadline can enter off, the scene requires a successfully drawn
native LCD pair followed by a visible, awake, context-live WebGL render.
If absent, it paints/renders the source terminal and keeps shutdown selected
until the following animation callback. It does not invent a dwell duration
or change the pure reducer's clock. Reduced/normal120/1200ms policies remain.

Paint, recovery and unsupported failures cannot supply acknowledgment;
diagnostic canvas restorations also clear/recompute the painted identity.
Awake Power/Shutdown now explicitly report failed or missing native overlays.
Sleeping does not turn a deliberately absent overlay into a persistent error.
Context loss and restoration both invalidate the acknowledgment. Independent
review found that an already-valid receipt survived hide/sleep; `ea6265de`
(worker `9e5f9daf`) revokes both painted and presented identities on suspension.

`fb2d9819` (worker `8e3fcce0`) updates extracted capture test harnesses to
provide and assert the restoration callback. The initial full suite's four
failures are preserved in `npm-test.log`, not relabeled as passing. No asset,
shader, material, audio or authored source-frame mapping changes were made.

## Captured Defect

Baseline coordinator `7b9af2cd` / runtime `b0814dd4`. Private root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/shutdown-publication-20261003/`.
`capture.mjs` uses real browser keyboard P/Enter and deliberately blocks its
main thread for1400ms after the first shutdown paint at or after150ms.
This is a documented host-stall experiment, not emulated native cadence.

`before-stall` records29 raw samples. Its last presented shutdown is152.2ms;
the next presented state is off, so the final source pair is skipped entirely.
Both LCDs at that last shutdown sample differ from the retained native black
endpoint on all172800 pixels. The later charcoal off fill is not the native
black target. Browser restart still works, mute is true and page errors empty.

`before-reduced-stall` is a non-failing control: four raw samples retain a
presented terminal shutdown at0.3ms before off. The same1400ms artificial
stall does not establish a general reduced-motion defect. Preserve this
distinction instead of inferring behavior from duration alone.

The unchanged native reference is the isolated Azahar own400x480 PNG
`native-folder-switch-20261002/screenshots/power-input-20261003/_03.10.26_00.56.59.536.png`
under the same parent private root, SHA-256
`d69f16b3cb6bd6ed17d611e71aaf50f4e40bb15f8b5ab6bfbc39b8c3dc3f73e3`.
Its source path, HOME title/version/content, sleep pack/layout/animation and
converter identities remain in the [shutdown source record](home-shutdown-fade-2026-10-03.md#source-mapping).
No assets are newly extracted or delivered. This turn reuses a preserved
native endpoint; it does not claim a fresh Azahar run or matched input.
Native entry was held touch, while this diagnostic uses keyboard input.

## Final Production Checks

Runtime `ea6265de73ef5526f6c1ffb4b372762de138cf18`:

| Run | Raw paint/presentation samples | Last terminal elapsed ms |
| --- | --- | --- |
| `final-stall` | 30 | 1584.4 |
| `final-mobile-stall` | 28 | 1602.9 |
| `final-reduced-stall` | 4 | 0.2 |
| `final-app-stall` | 29 | 1596.3 |
| `final-context-tracked` | 77 | 1644.2 |
| `final-normal` | 68 | 1198.4 |

These sample counts include duplicate LCD contents at paint and render events,
not distinct native animation frames. All runs finish off and restart ready,
muted, with empty page errors. The context-tracked run logs actual context loss
and restoration: restoration at7105.7ms precedes a context-live shutdown render
at8183.1ms, then off at8187.4ms. These are browser timestamps, not native timing.
The earlier `final-context` lacked context-live metadata and is diagnostic
only; pre-suspension-fix `after-*` runs are retained history, not final evidence.

`final-power-input` repeats the owned touch/cross-boundary/cancel/re-entry/off/
restart checks and retains26 motion pairs with no errors. `final-power-lid`
uses reduced-motion Power -> lid close -> lid open -> Power -> HOME. Sleep
reports inactive native composition without failure, then wake returns ready;
both remain muted. Native re-entry and lid timing are not established by these
browser controls. Agent-browser sees the expected console controls and no
framework overlay; the coordinator inspected raw terminal pixels and mobile
framing.

Final full suite:1882 passed,0 failed,23 skipped,1 TODO (1906 total).
Typecheck/build pass. Independent review:101 focused tests, no remaining
finding after the suspension fix. Shader/material code was unchanged.

## Native Endpoint Comparison

Unmasked raw upper400x240/lower320x240 pairs, delta2, without registration,
color correction or phase fitting. Baseline last presented shutdown
`before-stall/frame-013` differs from native black on172800 pixels, maximum255,
mean absolute channel delta68.300264. The reduced baseline already matches.

All six final terminal pairs are byte-exact to native black: desktop
`frame-017`, mobile `frame-016`, reduced `frame-001`, app `frame-016`, ordinary
`frame-064`, and context-restored `frame-073` in their respective directories
above. The context-restored pair additionally has `contextLost:false` after
the retained restoration event and before off. Authored charcoal off remains
visible in the contact sheet but is excluded from the native terminal target.
Settled Power, held feedback and lid-wake supporting controls retain zero
pixels over2, maximum2 or less; their input/motion acceptance is not inferred.

Coordinator opened the final side-by-side sheet and independently verified938
records across final comparison and baseline inventory manifests. Final
artifacts in the private root:

| Artifact | SHA-256 |
| --- | --- |
| `shutdown-publication-comparison-report.json` | `3ee33d725691e5a44691d9edbc896864265b871488a3e08592e7d07d0bc8e0dd` |
| `shutdown-publication-comparison-manifest.json` | `2e35fc893d3104bd1a54728fac6e135482911aa78f4d528b5440fd3a0d7934f3` |
| `shutdown-publication-comparison-sheet.png` | `7553613826104c929688f9f653cb19de49512fd5bbd14ad4dc38e8e4b9b974c5` |
| `generate_shutdown_publication_comparison.py` | `b9c135e6fe33786b0a6f5a611194c0b609b8aeac30997f0aed0ec11a592b013b` |

## Cleanup

No Azahar process was launched this turn. Dedicated Chrome PID94201 was
closed with CDP `Browser.close`; its process session exited0 and both owned
browser/native process searches are empty. Chrome stderr retains deprecated
service-endpoint warnings, separate from empty page-error arrays. Required
tests/captures are complete; production3021 remains HTTP200. All browser runs
used `--mute-audio` and verified system mute; system audio, Spotify, microphone,
default reference profile and original firmware remain untouched.

## Acceptance Boundaries

Native black endpoint pixels and browser publication are separate checks.
Only paired successful native draws followed by a live visible render can
acknowledge the endpoint. An offscreen paint, failed/recovery pair, stale
shutdown identity, lost graphics context or same-callback overwrite cannot.
Browser nominal1200/120ms durations, reduced-motion policy, authored charcoal
physical-off fill and portfolio content remain adaptations. Exact native
epochs, input cadence, motion/audio and physical backlight order remain open.
Whole scenarios fail; the private scenario matrix is unchanged.
