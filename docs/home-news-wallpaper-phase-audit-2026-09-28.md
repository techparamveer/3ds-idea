# HOME Notifications wallpaper phase audit — 28 September 2026

No renderer timing change is supported by the current capture pair. The HOME
`BannerBG_Loop` source material runs for 600 frames, while native mode entry and
explicit restart reset its epoch and resume preserves it. The native Notifications
screenshot records none of those events or the loop frame. The browser capture
uses a diagnostic elapsed time rather than a matched native background epoch.

## Production comparison

- Native Azahar: `/Volumes/Codex3DSIsolated/native-home-idle-matched-20260928/screenshots/_28.09.26_01.44.53.539.png` (400×480, upper LCD rows 0–239).
- Production browser, integration source `54e61c8`: `/Users/paramveer/.codex/3ds-artifact-overflow/presentation/news-wallpaper-phase-20260928/browser-upper.png`, SHA-256 `df90572cb3498cc1b969a80639a3abae04eb1459e8df7f992bdcad40e831bd45`.
- Browser selected toolbar Notifications (`focus:3`, `category:6`) and sampled `lcdElapsedMs=8483.333333333334`, `lcdDate=2026-09-28T00:44:00.000Z`. Its upper PNG is byte-identical to the previous source-banner capture.
- Empty-mask upper residual: 46,756 pixels over 2/255, maximum channel delta 255. Notifications banner crop `(130,35,140,120)`: 8,710 pixels over 2/255, of which the prior pose audit attributes 6,025 to pixels outside the green model union.
- Unoccluded wallpaper margin ROI, `x=0..59` and `x=340..399`, `y=25..199`: 12,205 of 21,000 pixels over 2/255; mean absolute RGB error 4.0312.

The source pipeline already renders the decoded HOME `BannerBG_Loop` texture and
material transform. Its live frame is sampled from scene elapsed time, with an
explicit source-frame override available only for diagnostic capture. Earlier
native burst analysis matched the same source wallpaper at different frames
without recovering a live restart epoch; see
[wallpaper phase evidence](home-wallpaper-phase-2026-09-26.md). The current native
and browser input histories differ, so this screenshot cannot identify a fixed
offset, pause interval, or transform correction. The native pre-3D
`LncBgSlide_U_00` layout also has no established settled white-HOME eligibility.

## Required next evidence

Record a native mode-0 entry or explicit `BannerBG_Loop` restart together with
monotonic update/capture timestamps, then compare the source frame at the same
elapsed interval in production. Include resume and AppQuit paths if used. Until
that trace exists, leave the source frame, material transform and pre-3D slide
unchanged. Production build passed; the screenshot above is the verification
capture. This result remains a whole-scenario fail.
