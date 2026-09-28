# HOME archive-entry volume and native short-cue comparison

Converter v6, 2026-09-22. The source-derived correction makes archive-entry
volume a separate linear gain. It changes no sequence timing, envelope, pitch,
loop selection or public cue allowlist. No measured normalization is applied.
Public audio remains held: strong short-cue matches coexist with unresolved
music level, folder-opening attack/pitch and carried loop-state differences.

## Source identity and call chain

The owner-supplied EUR HOME title is `0004003000009802`, version 24576. Its
`code.bin` SHA-256 is
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`;
`romfs/sound/menu.bcsar` SHA-256 is
`1017eb4a367cb202ac6018fb432b5654222487149d16242fa7d1f205e63f3eb2`.
Addresses below refer to this executable's ARM address space. This was static
inspection; executable bytes and disassembly remain private.

| Native path | Evidence |
| --- | --- |
| Archive reader `0x149168` / `0x149170` | `0x149198` reads the SoundEntry byte at `+8`; `0x14919c` writes it as an integer to SoundInfo `+0x10`. |
| Sequence setup | `0x1a5728` reads SoundInfo into stack `+0x10`; the sequence branch at `0x1a5e08..18` passes that record to `0x1a5184`, which retains it in `r7`. |
| Conversion `0x1a53d4..e8` | Loads SoundInfo `+0x10`, converts signed integer to float32, multiplies by the float32 at `0x1a54c0`, and calls `0x1a66f4`. The constant has bits `0x3c010204`, value `0.007874015718698502`, float32 `1/127`. |
| Setter `0x1a66f4` | Floors the result at zero and stores the float to BasicSound `+0xb0`. It has no upper clamp, squaring or logarithmic conversion. |
| Player update `0x1a6414` | Loads `+0xb0` at `0x1a6428`, multiplies it once with separate runtime factors, and writes the product to work-command `+0x14` at `0x1a65d4`. The command type is 8. |
| Work-command dispatch | Table index 8 from `0x14c2a0` targets `0x14c434`; `0x14c434..38` copies the float at command `+0x14` to sequence-player `+0x14`. |
| Track product `0x208a88..b8` | Multiplies the player float with external track gain, separately from the squared raw track-volume/expression/sequence-main product. |

The bounded implementation is `max(0, f32(raw * f32(1/127)))`. The patch removes
the archive value from the sustain-table sum and multiplies the resulting voice
amplitude by this factor. It preserves the existing treatment of other controls;
this does not claim their complete arithmetic is native-exact. Tests exercise
entry values 0, 30, 48, 96 and 127 with a nonunity track volume, plus the setter's
zero floor and absence of an upper clamp.

Private source excerpts are `archive-volume-reader.asm.txt`,
`archive-volume-sequence-setup.asm.txt`, `archive-volume-setter.asm.txt`,
`archive-volume-player-update.asm.txt` and
`archive-volume-command-handler.asm.txt` under `assets/audio-research`.
`archive-volume-native-check.json` verifies the factor bits and dispatch target.

## Native capture and event mapping

The coordinator recorded `reference/home-sfx-native.wav` through Azahar
2126.1.2's built-in lossless dump, stereo signed 16-bit at 32728 Hz, 115.15 s.
Its SHA-256 is
`863a4f0916fb0afdf3110d382b3a95ece8c24a6e76b0b978d6dc6444dd94dd99`.
The MKV has no video packets. The isolated original-3DS EUR English white-theme
stereo profile was restored from the preserved snapshot. Before/after emulator
configuration differs only in UI geometry/state; audio settings are unchanged.
See [gain evidence](home_audio_GAIN_EVIDENCE.md) for the saved native stereo
setting and why built-in recording bypasses the host slider and time stretching.

The input movie requests B at nominal 12 s, six RIGHT presses at 14–19 s,
footer touches at 24 and 28 s, and B at 32 s. A screenshot at frame 2164 shows
folder 1 selected in a one-row menu. The individual opening/closing transitions
were not visually sampled. These are input intents, not proof of each UI result.
Dump start and movie start are separate; audio events must be aligned by waveform.

The independent no-input baseline is `reference/home-native-lossless-long.wav`,
SHA-256 `35f7f9141df9d48810a86ecba54b72fbc7be81661ad52ff3fbcbf07a81080782`.
Stereo integer-sample correlation finds exact music matches with baseline index
equal to SFX index **+480 samples** before the first RIGHT and **-46080 samples**
in stable later passages. Four-second anchors at 40, 65 and 90 s match with
correlation 1, unity gain and zero difference RMS. The transition changes the
music cursor by 46560 samples (1.422635 s); one global subtraction is invalid.

Diagnostic residuals subtract the aligned native music at unity in four bounded
windows: 11.05–11.50 s using +480, then 20.9–24, 24.9–28 and 28.9–32 s using
-46080. Neighboring music-only chunks match exactly. These are subtraction
residuals, not independently captured isolated cues; overlapping effects and
mixer rounding can remain.

Six RIGHT waveform cores occur at 11.234600, 12.236800, 13.239000, 14.241200,
15.243400 and 16.245600 s. Their spacing is 1.002200 s per nominal movie second.
The first template-aligned sequence origin is 11.229589 s. This maps sound events;
it does not establish input-dispatch latency. No distinct cancel cue is found
near the first nominal B: that region matches the baseline exactly.

## Before and after entry-volume correction

The same residual method and integer-sample template search are used for v5 and
v6. RMS differences are native residual minus candidate. Least-squares gain is
reported only as a diagnostic and is never applied to delivered audio.

| Event / template (entry volume) | Template origin, s | v5 RMS difference | v6 RMS difference | v5 / v6 fitted gain | v6 correlation |
| --- | ---: | ---: | ---: | ---: | ---: |
| First RIGHT / ICON_SELECT (48) | 11.229589 | +8.4205 dB | -0.0314 dB | 2.63365 / 0.99532 | 0.998925 |
| B-close intent / HOME_SELECT (30) | 29.230078 | +12.5461 dB | -0.0313 dB | 4.23480 / 0.99533 | 0.998923 |
| B-close intent / folder-close (48) | 29.327884 | +8.5706 dB | +0.0902 dB | 2.67752 / 1.00858 | 0.998158 |
| Footer-create intent / COMMON_BUTTON (86) | 21.446773 | +4.7615 dB | +1.3474 dB | 1.69829 / 1.14631 | 0.981595 |
| Footer-open intent / SUB_MENU_BTN (64) | 25.436446 | +5.6546 dB | -0.2940 dB | 1.72086 / 0.86761 | 0.897479 |

The first two templates use the same CSEQ notes with different entry volumes.
The B-close event is approximately 30/48 of the RIGHT event, consistent with
HOME_SELECT. A reused sequence with a runtime gain could produce the same
waveform, so this is not an exclusive cue identity. The folder-close match is
strong audio evidence. COMMON_BUTTON-family matching supports a confirmation
sound without independently establishing the folder UI transition.

Additional comparison-only archive entries (COMMON_BUTTON, COMMON_OK, DIALOG,
POPUP_ZONE, SUB_MENU_BTN, HOME_TOUCH and HOME_SELECT) were rendered privately
with the same inspected mono banks and startup options. They do not expand the
public allowlist. The identical early footer residuals near 21.2078 and 25.2019 s
remain unidentified: their best grab-template correlation is only 0.635.

Folder opening remains a poor full-waveform match (correlation 0.21687).
Its candidate tail from 0.21–0.28 s matches at an implied origin of 25.536853 s
with correlation 0.991753 and gain 0.969944; the 0.28–0.38 s tail gives 0.984734
and 0.958938 at almost the same origin. Early segments correlate poorly. The
archive sequence includes wait 6, attack 64, decay 110, sustain 0, release 121,
portamento key 64 and note 74/velocity 48/length 10. This bounds further
attack/pitch investigation; it does not justify fitting a replacement sweep.
The full-match RMS value is not a meaningful fidelity metric at that correlation.

Private scripts/reports: `compare-sfx-native.py`, `map-sfx-music.py`,
`sfx-music-map.json`, `render-sfx-comparison-cues{,-v6}.py`,
`compare-sfx-residual{,-v6}.py`, `sfx-native-residual-comparison{,-v6}.json`,
and `sfx-event-detail{,-v6}.py` / `sfx-folder-open-detail{,-v6}.json`.
Capture provenance remains in `reference/home-sfx-native-metadata.json`,
`home-sfx-native-probe.json`, `home-sfx-plan.json`, `home-sfx-manifest.json`,
`home-sfx.ctm` and before/after configuration snapshots.

## Music and reproducibility limits

V6 raises the full main music RMS by **2.470456 dB** relative to v5 (resume
+2.471118 dB). Approximate 48-band spectral alignment against the long native
recording selects speed 1.0 and onset about 1.77 s. The native-minus-v6 RMS
differences are -1.721, -1.520, -1.802 and -1.667 dB in 12–25, 25–50, 50–75 and
75–100 s windows: the candidate is now louder. Later 125–150 and 150–180 s
windows differ by -1.690 and -1.528 dB. Runtime gains and synthesis differences
remain open; no compensating attenuation is introduced.

The first-cycle feature score is 0.94036. This log-power metric changes with
gain and is not a gain-independent waveform-fidelity score. Exact native
self-correlation still finds a 3515200-sample period in all three tested windows.
The baked seam remains defective: its step is 0.0138855 left / 0.0113220 right,
and the seam-containing 115–122 s window differs by -2.807 dB. Correct period
does not establish continuous voice-state equivalence.

Two fresh packs, `assets/audio-candidate-v6` and `assets/audio-candidate-v6-repro`,
are byte-identical across 12 WAVs and `audio.json`. All sample counts and loop
positions match v5; main remains `[314720,3829920)`, resume `[0,3515200)`.
Every cue has zero samples at the int16 clipping limits, and provenance matches
the converter sources. The pinned DualRip checkout stays clean. V2–v5 and the
public assets are preserved. `candidate-v6-validation.json` and
`candidate-v6-long-comparison.json` record full measurements, with
`validate-v6.py` and `compare-v6-long.py` alongside them.
