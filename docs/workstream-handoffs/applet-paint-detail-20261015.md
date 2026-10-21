# Applet paint detail diagnostics - 15 October 2026

## Scope and result

This bounded diagnostic slice extends the existing opt-in `measurePaint` path.
It does not change the stock paint key, draw calls or order, native resources,
clocks, poses, cache policy, publication, guards, retry, disposal, input, or
recorder behavior.

`ScreenPaintTiming` now includes two nullable details:

- `titleIncomingDetail` records title asset validation, upper draw, lower draw,
  and the remainder of the existing outer `titleIncomingMs`, plus retained
  renderer cache entry and byte deltas around each draw.
- `notificationsStockDetail` records whether the current Notifications stock
  pair was recomposed or cached. A recompose includes its elapsed composition
  time and every changed component of the existing key; a cache hit has
  `compositionMs: null` and an immutable empty reason list.

The component vocabulary is `cold`, `owner`, `view`, `revision`, `capture`,
`reducedMotion`, `zone`, `eshopPose`, `eshopHud`, `notificationsHud`,
`notesHud`, `browserHud`, `settingsHud`, `soundClock`, `intro`, `health`,
`notesFooterClose`, `notificationsFooterClose`, `manualFooterClose`,
`friendsFooterClose`, `webFooterClose`, and `font`. Multiple changes are
retained rather than selecting one cause.

`NativeLayoutRenderer.cacheEntryCount` is a read-only view adjacent to the
existing `cacheBytes`. The measurements are retained-cache deltas, not
allocation counts; negative integral deltas are valid when eviction occurs.

## Measurement boundaries

Title detail is collected only while the existing title-owned incoming branch
is active:

- `validationMs` wraps only `validateAppletTitleEntryAssets`.
- `upperDrawMs` and `lowerDrawMs` wrap only their respective existing
  `NativeLayoutRenderer.draw` calls.
- Each cache baseline is sampled immediately before its draw and again
  immediately after it.
- `remainderMs` is the existing outer `titleIncomingMs` minus validation,
  upper draw, and lower draw. It therefore retains option preparation,
  override preparation, callback, and other title-helper time inside the outer
  interval without attributing that time to a renderer draw.

Notifications `compositionMs` starts immediately before the existing
recomposition branch and ends after that branch. It excludes the later outward
upper and lower `drawImage` copies. Changed components compare the successful
current measured snapshot with the preceding successful measured snapshot;
the first successful composition reports `cold`. A failed or incomplete paint
does not publish a diagnostic snapshot.

The disabled path performs no added clock reads, cache inspection, or reason
construction. Current-paint diagnostics are cleared on paint start, skipped or
inactive paths, failure, retry/reset, and disposal. Returned measurements and
reason arrays are frozen or defensively copied.

## Behavioral evidence

The focused tests exercise the real title helper and renderer, the real stock
presentation, and screen receipt forwarding. They cover upper/lower timing and
retained cache deltas, cache hit, cold and multi-reason recomposition,
Notifications HUD parity, revision and font changes, failure/retry, reset,
disposal, immutable results, disabled clock/cache behavior, unchanged draw
calls/order, and unchanged Canvas source pixels across all 42 title poses.

Before the implementation, the final focused command produced 45 passes and
the five intended failures: the title callback/cache detail, renderer entry
count, stock diagnostic API, Notifications reason diagnostics, and screen
receipt detail were absent. The unaffected controls passed.

```text
node --test \
  tests/applet-title-entry-raster.test.mjs \
  tests/stock-screen-preparation.test.mjs \
  tests/applet-incoming-paint-timing.test.mjs
50 tests, 50 passed
```

## Verification

Base: `bae2e9ce1e8cb7e88b21a134cd35d7ed6cc7edd5`.

Source/test commits:

- `caaa3f9738c132e85bcb686e9b211603c3337d28` adds the diagnostics and tests.
- `4626dc8eef5b2a1b6db271e9274df803e98e7cbc` restores the pre-existing stock
  paint key expression byte-for-byte after a source-contract test caught the
  initially factored local. Runtime key values had not changed.

Final command results at `4626dc8`:

- Focused command above: 50 passed, 0 failed.
- `npx tsc --noEmit --incremental false --pretty false`: passed.
- `npm test`: 3,094 tests; 2,990 passed, 1 failed, 102 skipped, 1 TODO.
  The sole failure is the preserved historical Camera test `frozen HNI pair
  hashes and the ThmbBase date rect stay the recorded leftover`, because
  `/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/camera-3d-badge-sdmc-recapture-20261005/browser/lower.png`
  is absent. No paint-detail, title-entry, renderer, or stock-presentation test
  failed.
- `npm run build`: passed; build ID `3O1VJY2p2mFLyJ__sHpJn`.

Dependencies were copied with APFS clone semantics from the frozen incoming
raster checkout. Tracked LFS assets were hydrated from the existing local
object cache with `git lfs checkout`; no install, download, source asset, or
lockfile change occurred. The first full run is retained: 3,037 tests, 2,892
passed, 42 failed, 102 skipped, and 1 TODO. Its failures record the initial
pointerized LFS setup, the caught source-contract issue, and the same historical
Camera PNG absence. Nothing was skipped or weakened to hide those results.

Private logs under
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261015/applet-paint-detail/source-checks/`:

- `base-red.log`, SHA-256
  `e9ec9e919f9b24ba767ef48e2555a3a98e8320bf8250b9a2db6a5da43e897deb`
- `focused-final.log`, SHA-256
  `7961e3264f20c21ead4b68c2384b5eff2cd0cf6e55e7308436106eb904b6e101`
- `npm-test.log`, SHA-256
  `9e3dc0d0c6ae82a5041788a424d620bc01f36fd9dc91186b63b6132afffacf6f`
- `npm-test-hydrated.log`, SHA-256
  `ea2db788c95915e5d7cee817870cf91524c34bbd4a5563eb18a15e22b732057b`
- `typecheck-final.log`, SHA-256
  `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
- `build.log`, SHA-256
  `916333cebd6c19fad1646b2ce58fbf279b9a5614e6cdee4a5b0c5ea62afeea7a`

Independent review of source head `4626dc8` found no actionable issues. The
reviewer independently passed the 50/50 focused suite, verified the original
stock key expression byte-for-byte, and checked the prior-success snapshot
semantics. The review is
`applet-paint-detail/review/source-review-4626dc8.md`, SHA-256
`3a8070f2bddd4d8b406ec0da5f3f9fe8aa3d1647a27130d9d8d52c20c1346cd3`.

## Limits and transfer

These values are browser CPU diagnostics. They are not compositor or native
measurements and do not prove cadence, native parity, pixel acceptance, input,
or audio behavior. No browser, GUI, server, or Azahar session was run by this
worker. No visible source or native asset changed, and no optimization or
causal conclusion is included in this slice.

The frozen worker build is `3O1VJY2p2mFLyJ__sHpJn` from independently reviewed
source head `4626dc8`. After this handoff commit, the worker releases the
`applet-paint-detail-20261015` checkout, source, tests, handoff, and build to
root for capture, analysis, and integration.
