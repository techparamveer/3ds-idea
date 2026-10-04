# HOME Launch Music Stop30

Runtime `d8b3e982` (integrated in `3ds-home-fidelity-20261001`). This pass
follows the [launch START_EFFECT cue](home-launch-start-effect-2026-10-04.md),
which traced the same launch-preparation update. Native audio was muted in
every Azahar capture, so this is source-traced timing, not an audio comparison.

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-launch-effect-20261004/`.

## Defect

The browser told the audio owner `home: false` as soon as A entered the
launch phase, so HOME music stopped outright at A. Native keeps HOME running
through the Open listener's Decide. Successful preparation then requests
stop30 (`0x2be2a0`), which interpolates the current fade gain to zero over
`trunc(gain * 30)` eligible updates and detaches the handle. Music that has
not started takes the immediate teardown (see
[launch stop evidence](../scripts/firmware/home_audio_LAUNCH_STOP_EVIDENCE.md)).

## Change

Worker `3ds-home-launch-music-stop-20261004` /
`codex/home-launch-music-stop-20261004`, `d8b3e982`:

- `launchPreparationUpdates` counts nominal 60Hz updates from the
  preparation epoch already used for START_EFFECT (launch fade pose 0;
  reduced launches at A). **Fitted adaptation**, as before.
- The audio owner accepts `musicStopUpdates`. On the first request it captures
  the playing fade gain (cold `1`, or the partial resume fade) and ramps it at
  1/30 per update, then stops the transport. Unstarted or preparing music is
  cancelled at once. A finished stop cannot restart music during the launch.
- The scene holds music, and plays START_EFFECT, only for launches entered
  from HOME. Helpers started from software never start HOME music.

## Verification

- Full `npm test` 2001 pass / 0 fail / 23 skip; typecheck and production build
  pass. New owner tests cover the cold ramp (1 → 1/30 → detach, no restart,
  later resume entry), a partial resume gain (0.5 → 15 updates) and teardown
  of music still loading.
- Probe `R/browser-music-stop.mjs` (`b071c839…`) on preview 3021 at
  `d8b3e982`, dedicated `--mute-audio` CDP 9320 Chrome. It logs
  `AudioParam.setValueAtTime` changes and cue starts, lifts the console mute
  only for the run and restores it (`errors[]`).
  - `R/music-desktop.json` (`50b8edc4…`): music gain holds 1 through Decide,
    then 30 steps from 0.967 at frame 10.1 to 0 at frame 39.1, followed by
    detach. START_EFFECT starts at the same preparation update.
  - `R/music-reduced.json` (`1abf5cbe…`): the ramp starts at A and is cut at
    about 0.77 when the 120ms reduced launch hands over to the application.
- No visual code changed, so no LCD recapture was taken.

## Remaining differences

- Native stop30 counts eligible sound-thread updates, not proven display
  frames. The epoch is the fitted fade pose 0. Neither is native-compared.
- Reduced launches cut music before the ramp ends. The application handoff
  stops it outright.
- Matrix unchanged; every whole scenario still fails.
