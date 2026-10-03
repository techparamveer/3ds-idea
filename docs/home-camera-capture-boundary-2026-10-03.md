# Camera Capture Boundary

3 October 2026, unchanged runtime `0e59c1a0`, evidence base `0f3a248e`.
This bounded fault-isolation replay changes the next action, not the UI.
The preceding [Camera close comparison](home-camera-manual-footer-2026-10-03.md)
reported 95,208 upper pixels above delta2. It must not be interpreted as
95,208 pixels of missing HOME capture or incorrect HOME material.

## Observed Boundary

Fresh production `before-desktop/camera-app/upper.png` already contains a
black finder with capacity3000, a source cube and SD symbol. The subsequent
suspended and close frames retain those graphics in the curved capture.
`drawNativeCameraGuide` in `src/os/stock-native-camera.ts` explicitly fills
the finder black and declares its capacity/SD fixture; this is not an observed
physical camera feed. Native reference Camera uses a different static image.

Native's three Camera providers point to existing portfolio `renu.jpg`,
2000x1500, SHA `6f58eb909c20907c56179dbf35f39024057f62e203503973eccbf3918b3de5a0`.
That user image is not firmware art. A future matched read-only Camera fixture
must preserve this distinction and coordinate Stock/scene ownership rather
than inserting the native screenshot into HOME.

`screens.ts` requests the retained owner capture, validates transition owner
and generation, and rejects unavailable native backing. `firmware-banner.ts`
binds `capture.upper` into `BG_DmyApp_00`, caching by owner, generation and
playback. The preserved graphics contradict the suspected wholesale missing
capture. They do **not** prove every overlay, capture epoch or material correct.

No runtime, asset, geometry, shader, Camera behavior or profile is changed.
No screenshot substitution, brightness fit, guessed scene or acceptance mask
is introduced. The black finder is an existing fixture adaptation, not new
user acceptance of a reduced fidelity target. Source/manifest identities for
the unchanged backing remain in [suspended background](home-suspended-background-2026-10-02.md#source-mapping).

## Evidence

Private R:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-camera-suspended-backing-20261003`.
Fresh production raw LCDs are in `R/before-desktop`; 19 switch pairs complete
without page errors and restore the exact layout fixture. Coordinator opened
live-app and Close upper captures. Source worker uses separate
`3ds-home-camera-suspended-backing-20261003` / `codex/home-camera-suspended-backing-20261003`
from `0f3a248e`; comparator owns only R. Both use GPT-5.6 Sol/high.
Worker `R/diagnosis.md` SHA
`09785e83ec515c4d45370c6000a0da472eb54a991771a440ad09f86f86407360`
records source guard paths and existing test coverage; no new test run or
runtime commit is claimed. The worker checkout remains clean.

Native own400x480 PNGs are reused, not recaptured this slice. Native process
was not started. Full comparisons remain unmasked and failing; differing
Camera content is diagnosed, not excluded. Prior1,902 tests/build/typecheck
belong to unchanged runtime and were not rerun for documentation.
Muted Chrome74609/window13177 was verified on the authorized Mac and exited0;
exact PID absence checked. Preview3021 remains available. No default profile,
system audio, microphone, private matrix or DeveloperStorage artifacts changed.

Coordinator opened the comparison sheet and rehashed all30 manifest records.
Frozen artifacts under R:

- Report SHA `6479d05688cdcc0dcd6b1d6ef3ac2bf614d9e1ef94cce8cf15e1dc08130772d0`.
- Sheet SHA `7278fb135c688fc244d7d65dbe657df554f0783a5093d0b41f41db1a45baf27f`.
- Manifest SHA `103a85f22d836c00be37978c7f7f5d7a9e7c077d15a33e63e6b3934abc3e4728`.

Names use `home-camera-suspended-backing-comparison-{report.json,sheet.png,manifest.json}`.
The same sheet isolates a **separate** confirmation defect: browser Camera
Close changes all36,128 pixels in the unoccluded app diagnostic region, while
the corresponding native suspended/Close region is byte-identical. The
explicit ordinary-close upper mask is therefore the next bounded correction
target; do not conflate it with the independent Camera feed gap. Native timing
and non-Camera policies remain unproven.

## Next Action

Do not repeat this source-only audit or adjust HOME shading to compensate for
different app content. A further Camera HOME comparison needs a matched
read-only fixture, or use a deterministic foreground app such as Health.
Then measure retained-frame transfer, window/HUD and transition separately.
First isolate Camera's ordinary-confirmation upper mask identified above,
then continue the lifecycle queue's native reveal/power-on evidence. Existing
capture padding/sampling, native epochs, overlay pixels, timing and muted audio
remain unaccepted. Strict whole-scenario fidelity is still unproven.
