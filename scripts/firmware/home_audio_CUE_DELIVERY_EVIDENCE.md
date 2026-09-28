# Cue-only v8 delivery

2026-09-23. Wrapper version8 now defaults to the ten existing short cues.
Voice/DSP profile remains `eur-home-24576-stereo-startup-v8`: this changes
pack selection and provenance, not synthesis. All ten WAVs are byte-identical
to the preserved `assets/audio-candidate-v8` outputs.

`render_firmware_audio.py` defaults to `--pack cues` in both CLI and API.
`--only` selects a subset; either music alias is rejected before source reads
or output creation. Explicit `--pack diagnostic` preserves historical music
research. Cue mode also rejects loop-bearing renders. Existing output paths
remain rejected to prevent stale music files from surviving a new cue export.
`audio.json` retains schema1, adds `pack`, and records each `archiveId` beside
its original index/name. The profile still validates the complete pinned
archive, sound options and 33 mono bank-wave references.

## Reproduction and identity

Private outputs are under the SSD firmware root
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/`:

- Candidate: `assets/audio-cues-v8/`.
- Independent reproduction: `assets/audio-cues-v8-repro/`.
- Preserved baseline: `assets/audio-candidate-v8/`.
- Checker/report: `assets/audio-research/validate-cues-v8.py` and
  `assets/audio-research/cues-v8-validation.json`.

The two new directories contain exactly ten WAVs and `audio.json`, all eleven
files byte-identical. WAVs total **1,234,360 bytes**; the complete pack is
**1,255,395 bytes**. Neither directory contains a music WAV or music cue entry.
All source/title/profile/patch/helper/bank metadata matches the preserved v8
pack. Per-cue metadata is identical except for the added archive ID. Original
volume, sample rate, sample origin, tails and command handling are unchanged.

| Item | SHA-256 |
| --- | --- |
| Both new `audio.json` files | `89d4f295c18f6a803010572ba08df8cf614440425b00a51f1cfabc9ece49a5a0` |
| Converter | `60532eadbf7212609d91f188fd11841910a46d0fce7dc8623b71401c58fbecbd` |
| Preserved v8 `audio.json` | `6b448b0a0669f6e06419a781bd9d58280c8adf0a5f1b8f3fe81aa84851f53858` |
| Private checker | `71425c84980e0d15298bcaae499485492f05697e5f46d5cc165a2885924ae4b6` |
| Private validation report | `ff8034811923f96a1545c592c0a49b0a8085f8fa9bfee118d311101287cac3d8` |

The report contains every WAV hash, metadata comparison, active sample range
and clipping count. Source remains EUR HOME `0004003000009802`, version24576,
archive SHA-256
`1017eb4a367cb202ac6018fb432b5654222487149d16242fa7d1f205e63f3eb2`.
The pinned DualRip checkout remains clean at
`c00e809ad4fcc44056a5b3c11d30f6a698b92be0`. No firmware binaries or PCM are
added to Git.

Reproduce from this worktree using the existing SSD audio environment:

```sh
audio_root=/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E
"$audio_root/audio/venv/bin/python" scripts/render_firmware_audio.py \
  "$audio_root/assets/extracted/home/romfs/sound/menu.bcsar" \
  "$audio_root/assets/audio-cues-v8-new" \
  --renderer "$audio_root/audio/research/DualRip" \
  --scratch "$audio_root/assets/audio-scratch" \
  --source-record "$audio_root/assets/extracted/home/source.json"
```

## Exact archive entries and retained evidence

All files are stereo signed16 PCM at32728 Hz. None has loop metadata,
unapplied commands or samples at either int16 clipping limit.

| Alias | Original archive entry | ID | Samples |
| --- | --- | --- | ---: |
| select | `SE_CTR_HOME_ICON_SELECT` | `0x0100002c` | 960 |
| open | `SE_CTR_HOME_START` | `0x0100001e` | 80320 |
| back | `SE_CTR_COMMON_CANCEL` | `0x0100000c` | 67840 |
| home | `SE_CTR_HOME_HOMEBUTTON` | `0x0100001b` | 107840 |
| power | `SE_CTR_HOME_POPUP_POWER` | `0x01000037` | 19040 |
| touch | `SE_CTR_HOME_ICON_TOUCH` | `0x0100002b` | 1600 |
| grab | `SE_CTR_HOME_ICON_GRAB` | `0x0100002f` | 2720 |
| drop | `SE_CTR_HOME_ICON_EXCHANGE` | `0x01000030` | 3360 |
| folder-open | `SE_CTR_HOME_OPEN_FOLDER` | `0x01000034` | 17600 |
| folder-close | `SE_CTR_HOME_CLOSE_FOLDER` | `0x01000035` | 7200 |

Exact byte equality preserves the [v8 capture comparisons](home_audio_DSP_EVIDENCE.md):
select correlation0.999999991, whole folder-open0.999871196 and
folder-close0.999999941. The weak folder-opening tail still has the recorded
residual difference. No waveform fit, crop, gain adjustment or new recording
was performed for this packaging change.

Aliases identify assets; they do not prove every runtime action binding.
The [input-route evidence](home_audio_OPEN_ROUTE_EVIDENCE.md) retains its
footer-confirmation and timing limits. The [HOME-return caller evidence](home_audio_HOME_RETURN_EVIDENCE.md)
maps the HOME-button sound in its bounded return branch. These findings do
not verify all touch/grab/drop/start/power transitions, browser input latency,
runtime gain overrides or physical-hardware parity. In particular, `open`
names `HOME_START`; folder opening has its separate archive entry.

## Checks and integration boundary

All **44 converter tests pass**, including four new tests for default cue
selection, explicit music diagnostics, API/CLI rejection of music in cue mode
and actual select-file/provenance emission. The independent SSD checker passes
all eleven reproduction hashes, ten preserved WAV/metadata comparisons,
profile provenance, WAV structure and zero clipping. The full historical v8
pack remains intact. No application rebuild is needed for exporter-only work.

Public promotion and actual input verification belong to the integration task.
This change writes no public audio, runtime, persistent-engine, stream, browser
or emulator files. Music resource export remains separate from cue WAV delivery.
