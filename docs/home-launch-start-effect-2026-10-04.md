# HOME Launch START_EFFECT Cue

Runtime `3d90106d` (integrated in `3ds-home-fidelity-20261001`). This pass
follows the [launch Decide and dwell fit](home-launch-decide-dwell-2026-10-04.md)
and adds the second native launch cue. Every Azahar capture used so far was
muted, so this is a source-traced cue, not an audio comparison.

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-launch-effect-20261004/`.

## Source trace

EUR HOME `0004003000009802`, v24576, executable SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`
(read as data; nothing added to Git).

- The Open footer listener (`0x253448`, see
  [open-route evidence](../scripts/firmware/home_audio_OPEN_ROUTE_EVIDENCE.md))
  reads its sound from the 20-by-15 matrix at `0x314054`. Group 0
  (`G_BtnW_C_01`, Decide) is `0x0100001e` (`SE_CTR_HOME_START`) in forms 0
  and 2. A physical key starts the Decide animation and this cue together
  (key-down); touch does both on release. The browser's existing `open` cue
  at A already matches this.
- Successful launch preparation (`0x2be278..0x2be28c`, reached after Decide
  completion emits the listener's action) dispatches `0x0100001f`, unless a
  mode byte equals 3 (unclassified), then requests the music stop30
  (`0x2be2a0`, see [launch stop evidence](../scripts/firmware/home_audio_LAUNCH_STOP_EVIDENCE.md)).
  The archive maps `0x0100001f` to `SE_CTR_HOME_START_EFFECT` (index 31,
  volume 72, banks 0 and 2). The browser had never played it.
- `0x235540(…, 20)` after it is a sound-handle stop, not the visual fade.
  No trace ties the preparation update to a fade pose.

## Change

Worker `3ds-home-launch-effect-20261004` / `codex/home-launch-effect-20261004`:

- `a8e09e43`: converter v10 adds alias `open-effect` and allowlists the
  entry in `home_audio_profile.json`. The delivered pack (`audio.json`
  `dae7d915…`) adds `open-effect.wav` (`abbd327d…`, 134,560 samples at
  32728 Hz, stereo, no loop, no unapplied commands, audible 0.005–2.223 s).
  Two independent renders are byte-identical, and the other twelve WAVs equal
  the previous public files. The scene plays it once per launch phase when
  `launchStartEffectDue` holds: fade pose 0 (`LAUNCH_FADE_START_MS`, ten
  frames after A), the first stage after the fitted Decide hold. **Fitted
  adaptation**; reduced launches, which never reach that pose, play it at once.
- `3d90106d`: observe the effect after the action cue, so a reduced launch
  keeps native order (HOME_START, then START_EFFECT).

## Verification

- Full `npm test` 1998 pass / 0 fail / 23 skip; typecheck and production build
  pass. Python converter suite 44 pass with the real archive and pinned
  DualRip (`HOME_AUDIO_SOURCE`/`HOME_AUDIO_RENDERER`/`HOME_AUDIO_SCRATCH`).
- Browser trigger probe `R/browser-effect-trigger.mjs` (`19f2755b…`) on the
  production preview 3021 at `3d90106d`, dedicated CDP 9320 Chrome with
  `--mute-audio`. It hooks `AudioBufferSourceNode.start`, lifts the console
  mute only for the run, launches the selected Camera with keyboard A and
  restores mute (restored `true`, `errors[]`).
  - `R/trigger-desktop-v2.json` (`8a20a8e5…`): HOME_START (2.454 s) at A,
    START_EFFECT (4.111 s) 166.3 ms later (10.0 frames); launch to app 3250 ms.
  - `R/trigger-reduced-v2.json` (`6adbfba6…`): HOME_START then START_EFFECT in
    the same update.
- No visual code changed, so no LCD recapture was taken.

## Remaining differences

- No native audio capture of a launch exists; the effect's epoch relative to
  the fade is not native-compared, and the mode-3 skip is unclassified.
- Music still stops at A (`home` turns false at the launch phase), while
  native keeps it through Decide and fades it over 30 updates from the same
  preparation update. Next slice.
- Matrix unchanged; every whole scenario still fails.
