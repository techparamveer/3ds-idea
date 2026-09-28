# HOME sequence audio: native evidence

Read-only investigation, 2026-09-22. This identifies corrections to the current
12-cue audio candidate; it does not establish PCM parity or listening acceptance.
The pinned renderer, root wrapper and generated audio pack were not changed.

## Sources and scope

- Owner's EUR HOME Menu `0004003000009802`, v24576, firmware `10.7.0-32E`.
- Uncompressed ExeFS code SHA-256:
  `243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
  Native addresses below use base `0x100000`. Code was read statically, not executed.
- `romfs/sound/menu.bcsar` SHA-256:
  `1017eb4a367cb202ac6018fb432b5654222487149d16242fa7d1f205e63f3eb2`.
- [DualRip](https://github.com/TetraSsky/DualRip/tree/c00e809ad4fcc44056a5b3c11d30f6a698b92be0),
  pinned revision `c00e809ad4fcc44056a5b3c11d30f6a698b92be0`.
- [Citric Composer sound metadata](https://github.com/Gota7/Citric-Composer/blob/73439816c9f2cd6f43ab9aa46f89247be8e32942/Citric%20Composer/Citric%20Composer/High%20Level/Sound%20Archive/SoundInfo.cs)
  supplies field/enum names, checked against actual archive records and native mix code.
- [Azahar DSP configuration](https://github.com/azahar-emu/azahar/blob/b8c29a64c306bac3866a5ed293ebee94ef6dcb00/src/audio_core/hle/shared_memory.h)
  and [mixer](https://github.com/azahar-emu/azahar/blob/b8c29a64c306bac3866a5ed293ebee94ef6dcb00/src/audio_core/hle/mixers.cpp)
  distinguish host aux routing from DSP effects. These implementations are useful
  evidence, not a claim that HLE matches hardware sample for sample.

Private traces, native excerpts and downloaded research sources are under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/assets/audio-research`.
No firmware code or disassembly is included in this repository/public delivery.

## Actual selected commands

`allowlist-command-values.json` records arguments consumed by the pinned sequence
interpreter, with two loop passes, while replacing PCM generation with a simple
voice-position advance. Event arguments/order and unhandled-command counts are
useful; its approximate sample positions are **not** a timing acceptance oracle.

| Cue | `init_pan` count | `span` | `fxsend_a` |
| --- | ---: | --- | --- |
| music | 0 | five commands, all 0 | three commands, all 30 |
| music-resume | 0 | six commands, all 0 | four commands, all 30 |
| open | 9 | none | none |
| back | 8 | none | none |
| home | 3 | none | none |
| power | 10 | two commands, both 64 | none |
| select, touch, grab, drop, folder-open, folder-close | 0 | none | none |

`init_pan` ranges from 0 to 127; it is not merely repeated center values.
For example, open track 0 changes from 64 to 127, while track 1 changes from
64 to 0. The 33 wave resources referenced by the three selected banks are all
mono (`allowlist-bank-waves.json`); the inventory is a bank-resource superset,
not an expansion of the cue allowlist.

## Initial pan: captured by new notes

The parser stores `init_pan - 64` as a signed byte at track `+0x87`
(`0x2e58e4`). Live `pan` is separate, at the signed ramp beginning `+0x72`.
The new-note path at `0x1a8934` copies `+0x87` into note-on info `+0x10`.
Allocation at `0x2e5524..554c` combines it with bank-region pan:

```text
capturedNotePan = (region.pan - 64 + initialPanOffset) / 63
```

It stores that float at channel `+0x104`. Update at `0x14d0b8..cc` adds the
live track/user pan (`+0xd4`) separately. The final pan routine clamps the sum.
The tied/reused-note path skips the new-note capture.

Required correction: retain initial pan state (neutral raw 64), snapshot it
only when allocating a new note, and add it to region pan before final live
pan/clamping. Changing `init_pan` must not repan already sounding voices or
recapture the initial pan of tied voices. Do not clamp the captured region/initial
sum early: a subsequent live pan can bring it back into range.

The pinned interpreter currently consumes this command without applying it;
its note-on path uses only `region.pan - 64`.

## Pan curve: an additional gap in all 12 cues

Every selected sound record has flag-1 value zero: pan mode 0 (`Dual`), curve 0
(`SqrtNegative3`). Pinned DualRip drops these options and uses linear attenuation
with unity gain in both channels at center.

Native mix routine `0x155518..59c` selects curve 0 without center normalization.
In stereo mode, lookup `0x21779c` uses table pointer `0x33c3c8`, table 0 at
`0x30eff8`. Its 257 entries match `sqrt(1 - i/256)` to float precision
(maximum absolute difference from that formula: `2.9948642010779736e-8`).
For the mono source waves used here:

```text
p = clamp(capturedNotePan + livePan, -1, 1)
leftIndex  = floor(128 * (1 + p) + 0.5)
rightIndex = floor(128 * (1 - p) + 0.5)
leftGain   = table[leftIndex]
rightGain  = table[rightIndex]
```

