# HOME music repeat-state audit and proposed synthesis boundary

The v8 model has **no certified finite PCM region suitable for indefinite
repetition**. Moving the repeat point beyond the intro does not resolve the
carried clock phase. Public music remains held. This audit does not prove that
an arbitrarily distant exact cycle is mathematically impossible.

## Source and audit method

This continues [v8 DSP evidence](home_audio_DSP_EVIDENCE.md) without changing its
sequence, voice or DSP arithmetic. The exact EUR HOME title is
`0004003000009802` version 24576; archive SHA-256 is
`1017eb4a367cb202ac6018fb432b5654222487149d16242fa7d1f205e63f3eb2`.
The pinned DualRip revision, source hashes, patch and helper hashes are recorded
in each audit report. Native clock evidence remains in
[the clock note](home_audio_CLOCK_EVIDENCE.md).

`home_audio_loop_audit.py` runs the guarded isolated renderer continuously and
stops externally before its offline loop-pass cap. It copies state after the
sequence/voice timer and before the next 160-sample DSP frame. For these entries,
boundary 0 is the **first observed track-0 repeat jump**, at sample 2,072,320 for
main or 1,757,440 for resume. It is not the original loop-start position. Twelve
subsequent intervals give 13 snapshots per entry.

The copied state includes player settings and active-track order, all tracks,
finite loop counts and call positions, float32 clock phase, RNG, every active
voice and its envelope/sweep/LFO, source cursor/fraction/history, previous bus
gains, and inactive-slot allocation fields. PCM identities are hashed. Absolute
sample counters, offline stop/report fields, export timestamps and overwritten
inactive voice payloads are excluded. Active-voice multisets are compared too,
so a slot permutation can be distinguished from changing voice values. No
state is reset, normalized or fitted; PCM is never spliced or faded.

```sh
python scripts/firmware/home_audio_loop_audit.py \
  /path/to/romfs/sound/menu.bcsar /Volumes/YourSSD/music-audit.json \
  --renderer /path/to/pinned/DualRip \
  --scratch /Volumes/YourSSD/audio-scratch \
  --source-record /path/to/extracted/home/source.json \
  --cue music --passes 12 --write-pcm
```

Use `--cue music-resume` and a fresh output path for the other entry. Outputs
contain diagnostic state and belong in the private artifact area, not public
delivery. Repeat without `--write-pcm` to compare deterministic report bytes.

## Results

| Entry | Continuous samples | Duration | Exact boundary-state matches | Peak active voices |
| --- | ---: | ---: | ---: | ---: |
| Main | 23,163,520 | 707.758494 s | 0 of 78 pairs | 24 |
| Resume | 22,848,800 | 698.142264 s | 0 of 78 pairs | 24 |

Independent reruns produced byte-identical complete JSON reports. Every
consecutive comparison of two-pass PCM regions differed (nine comparisons per
entry). All streaming single/two-pass hashes were independently recomputed from
the retained WAV bytes. The earlier four-pass continuous render is an exact
prefix in both entries.

The decisive resume counterexample compares samples **3,515,200 and 7,030,400**.
Tracks, all ordered voice slots, envelope/LFO/sweep/DSP state, player settings,
RNG and aux returns are equal. Only the next-tick float32 clock fraction differs:
`0.8440735936164856` (`3515583f`, little-endian bytes) versus
`0.8802837133407593` (`465a613f`). In the following 3,515,200-sample regions,
PCM first differs 15,852 samples later, or **0.484356 seconds**. A total of
1,393,008 stereo sample positions differ. Thus a fixed restart changes future
audio even when all voice/DSP values initially match.

A longer necessary-condition check executes the original sequence interpreter
and exact clock for 256 intervals while bypassing voice creation. It rejects
zero-length and zero-gate note-end waits, which would invalidate this reduction;
neither occurs. Its first 13 boundary samples, exact clock bytes, tempo,
timebase and RNG agree with full synthesis. Both entries then have **257 unique
clock boundary states over 13,748.051821 seconds** (about 3.819 hours).
Each has 252 single intervals of 1,757,600 samples and four of 1,757,760 samples.
Two-pass durations sometimes become **3,515,360**, so the short capture's
3,515,200-sample period is not globally invariant in this model. Tempo changes
through 146–221; 149 is a boundary value, not a constant playback tempo.

This is a bounded audit of the source-backed, pinned-capture model. It neither
extends hardware verification nor certifies native allocation under pressure.
The measured peak of 24 voices makes slot ordering and allocation behavior
relevant; the existing allocation model remains an explicit fidelity limit.

