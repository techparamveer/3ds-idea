# Firmware scene integration checkpoint

The console scene loads the audited HOME manifest, shared/HUD font atlases and
native layout renderer. The folder callback renders the original CGFX mesh and
material operations into a reusable 400×240 target using the console's Three.js
renderer. Its camera framing remains authored pending a matched native capture.
The upper canvas retains the existing 800×240 texture adapter.

Physical controls and keyboard now deliver press/release events. Circle Pad
samples and touchscreen down/move/up/cancel use the same runtime path; the scene
no longer implements its own HOME drag, swipe or repeat rules. Blur, pointer loss,
sleep and teardown release held input. Runtime HOME helpers own folders and
movement. Three.js stays outside the deterministic runtime.

`runtime-effects.ts` drains effects without awaiting permission dialogs. Device
requests begin synchronously from the originating user gesture, results check
the current request token, and release runs independently of queued saves.
IndexedDB writes preserve emission order. Preferences restore before input is
installed, migrate from the old localStorage value, and are only written when
changed. Failed/corrupt storage is shown inside the lower display. Teardown
releases devices immediately and closes the database after pending saves finish.

`render_firmware_audio.py` pins DualRip revision
`c00e809ad4fcc44056a5b3c11d30f6a698b92be0`, interprets selected original sequences
with their banks/samples, and exports PCM plus source, converter, loop and cue
provenance. It refuses a dirty renderer checkout or mixed existing output.
The browser lazily fetches music after a gesture, supports overlapping effects,
uses original sample loop bounds, and stops sources on sleep, power or teardown.
The audio pack explicitly records pending Azahar verification and unapplied
commands (`span`, `fxsend_a`, some `init_pan`). It is a comparison candidate, not
an audio fidelity sign-off. Compression and measured playback timing remain open.

## Verification at this checkpoint

- 209 integration tests passed before the HOME gesture follow-up.
- After HOME gesture integration, 26 focused gesture/audio/effect tests passed;
  type checking and the production build passed.
- Actual development browser loaded the console with `data-firmware=native-home`
  and `data-vgpu=ready`, no error overlay or captured browser errors. Real keyboard
  selection and portfolio launch reached the expected title. Native HOME music
  and ten effects decoded. This is a functional smoke check, not reference parity.
- After native message-style and material-byte rounding integration, all 240
  integration tests and nonincremental type checking passed. The independent CTM
  helper subsequently passed its 11 focused tests in the integration worktree.
- Azahar 2126.1.2 produced native 400×480 HOME screenshots using its Capture
  Screenshot action. The lower 320×240 viewport begins at (40,240). A first
  two-row comparison identified incorrect ordinary icon backplates/density and
  material constant handling. These are open visual defects at this checkpoint.
- Native movie recording captured 27,596 pad/touch pairs. The attempted computer-use
  touchscreen event was absent from that recording. A derived CTM played through
  the official `--movie-play` route and visibly dismissed a notification and moved
  selection to empty slots. Persisted notification state changes subsequent replay
  behavior; exact profile/content state must accompany each scenario.
- Compatible FFmpeg 6 libraries enabled native audio dumping. The first 123-second
  capture contains stereo Vorbis audio at 32,728 Hz, but its Vulkan video stream has
  no packets. Use native screenshots for visual comparison. The lossy recording
  identifies the expected HOME music/tempo, but cannot establish PCM parity.
  Native pan/aux evidence and measured level/stereo differences remain open.

Evidence is under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/`:
`integration-tests.log`, `integration-focused.log`, `integration-build.log`,
`browser-first-integrated.png`, `audio/cues-full/`, and `reference/`.
The newer evidence includes `integration-native-checkpoint-tests.log`,
`integration-native-checkpoint-typecheck.log`, `integration-ctm-tests.log`,
`home-comparison-first/`, `runtime/reference/`, and `assets/audio-research/`.

`scripts/compare-firmware-screens.mjs` normalizes the native composite and browser
canvases, records source hashes, writes native/browser/difference strips and RGB
region measurements under the SSD artifact root. It accepts optional region JSON
(`name`, `screen`, `bounds: [x,y,width,height]`, optional explanatory fields) and
does not declare acceptance from a numeric threshold. Portfolio artwork, clock,
connectivity state and animation phase require explicit interpretation.

Example (all paths are local capture files):

```sh
node scripts/compare-firmware-screens.mjs --native NATIVE.png \
  --browser-top BROWSER-TOP.png --browser-bottom BROWSER-BOTTOM.png \
  --suite home-comparison-first
```

The full app groups, native offline flows, native keyboard/dialogs, permission UI,
mobile/reduced-motion/fallback checks, cleanup profiling and final PR remain
required. Existing stock application scaffolds are not accepted implementations.
