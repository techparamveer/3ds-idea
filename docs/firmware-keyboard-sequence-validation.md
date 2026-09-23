# Keyboard return/cancel sequence contract

The supplied keyboard's `COMMON_RETURN` and `COMMON_CANCEL` cues (6 and 7)
share `common_back.sseq` and the same two-entry native instrument bank. Their
original-code runs produce identical wave-command streams. This checkpoint
resolves the sequence's referenced resources, required track controls, relative
native timing and release ownership. It does not produce a synthesized WAV or
establish hardware/browser audio equivalence.

The [resource/event](firmware-keyboard-audio-validation.md) and
[wave-parameter](firmware-keyboard-audio-parameters.md) artifacts stay frozen.
New evidence resides only in the private sibling `assets/keyboard-audio/sequences/`.
The old export's unsupported-SSEQ marker remains correct for PCM synthesis.

## Source and implementation boundary

The source is keyboard title `000400300000d002`, version 4096, content 0
`0000000b`. Code and archive hashes are the pinned values in the earlier notes.
`common_back.sseq` is 128 bytes with SHA-256
`6b3913db5b1e493053a71000d7567a53a1a0ae1c9afd929746a9d7f64b08e817`.
Its stream begins at file offset 28. Both cue descriptors carry bank pointer
`0x1b7d70`, gain word `0x3f5eb852`, pan zero and pitch one.

`scripts/firmware/keyboard_sequence.py` is an isolated, source-bound track
interpreter. It supports only the required instructions below and rejects any
sequence with a different source hash. It emits control/note timelines, not
PCM or envelope samples. No general SSEQ compatibility is implied.

`scripts/firmware/keyboard_sequence_native.py` executes the original ARM/VFP
sequence parser, note allocation, envelope engine, pitch math, resource getter,
wave backend, BCWAV preparation, channel gain/timer calculations and player
updates under Unicorn 2.1.4. Three cases cover natural cue 6, natural cue 7,
and cue 6 explicitly stopped after player update 10. The independent Python
interpreter must match every original opcode offset, track, tick and note
control field in both natural runs.

The fixture uses an initialized synthetic player with 17 native wave-voice
objects, the original backend vtable at `0x1ad6e0`, and the original manager
vtable at `0x1ad6d0`. The original sequencer initialization `0x116ee0` executes.
The native manager/player constructors and firmware service initialization do
not. Loaded-resource pointers and the small sequencer globals at
`0x1b8630..0x1b864b`, `0x1b8fb8..0x1b8fc3`, and `0x1b8fc8..0x1b8fcf` are
explicitly mutable; all other bytes of the original executable image must
remain unchanged. BSS engine state lies outside the stored executable image.

| Declared stub | Boundary |
| --- | --- |
| `0x151544` | Memory fill using supplied destination/count/byte |
| `0x1382a0`, `0x134ed4` | Deterministic channel allocation/free; physical channel pool/service omitted |
| `0x129da8` | Channel remains active while allocated; loop decoder does not execute |
| `0x14fa8c` | Deterministic virtual-to-physical mapping |
| `0x1697b8` | Stereo setting true |
| `0x115118`, `0x129b94` | End-of-update service work and pending-queue query, with no pending submission |
| `0x151b48` | Record CSND command and return success |

Allocation, free/status, service and command boundaries are recorded. A native
stop command precedes each channel-free boundary. The release stub omits the
physical pool's additional reset/service bookkeeping; the report is not a
complete hardware queue capture. Original-code allowlists and instruction
budgets reject unexpected execution. No firmware service or original binary
runs as a host process.

## Bank and required instructions

`0x135648` reads a 12-byte bank record: resource ID, root key word, then attack,
decay, sustain and release bytes. The original resource getter `0x197fc4`
resolves resource-table entries; it is not replaced by a guessed mapping.

| Program | Resource ID | Original member | Root key | Bank ADSR bytes |
| --- | --- | --- | --- | --- |
| 0 | 13 | `tnr_Proton.16000.cn5.imaadpcm.bcwav` | 72 | 127, 127, 127, 127 |
| 1 | 14 | `kalimba_loop.32000.an4.imaadpcm.bcwav` | 69 | 123, 112, 0, 127 |

