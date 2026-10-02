# Silent Native Reference Recovery

Coordinator source baseline `fb0a9cfa`, 2 October 2026. No website runtime or
native delivery asset changed. This is reference recovery, not L-06/L-07
completion, native/browser comparison or a whole-scenario pass.

## Observed Failure and Recovery

The stopped `native-home-design-20261002` profile had Null microphone input,
Null output and volume zero. Both File -> Boot Home Menu -> EUR and the retained
Health CTM produced black LCDs and App 0 FPS while emulation/movie counters
advanced. Each run was stopped through normal Quit.

A fresh APFS copy of the preserved `native-ctm-seed` was made as
`native-close-clean-20261002`. Its paths were rebased while closed, host audio
was disabled, and its HOME transferable pipeline cache was preserved outside
the profile. Null input/output again produced black LCDs (observed at movie
counter2177/7056, App0 FPS).

Changing only the intended input setting to Static (`input_type=2`,
`input_type\default=false`), retaining Null output (`output_type=1`,
`output_type\default=false`) and volume0, then replaying the same CTM restored
visible HOME (counter1619/7056, App59 FPS) and Health (3245/7056, App61 FPS).
This is a successful working configuration, not a fully isolated causal A/B:
the emulator also rewrites window geometry, caches and private save data.

Pinned Azahar revision `9e6f523a57fac9564ac0bf8286db3c3702d301ec` defines
[Null input as returning no samples](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/audio_core/null_input.h),
whereas [Static input returns a built-in sample buffer](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/audio_core/static_input.h).
[Input IDs](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/audio_core/input_details.h)
and [output IDs](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/audio_core/sink_details.h)
establish the configuration mapping. Static is a synthetic microphone fixture,
not captured microphone evidence. It does not make audible/native-cue timing
accepted. System volume, Spotify and the default Azahar profile were untouched.

## Evidence

Private root `R` is
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001`.

| Record | Path under R | SHA-256 |
| --- | --- | --- |
| Null trial config | `close-native-reference/clean-null-config.ini` | `e050da85c3863321e273ef8ea88a28029912a743705b92324e8e2c3f326d60f3` |
| Working Static config snapshot | `close-native-reference/clean-static-launch.ini` | `dddc2b7df3eed1ea1c3ae2308d9895d5a4379cb967001806241ff9629dec23c5` |
| Reused input movie | `health-suspend/health-open.ctm` | `7387503b9efda52b96e0d5f71d4e49a579ecaccd5d6fcb64a90f4f03330439d0` |
| HOME with Health selected | `native-close-clean-20261002/screenshots/_02.10.26_04.43.22.851.png` | `c0f335e2baf756bf6eb31cdc778461a9581d5d4c572c13e8e77787cf2203cdd9` |
| Health after HOME attempt | `native-close-clean-20261002/screenshots/_02.10.26_04.45.21.186.png` | `f103e46b6baa49e201420095776cd1b034db81224b957524e77e43a43688281e` |

Both PNGs are Azahar's own 400x480 captures and were opened and inspected.
They are not paired with new browser output; mask/diff report are N/A. The old
CTM manifest retains its old config binding; this reuse is a recovery diagnostic,
not a newly config-bound or timing-matched replay. Its logical inputs are lower
touch(10,170) at samples7020..7028, release, A at11700..11708, then release.

Failed-run logs are preserved in `close-native-reference/boot-menu-black.log`,
`replay-black.log` and `clean-null-black.log`. The working final log is
`clean-static-final.log`; the 11-file `summary.json` inventory SHA-256 is
`fa86028b7628781410f491fa58c78e63b0fb7c9b3e676acfdc5ff88df69be15d`.
Executable SHA
remains `3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`;
the copied user directory has no symlinks. `lsof` confirmed the working process
and executable in the new private clone. Vulkan, original hardware, EUR,
resolution factors1, combined unswapped LCDs and disabled RPC/GDB were checked.

Sidecar was freshly `(1800,367,1357,935)`. Every main window was verified at
`(1810,397,1153,781)` and startup/EOF/Quit dialogs separately verified inside
Sidecar before input. Output stayed Null and UI volume0; no Cubeb-start claim
is inferred merely from volume. Working log records input2/output1.

## Remaining Gate

One explicit foreground HOME-key attempt with an upper-screen focus click
did not return Health to HOME. The tool reported the post as unverifiable;
no native key hold duration or APT notification was measured. It is not
evidence that native HOME suspension is impossible. Movie EOF was dismissed
and Emulation -> Continue dispatched before the later Health capture.

The next close/switch task still needs a verified native application -> HOME
return and captures of the suspended window, confirmation and closing frames.
A manual held-B check was requested; do not substitute more unmeasured short
key repetitions. The unchanged [design queue](feature-map/design-to-ship.md)
keeps close/switch first, then power-on and HOME interactions. Authored dialogs,
missing button glyphs, immediate close and hidden suspended window remain.
Other existing local/fitted adaptations remain as recorded in the progress log.

All four owned native processes are now absent; the three terminal-launched
replays exited0 after normal Quit. The manual check is deferred until the user
is available, not a live wait. No new browser was launched; preview3021 remains
available from the preceding implementation. Only documentation changed in Git,
so no runtime rebuild was needed. Relative links and whitespace are checked
before commit. Historical scenario matrices are unchanged.
