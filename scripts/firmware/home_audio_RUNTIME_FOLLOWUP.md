# HOME runtime gain, frame order and opening-cue follow-up

2026-09-22, after converter v6. These are static source traces and private
counterfactual renders, not installed converter changes or public acceptance.
Native code/archive identity is in
[entry-volume evidence](home_audio_ENTRY_VOLUME_EVIDENCE.md).

## Aux return does not explain most of the music level gap

The exact [Azahar 2126.1.2 mixer](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/audio_core/hle/mixers.cpp)
passes a bus with host aux routing disabled directly to its intermediate buffer.
`MixCurrentFrame` then includes all three intermediate buffers at their configured
gains. A null callback therefore does not itself imply silence. This confirms
the earlier startup interpretation, while actual runtime settings remain open.

The native return path is now traced beyond the defaults:
`0x15154c → 0x151320 → 0x154690 → 0x21ecf0`. The final setter writes the float
to DSP configuration `+8` or `+0xc` and sets dirty bit 24 or 25. These match
Azahar's [DSP configuration fields](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/audio_core/hle/shared_memory.h).
`0x1468ec..0x146a3c` combines the two bounded return ramps before calling the
setter; the SoundSystem constructor at `0x234afc` initializes their endpoints
to 1 via the constant at `0x234c24`. Available capture logs contain no
`aux_bus_enable`, `aux_return_volume` or `master_volume` trace values. Static
defaults do not prove that later runtime writes leave these values unchanged.

A private render changes only v6's aux return A/B to zero. This tests the
maximum effect of removing those contributions from the current converter;
it does not establish native settings or justify such a change.

| Music window | V6 minus main-only RMS | Native minus main-only RMS |
| --- | ---: | ---: |
| 12–25 s | +0.0916 dB | -1.6295 dB |
| 25–50 s | +0.0870 dB | -1.4331 dB |
| 50–75 s | +0.1308 dB | -1.6714 dB |
| 75–100 s | +0.0855 dB | -1.5817 dB |

The conditional +1.8419 dB boost on a track with send 30 is not the boost on
the complete mix. Removing both aux returns accounts for only 0.09–0.13 dB
here, leaving most of the music discrepancy. No normalization or aux change is
promoted. Native comparison uses the existing approximate 1.77 s alignment.

Private artifacts under `assets/audio-research`: `aux-return-diagnostic.py`,
`aux-return-diagnostic-v6/main-only.wav`, its `report.json`, and
`aux-return-{dsp-setter,native-setter,library-setter,fade-update}.asm.txt`.

## Native sequence callback precedes voice update

Sequence construction at `0x13b870` installs subobject vtable `0x320994` at
player `+0x4c`; its slot `+8` points to `0x2ec034`. Start at `0x1aa4f0` registers
that subobject through `0x1a83f4` in the sound-thread list at `+0x1d4`.
`0x13b478..498` invokes that list's slot `+8`, before the active-voice update at
`0x13b4ac → 0x1468b4 → 0x14cee8`. The sequence callback runs the scheduler
`0x1aa174` and then updates track parameters. V6 retains pinned DualRip's
opposite timer order. This is an identified source difference; changing it
requires a separate origin, gate, loop and full-music review.

A private sequence-first trial renders select/folder-open/folder-close. Each
cue's entire nonzero PCM core is byte-identical to v6, shifted earlier by 160
samples. Folder-open's residual correlation stays 0.216872; folder-close stays
0.998158. Thus changing frame order alone does not repair the opening waveform.
It also cannot establish end-to-end native startup latency from a freely
aligned audio template. No startup trim is introduced.

Private evidence: `frame-order-diagnostic.py`, `frame-order-diagnostic-v6/`,
`frame-order-native-comparison-v6.json`, `frame-order-core-check.json`,
`sound-frame-order.asm.txt`, and the `sequence-frame-*` excerpts.

## Sweep and attack differences are bounded, not corrected

New-note setup `0x1a8a0c..98` builds a float semitone sweep from the explicit
sweep plus the portamento-key difference when enabled. With portamento time
zero it uses the note gate and manual sequence-tick progress. `0x1a87a4..81c`
advances that counter before parsing the next commands; `0x1aab10` clamps it
to the stored length. Nonzero portamento time instead selects a frame-updated
counter, incremented by 5 at `0x14d104..118`.

`0x14d008..44` computes the remaining sweep fraction in float32. The combined
semitone pitch is multiplied by 256 and truncated at `0x14d094..a4`, then
converted through native pitch tables at `0x151c68`. Pinned DualRip truncates
its sweep in 1/64-semitone units and uses a direct power function. However,
folder-open's -10-semitone difference over 10 ticks can already produce whole
semitones, so finer resolution alone is not an established explanation.

The native envelope reset path `0x1aad88..94 → 0x1a69d0` loads -90.4 dB from
`0x3179c4` and stores it in tenths-of-dB units. V6 starts from -72.3 dB. Native
attack update `0x151ac0` is called with increment 5 at `0x14d128..130`; attack
64's table factor is 0.943102002 per unit. Its fivefold product, 0.746093634,
is already close to pinned 191/256 = 0.746093750 per frame. Native float state,
thresholds, hold, decay and release handling still differ.

A private trial changing only the initial attack level to -90.4 dB moves
folder-open's full correlation from 0.216872 to 0.218827, and folder-close
from 0.998158 to 0.997101. This does not repair the opening waveform or justify
a partial envelope patch. No envelope or sweep trial is promoted.

Private evidence: `initial-envelope-diagnostic.py`,
`initial-envelope-diagnostic-v6/`, `initial-envelope-native-comparison-v6.json`,
`runtime-followup-native-values.json`, and the `sweep-*`, `manual-sweep-*`,
`native-pitch-conversion` and `native-envelope-reset` source excerpts.