Both waves loop. Their sample rates, initial/loop states and native byte
intervals remain those proved in the wave-parameter checkpoint. Sequence
tracks override the bank ADSR values before envelope service.

| Required opcode | Proven action |
| --- | --- |
| `0xfe` at stream start | Allocate tracks from little-endian mask; track 0 is always allocated |
| `0x93` | Open allocated track at a 24-bit little-endian offset relative to stream start |
| `0x81` | Select bank program using variable-length integer |
| Key `<0x80` | Read velocity byte and variable-length duration; allocate note and wait for duration |
| `0x80` | Rest for variable-length duration |
| `0xc0` | Set track pan byte minus 64 |
| `0xc1` | Set track volume byte |
| `0xd0..0xd3` | Set track attack/decay/sustain/release overrides |
| `0xff` | End track, release/detach its notes and free its track slot |

The original setup allocates tracks 0, 1, 2 and 3. Track 0 opens tracks 1 and 2;
track 3 remains unopened and is freed at sequence completion. The parser
executes 40 stream instructions after the initial allocation. There are no
sequence jumps, calls, random/variable operations or sequence-loop opcodes in
this source. Instrument wave loops are a separate mechanism.

| Track | Program | Key | Note starts in sequence ticks | Velocities | Pan values | Track volume | ADSR override |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | 1 | 73 | 0, 20, 40 | 116, 20, 10 | 0, 32, 32 | 110 | 123, 112, 0, 127 |
| 1 | 1 | 66 | 0, 23, 43 | 116, 20, 10 | 0, -32, -32 | 82 | 123, 112, 0, 127 |
| 2 | 0 | 66 | 0, 20, 40, 60 | 60, 50, 30, 20 | -32, -8, 8, 36 | 110 | 110, 100, 0, 108 |

Every note has encoded duration 20. Track 1 contains the sole rest, duration
3, after its first note. Track ends occur at ticks 60, 63 and 80. Cue gain is
converted separately by the original sequence path to master volume byte 110;
it is not applied as the wave cue's float gain directly. Native backend
resource requests total six kalimba voices and four Proton voices. Backend
`0x18c0ac` receives gain in s0, pitch in s1 and pan in s2; the report names
these fields explicitly. This register order differs from the wave-preparation
function's gain/pan/pitch order.

## Native temporal units and update order

`0x111dd8` loads float32 `0x41855555` (about 16.666666 native units) and invokes
`0x116f4c` once per player update. That function accumulates the value in
float32 and services a quantum whenever at least float32 5.0 units remain.
No wall-clock call is executed by this fixture. Calling the units milliseconds
or equating a player update to a browser frame would require separate host
scheduling evidence.

The sequence starts with accumulator word 240, increment word 120 and scale
word 256. `0x1300dc` consumes ticks by subtracting 240, then adds
`(increment*scale)>>8` after parsing. Here the first sequence tick executes on
service quantum 1 and later ticks execute every two quanta. The fixture checks
that every opcode lies on an odd quantum; sequence tick `t` is quantum
`1 + 2*t`. It does not assume a general MIDI or DS tempo conversion.

Each 5-unit service quantum runs, in order:

1. `0x12bd40`: apply previously queued note start/stop/gain/pitch/pan changes.
2. `0x12b620`: advance sequence ticks, decrement note durations and release expired notes.
3. `0x12b8dc`: advance note envelopes and calculate the next backend controls.
4. Status bookkeeping and random-state advancement.

After all due service quanta, the player services its 17 wave voices once via
`0x117530`. Thus a note allocated at quantum 1 first reaches the wave backend
at quantum 2; its physical wave start command occurs during the wave service
at the end of player update 1 (quantum 3). The first six player updates contain
3, 6, 9, 13, 16 and 19 cumulative quanta. Preserving float32 accumulation is
necessary to reproduce this ordering; rounding the input to an exact 1/60
second or adding one extra quantum on update 3 changes the fixture.

## Release and loop-stop ownership

