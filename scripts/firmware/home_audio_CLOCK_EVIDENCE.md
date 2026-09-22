# Native HOME sequence clock

Static native-code inspection and built-in PCM comparison, 2026-09-22. This is
the bounded scheduler correction in converter v4; it does not establish native
envelope, waveform or baked-loop continuity equivalence.

## Source and transcription

The owner-supplied EUR HOME title is `0004003000009802`, version 24576.
Its `exefs/code.bin` SHA-256 is
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`;
`romfs/sound/menu.bcsar` SHA-256 is
`1017eb4a367cb202ac6018fb432b5654222487149d16242fa7d1f205e63f3eb2`.
Firmware is reference data and is not included in the repository.

Sequence update `0x1aa174` uses these player fields:

| Offset | Meaning | Reset at `0x1aa0a4` |
| --- | --- | --- |
| `+0x60` | Float32 tempo ratio | 1 |
| `+0x64` | Float32 fraction until next tick | 0 |
| `+0x72` | Unsigned 8-bit timebase | 48 |
| `+0x74` | Unsigned 16-bit tempo | 120 |

The constants are float32 `1/60000` at `0x1aa388` (bits `0x378bcf65`),
integer frame budget `0x4e200000` at `0x1aa390`, float32 ARM11 frequency
268111856 at `0x1aa394` (bits `0x4d7fb0ff`), and float32 inverse frequency
at `0x1aa398` (bits `0x3180278d`). The budget is `160 * 8192 * 1000`.
The scaling by 1000 is needed because the sequence rate is ticks per millisecond.

`home_audio_clock.py` transcribes the scheduling arithmetic:

1. Compute float32 rate from tempo, timebase and ratio. Preserve the native
   initial multiplication order: `(tempo * timebase * ratio) * (1/60000)`.
2. Convert `fraction * ARM11_frequency / rate` to unsigned integer tick cost
   by truncation, matching `0x208874` for the finite positive values in this
   guarded profile. Zero rate returns without changing the saved fraction.
3. Run a tick only while its cost is **strictly less** than the remaining
   frame budget. An exact equality is deferred to the next frame.
4. After every tick, read tempo/timebase/ratio again. The native post-tick order
   is `(tempo * timebase * (1/60000)) * ratio`. Recompute integer cost from
   `ARM11_frequency / rate`; a tempo command can change the next tick in this
   same frame.
5. Convert the unused next-tick cost back to float32, multiply by rate and
   inverse ARM11 frequency, and save the remaining fraction. This matches
   `0x21bf94` followed by `0x1aa2ec..2f4`.

The native callback `0x2ec034..0c0` invokes the sequence update when playback
is active. The exact [Azahar 2126.1.2 source revision](https://github.com/azahar-emu/azahar/tree/9e6f523a57fac9564ac0bf8286db3c3702d301ec)
defines native sample rate 32728 and frame size 160 in
[`audio_types.h`](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/audio_core/audio_types.h).
Its [`hle.cpp`](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/audio_core/hle/hle.cpp)
schedules frames every `samples_per_frame * 4096 * 2` ARM11 cycles, and
[`core_timing.h`](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/core/core_timing.h)
defines ARM11 frequency 268111856. These are source constants, not values fitted
to the recording. The patch mixes 160 samples per frame at 32728 Hz; the existing
optional output rates map that same frame cadence with fractional sample carry.
Only the native-rate output has been compared with captured PCM.

The CSEQ render path previously used DualRip's different driver cadence and
tempo accumulator. V4 replaces that scheduler and keeps the first audible
frame: native initial fraction zero means the first sequence tick runs at once.
The existing voice timer runs before sequence commands, so that first generated
block has no initialized note increment; the following block must be retained.
A synthetic constant-wave test checks this startup behavior. WSD rendering is
outside this exact sequence-only profile and is unchanged.

## Independent native period measurement

`reference/home-native-lossless-long.wav` is the 196.93-second built-in Azahar
PCM recording, signed 16-bit stereo at 32728 Hz, SHA-256
`35f7f9141df9d48810a86ecba54b72fbc7be81661ad52ff3fbcbf07a81080782`.
The main task captured normal boot in its isolated original-3DS EUR English
profile without intentional game input. The source contains no video packets;
it supplies audio evidence only. Saved stereo mode and the capture tap before
host volume/time stretching are documented in `home_audio_GAIN_EVIDENCE.md`.

Normalized native-to-native waveform correlation, at integer-sample offsets,
found the same repeat period in three independent 15-second windows:

| First native window | Period in samples | Correlation |
| --- | ---: | ---: |
| 15–30 s | 3515200 | 0.990265 |
| 40–55 s | 3515200 | 0.990826 |
| 65–80 s | 3515200 | 0.978443 |

This is **107.406502078 seconds**. V3's exported loop was 3514642 samples,
558 samples (17.050 ms) shorter. A scheduling-only replay of the actual CSEQ,
using the source-derived clock, independently produced three successive bytecode
loops of 1757600 samples each. DualRip retains the first loop start and extends
the end through its second pass, so the exported slice spans **two bytecode
passes**, or 3515200 samples. No fixed-tempo approximation is used: this music
changes tempo repeatedly between 146 and 221 at timebase 96; 149 is the value
at the inspected loop boundary, not its constant tempo.

The tests cover fixed tempo 149 with fractional carry, exact budget equality
and one float32 step below it, tempo changes inside a frame, zero-tempo holding,
first audible-frame retention, and the actual archive's two-pass period. Native
code excerpts, constants, the separate scheduling diagnostic and comparison
scripts/results remain private SSD artifacts in `assets/audio-research`.

## Limits

Matching repeat length does not make the exported loop waveform continuous.
The renderer repeats a baked slice, whereas the native sequencer retains voices
and other live state. The measured seam and long-recording comparison belong
in the candidate report and must be reviewed before replacing public audio.
The resume entry starts its loop before the renderer drops its initial silent
block, so its exported two-pass slice is 160 samples shorter than its untrimmed
schedule. The README records that startup boundary limitation separately from
the validated main-music period; no native resume capture is available.

Changing the shared sequence-render frame cadence also changes how often the
pinned voice envelope/modulation implementation updates. Native `0x14d120..130`
passes a constant 5 to the envelope/LFO update per native frame, but the pinned
envelope formulas have not been fully transcribed. V4 does not claim envelope
parity. Archive-entry routing, player/master gains, later aux changes, resampling,
table rounding and integer bus clipping remain unresolved. There is no measured
gain boost, fitted padding, crossfade or time stretch in this correction.