## Proposed bounded engine/export contract — pending agreement

The resource pipeline would export only the allowlisted music entries' sequence
data, bank/region selections, decoded mono PCM, exact arithmetic tables and
provenance. No firmware executable, credentials, neighboring archive data or
runtime capture is required. Resource extraction remains independently
reproducible. The proposed JavaScript engine consumes this immutable resource
pack; browser scheduling stays with the owner of `src/os/audio.ts`.

The smallest useful interface is an entry constructor and a deterministic
`renderFrame()` returning **160 interleaved stereo signed-int16 samples at
32728 Hz**, an absolute starting sample index, and optional diagnostic state.
One call advances sequence ticks, live track parameters, voices and source DSP
in the current native-frame order. Bytecode jumps retain the engine instance.
Diagnostics should be optional so full state serialization is outside the
render hot path. Engine initialization and sample decoding also stay outside it.

Persistent state comprises:

- Clock fraction, tempo/timebase/ratio, master/player gains and active-track
  order; track positions, waits, finite loop/call stacks, ties, parameters and
  note-gate state. Retain any supported variables/RNG if the accepted command
  coverage requires them.
- All 24 ordered voice slots and their allocation fields, wave identity, note
  length, envelope, sweep and LFO. Tied notes retain their captured pan and source
  playback state according to the v8 rules.
- Per-voice DSP loaded/enabled state, source position, 24-bit fraction, two
  history samples, previous main/aux stereo gains; player aux returns.

Offline loop budgets, visited-address bookkeeping and export timestamps are
diagnostics, not runtime loop semantics. Transport chunks do not reinitialize
the generator. Sample indices must remain contiguous. Browser output-rate
conversion and scheduling must preserve their own interpolation/history state;
that adapter, lifecycle and pause/resume policy are outside this asset task.
The `music-resume` entry is a separately initialized resource entry, not an
implicit snapshot of an interrupted main entry.

A port must preserve every float32 rounding point (`Math.fround`), signed
truncation, integer saturation and 24-bit phase operation. Ship the checked
float32 table bytes instead of relying on cross-language transcendental or
decimal-rounding behavior. Proposed conformance gates are exact native-frame
PCM and state fixtures at startup, note/tie/release transitions, loop jumps and
late clock divergence, plus identical output when frames are requested in
different chunk groupings. Unknown commands/data must fail validation rather
than silently disappear. This contract targets v8 equivalence; it does not
erase the pinned-capture model's existing hardware/runtime limitations.

## Required current music coverage

A private command hook covered all **13,046 reachable command positions** in
main and **8,956** in resume over four observed repeat jumps. The control-flow
walk follows opened tracks, jumps and calls and stops at unconditional transfers
and returns. Every reachable position executed. Instrumented PCM matches the
same full-audit prefix exactly, and there are no missing bank lookups or
unapplied commands. Main uses 12 tracks and resume 14, with IDs up to 15.

The accepted music subset needs note key/velocity/variable-length gate data and
these 27 non-note command forms (hexadecimal opcodes):

| Behavior | Commands |
| --- | --- |
| Scheduling and flow | `80` wait, `88` open track, `89` jump, `8A` call, `FD` return, `B0` timebase, `E1` tempo |
| Instrument and allocation | `81` program, `B6` bank select, `C6` priority, `C7` note wait |
| Pan and gain | `C0` pan, `C1` volume, `D5` expression/volume2, `D7` stereo span, `D9` aux-A send |
| Pitch and modulation | `C4` pitch bend, `C5` bend range, `CA` modulation depth, `CB` speed, `CC` type, `CD` range, `E0` delay |
| Envelope overrides | `D0` attack, `D1` decay, `D2` sustain, `D3` release |

Priority `C6` appears only in main. No tie, portamento, random/variable/conditional
prefix, extended operation, finite-loop command or FIN is reachable in either
entry. Those forms can be explicitly rejected by a music-only first port; its
contract must not imply support for the short cues or arbitrary CSEQ resources.
The note wait/gate, natural voice release, source looping and ongoing call/jump
semantics still apply. No zero-gate waits occur. Existing default fields and
source arithmetic must remain consistent with v8 even when no command changes
them. In particular, main/aux gains exist independently of a send command.

