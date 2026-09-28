# Settings verification calendar injection

This diagnostic-only change follows direct text sampling commit `b4d2c34`.
The coordinator's capture requested04:31 while the retained live Settings HUD
still displayed04:41. Capture metadata recorded the requested Date despite
those pixels. The normal source-retention behavior was working; the capture
entry point lacked an explicit way to request an isolated calendar replay.

## Capture path

`captureScreensAt(elapsedMs, isoDate)` now passes `{sampleCalendar:true}` only
when an ISO Date was explicitly supplied. The option flows through
`screens.paint` → portfolio `overlay`/`semanticApplication` → stock presentation.
For Settings, it calls the existing `sampleSettingsHud` with a fresh temporary
sampler, the active Settings-local elapsed time and the requested Date. The
result is rendered without replacing the live owner's retained sampler.
The existing `finally` paint restores the live view. Normal frame paints and
captures without an explicit Date retain normal source counter/date behavior.

Capture metadata additionally records `calendarSampling` as either
`verification-settings-local-replay` or `live-retained`. The existing `date`
field continues to identify the requested sample instant. This is a controlled
browser-calendar replay, not a reconstruction of the native launch timestamp.

Source counter semantics and original firmware resources are unchanged:
calendar/colon refresh at counter<=0, charging battery refresh at counter2 or
negative, and colon uses the previously displayed date. Therefore near a minute
boundary the displayed minute may precede the requested timestamp, exactly as
it can in the retained model. For settled odd/even comparisons, use matching
native phases sufficiently after the second boundary. The active local elapsed
time remains an input to this replay; this diagnostic does not advance app state,
inputs, source motion or the runtime clock. See
[the HUD source/runtime mapping](settings-hud-runtime-2026-09-26.md).

## Verification

A focused production-presentation test initializes a live04:41 sample, asks for
04:31 and04:32 at the same Settings-local update count on both main and Other,
and checks the HUD passed to the native renderer. Returning to normal painting
must restore the identical original retained date/counter/phase. The pre-existing
normal repaint/clock-change retention tests remain unchanged and pass.

32 focused presentation, HUD, Camera and eShop lifecycle tests pass; typecheck
and production build pass. Diff-check passes. No source asset or shader changed.
The prior direct-text source regression remains: Settings main and all50 lower
renders unchanged, Other source title/icon8 pixels >2 (two additional HUD pixels
remain). Live matched Date capture and image comparison still belong to the
coordinator; this worker did not operate a browser or Azahar.

Logs: lane `.local/settings-title-phase/capture-{tests,typecheck,build}.log`.
