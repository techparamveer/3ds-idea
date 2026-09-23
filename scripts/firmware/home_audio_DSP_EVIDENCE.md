# Pinned-capture DSP source path, profile v8

2026-09-23. V8 resolves the previously isolated **early folder-opening sweep
mismatch against the pinned Azahar recording**. It models the source's initial
buffer dequeue, persistent interpolation history/fraction and per-frame gain
ramps. The early sweep correlation rises from -0.005517 to **0.999999693**,
with native-minus-candidate RMS **+0.000244 dB**, without fitting volume,
pitch, timing constants or envelopes. Select and close also improve.

This is an offline candidate, not a public audio replacement. It retains v7's
native sequence/envelope/sweep/LFO arithmetic, original archive volume, all
sequence/bank/wave data and original loop selection. The baked music-loop
restart is still defective. The correction targets the **identified emulator
capture path**, not a claim that Azahar's polyphase or fixed-point arithmetic
is verified against hardware.

## Pinned sources and scope

The owner-supplied HOME code/archive/title identity remains the one in
[voice evidence](home_audio_VOICE_EVIDENCE.md). The coordinator provided these
files from Azahar revision `9e6f523a57fac9564ac0bf8286db3c3702d301ec`, matching
the capture metadata. The worker independently rechecked both SHA-256 and Git
blob identities in `reference/audio-resampler-source/provenance.json`.
The complete source hashes and URLs are also embedded in the v8 profile.

| Source | SHA-256 |
| --- | --- |
| [interpolate.cpp](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/audio_core/interpolate.cpp) | `e5246de03956bf86252ff3f0531e438803c0ec69fd11272d8374d433e4296dcb` |
| [interpolate.h](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/audio_core/interpolate.h) | `c258df7a2d839ab2733c8915a529f649fb6301e0a29d97af237cf875d0330925` |
| [source.cpp](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/audio_core/hle/source.cpp) | `2c2e450a25a6fc11b3cceb192728e86fabc78f1addf67aa7283b832194ac29c1` |
| [source.h](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/audio_core/hle/source.h) | `098f0121bd845cf8ead26a879792945c0dc367022938320a66894fc58092af2e` |

Azahar's default Polyphase case explicitly dispatches to Linear. Its source
calls the choice of 24 fractional bits unverified, and notes occasional +/-1
linear-interpolation differences from actual firmware. Consequently the new
helper is named `CaptureDsp`; profile metadata says `hardwareVerified: false`.
The mathematical behavior is independently expressed with NumPy, an existing
pinned DualRip dependency. No emulator implementation or firmware bytes are
copied into Git. Original emulator files and the C++ test harness remain
private, with their source notices intact.

The profile remains limited to the exact archive, validated mono waves and
original default bank interpolation field zero. Other interpolation fields are
rejected. Generation requires complete **160-sample frames** at the native
**32728 Hz** output rate. The unchanged wrapper still advertises other rates;
those are outside v8's scope and fail its frame-size check. No post-render rate
conversion has been added.

## Source behavior represented

`Source::GenerateFrame` clears its current frame first. With an empty current
buffer, a successful initial `DequeueBuffer` returns immediately: that frame
contains no source PCM, while control/envelope updates and gain state still
advance. The next frame starts interpolation from zero history and fraction.
This is why adding output padding or simply delaying a finished v7 WAV would
be wrong: the next frame's pitch and gain are used to begin consuming samples.
V8 preserves this source lifecycle, without trimming or appending silence to
rendered audio. Tied notes keep their existing DSP state; new notes replace it.

The resampler retains two historical signed-16 samples and an integer position
with 24 fractional bits. Each frame derives its step from float32 rate times
2^24, truncated to unsigned integer. For every output sample it interpolates
between the two preceding source positions. Their difference saturates to
[-32768,32767] **before** multiplication by the fraction. The C++ unsigned
fraction/signed-difference expression and final int16 conversion yield the same
low bits as a signed product rounded down, including negative fractions.

At each input-buffer boundary, both history samples and the unconsumed
fraction survive. At a full output-frame boundary, the source retains the
last input position used, not an independently rounded `rate * 160` estimate.
The helper stores the cursor, fraction and history explicitly; it does not
restart interpolation at pitch changes or sample-loop boundaries. Nonlooping
source status is disabled on the following empty-buffer frame, matching the
source lifecycle rather than prematurely reusing its voice slot.

