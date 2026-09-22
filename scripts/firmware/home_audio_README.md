# Bounded HOME audio correction

`../render_firmware_audio.py` version 3 builds a diagnostic candidate for the exact
owner-supplied EUR HOME archive identified by `home_audio_profile.json`. It rejects
other archive hashes, source records, nonallowlisted sounds, altered sound options,
unexpected banks and stereo source waves. It does not load neighboring `extData`.

The wrapper exports the pinned DualRip commit through `git archive`, verifies the
three source-file hashes, applies `home_audio_dualrip.patch` in a disposable copy,
and adds `home_audio_math.py`. The required `--scratch` argument places this
copy under the caller's SSD artifact root; there is no host temporary-directory
fallback. It never modifies the renderer checkout. The patch
is based on DualRip by Tetra_Sky; its MIT notice is in
`home_audio_DUALRIP_LICENSE.txt`. Firmware code is not executed or distributed.

The profile adds new-note initial-pan capture (ties retain their capture), native
quantized square-root pan, explicit stereo span handling and linear main/aux sends.
The 257-entry LUT is generated mathematically with one native rounding correction
at index 2; its packed float32 SHA-256 is checked against the researched table.
Version 3 also converts envelope/table units as tenths of a decibel (`/200`
for amplitude), with bank-region volume as a separate linear gain. See
`AUDIO_EVIDENCE.md` and `home_audio_GAIN_EVIDENCE.md` for the native evidence.

Two aux buses remain distinct from main and from each other; each has a transparent
unity return. This is a **startup runtime-state assumption** supported by the
inspected initialization. No reverb or delay algorithm is invented. The current
isolated CFG save and preserved snapshot both select stereo mode 1. Zero external
send/pan offsets and unit pan scaling remain explicit assumptions. Built-in Azahar
dumps bypass the host output slider and time stretching; provenance records this.
No compensating gain is applied. The profile rejects surround mode in its span
helper instead of silently treating it as stereo.

`audio.json` preserves the original source/title/cue metadata and adds raw sound
options, pan mode/curve, all 33 validated mono bank-wave references, handled-command
counts, profile/patch/adapter/math hashes and before/after source hashes. Remaining
runtime and synthesizer gaps are included in every pack. Zero unapplied commands
means only that the interpreter has handling for those commands; it does not prove
native arithmetic, timing, resampling, envelopes or PCM equality.

## Reproduce

Use the existing audio Python environment, or Python 3.12+ with the pinned
DualRip dependencies installed. Supply local paths; do not put firmware in Git.

```sh
HOME_AUDIO_SCRATCH=/Volumes/YourSSD/audio-scratch \
HOME_AUDIO_RENDERER=/path/to/pinned/DualRip \
HOME_AUDIO_SOURCE=/path/to/romfs/sound/menu.bcsar \
python scripts/firmware/home_audio_test.py -v

python scripts/render_firmware_audio.py \
  /path/to/romfs/sound/menu.bcsar /path/to/new/candidate \
  --renderer /path/to/pinned/DualRip \
  --scratch /Volumes/YourSSD/audio-scratch \
  --source-record /path/to/extracted/home/source.json
```

The output directory must not already exist. Tests use synthetic sequence/PCM data;
when `HOME_AUDIO_SOURCE` is provided they additionally validate the actual archive.
Both `HOME_AUDIO_RENDERER` and `HOME_AUDIO_SCRATCH` are required for the full
test suite; test fixtures also use the SSD scratch root. Absence is an error, not a
silently skipped correction test. The wrapper always validates the real archive.

## Version 2 baseline, 2026-09-22

The SSD artifact `assets/audio-candidate-v2` contains all 12 allowlisted cues.
All reported unapplied-command maps are empty. Every sample count and loop boundary
matches v1; this is a regression check, not independent native timing verification.
Two independent renders produced byte-identical WAVs and `audio.json` (13 files);
manifest source hashes identify its converter checkpoint; the pinned checkout
remained clean. The v2 pack is preserved when creating v3.
The 11-test suite passes overlap, new/tied-note capture, final pan clamping, LUT,
linear 0/30/127 sends, main routing without effects, span and archive/provenance checks.

Against the provisional native Vorbis recording, v2 music side/mid ratios are
0.559/0.457/0.512/0.459 in the four 12–100 s windows, compared with native
0.552/0.466/0.535/0.466. Native RMS remains 9.05–9.98 dB higher. At that checkpoint,
system mode and runtime/master gain were unverified. The later CFG analysis
confirmed stereo and the native gain trace identified formula mismatches, which
v3 corrects. No measured normalization boost is applied.

Comparison scripts and measurements are private artifacts in
`assets/audio-research`: `compare-v2.py`, `candidate-v2-comparison.json`,
`compare-v2-alignment.py` and `candidate-v2-alignment.json`. Public audio assets
are deliberately not replaced by this converter checkpoint.


## Version 3 PCM comparison, 2026-09-22

`assets/audio-candidate-v3` and `assets/audio-candidate-v3-repro` independently
produced identical 12 WAVs and `audio.json`. All 13 semantic/guard tests pass,
all handled/unapplied reports are consistent, and sample counts/loop boundaries
are unchanged from v2. The pinned renderer and public pack remain unchanged.

The native source is `reference/home-native-lossless.wav`, extracted without
loss from the 115.165-second Azahar 2126.1.2 built-in PCM dump (signed 16-bit,
stereo, 32728 Hz). The neutral-input recording has no video packets, so it
provides audio evidence only. Spectral feature alignment gives onset about
1.75 seconds and speed effectively 1.0; this is not sample-accurate alignment
or a precise drift measurement.

| Candidate window | Native minus v3 RMS | Native side/mid | v3 side/mid |
| --- | ---: | ---: | ---: |
| 12–25 s | +1.609 dB | 0.551 | 0.553 |
| 25–50 s | +1.524 dB | 0.464 | 0.470 |
| 50–75 s | +1.325 dB | 0.533 | 0.514 |
| 75–100 s | +1.489 dB | 0.464 | 0.467 |

No normalization was applied. The former roughly 9–10 dB discrepancy is largely
reduced by the native formula correction, while a 1.3–1.6 dB gap remains.
The capture ends before the first full candidate loop boundary, so it does not
validate that seam. It also does not exercise the short cues or state transitions.
Keep native archive-volume routing, runtime bus/master gains, envelope/resampling
and clipping differences open; do not turn this result into another fixed boost.

Private reproducible evidence: `compare-v3-pcm.py`,
`candidate-v3-pcm-comparison.json`, `candidate-v3-validation.json`,
`native-cfg-sound-mode.json`, and `native-gain-checks.json` under
`assets/audio-research`. The v2 pack and reports remain available as the baseline.
