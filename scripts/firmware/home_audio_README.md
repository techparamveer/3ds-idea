# Bounded HOME audio correction

`../render_firmware_audio.py` version 2 builds a diagnostic candidate for the exact
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
See `AUDIO_EVIDENCE.md` for native addresses and the limits of the evidence.

Two aux buses remain distinct from main and from each other; each has a transparent
unity return. This is a **startup runtime-state assumption** supported by the
inspected initialization. No reverb or delay algorithm is invented. Stereo mode 1,
zero external send/pan offsets and unit pan scaling are explicit assumptions.
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

## Candidate check, 2026-09-22

The SSD artifact `assets/audio-candidate-v2` contains all 12 allowlisted cues.
All reported unapplied-command maps are empty. Every sample count and loop boundary
matches v1; this is a regression check, not independent native timing verification.
Two independent renders produced byte-identical WAVs and `audio.json` (13 files);
manifest source hashes match the current scripts and the pinned checkout is clean.
The 11-test suite passes overlap, new/tied-note capture, final pan clamping, LUT,
linear 0/30/127 sends, main routing without effects, span and archive/provenance checks.

Against the provisional native Vorbis recording, v2 music side/mid ratios are
0.559/0.457/0.512/0.459 in the four 12–100 s windows, compared with native
0.552/0.466/0.535/0.466. Native RMS remains 9.05–9.98 dB higher. The capture's
system mode and runtime/master gain are unverified; this does not authorize a
guessed level boost or establish audible parity. The controlled native recording
and runtime gain checks remain acceptance dependencies.

Comparison scripts and measurements are private artifacts in
`assets/audio-research`: `compare-v2.py`, `candidate-v2-comparison.json`,
`compare-v2-alignment.py` and `candidate-v2-alignment.json`. Public audio assets
are deliberately not replaced by this converter checkpoint.