`Source::ParseConfig` saves the previous source gain when receiving an update.
`MixInto` uses float32 progress `sampleIndex * float32(1/159)` and interpolates
from the prior target to the new one over indices 0..159 inclusive. The gain
product is truncated to a signed integer **per source and per bus before
summation**. Main, aux A and aux B remain separate until the existing explicit
unity-return assumption combines them. New sources begin with zero gain; the
initial dequeue frame advances those gain endpoints even though its PCM is
zero. This explains why applying a fresh zero-to-target ramp directly to v7's
first audible frame made the diagnostic worse.

`home_audio_dsp.py` owns this bounded source state. The isolated adapter copies
it and records its hash in both `dspSha256` and the patched-file inventory.
The patch initializes it at new-note allocation, preserves it for ties,
passes float32 rate/gain targets and uses source completion to retire voices.
The voice profile is now `eur-home-24576-stereo-startup-v8`; wrapper version 6
is unchanged. DSP filters, later runtime gains/aux routing, arbitrary voice
allocation pressure, stereo source waves and hardware polyphase remain outside
this implementation.

## Independent arithmetic and lifecycle verification

A private C++ harness compiles the unchanged, hash-verified `interpolate.cpp`
with minimal type stubs. Six fixtures cover one-sample and offset loops,
finite buffers shorter/equal/longer than a frame, full-range saturated sample
differences, and rates 1, 0.25, 0.9991, 1.3333333, 3.75, 0.1 and 2.1 changed
between frames. All **23,040 PCM samples**, history pairs, fractional positions,
remaining-buffer counts and enabled states match exactly.

A second C++ harness executes the unchanged `Source::MixInto` method with
float contraction disabled. It checks another **23,040 per-source/bus/channel
products**, including nonzero prior gains, rising/falling ramps, negative
values and truncation near integer boundaries. Every integer product matches.
A further 19,200 randomized gain products match between the local compiler's
default settings and its contraction-disabled build. The independent golden
fixture digests are:

- PCM plus all resampler state: `1f468b4dd9859646d93e7baaa1f3c9d2d4f10a819cde577e7af7a158ab7a6495`;
- gain products: `519b2190f1c741c7ab5d50ee30b72f80e2f8c4f57b17393917c2ec59bc8c852d`.

The focused suite now passes **36 tests**, retaining the native v7 arithmetic,
archive/provenance, gates and loop-clock checks, and adding C++-derived golden
fixtures, initial-dequeue/history/EOF behavior, saturation/negative fractions
and invalid source/rate rejection. Existing integration tests now verify actual
complete frames, transparent bus contributions and preserved generated origin.

## Controlled short-cue comparisons

The input recordings, source identities and unity background subtraction are
unchanged from [entry-volume evidence](home_audio_ENTRY_VOLUME_EVIDENCE.md).
The older opening recording provides the clean early sweep. The later physical-A
capture still has the contamination described in
[input-route evidence](home_audio_OPEN_ROUTE_EVIDENCE.md); it is not silently
substituted into this comparison. No least-squares gain is applied.

Private variants tested interpolation only, gain ramp/integer mixing only,
both, and both with the source-derived initial dequeue behavior. The first
three retain poor whole-opening correlations 0.2154, 0.2185 and 0.2150.
The coherent source lifecycle gives **0.9998712**. This distinguishes a real
state-order correction from a fitted boost or an after-the-fact sample shift.

| Cue/window | V7 correlation | V8 correlation | Native minus v8 RMS | V8 unity error RMS |
| --- | ---: | ---: | ---: | ---: |
| First RIGHT / select, active template | 0.998925146 | 0.999999991 | +0.000127 dB | 0.000003915 |
| Folder-open, active template | 0.218836032 | 0.999871196 | +0.000338 dB | 0.000026851 |
| Folder-open, 0.07–0.21 s at tail-aligned origin | -0.005517402 | 0.999999693 | +0.000244 dB | 0.000001746 |
| Folder-open, 0.21–0.32 s at same origin | 0.990831957 | 0.994821061 | +0.004053 dB | 0.000040741 |
| B close / folder-close, active template | 0.996730206 | 0.999999941 | +0.000074 dB | 0.000001575 |

V8's whole-template and tail-based folder alignment agree at native sample
**835840**. The select and close waveform origins are samples **367520** and
**959840**. These are alignment results, not measurements of input-to-audio
latency. The weak tail still has residual differences; this does not claim
complete PCM equality. The other allowlisted cues are rendered/reproduced and
checked for clipping, but these captures do not independently exercise all of
their UI transitions. In particular, source lifecycle/ramping changes touch and
power levels; they have not been independently accepted from a native event
capture.

## Full pack, music and reproducibility

