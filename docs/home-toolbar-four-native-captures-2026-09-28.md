# Four HOME toolbar selections: isolated native captures

On 28 September 2026, a new APFS copy-on-write clone of
`/Volumes/Codex3DSIsolated/native-home-idle-matched-20260928` was made at
`/Volumes/Codex3DSIsolated/native-home-toolbar-four-20260928`. Only the new
clone was run. Its copied Azahar executable SHA-256 is
`3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`.
The clone has no symlinks under `user/`. Only its `Paths\screenshotPath` was
changed to the clone's own `screenshots/` directory; the resulting
`qt-config.ini` SHA-256 is
`e79fb9958ebf4bf0510f089e5038e8564d4b07368c4534180d5d3629e28df8a5`.
Azahar 2126.1.2 ran with Vulkan and was stopped after the captures.

The clone resumed the persisted Notifications HOME toolbar selection after
`File → Boot Home Menu → EUR`. The configured keyboard map has D-pad right
`H` and left `F`. Inputs were sent to the focused Azahar window through macOS
System Events, followed by visual checks of each selection. The input log is:

1. Three rapid `H` keystrokes selected Internet Browser (one observed move).
   `Tools → Capture Screenshot` saved the Browser image.
2. Three rapid `H` keystrokes selected Miiverse (one observed move).
   The same menu action saved the Miiverse image.
3. Four bursts of three rapid `F` keystrokes, then one single `F`, were
   attempted while navigating back; the observed final selection was Browser.
   Intermediate movement was not reliably sampled, so those key events cannot
   be equated to five exact native D-pad steps.
4. `F` key down in one System Events call, then key up in a later call after
   a 0.4-second shell delay, selected Friend List. The full held interval
   includes tool latency and was not measured. The Friend image was saved.
5. `F` key down for about 0.12 seconds, then key up, selected Game Notes.
   The Notes image was saved.

Azahar's own screenshot command produced genuine **400×480** PNGs. The upper
LCD is crop `(0,0,400,240)`; the lower LCD is `(40,240,320,240)`.

| Selection | Screenshot relative to clone `screenshots/` | SHA-256 |
| --- | --- | --- |
| Internet Browser | `_28.09.26_02.10.25.229.png` | `55c0e74dd4d76f145b000c90533d9a94e38d5c9297577898cd3a76d227a53a03` |
| Miiverse | `_28.09.26_02.10.50.672.png` | `cf46417e19d99c51baf203e551d5f71a8151b916a453182d3bf0bfb002190cfc` |
| Friend List | `_28.09.26_02.12.17.704.png` | `c842a5e2f5fb8c3674b8fd0d62a9484d8b930e17b58e71a4d2751480f19a77a4` |
| Game Notes | `_28.09.26_02.12.37.99.png` | `bf95a6980ccba2ec1ffe36b9020ac9bfe7ceb4c7bfe042051dd5c31704877d20` |

The selected toolbar icon, banner artwork and title were visually checked in
each screenshot. Native screenshots now exist for all four banner identities
listed in [the source inventory](home-toolbar-banner-source-inventory-2026-09-28.md).
Selection timing and animation phase were not synchronized to a browser run;
these captures do not establish a paired production comparison, input parity,
or whole-scenario acceptance. No private screenshot or CGFX is committed.
