# HOME startup origin and carried loop state

Converter v5 and eight-pass diagnostics, 2026-09-22. Exact archive, renderer and
native clock provenance are recorded in `home_audio_profile.json` and
`home_audio_CLOCK_EVIDENCE.md`. Public audio remains unchanged. These diagnostics
use the converter, not a new native capture.

## Startup correction

The sequence renderer called its voice timer before running the initial sequence
commands. Newly allocated voices therefore had no initialized sample increment
in the first generated 160-sample frame. V4 discarded that silent frame and
reset `player.now_sample` to zero. However, a sequence loop could already have
captured its start at zero before that reset. The retained PCM and its loop
positions then had different origins.

The resume entry demonstrates the error. Its first two untrimmed bytecode passes
span 1757440 and 1757760 samples, totaling 3515200. The reset reduced its rendered
two-pass end to 3515040 while its saved start remained zero. V5 removes the
discard/reset path and records every generated frame. It does not append silence,
shift notes, estimate native onset, pad a measured duration or stretch samples.

| Cue | V4 exported loop | V5 exported loop | V5 period |
| --- | --- | --- | ---: |
| Main music | `[314560,3829760)` | `[314720,3829920)` | 3515200 |
| Resume music | `[0,3515040)` | `[0,3515200)` | 3515200 |

Every v5 cue begins with the converter's existing silent 160 samples; its entire
remaining PCM is byte-identical to v4. The synthetic startup test checks silence
and the first audible sample at their generated positions. A synthetic loop
beginning at sequence origin checks its complete 96-tick period at the native
frame boundary. The real main/resume WAVs match the corresponding prefixes of
the independently streamed, untrimmed eight-pass diagnostics exactly.

This makes the converter's PCM and loop metadata consistent. Native startup
latency, native resume behavior and short-cue fidelity remain unverified.
The later [runtime follow-up](home_audio_RUNTIME_FOLLOWUP.md) traces a native
sequence-before-voice callback order, unlike the retained converter order.
V5's origin consistency does not establish native callback-order parity.

## Eight untrimmed passes

Private `render-untrimmed-passes.py` uses the isolated, source-checked renderer
and exact native clock, calls the existing voice/sequence timer once per frame,
and writes all generated stereo PCM directly as int16. It requests eight
bytecode passes and records per-track loop events and active-voice snapshots
after each boundary's complete timer update. No host UI, save or native process
is controlled. The final terminating boundary is excluded from steady-playback
comparisons.

The main music boundaries are:

`314720, 2072320, 3829920, 5587520, 7345120, 9102720, 10860320, 12617920, 14375520`.

The resume boundaries are:

`0, 1757440, 3515200, 5272800, 7030400, 8788000, 10545600, 12303200, 14060800`.

The first main loop start has 20 active converter voices, including sustained
track-9 notes carried from the intro. Its later nonterminating boundaries have
15 active voices and different release/sample positions. Consequently, jumping
back to the first start restores audio with intro state rather than the audio
that continuous playback would generate at that boundary.

The historical eight-pass reports stored each track's state list by reference,
so their serialized track flags show final state rather than boundary state.
Do not infer an early track end from those flags. PCM and copied voice scalar
snapshots are unaffected. The private diagnostic now copies that list, and
`intro-voice-origin.json` independently traces track 9's three notes to sample
102880, length 2736 ticks, with 911 ticks remaining at the first loop. No track
end occurs during the first 14.67 s of that trace. This supports carried intro
voices without establishing a missed native release; no track-end fix is made.

| Main two-pass slice | Baked step L / R | Continuous step L / R | Next-second difference RMS |
| --- | --- | --- | ---: |
| Boundary 0 → 2 | 0.0104065 / 0.0085144 | 0.0009460 / 0.0002747 | 0.0121207 |
| Boundary 1 → 3 | 0.0009460 / 0.0000610 | 0.0009460 / 0.0002441 | 0.0019792 |
| Boundary 2 → 4 | 0.0009460 / 0.0000610 | 0.0009460 / 0.0002441 | 0.0013897 |
| Boundary 3 → 5 | 0.0009460 / 0.0002441 | 0.0009460 / 0.0002441 | 0 |

Steps and RMS use int16 samples divided by 32768. The comparison takes the final
sample before the selected end and joins it to the selected start. It then
compares the next second against actual continuously generated PCM after that
end. A nonzero ordinary sample step is not itself an audio defect; the first
row's excess jump and differing continuation distinguish it from the live step.

## What later complete-pass selection resolves

The private `loop-state-candidates` directory contains two reviewable WAVs and
`loop-candidates.json` with loop ranges. They preserve every original sample
from sequence origin through the selected end. Loop metadata is in the JSON
sidecar; these WAVs are not installed in the public pack.

| Candidate | Loop range | One-time prefix | WAV bytes |
| --- | --- | ---: | ---: |
| `music-late-loop.wav` | `[5587520,9102720)` | 170.726 s | 36410924 |
| `music-resume-late-loop.wav` | `[7030400,10545600)` | 214.813 s | 42182444 |

Each selected range is exactly 3515200 samples and contains two complete
bytecode passes. Each two-second splice (one second before the end and one
second after returning to the start) is **byte-identical** to the converter's
continuous output around that end. Separate `*-seam-two-seconds.wav` files
preserve those exact samples for review. There is no crossfade, normalization,
inserted PCM or removal of the original lead-in.

Thus later complete-pass selection resolves the measured local voice-state
seam in these diagnostic candidates. Merely correcting the startup origin
does not resolve the main seam: moving both boundaries by 160 leaves its
waveform join unchanged. Preserving the complete lead-in avoids introducing
an untested splice from the intro directly into a later state, but costs a
larger file and a longer first playback before the selected repeat begins.

## Why this is not full steady-state or native parity

The native clock carries fractional phase across each repeat; it does not
reset at bytecode loop commands. At main boundaries 3 and 5 the fractions are
0.00582614 and 0.04203583. Different carried phase can place later note events
in different 160-sample frames even when the total period has the same integer
length. This comparison does not attribute every full-pass difference to that
phase; other converter voice/interpreter approximations remain unverified.

The complete main boundary-3→5 slice differs from the following two passes:
normalized difference RMS 0.00350969, maximum difference 0.0871582, with
1495077 of 3515200 stereo sample positions exactly equal. The selected resume
slice also differs from its following two passes (RMS 0.00402424). Matching
one second after a join does not make an entire repeated passage identical
to continuously evolving native playback. These finite diagnostics establish
a local seam improvement only; they do not justify calling a baked WAV an
exact native runtime replacement.

Private reproducible artifacts under `assets/audio-research`:
`render-untrimmed-passes.py`, `untrimmed-*-eight-passes.wav` and adjacent JSON,
`analyze-untrimmed-passes.py`, `untrimmed-pass-comparison.json`,
`make-late-loop-candidates.py`, `loop-state-candidates/loop-candidates.json`,
`validate-v5.py`, and `candidate-v5-validation.json`. All writes and isolated
renderer copies remain under the SSD artifact root. The production converter
keeps its original two-pass selection in v5; later-pass candidates are separate
evidence for a future delivery decision.
