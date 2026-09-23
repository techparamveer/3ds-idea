# Native invalid-movement and toolbar cues

2026-09-23. The cue pack now includes the two distinct sounds required by the
source-proven HOME direction/focus dispatcher. They use original sequence,
bank and wave data; no replacement tone, volume fit or sample trimming is added.

| Alias | Original entry | Archive ID | Samples at32728 Hz | Source volume |
| --- | --- | --- | ---: | ---: |
| scroll-invalid | SE_CTR_HOME_ICON_SCROLL_INVALID | 0x0100002e | 480 | 96 |
| toolbar-select | SE_CTR_HOME_SELECT | 0x0100003f | 960 | 30 |

Both use sequence file5, bank2 and wave archive4. Their sequence offsets are508
and758 respectively. Grid selection remains `SE_CTR_HOME_ICON_SELECT`, ID2c.
The dispatcher distinguishes invalid press from silent invalid repeat, toolbar
selection, and grid return; see `scripts/firmware/HOME_DIRECTION_MASK_EVIDENCE.md`.

Exporter version9 expands the default short-cue pack from10 to12. The synthesis
profile remains `eur-home-24576-stereo-startup-v8`; only its archive sound-option
allowlist and resulting profile hash change. Voice, DSP, clock, renderer patch,
bank-wave validation and all original cue metadata remain unchanged. The source
archive SHA is
`1017eb4a367cb202ac6018fb432b5654222487149d16242fa7d1f205e63f3eb2`.
The pinned DualRip revision is `c00e809ad4fcc44056a5b3c11d30f6a698b92be0`.

## Reproduction and delivery

Artifacts are under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/audio/navigation-cues/`:
`candidate/`, independent `repro/`, preserved `public-before/`,
`source-options.json`, `validate.py` and `validation.json`.
Run the normal `scripts/render_firmware_audio.py` command with the original
archive, source record, pinned renderer and a fresh SSD output/scratch path.
The private checker accepts explicit `--candidate`, `--repro`, `--baseline`
and `--report` paths.

All13 output files are byte-identical between the independent exports.
All ten preceding public WAVs and their cue metadata are unchanged. Every cue
is nonempty stereo signed16 PCM, with no loop, unapplied command or int16
clipping. WAVs total1,240,208 bytes; the complete pack is1,263,078 bytes.
Only the manifest and two new WAVs are promoted to public delivery.

| Artifact | SHA-256 |
| --- | --- |
| scroll-invalid.wav | 13f0cfdb4668344e749551da58aebde97d48ba72c4f620d437d06353e60c2a94 |
| toolbar-select.wav | 9865661874de768ec6f0a07ac26f3cf66b8f250d98d6936fcb972be8ea6671fa |
| audio.json | 8c87e9fafefd87b97cf6a3cb0cc0fa3cc932a2118f3f57281fd69285222479e4 |
| Converter | 9d7a43e9f8500073b345a0d9110479ad908910179a761b5ea8c7e306663696c9 |
| Profile | 22da63262ee9b68cae7fa0541a4a6334101c48fc6e76901eb44bea531b4d65fd |
| Private checker | 7b009f127ae2b2ec583ff237cca87e715b209c565767bc8896c6e20e636b0f26 |
| Validation report | 1f6e061b6c8fc6186ff4a80fc32cb7b1763ba741da56b33405d23b35e48780da |

The real-archive converter suite passes44 tests, including all three navigation
cue identities, sample counts and exact PCM hashes. The initial run exposed an
old12-entry archive metadata assertion; the corrected14-entry assertion includes
the two diagnostic music entries. Nine audio-owner tests and typecheck pass.

A fresh real browser session fetched the manifest and12 WAVs with HTTP200.
A keyboard selection unlocked audio, decoded all12 effects and played `select`
while persistent music reached `playing`, with no reported failure. Evidence:
`browser-decode.json` in the artifact directory. The `Sound` type and scene
allowlist accept the new aliases; input routing is still awaiting the native
consumer integration. This check does not claim the new cues were triggered
by native navigation or compared audibly with Azahar. Their waveform capture,
runtime gain overrides and input-to-audible timing remain acceptance work.
