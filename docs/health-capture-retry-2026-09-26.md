# Health exact-frame capture retry

The production Usage capture after one Down timed out requesting
`lcdHealthFrame=327`, while the display continued animating. This does not
establish a Health scroll defect. `stock-apps.ts` adds each positive tick's
elapsed time to `healthElapsedMs` before calling `healthDocumentReduce`; the
scroll path preserves that clock. `healthTopLoopFrame` samples the 720-frame
source loop at `268111856 / 4481136` Hz. The capture gate reads the live app
state once per browser animation frame and requires exact integer equality.

The former 14.1-second deadline allowed about one 12.034-second source loop.
A browser update spanning source frames 326 to 328 cannot observe 327. If that
happens during its one opportunity before the deadline, the capture fails even
though animation and scrolling work. Actual callback timestamps from the failed
production attempt were not recorded, so this identifies a sufficient harness
failure mode, not a measured frame-drop count for that attempt.

The default deadline now permits three complete source loops plus two seconds
of scheduling grace (about 38.1 seconds). It still captures both LCDs inside the
callback observing exactly the requested live frame. No clock seeking, source
phase substitution (including the visually repeated phase 687), or scroll state
change occurs. Timeout errors include target, observation count, last source
frame, last app elapsed time, and observed skipped target crossings. The crossing
counter is diagnostic: a gap longer than a full loop may hide further crossings.

A low or unlucky browser cadence can still skip the target in every loop. The
bounded wait then fails visibly rather than fabricating the requested frame.
Production recapture remains the coordinator's gate. Focused tests simulate a
missed target followed by a hit in a later loop, reject the equivalent phase,
and check actionable timeout telemetry; existing cancellation, unavailable-app,
and reduced-motion tests remain in force.