Both entries select bank **1**, bank slot 0, programs **5, 6, 11, 14**, resolving
to five regions and wave archive **3**, waves **0–4**. Each wave is mono PCM with
source rate **44100 Hz**, has its own loop start/end, and uses interpolation
flag 0; source resampling remains part of the engine's 32728 Hz DSP path.
Region root keys are 60/69/76; volume 127, pan 64, pitch 1, hold 0, other bank
envelope parameters 127 and `ignore_note_off=false`. Export the values rather
than replace the region selection with assumptions. Retain source PCM and
loop boundaries exactly.

The four-jump runs reached 24 voices and allocated over an occupied slot 841
times in main and 2,229 times in resume, under the existing allocator. Thus
fixed slot order and `(priority, volume)` selection are exercised behavior,
not an optional optimization. These counts establish v8 coverage, not native
allocation correctness under pressure.

## Measured package size and reference cost

The in-memory accounting uses complete DATA blobs, the complete selected bank
tree, the observed wave union and explicitly packed arithmetic tables:

| Resource | Bytes |
| --- | ---: |
| Main sequence DATA | 28,792 |
| Resume sequence DATA | 20,568 |
| Five decoded mono signed-int16 PCM waves | 117,798 |
| Seven exact arithmetic tables | 6,761 |
| Compact bank/entry/wave/table metadata | 3,810 |
| Total concatenated resources | **177,729** |
| Gzip of that concatenation | **137,361** |

Tables comprise pan (257 float32), attack (128 float32), semitone pitch
(12 float32), fractional pitch (256 float32), gain (965 float32), sustain
(128 int16) and sine (33 int8). The count/size prototype is not a delivery
format. It excludes framing, expanded provenance, JavaScript engine code,
decoded float caches and browser overhead. The two DATA blobs belong to these
music entries; source ARM code is not part of this measurement.

On Apple M2, macOS arm64, Python 3.13.5 and NumPy 2.5.3, an uninstrumented,
prewarmed v8 player rendered eight batches of 1,024 frames per entry. Parsing,
resource export and diagnostics were excluded. The 8,192 frames represent
40.048888 seconds of audio:

| Entry | CPU ms/frame | Wall ms/frame | Audio/wall ratio |
| --- | ---: | ---: | ---: |
| Main | 1.0822 | 1.0969 | 4.457× |
| Resume | 1.1165 | 1.1329 | 4.315× |

The native frame budget is 160/32728 seconds, about **4.889 ms**. These are
Python/NumPy measurements on one host, not estimates of JavaScript speed or
real-time scheduling safety. A browser port needs its own worst-frame and
buffer-underrun verification before choosing its execution/scheduling policy.
No engine implementation or public resource package is included here.

## CLI correction and verification

Wrapper version **7** now rejects every rate other than **32728 Hz** before any
input/output work and advertises only `--rate {32728}`. It keeps DSP profile v8
and does not alter synthesis. A fresh native-rate `select.wav` is byte-identical
to v8, SHA-256
`79cce738dbe8e64e5b86a626c238c31ff97c1ccae9ea576592329d8612e22c9c`.
Its manifest records converter version 7 and the current wrapper hash.

The focused suite has **40 passing tests**, including alternate-rate rejection
through both interfaces, state-copy independence and exclusion of export-only
fields while retaining finite loop counts. No application/audio runtime or
public assets changed, so no browser, shader or application build is claimed.

## Private artifacts

All paths below are relative to the SSD firmware artifact root
`assets/audio-research`:

- `v8-loop-audit-{music,music-resume}.{json,wav}` and matching `-repro.json`;
  JSON SHA-256 respectively
  `a821a2e256aec326835aca8630acfac230aafe1d0312eace96892d09353b6327` and
  `efbe0f03baa11d0bd75ca20f9d316f5446929066919fbbe4a86ac19ef35e44b6`.
- `clock-cycle-audit-v8.py`, `clock-cycle-audit-v8-{music,music-resume}-checked.json`.
- `summarize-loop-audit-v8.py`, `v8-loop-audit-summary.json`,
  `v8-clock-only-state-counterexample.json`.
- `music-contract-inventory-v8.py`, `music-contract-inventory-v8.json`.
- `cli-v7-select-check/{audio.json,select.wav}`.

Main continuous PCM SHA-256 is
`4afa4155dcf8d2d668b028190d487ac8d62c860d5e34014f3ce4454ec70dc1d1`;
resume is
`3a722763af1236115abc929b3f4dcda6f2b39152e14266de1739e87c3bc697eb`.
