# Native HOME mode and gain follow-up

Static source/save inspection, 2026-09-22. Native addresses and source hashes are
those in `AUDIO_EVIDENCE.md`. No native code was executed and no UI or save was
changed. This evidence identifies bounded converter corrections, not PCM parity.

## Actual isolated system sound mode

The exact [Azahar 2126.1.2 tag](https://github.com/azahar-emu/azahar/tree/2126.1.2)
resolves to `9e6f523a57fac9564ac0bf8286db3c3702d301ec`.
Its [CFG definitions](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/core/hle/service/cfg/cfg.h)
identify block `0x00070001` and enum values mono 0, stereo 1, surround 2.
The [save parser/getter](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/core/hle/service/cfg/cfg.cpp)
uses a 4-byte header followed by 12-byte entries; values of size at most four
bytes are inline in the entry's `offset_or_data` field. The sound getter reads
one byte from that block.

Both the current isolated `reference/user/nand/.../sysdata/00010017/00000000/config`
and its saved member in `reference/pre-folder-profile.tgz` have SHA-256
`e9caff9ef9b4394499ae857da458c7fb7d3af472be8521357d4bbb56977b0f9e`.
They contain 28 entries, data offset `0x455c`. Entry 5 at `0x40` has block ID
`0x70001`, size 1, access flags `0xe`, and inline byte at `0x44` equal to **1:
stereo**. This is the saved 3DS setting, independently of emulator `output_type`.
It is not a per-frame DSP memory capture or proof that software cannot override it.
Full paths, hashes and fields are in private `native-cfg-sound-mode.json`.

## Built-in recording bypasses host slider/stretching

In the same version's [DSP interface](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/audio_core/dsp_interface.cpp),
`OutputFrame` and `OutputSample` send frames directly to the video dumper.
Time stretching and the cubic host volume slider are applied later in
`OutputCallback` to the host output buffer. Thus built-in dumps bypass these
host-output operations; native DSP/player gain still affects their samples.
This removes host-slider scaling as an explanation for a built-in dump's gap.
The [stereo mixer](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/audio_core/hle/mixers.cpp)
adds corresponding front/rear channels at each bus's configured gain, with
integer clipping. It does not apply a general fixed 9 dB recording boost.

## Table-unit conversion

Native envelope update `0x151b64..ba4` reads the signed 16-bit sustain table at
`0x3179c8`. Entries 1..127 equal pinned DualRip's `SUST_LUT` exactly. Entry 0
is native -723 versus pinned -32768, a separate floor/silence distinction.
Native getter `0x153320..354` multiplies the stored envelope value by 0.1.
`0x14d144..154` passes it to `0x151d94`, which clamps dB to [-90.4,6], truncates
`dB*10`, adds 904 and indexes gain table `0x30e0e4`. Examples are -10 dB →
0.316227764, -1 dB → 0.891250908, 0 dB → 1, +6 dB → 1.99526227.
These are ordinary amplitude decibels. A table-unit value U therefore converts
approximately as `10 ** (U / 200)`, not pinned `10 ** (U / 160)`.

| Raw sustain | Table units | Native dB | Pinned dB | Excess pinned attenuation |
| --- | ---: | ---: | ---: | ---: |
| 30 | -251 | -25.1 | -31.375 | 6.275 dB |
| 64 | -119 | -11.9 | -14.875 | 2.975 dB |
| 96 | -49 | -4.9 | -6.125 | 1.225 dB |
| 127 | 0 | 0 | 0 | 0 |

The same pinned conversion aggregates velocity, volume/expression and source
volume contributions. Its extra attenuation varies with note/track/envelope
state; it is not a fixed master gain to normalize away. Correcting the denominator
alone does not reproduce the full native envelope state machine or table rounding.

## Region gain versus velocity and track controls

New-note allocation `0x2e54c0..dc` multiplies velocity by itself, then by the
bank-region volume byte, then by float32 `1/127^3`. Region-byte provenance is
`0x2e4884`: fallback `0x2e4988..990` calls `0x2e6670`, which reads optional
region flag 1 (default 127), and writes NoteInfo `+0x12` (allocation stack `+0x92`).
Thus the new-note factor is `(velocity/127)^2 * (regionVolume/127)`.
Pinned DualRip instead sends both values through its sustain curve. Region
volume must be kept as a **linear multiplier**, independent of envelope dB.
Native live track update `0x208a74..ab8` separately squares the product of
track-volume, expression and sequence-main raw values divided by `127^3`.

A two-loop diagnostic of every allowlisted cue found **regionVolume 127 for all
recorded note-ons** (`allowlist-volume-settings.json`). The linear-region fix
therefore has no effect on this particular cue pack, though synthetic tests must
cover nonunity regions. Music uses track-volume values as low as 34; the exponent
error can materially affect its level. Event traces are for field values, not
sample-accurate timing acceptance.

The pinned mix/render/WAV paths do not contain a further fixed master attenuation:
voice samples are multiplied by their gains, summed, clamped to int16, and written
without normalization. V6 subsequently traces archive-entry volume through the
reader, player and track path and corrects it to a separate linear factor; see
[entry-volume evidence](home_audio_ENTRY_VOLUME_EVIDENCE.md). Runtime player/master
values, envelope evolution/floors, interpolation and DSP bus clipping remain
separate checks. Do not replace those checks with a measured +9 dB multiplier.

Private excerpts and numeric checks are in `assets/audio-research/gain-*.asm.txt`
and `native-gain-checks.json`; no disassembly is included in the repository.
