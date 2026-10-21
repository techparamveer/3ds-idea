# Notes and Notifications HOME reveal

Base: `ff5ae95cc8fd4af6833bdf11e574d5b03d12534a`.
Worker: `codex/toprow-home-reveal-20261015` in
`/Users/paramveer/.codex/worktrees/toprow-home-reveal-20261015/3ds-idea`.

## Captured defect

The coordinator inspected native Notes ordinal 1469 and Notifications ordinal
1499, each retaining selected Health while ordinary neighbours remain absent.
The Chromium first-Close boundary sheets already show the populated ordinary
grid through incoming20. This assignment addresses that premature visibility,
not native partial-neighbour loading or its timing.

Native full-window samples are `notes-first-uncoveredHomeNoBanner-window-1x.png`
and `notifications-first-uncoveredHomeNoBanner-window-1x.png` under
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/toprow-current-20261010/native-v2/audit-sol-high-v1/`.
The corresponding browser `notes-first-close-boundaries-paired-1x.png` and
`notifications-first-close-boundaries-paired-1x.png`, plus first/repeated
`*-close-incoming-lowers-1x.png`, are under
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261015/toprow-chromium/browser-audit/`.
These are coordinator-inspected baseline evidence, not worker recapture.

## Implemented adaptation

[screens.ts](../../src/os/screens.ts) enables the existing Manual selected-only
grid path when the guarded Notes or Notifications Close pose has `kind: 'in'`.
The retained ordinary slot still comes from `state.selected`, or
`state.folderSelected` inside a folder. Toolbar focus does not replace it.
Other occupied ordinary slots use the existing native empty-slot renderer.
Folder tiles and vacant slots keep their existing paths.

Incoming20 remains selected-only. The separate handoff restores the populated
grid, and its accepted paired receipt admits the banner for the next clear
paint. No controller, timer, resource, logical layout, input, generation,
owner, paired-publication or disposal contract changes. Manual behavior is
preserved; Friends, Browser and Miiverse returns remain populated.

This extends a fitted visibility policy, not the native per-record loader.
Partial groups, exact native epochs/cadence, input, moving pixels and muted
audio remain unresolved. The closed loader trace and debugger-capability gap
are not reopened. All whole flows remain fail/unproven.

## Resources

No asset or converter changed. The shared vacancy resource is
`launcher.layouts.LncIconSetSrc_00`, its `LncIconSetSrc_00_Scale` animation and
the existing category-5 overrides in `createFirmwareHome.empty`.
The [Manual handoff](manual-home-reveal-20261012.md#reused-provenance) records
the reused mapping: EUR HOME `0004003000009802`, v24576, content index 0 /
ID `00000082`, `launcher_LZ.bin/blyt/LncIconSetSrc_00.bclyt`, source SHA-256
`1296496b88f41abc6c9382f59bb51927a6b8f049f9cc02454653f27d2730dcaa`,
converter `ctr-native-web 1.2.0`.
Delivered launcher SHA-256 reverified unchanged:
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`.
Selected titles keep their existing manifest-backed icon path. Existing
portfolio graphics and compositor adaptations are unchanged; none are
represented as native acceptance.

## Tests and limits

[manual-home-reveal.test.mjs](../../tests/manual-home-reveal.test.mjs) reuses
the actual screen compositor, System entry/Close completion, firmware helper,
decoded launcher textures/title pixels and material renderer. Top-row setup
uses the public toolbar-selection and applet-invocation APIs, then actual
touch down/up Close and accepted presentation receipts. Unrelated stock
screens/covers and Canvas transport are fixture doubles. Prepared pixel bytes
and placement are checked against the delivered source paths; this is not a
browser raster, GPU-publication or native pixel-equivalence test.

Coverage includes first/repeated Notes and Notifications return with retained
Health then Camera while toolbar focus stays active; every incoming0..20;
reduced-motion incoming20; unaccepted handoff/banner quarantine; unavailable
empty rendering and restored artwork; retry, revoked receipts, cancellation
and existing firmware-generation reset; unchanged Manual and non-target returns.
Every paint checks that presentation does not mutate System/layout/input state.

Private checks:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261015/toprow-home-reveal-worker/`.

- Before runtime edits, `node --test tests/manual-home-reveal.test.mjs` reports
  8 passes and 8 expected target failures in `red-confirmed.log`. Both target
  routes draw four ordinary titles instead of retained Health alone. The
  Manual and three non-target controls pass.
- After the fix, the same command passes all 16 tests in
  `green-confirmed.log`. Earlier fixture-setup failures and an incorrect test
  assumption about firmware replacement are preserved in the earlier logs;
  neither drove a runtime change. The firmware test now preserves the
  existing controller-reset behavior.
- The focused Manual/Notes/Notifications/Friends/Web footer, applet compositor,
  entry and scene-policy run passes 141 tests, with no failures or skips,
  in `focused.log`.
- `npm run typecheck` passes in `typecheck.log`.
- `NEXT_TELEMETRY_DISABLED=1 npm run build` passes in `build.log`, build ID
  `454Ei9DxtcRvfuTR5Vcr0`.
- `git diff --check` passes. The root-owned STATUS assignment stays unstaged.

No full suite, browser, server, GUI or emulator run was performed. The worker
build is not the coordinator's integrated build or a native acceptance result.
Next: independent review, integration in the separate verification checkout,
and first/repeated Notes/Notifications recapture with Manual and non-target
regression checks. Do not interpret the fitted handoff as native loader timing.