The eight-slot note engine owns envelope phase and attenuation. Native
`0x138ab4`, `0x138a44` and `0x169b38` convert source ADSR bytes. `0x12b8dc`
advances attack, decay, sustain and release state in service quanta. Native
pitch conversion, including the original floating-point power implementation,
executes without a mathematical substitute. The resulting float words,
subsequent wave timer commands and volume commands are in the private fixture;
this does not verify DSP interpolation or audible pitch.

Duration expiry or track end changes a note to release phase. Track end calls
`0x14f774` to release and `0x14f908` to detach its notes. Detached release tails
remain in the note engine. The backend handle belongs to that note slot, not
to the caller's immediate cue-request handle. The latter stays null for SSEQ.

When release attenuation crosses the native threshold, the note engine queues
a stop. The following service quantum calls backend stop `0x18c090`, then
`0x151f0c`, which submits CSND play-state 0 through `0x15171c`, frees the wave
channel, returns the wave voice to its free list and clears the backend handle.
The source's completion callback `0x18a9dc` is a no-op. Completion clears the
sequence's active bit, and the service wrapper clears its priority/identity
slots; this is independent of the remaining release tails.

| Case | Sequence completion | Final loop stop | Final quiet verification |
| --- | --- | --- | --- |
| Cue 6 natural | Quantum 161; tick 80 | Quantum 252, player update 76 | Update 77 has no allocated voices or new commands |
| Cue 7 natural | Identical to cue 6 | Identical to cue 6 | Identical command stream |
| Cue 6, explicit `0x12b844` after update 10 | Quantum 33 | Quantum 187, update 57 | Update 58 has no allocated voices or new commands |

Natural playback submits ten wave starts and ten native stop commands. Four
release tails remain after sequence completion; their final stop times must
not be replaced with immediate silence at tick 80. Explicit sequence stop
schedules no further notes, but still permits existing envelope tails. Its
three wave stops occur at quanta 35, 36 and 187. These outcomes assume the
looped channels remain active until the native stop, as declared by the status
stub; hardware decoder or device interruptions are not reproduced.

## Contract for future implementation

Use the source-bound track interpreter for program, key, velocity, duration,
track volume, pan, ADSR overrides and relative tick scheduling. Preserve the
separate master-volume conversion, eight note slots, native update order,
envelope release ownership and 17 wave-voice handles. A future envelope/transport
port must match the captured controls and CSND commands through the final tail
stop, not just the ten note-on events.

The wave transport contract remains in the earlier parameter note. In
particular, preserve the original loop codec states and native byte lengths.
This pass does not add a WebAudio transport, PCM sequence renderer, general
SSEQ engine, concurrent-sequence arbitration proof or host interruption policy.
No original firmware, numerical report, PCM, raw disassembly or public resource
is committed. HOME audio, scene, browser and application code are unchanged.

## Reproduction and validation

```sh
PYTHONPATH=scripts /private/venv/bin/python -B -m firmware.keyboard_sequence_native \
  --extracted /private/ssd/extracted/keyboard \
  --output /private/ssd/new-sequence-evidence/replay.json
PYTHONPATH=tests KEYBOARD_AUDIO_EXTRACTED=/private/ssd/extracted/keyboard \
KEYBOARD_SEQUENCE_NATIVE=1 /private/venv/bin/python -B -m unittest test_keyboard_sequence
```

Seven tests cover source rejection, bank/resource resolution, identical cue
behaviour, interpreter/native agreement, exact service/start ordering, natural
release tails, explicit stop and unchanged executable bytes. Application and
browser tests do not apply to this offline-only checkpoint.

All 21 resource/event/parameter/sequence tests passed together. After adding
explicitly named backend gain/pitch/pan words and clock-word provenance, the
seven sequence tests passed again.

Final private fixture:
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/assets/keyboard-audio/sequences/replay-reviewed.json`
SHA-256: `e4960403e58aca6e6a664df710410b1053bfd5286fab29721c01b3e32eb8ee29`.
The three earlier frozen resource, event and parameter artifacts were rehashed
and remain unchanged. Source disassembly and exploratory replays in this new
private directory are research scratch, not delivery artifacts.
