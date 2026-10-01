# HOME native input replay audit - 1 October 2026

This is a source/configuration audit only. It did not launch Azahar or a browser,
operate a GUI, play audio, mutate a native profile, or establish a matched native
replay. The inspected profile is
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/native-reference`.
All future visible operation belongs to the coordinator on the iPad Sidecar
display. The configured 3DS output volume must remain zero.

## Current profile result

The inspected `user/config/qt-config.ini` has SHA-256
`ba90c7db54c2f89f8321f0259c78ddb1ace451a6c57ca798d5b943c8c5f20896`.
The new read-only audit command is:

```sh
node scripts/reference/azahar-input-profile-audit.mjs \
  /Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/native-reference/user/config/qt-config.ini
```

It reports active profile zero (`profiles\\1`), mouse touch
`engine:emu_window`, button touch enabled, map zero, no audited key collision,
volume zero, and all absolute NAND/SD/screenshot paths contained by this portable
instance. Direction keys are Up `T`, Down `G`, Left `F`, Right `H`. The selected
button-touch map is `U`=(240,170), `C`=(160,80), `E`=(160,230),
`R`=(160,205), `Y`=(220,205), in logical 320x240 lower-LCD coordinates.

`use_touch_from_button=true` does **not** disable mouse touch. At Azahar revision
`9e6f523a57fac9564ac0bf8286db3c3702d301ec`, HID constructs
`touch_device` from `engine:emu_window` and separately constructs the
button-touch device. Each poll checks the window device first, then button touch
only if the first device is not pressed, then controller touch. The Qt render
window sends a left mouse press through `TouchPressed`, and focus loss releases
all keyboard keys. Primary sources at the pinned revision:

- [HID device load and poll order](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/core/hle/service/hid/hid.cpp)
- [Framebuffer-to-touch conversion](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/core/frontend/emu_window.cpp)
- [Qt mouse, key and focus handlers](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/citra_qt/bootmanager.cpp)
- [Ordered button-touch map polling](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/input_common/touch_from_button.cpp)

The preserved 1568x866 pre-click window image places attempted desktop point
`(598,815)` inside the displayed lower footer, approximately logical `(50,226)`.
That supports the coordinate estimate only. It does not show that macOS delivered
the press to the render widget or that a 234 Hz HID poll sampled it before release.
The failed click therefore does not support a button-touch configuration defect.

## Why host key injection is not repeatable

Native HID polls pad/touch at about 234 Hz, one poll per 4.2735 ms. A press and
release wholly between polls is invisible. Conversely, HOME direction repeat is
proved at press poll 1, then polls 21, 26, 31 and so on. A held direction that
crosses roughly 85.5 ms can therefore move more than once even when the host sent
only one key-down. OS text entry may synthesize repeated key pairs, and changing
foreground windows invokes the render window's release-all path. These boundaries
explain both missed and repeated `f`/`h` observations without implying a HOME
reducer defect.

For a live diagnostic only, a coordinator can activate the Azahar render surface,
confirm the window remains on Sidecar, hold a key for more than one poll but less
than the repeat boundary, release it, and inspect immediately. This is still
wall-time automation and must not be described as matched input. Button-touch `E`
at `(160,230)` is a better footer diagnostic than a mouse click because the entire
native Open footer accepts that point, but it has the same host-duration hazard.

## Recommended matched replay

Use the existing offline CTM path in `scripts/reference/ctm.mjs` rather than
`type_text`, OS key repeat, or mouse clicks. `docs/ctm-reference.md` records the
pinned format and CLI route. The neutral HOME template is read-only source data:

```text
/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/home-idle-template.ctm
SHA-256 e1273f393d57175ab9cb28b443b267b089ae7af2cb777dbdf1c3a72b5ae01951
title 0004003000009802; 27,596 pad/touch pairs; all neutral
```

Copy the template and config snapshot into the internal HOME artifact root before
creating new plans; do not write new evidence to the DeveloperStorage sparsebundle.
For each target, use a fresh copy-on-write clone of the same stopped portable
profile. Rebase that clone's absolute NAND, SDMC and screenshot paths while it is
closed, then run the profile auditor. A stale cloned config will be rejected by
the audit's issues list because its paths escape the inferred clone root. The
auditor is read-only and reports findings; its successful exit alone is not an
isolation approval. Resolve findings and separately check symlinks before launch.

Author one CTM per target from the same initial clone/NAND identity. Use constant
phases with explicit releases:

1. Keep the recorded neutral prefix long enough for HOME to settle.
2. For one direction step, hold exactly 8 pad samples (about 34.2 ms), then keep
   at least 16 neutral samples. Eight samples are intentionally below the proved
   20-poll initial repeat boundary.
3. For footer activation, hold touch `(160,226)` or `(160,230)` for 8 samples,
   then explicitly release it. CTM touch bypasses window hit-testing and the
   button-touch keyboard map while exercising native HID touch data.
4. Retain a long neutral tail so the coordinator can inspect/capture before EOF.
   Record the exact sample ranges and do not equate CTM samples with video frames.
5. Launch the copied bundle's executable with `--movie-play MOVIE.ctm` and the
   clone-owned HOME content `.../title/00040030/00009802/content/00000082.app` as
   the final argument. Confirm the status bar says playback, observe every
   intended transition, and capture only after the expected state is visible.

The starting HOME focus remains an external precondition. The latest profile
restored Notifications, but CTM does not restore NAND. The coordinator must record
the frozen clone identity and visibly confirm the initial focus before interpreting
one Left as Friend or two Left pulses as Notes. If initial state differs, discard
the run; do not repair it with unrecorded live input.

## Multiple isolated instances

The pinned Qt source has no single-instance IPC/lock path, and direct executable
launch supports distinct processes. On macOS it also changes current directory to
the app bundle's parent; `file_util.cpp` selects an adjacent `user/` directory when
present. Multiple instances are therefore source-feasible only as **complete,
separate portable roots**, each with its own copied app bundle, `user/`, shader
cache, log and screenshots, and clone-local absolute NAND/SD paths.

Do not run two processes against the inspected profile or against blind directory
copies whose Qt config still points back to that profile. Concurrent shared NAND,
SD, cache, log or screenshot output invalidates evidence and risks corruption.
Also keep every clone at `volume=0`; per-title HOME audio uses the global value in
the inspected custom config. RPC/GDB are disabled in this profile, but that does
not prove every platform/GPU resource is concurrency-safe.

Parallel CTM processes may reduce boot wait, but they do not improve input
determinism and add GPU scheduling, window-placement and capture-attribution
variables. The conservative acceptance procedure is serial replay from fresh
identical clones. Treat concurrent Azahar runs as an unverified throughput
experiment, never as the first matched reference.

## Evidence boundary

The auditor validates static Qt settings, key/touch mapping, configured silence
and portable-path containment. Its source statements are pinned to Azahar
2126.1.2. It cannot prove the active window, effective runtime settings, event
delivery, initial HOME selection, movie playback, display placement, audio sink,
motion timing, pixels or scenario acceptance. Those remain coordinator-only live
evidence.
