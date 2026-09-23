# Native screen preparation and recovery

Native resource support is selected independently of font availability. A
supported foreground view starts one 20-second preparation deadline, including
any wait for the borrowed shared font. The browser prepares resources during the
existing launch animation. When launch ends before preparation, both LCDs hold
opaque black; no generic app controls are drawn. The black pixel value matches
`packs/home/common.json`, `CmnFadeNinLogo_U/D_00`, `SceneOut` frame20: full-screen
`P_00`, RGB0, alpha255. Holding this endpoint for browser loading is an explicit
host policy, not a measured Nintendo loading sequence or duration.

The existing per-owner native session still snapshots/coalesces requests,
invalidates generations and disposes late completions. No global asset cache or
background title preload is added. Timeout aborts the owner and invalidates its
session; a non-cooperative loader's late result is disposed. Timers are cleared
on settlement, replacement, suspension and disposal. Font arrival after timeout
does not silently retry. Stable descriptor identities keep interior navigation
within a loaded title session.

`stock-screen-presentation.ts` renders both screens into private canvases before
publishing either. Native draw failure or exception discards the entire pair and
shows recovery rather than falling through to generic chrome. Camera retains
its documented portfolio upper-screen composition; failure of its native lower
frame is still a whole-pair failure. The session is input-ready only after the
first successful native pair has been published. Recovery controls likewise
become eligible only after the recovery pair is painted; global storage notices
are deferred so they cannot cover loading or recovery pixels.

Recovery is deliberately authored browser UI: white browser-font text on black,
labelled “Website display unavailable”, with A/Retry and B/HOME controls. It is
not Nintendo artwork, a firmware error code or a substitute application screen.
B and HOME suspend the current owner and return to HOME, including during launch;
the suspended Settings/helper caller chain survives. A or a complete touch on
Retry explicitly begins a new attempt. There is no automatic retry loop.

`native-screen-input.ts` owns the host input gate and the recovery hit rectangles.
Loading/error blocks app actions, directional inputs, analog navigation and app
touches. Power remains available. Error permits explicit Retry; B/HOME escape is
available in both states. A touch must begin and end in the same recovery button.
Held controls/touches are cancelled when a frame becomes unavailable; controls
started or cancelled there must be released/centred before they can activate a
later ready frame. `native-screen-system.ts` bridges cancellation and HOME escape
to existing reducers without storing resources/readiness inside them.

The scene reads status through `screens.ts` and `portfolio-screens.ts` before
input dispatch and clock updates. It cancels latched repeats before ticking a
hidden app, publishes development-only `data-native-screen` and
`data-native-screen-failure`, and announces loading/recovery instead of unseen
application rows. Normal portfolio app presentation is unchanged.

## Verification

Focused preparation, session, input and Settings/helper tests cover missing
fonts, deferred/rejected/hung loads, timeout, late-result disposal, owner changes,
explicit retry, partial draw failure, atomic publication, held input, touch
recovery and caller preservation. TypeScript checking and real-resource Canvas
composition checks complement these tests. Final browser throttling, reduced
motion, HOME/sleep resume and physical control verification belong to integration;
these checks do not establish native hardware timing or 1:1 LCD fidelity.
