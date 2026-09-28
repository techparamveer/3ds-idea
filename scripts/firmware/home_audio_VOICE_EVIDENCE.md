# Native HOME voice-state transcription, profile v7

This is an offline candidate for the exact EUR HOME v24576 archive, not a public
audio replacement or a claim of native PCM equality. The original CSEQ, CBNK and
CWAV data are unchanged. No measured gain, waveform trim, padding or time stretch
is applied. Converter wrapper version 6 is unchanged; the separately hashed
voice profile advances to `eur-home-24576-stereo-startup-v7`.

Source identity: title `0004003000009802`, code SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`, archive SHA-256
`1017eb4a367cb202ac6018fb432b5654222487149d16242fa7d1f205e63f3eb2`.
The code is inspected as data, never executed or included in delivery. The
[entry-volume evidence](home_audio_ENTRY_VOLUME_EVIDENCE.md) identifies the
parent CIA and existing lossless native captures.

## Envelope state and gain

New-note setup `0x1aad6c` resets the envelope through `0x1a69d0`, using the
float32 -90.4 dB constant at `0x3179c4`, multiplied by 10 to give **-904** stored
table units. State values are attack 0, hold 1, decay 2, sustain 3, release 4.
The update at `0x151ac0` receives increment 5 from the 160-sample voice frame.

- Attack setter `0x1a6a84` loads the 128-entry float table at `0x317ac8`.
  Each unit multiplies the float32 level. A result strictly greater than
  -0.03125 changes to hold at zero, initializes the hold counter and returns
  without carrying the remaining attack units into hold.
- Hold setter `0x1a69ec` uses integer `(raw+1)^2/4`. Hold consumes its counter;
  leftover update units fall through to decay.
- Decay `0x1a6a0c` and release `0x2089a8` set 65535 for raw 127, 24 for 126,
  `(2*raw+1)/128*0.2` below 50, otherwise `60/(126-raw)*0.2`, preserving
  float32 rounding at each native operation. Decay subtracts rate times units
  and clamps only when strictly below the signed sustain table at `0x3179c8`.
  Native sustain raw zero is -723; it is not the pinned renderer's -32768.
- Getter `0x153320` multiplies level by float32 0.1, except zero-factor attack
  reports 0 dB immediately. Gain lookup `0x151d94` clamps to [-90.4,6], truncates
  float32 `dB*10` toward zero, adds 904 and reads `0x30e0e4`. The floor entry is
  exactly zero. Voice expiry is tested **before** update at `0x14cf80..98` and
  requires release dB strictly below -90.4. The crossing frame is retained.

The voice factor at `0x2e54c0..dc` is float32 velocity squared times linear
region volume times float32 `1/127^3`. Track update `0x208a74..ab8` computes
volume times expression times sequence-main volume, normalizes by the same
constant and squares the result, then applies external track/player factors.
`0x14cf58..7c` combines that with the voice factor, and `0x14d144..154` applies
envelope-table gain separately. Even all-127 input gives a voice factor one
float32 ULP below 1 because of the stored reciprocal; no idealized unity
replacement is made. Archive volume remains the separate v6 linear factor.

## Sweep, pitch and modulation

`0x1a8a0c..98` builds a float32 semitone sweep from the explicit value and,
when portamento is enabled, previous key minus current key. An explicit sweep
still applies when portamento is disabled. Command E3 at `0x2e5794..a0` stores
signed input times 1/64 and does not enable portamento. C9 stores the transposed
portamento key as a byte and enables it (`0x2e5a30..44`).

Portamento time zero uses the passed gate and a counter advanced on sequence
ticks. Nonzero time uses `5 * (int(float32(abs(sweep)*time^2)) >> 5)` and a counter
advanced by 5 per voice frame. `0x14d008..44` evaluates the remaining fraction
before advancing the timed counter. `0x1aab10` clamps a manual counter to its
duration. Nonpositive gate values produce no sweep fraction.

The voice adds key difference, live float32 bend (`raw/128 * bendRange`,
`0x208adc..b18`) and pitch modulation. `0x14d094..a4` multiplies by 256 and
truncates toward zero. `0x151c68` combines an octave factor, the semitone table
at `0x30dcb4`, and fractional table at `0x30dce4`, rounding each multiply to
float32. Region pitch multiplies the runtime factor before this ratio.

The exact allowlist actively uses volume and pan LFO in music, and pitch LFO
in the launch cue. Keeping pinned integer modulation would undermine this
voice transcription. Native setters `0x2e5954..980` normalize depth by 1/128
and speed by **0.390625**, distinct constants. Delay command E0 multiplies its
input by 5. `0x1530dc` consumes delay units, advances float32 phase by speed
times increment times float32 0.001, and removes the integer phase. It advances
even at zero depth. Getter `0x1533d0` indexes the native 33-byte quarter-sine
table at `0x3180b4`, reflects/signs its quadrants, normalizes by float32 1/127
and multiplies depth and range in the native order. Pitch and pan use the
pre-update value; volume uses the post-update value times 6 dB and the gain
table (`0x14d164..178`).

## Exact tables

All **1,522 entries** across attack, sustain, pitch semitone/fraction, gain and
sine match the private code bytes exactly. Packed hashes are in the profile
and checked by tests. Attack is reproduced by the known integer attack factors
raised to 1/5, rounded to seven decimal places, then float32. Pitch uses powers
of two. Gain indices 1..104 use the decibel power rounded to ten decimal
places; indices 105..964 use nine; index zero is zero. These compact formulas
reproduce the tables; their rounding is established by full byte comparison,
not fitted to audio. The sustain/sine integer values are the native values.
The pinned DualRip MIT notice remains adjacent to the patch.

## Sequence, gate and loop semantics

The [runtime follow-up](home_audio_RUNTIME_FOLLOWUP.md) traces the native sound
thread callback before voice update. V7 executes all sequence ticks, updates
live track parameters, then updates voices. It retains every generated frame;
the former silent first frame is removed by this execution order, not trimming.
The native sequence clock is unchanged.

`0x1a87a4` decrements positive gates and advances manual sweeps before parsing
new commands, including newly created voices on a second tick in one frame.
Parser `0x2e6028..38` maps nonpositive note length to -1; a raw zero-length
notewait still waits for its owned voice to end. Note keys saturate to 0..127.
Bank flag-4's low byte is ignore-noteoff (`0x2e6564`); gate release honors it,
while forced track close does not. Native absent-envelope fallback at
`0x33db14` is five zero bytes. The decoded original 33 bank regions all have
explicit envelopes, hold zero and note-parameter word zero.

Native noteoff `0x1aadf8`/forced release `0x208964` changes envelope state and
priority; it does not disable CWAV looping. V7 removes the pinned heuristic
that stopped nonpositive-length notes at the first sample wrap. FIN uses
`0x208810` semantics: update parameters, force release and detach track
callbacks. Detached manual sweeps no longer advance. An offline loop-pass
limit remains a renderer stop, not a synthetic native FIN; it preserves the
continuing state at the reported boundary. The existing wrapper exports its
original first-start/second-pass interval, with no later loop selection added.

## Scope limits

This transcribes the traced voice arithmetic for the exact allowlisted original
banks and commands. It does not implement the native DSP resampler, fixed-point
bus mixing/clipping or gain ramps. Runtime player/master/aux overrides are not
captured. The existing voice allocation model is not established as native
under arbitrary overload. No broader firmware, unsupported command, surround
or stereo-source support is claimed. Source-state tests and exact table bytes
do not establish native startup latency, waveform equality or a seamless baked
loop. Capture comparison and continuous-state measurements follow below.

## Candidate verification, 2026-09-22

All **31 focused tests pass**, including full native table hashes, envelope
threshold/equality/hold carry, release-crossing lifetime, explicit and timed
sweeps, signed pitch quantization, LFO delay/phase, live versus captured pan,
linear archive versus squared track gain, zero-length sample loops, ignored
gate release versus forced FIN, detached sweeps, multiple sequence ticks before
the first voice frame, bank fallback fields and the exact archive/loop guards.

`assets/audio-candidate-v7` and `assets/audio-candidate-v7-repro` independently
produce byte-identical **12 WAVs and audio.json**. All current profile, patch,
adapter, math, clock and voice hashes match; the pinned renderer is clean.
All 12 cues have no unapplied commands and **zero samples at either int16
clipping limit**. Peak main music is 0.198151; the largest cue peak is back at
0.507263. This does not test the native DSP's internal clipping behavior.
The preserved v6 packs and public audio are unchanged.

Main music still exports `[314720,3829920)` and resume `[0,3515200)`, both
**3,515,200 samples** at 32728 Hz. Independent native self-correlation in three
windows returns that same period, with correlations 0.990265, 0.990826 and
0.978443. Short-cue durations legitimately change with native envelope/FIN
lifetime; silence is retained, not cropped. Select has 640 samples (v6 960),
folder-open 17600 (15200), and folder-close 7200 (6560). Their nonzero ranges
are `[0,492)`, `[2080,10466)`, and `[2080,5760)` respectively. Freely aligned
templates do not validate the absolute runtime onset of a user input.

### Native short-cue comparison

The existing `home-sfx-native.wav` and `home-native-lossless-long.wav` captures
are unchanged. The native music baseline is subtracted at independently
established piecewise integer offsets, with unity gain. Full active templates
use the same 0.1%-of-peak support threshold in v6 and v7 for diagnostics only;
the exported WAVs retain their complete timeline. Least-squares gain is measured
but never applied. Event names express cue hypotheses within the recorded input
windows, not independent visual verification of every UI transition.

| Cue/window | V6 correlation | V7 correlation | Native minus v6 RMS | Native minus v7 RMS |
| --- | ---: | ---: | ---: | ---: |
| First RIGHT / select | 0.998925 | 0.998925 | -0.0314 dB | -0.0314 dB |
| Footer opening / folder-open | 0.216872 | 0.218836 | -0.3504 dB | +0.1260 dB |
| B closing / folder-close | 0.998158 | 0.996730 | +0.0902 dB | +0.1753 dB |

Select's complete nonzero PCM core is unchanged and moves earlier by one frame.
Folder-close is slightly worse by these measures. Folder-open's early waveform
remains poorly correlated, so its whole-template RMS similarity cannot establish
correctness. Its 0.21–0.28 s tail still correlates 0.991528 at an inferred origin
25.541742 s, diagnostic gain 0.979931; the 0.28–0.38 s slice correlates 0.983443.
The native variable-pitch/DSP resampling path remains an explicit candidate for
further investigation, not an established explanation of the early mismatch.
The launch/back/home/power cues were rendered and checked for reproducibility
and clipping; these captures do not independently validate all their UI events.

### Full native music comparison

The 196.930-second long lossless capture is compared with the main WAV followed
by its exact baked repeat. The 48-band FFT method uses 4096-sample windows and
3273-sample hops. Its best first-cycle alignment is speed 1.0, approximate onset
1.775 s; v6 was 1.770 s. This is feature alignment, not sample-exact PCM matching.
Aggregate first-cycle feature similarity changes **0.940360 → 0.949026**.

| Candidate window | Native minus v6 RMS | Native minus v7 RMS | V7 feature similarity |
| --- | ---: | ---: | ---: |
| 12–25 s | -1.7211 dB | -0.0631 dB | 0.9448 |
| 25–50 s | -1.5201 dB | -0.0464 dB | 0.9548 |
| 50–75 s | -1.8022 dB | -0.1186 dB | 0.9455 |
| 75–100 s | -1.6671 dB | -0.0464 dB | 0.9490 |
| 108–115 s | — | -0.0397 dB | 0.9480 |
| 115–122 s, containing baked join | — | -1.0975 dB | 0.8831 |
| 125–150 s, repeated slice | — | +0.0085 dB | 0.9503 |
| 150–180 s, repeated slice | — | -0.1089 dB | 0.9487 |

The main 12–100 s level discrepancy is now 0.046–0.119 dB, achieved solely by
source-derived arithmetic. The weaker baked-join window is a distinct defect.

### Continuous loop-state comparison

Independent four-pass diagnostics produce 7,345,120 main samples and 7,030,400
resume samples, without trimming or waveform processing. Each candidate WAV
matches its entire continuous prefix byte-for-byte. Both baked repeats differ
from the continuation, even though their sequence period is correct.

| Cue | Baked join step L/R | Continuous step L/R | Correlation of first 2 s after join |
| --- | --- | --- | ---: |
| Main | 0.0538025 / 0.0202332 | 0.00186157 / 0.00079346 | 0.796742 |
| Resume | -0.00277710 / -0.00408936 | 0.00100708 / -0.00012207 | 0.984919 |

Main's baked step is larger than v6's 0.0138855 / 0.0113220. The largest natural
adjacent step in the surrounding continuous 20 ms is only 0.00314331. At the
first loop start, three track-9 intro voices still have gate 911; at the exported
end they are absent. Restarting the first loop slice audibly risks replaying
that state. The snapshot records copy track flags and all envelope/LFO/sweep
scalars, avoiding the historical by-reference diagnostic limitation.

Replacing the baked repetition with continuous converter PCM for analysis
improves the native 115–122 s feature similarity from 0.883131 to 0.928091 and
native-minus-candidate RMS from -1.09746 to -0.14231 dB. This is evidence of a
baked-state problem, not approval to change the delivery loop. Across each
complete repeated period, only 2,122,918/3,515,200 main stereo samples and
2,322,119/3,515,200 resume stereo samples are identical to continuous output.
No steady-state or seamless-loop claim is made. **Public replacement remains
held** for this defect and the remaining native waveform/runtime differences.

## Reproducible private evidence

All paths below are under the SSD artifact root
`firmware-10.7.0-32E/assets/audio-research`:

- `v7-source-table-verification.json`, `native-v7-table-analysis.json`,
  `v7-bank-region-inventory.json`, `v7-lfo-inventory.json`;
- `validate-v7.py`, `candidate-v7-validation.json`;
- `compare-sfx-residual-v7.py`, `sfx-native-residual-comparison-v7.json`,
  `sfx-event-detail-v7.py`, `sfx-folder-open-detail-v7.json`;
- `compare-v7-long.py`, `candidate-v7-long-comparison.json`;
- `v7-loop-render.py`, `continuous-v7-music.{wav,json}`,
  `continuous-v7-music-resume.{wav,json}`, `compare-v7-loop.py`,
  `candidate-v7-loop-comparison.json`.

Existing v6 reports provide the before measurements. Native capture identity
and the piecewise music-subtraction caveat are recorded in the entry-volume
evidence. The private discarded `v7-lfo-scale-trial` is not a delivery candidate;
the final two packs use the verified, distinct depth and speed constants.
