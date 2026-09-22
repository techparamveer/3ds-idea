# Offline Azahar CTM reference timelines

`scripts/reference/ctm.mjs` inspects recordings and patches **existing** input
schedules. It never starts Azahar, sends input, changes a profile, or runs a
movie. The format is pinned to Azahar **2126.1.2**, commit
`9e6f523a57fac9564ac0bf8286db3c3702d301ec`. There is no format-version field in CTM;
other revisions can be inspected under this layout assumption but cannot be
transformed by this helper.

## Source evidence

Primary sources at that exact commit:

- [movie.cpp](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/core/movie.cpp): packed layout, read/write, validation, playback order, clock and savestate handling.
- [movie.h](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/core/movie.h): modes and public interfaces.
- [hid.cpp](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/core/hle/service/hid/hid.cpp) and [hid.h](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/core/hle/service/hid/hid.h): adjacent pad/touch calls, axes, coordinates and polling rates.
- [core_timing.h](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/core/core_timing.h) and [core_timing.cpp](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/core/core_timing.cpp): tick rate, video interval and base ticks.
- [ir_rst.cpp](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/core/hle/service/ir/ir_rst.cpp) and [extra_hid.cpp](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/core/hle/service/ir/extra_hid.cpp): application-configured IR polling periods.
- [citra_qt.cpp](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/citra_qt/citra_qt.cpp), [record dialog](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/citra_qt/movie/movie_record_dialog.cpp) and [play dialog](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/citra_qt/movie/movie_play_dialog.cpp): boot order, cancellation, title lookup and duration display.

