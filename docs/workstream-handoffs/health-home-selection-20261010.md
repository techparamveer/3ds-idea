# Accessibility HOME shortcut destination focus

Worker checkout: `/Users/paramveer/.codex/worktrees/health-home-selection-20261010/3ds-idea`,
branch `codex/health-home-selection-20261010`, base
`5428c4165865f50048a6e03c6f7ef73c99de5bf9`. Runtime/test commit
`7214ff7ca6483f7d7bbb96954f2842c58c437190`; extracted callback fixture correction
`5cd5ea76f00857d6dcabfa94f33aa04cb6c5fc2a`. Only the assigned checkout was edited.
The coordinator's unrelated human system.ts edit was not read or changed.

## Observed defect and cause

The coordinator's frozen `5dab027` production build `AbU0doePk5fpJYzR19WW_`
captured 451 Health pairs after Notes/Notifications closing and an accessibility
Open Health action. Physical HOME reported suspended Health in accessibility
state while the LCDs exposed Notifications and Open. The setup used an
accessibility adaptation and did not prove a native suspension defect.

The worker reproduced the exact contradiction through real touch input,
`launchHomeShortcut`, physical HOME, the lower HOME update journal,
`resolveHomeBannerHostObservation`, `selectedSuspendedApplication` and
`getHomeFooter`. A previous Notifications toolbar selection alone was sufficient;
opening and closing the applet was not necessary. The ordinary touchscreen Health
route and an untouched-grid shortcut were passing controls. The original
Notes/Notifications footer-close history is also covered.

The ranked probes distinguished a shortcut selection error from a suspension
override or stale banner classification. `selectHomeLocation` changed the grid
title to Health but preserved `toolbarActive: true` and `currentFocus: 3` before
launch. Launch and HOME preserved those fields. The lower journal therefore
resolved Notifications, and the existing composition selectors consistently
suppressed Health's suspended window and selected Open.

## Delivered change

[launchHomeShortcut](../../src/os/system.ts) now resolves the title's root or
child location and selects grid focus before launch. The five top-row shortcuts
select their own toolbar focus. The
[scene accessibility loop](../../src/scene/console-scene.ts) uses that same
adapter while retaining its existing entry-cover skip.

This is an explicit accessibility adaptation. Direct destination selection and
the pre-existing cover skip do not reproduce native touch or cursor motion.
Ordinary `invokeSystemApplet`, physical/touch input, suspension composition,
native assets, timing, curves, generation/owner guards, readiness and paired-LCD
publication are unchanged.

The [new behavior regression](../../tests/home-shortcut-selection.test.mjs)
covers the exact failure, ordinary touch, untouched-grid access, a folder child,
all five top-row destinations and applet footer-close history. The existing
[extracted scene callback test](../../tests/applet-entry-live.test.mjs) now injects
the real adapter, checks grid and prior-toolbar origins, and retains every prior
cover skip, Notes readiness quarantine, retry and visual-reopen guard assertion.

## Checks and frozen delivery

All private logs are under:

`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/health-home-selection-20261010/`

| Check | Result | Log |
| --- | --- | --- |
| Initial minimal regression | 2 pass, 1 exact symptom failure | `red-tests.log` |
| Final ten-test regression replay against pristine base source | 2 pass, 8 fail | `red-final-regression.log` |
| Final ten-test regression on candidate | 10 pass, 0 fail | `green-final-regression.log` |
| Focused input/lifecycle/composition and actual callback checks | 121 pass, 0 fail | `focused-final-tests.log` |
| `npm run typecheck -- --incremental false` | Pass | `typecheck.log` |
| `npm run build` | Pass | `build.log` |
| Final `npm test` | 2,662 pass, 1 unchanged historical Camera PNG failure, 101 skip, 1 TODO | `full-final-tests.log` |
| `git diff --check` | Pass | Worker command result |

The red replay command uses the unchanged base `src/` snapshot and the exact
committed regression file under the private `red-replay/` directory:

```sh
node --test /Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/health-home-selection-20261010/red-replay/tests/home-shortcut-selection.test.mjs
node --test tests/home-shortcut-selection.test.mjs
```

Red log SHA-256:
`6be36bfe5166e80f055602d61d5ae58c7eac7890e4c8afab96626a29a13e7161`.
Green log SHA-256:
`34740add373775fac90c08c3b41cad241f1353078332c94ecec193d55c8c5f4d`.
Focused final log SHA-256:
`f128e9e08e82133f3a1c1f0be00bc261a1266b8009b3ec5bdef352f07bec4dfc`.
Full final log SHA-256:
`cdba69a3c93fba0e750637da4f477b3617175d42664184ff4317446eda0d58b0`.
The red and green regression file SHA-256 is identical:
`25aab09a13b362b3a0dc15b50cecf9bc39858823791135d76a671344808dde1b`.

Production build `YUOmZy1gnxALpXL-fNhqB` was built at runtime commit `7214ff7`.
The later fixture and handoff commits do not change runtime source or assets.
Dependencies are a local copy, not an external symlink. Source, assets and
`.next` are frozen for coordinator takeover. No server, browser, Azahar or audio
session was started by the worker.

The first full run had one new extracted-callback missing-binding failure and
the unchanged historical missing Camera PNG. The fixture correction fixes the
binding failure. The first full log remains preserved as `full-tests.log`.
The final remaining failure is `tests/camera-date-group.test.mjs:44`, which reads
the absent historical
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/camera-3d-badge-sdmc-recapture-20261005/browser/lower.png`.
The four relative handoff links and whitespace checks pass.

## Evidence limits and remaining work

Source-identified: the accessibility selection error and its input/composition
consequences. Delivered and implemented: the two exact commits above. Tested:
the table above. Browser-inspected and native-compared: no new worker evidence.
The coordinator owns integration, independent review and muted production
recapture of the shortcut plus ordinary Health and top-row regressions.

No firmware asset, manifest entry, source mapping, font, sound or native graphic
was introduced or changed. The pinned EUR 10.7.0-32E asset identities remain the
existing ones. No new capture pair, pixel mask or native diff report was created.
Native Health audit `5e78d332` identifies retained Health and later suspended
dialog/footer poses; it does not establish this candidate's fidelity or timing.

The coordinator's later ordinary Health captures show a separate motion
mismatch: browser HOME tray exposure precedes upper status/dialog, and the upper
retained LCD stays bright while the lower dims. That defect is outside this
shortcut correction. Existing capture-fitted suspension timing/composition and
accessibility adaptations remain explicit. Native input, motion and audio
acceptance, including muted-audio limitations, remain open. No whole scenario
is accepted by this handoff.

Coordinator integration must update the live progress record, feature map and
shared handoff log. The worker's uncommitted STATUS identity is local bookkeeping
and should not replace coordinator STATUS.