At center the native gain is `0.707106769` per channel, versus DualRip's 1.
Use the native quantized lookup behavior for close comparison; a continuous
square-root curve is close but is not identical. Preserve archive pan metadata
instead of hardcoding a new law for unrelated archives. Native stereo-source
Dual mode also offsets the source channels' pans; that path is unnecessary for
this verified mono resource set, and DualRip's stereo-to-mono fallback should
not be generalized as faithful support.

## Surround pan: no effect in native stereo mode

The parser writes raw `span` to the ramp at track `+0x78` (`0x2e58ec`). Track
update scales it by `1/63`, clamps to `[0,2]`, adds external/player offsets,
and passes it through channel `+0xd8` to voice `+0x34`.

The final native mix reads output mode from SoundSystem `0x3824d8 + 1`.
Mode 1 (stereo) goes through `0x1556e4..570c`, using fixed front/rear spans
0 and 2; it does **not** read the voice's span. Mode 2 (surround) at
`0x155710..5738` does read it. Mono also uses the fixed front/rear pair.

Therefore `span`, including power's nonzero 64, can be classified as consumed
with no stereo-output effect **when the render target is explicitly mode 1**.
Do not translate raw 64 to a neutral surround value; neutral/front is raw 0.
Do not infer the native mode from a two-channel capture: surround ultimately
also reaches two physical output channels. Record and match the reference's
system sound mode. The native constructor defaults to stereo but initialization
reads the current underlying sound mode, so the default alone is insufficient.

## Aux sends and effect configuration

The parser stores raw `fxsend_a` at track `+0x93`, B at `+0x94`, main at `+0x92`.
Update at `0x208c44..c70` scales A/B values by `1/127` and adds player offsets.
Voice setters floor negative sends at zero; final mix `0x155478..54fc` clamps
them to `[0,1]`. Main ultimately uses the same linear convention with its
neutral value 127. These are bus multipliers, not sustain-envelope parameters.

At zero player offset, send 30 is `0.2362204724`. DualRip's `cnv_sust` conversion
gives `0.0269929282`, and the current wrapper applies neither because it does
not configure effects. Command state and main/aux gains must be maintained
even when no delay/reverb is selected.

The archive metadata inspected contains pan/volume/player/3D/front-bypass
options, not a selected delay or reverb algorithm with coefficients. A send
command does not itself establish an effect type. Native setup is more useful:

- HOME init `0x10c2b0` calls `0x22ac40`, which calls `0x12cf7c`. That routine
  obtains the effect cache at `0x37c248` and falls through into `0x12cfc0`.
  The loop explicitly sets **delay and reverb enable to zero on both buses**
  through DSP setters `0x138430` and `0x138534`.
- The other direct calls to those setters are in `0x12d12c`, restoring that
  cached state after sleep. Static references inspected did not identify an
  application path installing nonzero effect parameters. This is static evidence,
  not an exhaustive proof that no indirect runtime override can occur.
- Master defaults `0x12d24c..288` set both aux return gains to 1. The callback
  fields start null. SoundSystem init also registers null host callbacks.
- Host effect append exists at `0x151f08`, reached by generic queued command
  48 in `0x14c89c`. It attaches callback `0x154e30` on first use. No producer
  of that command was found in the inspected native paths.

Crucially, disabled **host aux routing** does not mean silent aux output.
Azahar's `AuxSend` passes an unhooked bus directly to its intermediate mixer;
the final mix still includes its return gain. Delay/reverb processing is separate.
Thus the supported startup candidate is a **transparent aux return**, not a
guessed delay/reverb. At main=1, return A=1 and zero offsets, sending 30 would
multiply the affected music tracks by `1 + 30/127 = 1.2362204724` (+1.8419 dB)
before downstream clipping/gain. This numeric consequence is conditional on
those runtime settings, not a measured loudness result for the whole music.

Confirm later player offsets, return gain, callback state and DSP enable fields
against a runtime capture before accepting that candidate. Do not mark
`fxsend_a` safely ignored merely because an effect parameter file is absent.

## Implementation and acceptance checklist

1. Preserve pan mode/curve metadata and use the verified native curve for these
   cues. Add initial-pan state/capture and keep tied voices unchanged.
2. Parse/store surround pan while explicitly targeting native stereo mode;
   report that mode-specific handling distinctly from an unknown command.
3. Apply linear main/aux sends independently of effect selection. Model bus
   routing/return gain separately from delay/reverb; use the supported disabled
   DSP-effect startup state for a diagnostic candidate, with its assumptions
   visible in provenance.
4. Focused semantic checks should cover overlapping notes, ties, a captured
   pan outside `[-1,1]` restored by live pan, LUT center/endpoints, send values
   0/30/127, main-send behavior without effects, and span in stereo/surround.
5. Compare cue timing, level, stereo image and tails to captured native playback.
   Preserve the reference output mode and DSP backend/version. Lossy captures
   can reveal large discrepancies but cannot prove PCM equality. No source-level
   test here validates interpolation, envelope timing, clipping or the entire
   synthesizer; those remain separate possible differences.

This checkpoint changes documentation only. No application rebuild is needed.