Downloaded sources were checked against Git blob IDs in the isolated cached
recursive tree. Download SHA-256 and blob hashes are recorded outside the repo at
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/runtime/reference/source-provenance.json`.
The helper is independently implemented; no firmware or emulator source is
bundled in the application.

## Binary layout

The header is 256 bytes. Integers are little-endian; the revision is raw SHA-1
bytes. The helper renders 64-bit values as strings to preserve precision.

| Offset | Bytes | Field |
| --- | --- | --- |
| 0 | 4 | Magic `43 54 4d 1b` |
| 4 | 8 | Program/title ID, unsigned |
| 12 | 20 | Emulator Git revision |
| 32 | 8 | Initial clock value, unsigned |
| 40 | 8 | Movie ID / savestate namespace, unsigned |
| 48 | 32 | Author bytes, possibly without a NUL terminator |
| 80 | 4 | Rerecord count, unsigned |
| 84 | 8 | Input count: **pad records only**, unsigned |
| 92 | 8 | Initial timing base ticks, signed |
| 100 | 156 | Reserved |

Each body record is seven bytes: a one-byte type and six payload bytes. There are
no timestamps, frame markers or event durations. Payload offsets below are
relative to the record, including the type byte.

| Type | Meaning | Payload |
| --- | --- | --- |
| 0 | Pad + circle | `u16` mask at 1; signed `s16` X/Y at 3/5 |
| 1 | Touch | `u16` X/Y at 1/3; one-byte validity at 5; padding at 6 |
| 2 | Accelerometer | signed `s16` X/Y/Z at 1/3/5 |
| 3 | Gyroscope | signed `s16` X/Y/Z at 1/3/5 |
| 4 | IR reset input | signed `s16` C-stick X/Y at 1/3; one-byte ZL/ZR at 5/6 |
| 5 | Extra HID | `u32` packed value at 1; padding at 5/6 |

Pad bits 0–13 are A, B, SELECT, START, RIGHT, LEFT, UP, DOWN, R, L, X, Y,
DEBUG, GPIO14. Bits 14–15 are unused. **HOME is absent** from this format. Touch
is its own record, not a pad-mask bit. Extra HID packs battery in bits 0–4,
active-low ZL/ZR/R in 5/6/7, and unsigned 12-bit C-stick X/Y in 8–19/20–31.

## Samples, ticks and displayed frames

One helper sample is a zero-based pad record and its immediately following touch
record. The HID callback polls at `floor(268111856 / 234) = 1145777` emulated ticks
per sample, approximately 4.2735 ms. It compensates for late callbacks when
rescheduling. Sensors can interleave between these pairs: accelerometer nominally
104 Hz and gyroscope 101 Hz when enabled; IR polling periods are configurable.

The inspector's `nominalStartMs` is relative to the first recorded pad sample,
using `sample * 1145777 * 1000 / 268111856`. Its duration includes one sample
period per pad record, matching the play dialog's approach. These values do not
establish the exact first sample's boot time, wall-clock capture time, callback
lateness or screenshot frame. Pauses and emulation speed alter wall time.

The movie status bar uses `nearbyint(padCount / 234 * SCREEN_REFRESH_RATE)`, where
`SCREEN_REFRESH_RATE = 268111856 / 4481136` (about 59.826 Hz). That displayed count
is an estimate from pad polling, not a stored frame index. Do not equate one
seven-byte record, one pad sample and one frame-advance operation.

## Inspect and transform

Run from the repository with Node:

```sh
node scripts/reference/ctm.mjs inspect /path/to/baseline.ctm --timeline
node scripts/reference/ctm.mjs transform /path/to/baseline.ctm /path/to/plan.json /path/to/config.snapshot /path/to/derived.ctm > /path/to/derived.manifest.json
```

Inspection checks magic, complete records, known types, boolean fields and the
declared pad count. It reports legacy zero input counts, matching Azahar's older
file convention; transformation rejects them. `--timeline` compresses consecutive
identical control states and reports their sample bounds and pad byte offsets.

Example plan shape (replace hash/title placeholders with inspected evidence):

```json
{
  "schemaVersion": 1,
  "expected": {
    "titleId": "<16 hexadecimal characters>",
    "revision": "9e6f523a57fac9564ac0bf8286db3c3702d301ec",
    "templateSha256": "<64 hexadecimal characters>",
    "configSnapshotSha256": "<64 hexadecimal characters>"
  },
  "phases": [
    {"startSample": 2808, "endSample": 2855, "buttons": [], "circle": [0, 0], "touch": {"x": 160, "y": 226}},
    {"startSample": 2855, "endSample": 3276, "buttons": [], "circle": [0, 0], "touch": null},
    {"startSample": 3276, "endSample": 3323, "buttons": ["RIGHT"], "circle": [0, 0], "touch": null},
    {"startSample": 3323, "endSample": 3510, "buttons": [], "circle": [0, 0], "touch": null}
  ]
}
```

Ranges are `[startSample, endSample)`, sorted, disjoint and within the recorded
length. Every phase explicitly replaces all supported controls. Gaps retain the
original input. Include release phases; input after the last phase also retains
the original recording. Touch uses logical lower-screen pixels (X 0–319, Y
0–239). `null` releases touch and clears its coordinates. Circle coordinates are
raw post-filter values, restricted to −154…154 per axis. A phase is a constant
hold; a drag uses adjacent phases with changing touch coordinates. Example
durations are authored experiments, not verified firmware thresholds.

The helper requires a nonempty, already captured configuration snapshot and
checks its exact bytes against the planned SHA-256. It does **not** inspect a
live emulator profile, validate the snapshot's completeness, or apply settings.
The title/revision checks compare the actual CTM header. Never change those
header bytes to bypass a mismatch. To reproduce a baseline, separately retain
the effective global and per-title settings, startup method, region/model,
CPU/timing settings, renderer, firmware/title build and relevant NAND/SD/save
state identities. CTM itself contains no configuration or firmware fingerprints.

Output creation is exclusive: an existing path, including the template path,
is rejected. Header bytes (including movie ID and rerecord count), record order,
file length, all sensor/IR payloads, unselected samples, reserved pad bits and
padding are preserved. No new polls are appended. The stdout manifest records
input/output/config/plan hashes and always says `playbackVerified: false`.

## Native recording and replay constraints

For this release, stop the running title **before** arming Record Movie, then
boot the intended title. The source has a cancellation path when Record is
chosen during a running title: `OnRecordMovie` sets `movie_record_on_start`,
`BootGame` calls `ShutdownGame`, and `ShutdownGame` calls `OnCloseMovie`, which
clears the pending recording. This explains the coordinating task's observed
“Movie recording cancelled” dialog. Confirm that the status bar actually shows
Recording before collecting a baseline. The helper does not perform these UI
steps.

Playback's dialog looks up the header program ID in the application list. A
valid file can still be unavailable there if the title is missing from that
list. `PrepareForPlayback` restores initial clock/base ticks before boot;
`StartPlayback` loads records after ROM loading. Azahar warns on revision
mismatch but permits playback; this helper deliberately requires the audited
revision for generation.

The file stream must match the *order of future service calls*. Azahar consumes
a record before reporting a type mismatch and does not recover by seeking the
expected type. Preserving the original type order therefore does not prove
replay determinism: changed input can change an application's sensor/IR
requests, title transitions or other execution behavior. Saves, configuration,
firmware, network/device inputs and platform execution differences remain
outside these byte checks. Camera/microphone data, lid events and the 3D slider
are not captured by the six CTM record types.

Movie ID preservation does not make an edited movie compatible with every old
savestate. Read-only movie states check both that ID and the already consumed
recording prefix. Changes before the saved position can invalidate it. Use an
explicitly documented boot path and do not assume native replay passed merely
because this helper accepts the file. At EOF the Qt completion callback pauses
the game and shows a completion dialog. If emulation resumes afterward, the
movie no longer overrides input. Arrange a neutral tail and distinguish the
last replayed state from later live input.

## Verification and current evidence

`node --test tests/ctm-reference.test.mjs` passes 11 tests: hand-encoded header and
all record types, 64-bit precision, corruption, legacy/revision restrictions,
pairing, sample timelines, unrelated-byte preservation, deterministic offline
output, hash/title/config binding, invalid ranges/controls and CLI no-overwrite
behavior. These are offline tests, not proof of firmware polling or visual
fidelity.

The coordinating task supplied a real recording at
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/home-idle-template.ctm`.
Its SHA-256 is
`e1273f393d57175ab9cb28b443b267b089ae7af2cb777dbdf1c3a72b5ae01951`:
386,600 bytes, title `0004003000009802`, exact pinned revision, 27,596 pad/touch
pairs and no sensor/IR records. This is about 117.932 seconds of nominal input
periods. Every sample is neutral: the reported late click did **not** appear in
the recorded touch stream. The inspection report is in SSD
`runtime/reference/home-idle-inspection.json`. No emulator UI or profile was
operated by this helper task. Replay of transformed controls remains a separate
native verification step.

Two requested candidates are staged in that same SSD `runtime/reference/`
directory, with `.plan.json`, `.manifest.json` and `.inspection.json` companions:

| Candidate | Authored action schedule in nominal emulated seconds |
| --- | --- |
| `home-close-right-six.ctm` | Touch (160,226) at 12s; six RIGHT presses at 14,15,16,17,18,19s |
| `home-close-right-six-create-folder.ctm` | Same sequence, then A at 22s |

Each hold lasts 47 samples (about 0.201s); all gaps and the remaining tail are
neutral. These names describe intended experiments, not observed navigation or
folder creation. The supplied copied configuration is
`reference/home-idle-qt-config.ini`, SHA-256
`d12895b444b3c08165dbb4f9a7d45ad9f67576d708f624502a9e983e1f48adaf`.
Both candidates preserve the entire header, length and every record-type byte;
their active sample ranges were re-read and checked individually. Original
recording and configuration hashes remain unchanged. Full artifact hashes and
checks are in `runtime/reference/staged-movies-verification.json`. The copied
configuration does not certify the live profile, effective per-title overrides,
firmware contents or saved state. Native result and environment compatibility
must be evaluated by the coordinating reference-capture task.
