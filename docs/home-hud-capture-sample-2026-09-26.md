# Explicit HOME HUD capture sample

The local LCD verification path accepts `lcdHomeHudSample` as URL-encoded JSON.
It must contain all fields of `DiagnosticHomeHudSample`: `kind: "source-pose"`,
nonempty `evidence`, `networkMessage` (`lau_connect0` through `lau_connect4`),
`netModeFrame`, `netAtnFrame`, `batteryFrame`, `walkCoinFrame`, `coins`, and `steps`.
There is no default diagnostic profile. Use the observed sample and record its
reference screenshot, independent phase choices, and unresolved assumptions in
`evidence`; this is a source pose probe, not a native service-state mapping.

To build the query, use `params.set('lcdHomeHudSample', JSON.stringify(sample))`
on the existing `URLSearchParams` containing `lcdCapture=1`, `lcdElapsedMs`,
`lcdDate`, and `lcdScenario`. It can accompany `lcdBannerFrame`; it cannot
accompany the live Health phase gate `lcdHealthFrame`. The exposed local
`captureScreensAt(elapsedMs, isoDate, bannerFrame, sample)` accepts the same
explicit sample as its fourth argument. Both entry points enforce loopback,
complete valid fields and evidence. The capture also requires a powered,
awake HOME Menu without a dialog or preferences panel, and native assets.

The existing HOME painter validates source clip bounds against the delivered
HOME `hud` pack (`HudMenu_00_NetMode`, `NetAtn`, `Bat`, `WalkCoin`) before drawing.
Message selection uses the delivered HOME messages. See
[the profile audit](home-hud-profile-state-audit-2026-09-26.md) for firmware
provenance and the unresolved service-to-frame mapping. This change adds no
asset, guessed palette, phase offset, or visitor state.

Capture JSON includes the exact copied `homeHudSample`, with its evidence string,
and `homeHudSampling: "verification-source-pose"`. Without a sample these are
`null` and `"live-default"`. The synchronous `finally` block repaints with no
verification options before returning, including when PNG encoding fails;
normal application state is never assigned the sample.

Validation: focused capture/HUD tests cover query validation, provenance
serialization, firmware clip bounds, live HUD restoration, active-HOME rejection,
and the actual capture transaction on encoding success/failure. Coordinator
production recapture remains the visual verification gate; no browser or
Azahar session was operated in this lane.