`assets/audio-candidate-v8` and `assets/audio-candidate-v8-repro` contain
byte-identical **12 WAVs and audio.json**. All source/profile/patch/helper and
manifest cue hashes match current files; the pinned DualRip checkout is clean.
All cues report zero unapplied commands and zero samples at the int16 clipping
limits. Main music peak is 0.198059; the largest cue peak is back at 0.509125.
This tests exported PCM, not every intermediate native mixing/clipping state.
The v7 packs, public assets and runtime audio are preserved.

Main remains `[314720,3829920)` and resume `[0,3515200)`: the native-measured
**3,515,200-sample period** is unchanged. Select now retains 960 samples,
nonzero `[162,652)`. Folder-open retains 17600, nonzero `[2241,10557)`; close
retains 7200, nonzero `[2150,5905)`. No active-support crop is applied to files.

The unchanged 48-band FFT comparison against the long native capture selects
speed 1.0 and approximate onset 1.775 s. First-cycle feature similarity improves
**0.949026 → 0.973924**. This is spectral alignment, not sample-exact equality.

| Candidate window | Native minus v8 RMS | Feature similarity |
| --- | ---: | ---: |
| 12–25 s | -0.002170 dB | 0.973176 |
| 25–50 s | +0.011389 dB | 0.975948 |
| 50–75 s | -0.034902 dB | 0.971464 |
| 75–100 s | +0.012658 dB | 0.974749 |
| 108–115 s | -0.004843 dB | 0.973012 |
| 115–122 s, baked restart | -0.982959 dB | 0.907740 |
| 125–150 s, repeated slice | +0.048995 dB | 0.976163 |
| 150–180 s, repeated slice | -0.011612 dB | 0.971742 |

## Baked music restart remains a delivery defect

Independent four-pass rendering retains all source, voice and sequence state.
Its entire exported-candidate prefix is byte-identical for both music entries.
The main continuation contains 7,345,120 samples; resume contains 7,030,400.

| Cue | Baked step L/R | Continuous step L/R | First 2 s after restart correlation |
| --- | --- | --- | ---: |
| Main | +0.0171204 / +0.0153503 | -0.00042725 / -0.00033569 | 0.794740 |
| Resume | +0.00555420 / +0.00051880 | -0.00030518 / -0.00012207 | 0.986725 |

The main discontinuity improves from v7's +0.05380/+0.02023, but still exceeds
the surrounding continuous maximum adjacent step 0.003296. The repeated main
slice has only 2,220,911 of 3,515,200 stereo sample positions equal to continuous
playback; resume has 2,454,706. Three track-9 intro voices remain at the selected
main loop start and are absent at its end, as before. V8 snapshots additionally
retain every source's cursor, fractional phase, two history samples and prior
gains; these are further state that a waveform restart does not preserve.

Replacing the baked repeat **only for analysis** with continuous PCM changes
the native 115–122 s comparison to **0.964345** similarity and **-0.002177 dB**,
versus baked 0.907740/-0.982959 dB. This confirms that the loop delivery issue
survives the sweep correction. A source-faithful continuous implementation must
carry sequence clock/track state, voices/envelopes/LFO/sweeps and DSP history/gain
state across the bytecode loop. A different fixed slice would require separate
steady-state and seam evidence. No later-loop selection, crossfade, public pack
promotion or runtime streaming architecture is introduced here.

## Private evidence

All diagnostic files are under SSD `assets/audio-research`:

- `resampler-diagnostic.py`, `resampler-{linear,gain,combined,combined-startup}/`,
  `compare-resampler-diagnostic.py`, `resampler-diagnostic-comparison.json`;
- `dsp-oracle-check.py`, `dsp-cpp-oracle/`, `dsp-cpp-oracle-report.json`, `dsp-gain-contraction-check.json`;
- `validate-v8.py`, `candidate-v8-validation.json`;
- `compare-v8-short.py`, `resampler-v8-comparison.json`;
- `compare-v8-long.py`, `candidate-v8-long-comparison.json`;
- `v8-loop-render.py`, `continuous-v8-{music,music-resume}.{wav,json}`,
  `compare-v8-loop.py`, `candidate-v8-loop-comparison.json`.

Application/UI/model code is unchanged, so no browser, shader or Next.js rebuild
is claimed. Public audio remains held for loop delivery and the remaining
capture/runtime/hardware limits described above.

The follow-up [complete repeat-state audit](home_audio_REPEAT_STATE_EVIDENCE.md)
tests later cycles without resetting state and documents the proposed persistent
engine boundary. Wrapper version 7 subsequently makes the native-only CLI rate
constraint explicit; the v8 pack and wrapper-6 provenance above remain historical.
