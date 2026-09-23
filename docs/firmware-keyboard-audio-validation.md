# Keyboard source audio and bounded cue evidence

2026-09-23. This isolated exporter produces original keyboard resource PCM and
records native cue identities. It does not use the HOME synthesis profile or
change public delivery, runtime transport, application controls or scene audio.

## Source identity

Software Keyboard title `000400300000d002`, version **4096**, content index 0,
ID `0000000b`:

- CIA SHA-256: `4f357189f74bea4521745b8d12137fc601806722e3c11b9dd3ed8a5600cf2b17`.
- Selected content: `c6d6bc4c7f45b6bbaaa2be5752fc209469cd4064d7f63c21ca60485aaa733d3c`.
- Executable: `a0b78005b0a99116ca703bc9b7625ce1b0f2d4cc45f66fc6fb9ab8a34244d4f0`.
- Stored `swkbd_bcwav_LZ.bin`: `2172d8e08d58840b6e1450a6e5a3ee4e8159b4f2f908267ff3d92ecb3dc680a4`.
- Decompressed DARC: `a2745168483ff69349b3f84b6839dcb5485f8ec8acd30d579b7bed4cc0417e9d`.

The exporter pins archive and executable hashes and requires the declared
title/version. Its manifest retains every full original member name, SHA-256,
size, source path and native resource index, plus PCM/WAV hashes and converter
helper hashes. The sequence member is inventoried but is not synthesized.

## Resource inventory

These are native resource-table indices, **not cue IDs**. All 15 waves are mono;
all except resource 12 are IMA ADPCM. The table abbreviates each member at the
first dot; the private manifest preserves complete names.

| Resource | Member prefix | Header Hz | Samples | Loop [start, end) |
| --- | --- | ---: | ---: | --- |
| 0 | `key_backspace` | 32728 | 2485 | off |
| 1 | `key_cursor` | 32728 | 101 | off |
| 2 | `key_conversion` | 32728 | 1734 | off |
| 3 | `key_enter` | 24000 | 1655 | off |
| 4 | `key_error` | 32728 | 230 | off |
| 5 | `key_input` | 32728 | 2256 | off |
| 6 | `key_input_release` | 32728 | 251 | off |
| 7 | `key_off` | 32728 | 1455 | off |
| 8 | `key_on` | 32728 | 1095 | off |
| 9 | `toggle_release` | 16364 | 1056 | off |
| 10 | `touch` | 32728 | 486 | off |
| 11 | `touchoff` | 32728 | 247 | off |
| 12 | `button_supershort` (PCM16LE) | 12000 | 7023 | off |
| 13 | `tnr_Proton` | 16000 | 5106 | [2, 5106) |
| 14 | `kalimba_loop` | **32020** | 5210 | [3606, 5210) |
| 15 | `common_back.sseq` | — | — | unsupported |

The kalimba filename says `32000`; decoding uses **32020 from the header**.
Exported WAVs contain exactly one source pass, at the original rate and signed
16-bit amplitude. Loop boundaries and initial/loop IMA state remain metadata;
the exporter adds no gain, fades, pitch changes, repeats or resampling.

## Independent decoder comparison

The primary cross-check is vgmstream revision
`764c84c5048932054356f2ea67a71ea7673abc83` (`r2117`), built privately with optional
external codecs disabled. Its [CWAV reader](https://github.com/vgmstream/vgmstream/blob/764c84c5048932054356f2ea67a71ea7673abc83/src/meta/bfwav.c)
and [IMA decoder](https://github.com/vgmstream/vgmstream/blob/764c84c5048932054356f2ea67a71ea7673abc83/src/coding/ima_decoder.c)
establish channel references, codec state and low-nibble-first IMA expansion.
The independent CLI decodes with `-i` (one pass) and reports metadata through
`-m -I`. All **30,390 samples** across 15 waves match exactly. Channels, rate,
sample count and enabled loop boundaries also match independently.

The new parser intentionally accepts only the observed little-endian CWAV
version `0x02010000`, mono PCM16/IMA profile. Other versions, channels/codecs,
invalid section references, truncated samples and invalid IMA indices fail.
This is not a general BCWAV decoder or native DSP conformance result.

## Cue identity and callback boundary

Registration `0x101574..0x101598` supplies 16 resource entries at `0x1b7adc`
(8-byte stride) and 19 cue entries at `0x1b7b5c` (28-byte stride).
Each cue's native name and resource pointer are read from those tables. The
four remaining parameter words are retained raw; their effective playback
semantics are not applied or inferred from filenames.

| Cue IDs | Native cue suffix / member prefix |
| --- | --- |
| 0 | `COMMON_SILENT` / no resource |
| 1 | `COMMON_TOUCH` / `touch` |
| 2, 3 | `COMMON_TOUCHOUT`, `COMMON_TOUCHIN` / `touchoff` |
| 4 | `COMMON_TOGGLE` / `toggle_release` |
| 5 | `COMMON_BUTTON` / `button_supershort` |
| 6, 7 | `COMMON_RETURN`, `COMMON_CANCEL` / **unsupported `common_back.sseq`** |
| 8 | `SWKBD_BUTTON` / `key_enter` |
| 9 | `SWKBD_CANCEL` / `toggle_release` |
| 10, 11 | `SWKBD_KEY`, `SWKBD_KEY_RELEASE` / `key_input`, `key_input_release` |
| 12, 13 | `SWKBD_BACKSPACE`, `SWKBD_ENTER` / `key_backspace`, `key_enter` |
| 14, 15, 16 | `SWKBD_CONVERSION`, `SWKBD_ERROR`, `SWKBD_CURSOR` / corresponding `key_*` |
| 17, 18 | `SWKBD_TOGGLE_ON`, `SWKBD_TOGGLE_OFF` / `key_on`, `key_off` |

`keyboard_audio_events.py` executes bounded original ARM with Unicorn 2.1.4.
It runs native configuration/constructors and virtual control methods, capturing
requests at `0x156300`. It separately supplies the resulting callback phase to
the native QWERTY handler `0x17f774`; this is a composed boundary fixture, not a
replayed host/UI session. The QWERTY table `0x1a2e30` identifies character, space,
backspace, Enter, Caps and Shift groups. Key type configuration is executed at
`0x17ea98..0x17eaf0`; dialog cue selection at `0x191b98..0x191bb4`.

| Bounded native input | Cue request order | Result |
| --- | --- | --- |
| Character or space; accepted callback phase 1, then release | 10, 11 | input then release |
| Character or space; rejected callback phase 1, then release | 15 | rejection suppresses release cue |
| Backspace; accepted, then short release | 12 | release cue is −1 |
| Enter; accepted, then release | 13 | release cue is −1 |
| Backspace or Enter; rejected, then release | 15 | no extra release request |
| Caps or Shift initially off; press and release | 1, 17 | state becomes on, callback phase 1 follows |
| Caps or Shift initially on; press and release | 1, 18 | state becomes off, callback phase 1 follows |
| Dialog button flag at configuration `0x11a + index` is zero | 1, 9 | generic press, keyboard cancel cue, callback phase 1 |
| Same dialog flag is nonzero | 1, 8 | generic press, keyboard button cue, callback phase 1 |
| QWERTY callback phase 0 | none | rejected at callback gate |

The fixture exposes acceptance as an input; it does not claim to prove text
validation or a complete cancel/submit outcome. Native cue selection precedes
the dialog/modifier callback. Character/space cue 10 comes from callback
acceptance, not merely from entering the key's pressed state.

The following boundaries are stubbed explicitly and recorded in the report:
memory helpers `0x15c6d4`, `0x15bff0`, `0x15b9bc`; base setup `0x1029bc`;
touch/hit/release queries `0x1562e4`, `0x1563c8`, `0x15af80`, `0x111d04`;
text acceptance `0x1401f8`, `0x140050`; animation/control work `0x13fb74`,
`0x13fb60`, `0x13f418`, `0x13f708`, `0x183f2c`; callback delivery `0x159cb8`;
audio request `0x156300`. Unexpected code boundaries and instruction-budget
exhaustion fail. The synthetic text-object pointer is declared at writable image
cell `0x1b777c`; every other original image byte is checked unchanged. Source
instruction spans and hashes are recorded privately.
Repeat cadence, drag-out/re-entry behavior, automatic modifier-reset queue
timing, native gain/pitch/mixing and SSEQ execution remain outside this proof.

## Reproduction and private outputs

```sh
PYTHONPATH=scripts python3 -B -m firmware.keyboard_audio \
  --extracted /private/ssd/extracted/keyboard \
  --output /private/ssd/new-keyboard-audio/resources \
  --reference-decoder /private/ssd/vgmstream-cli
PYTHONPATH=scripts /private/venv/bin/python -B -m firmware.keyboard_audio_events \
  --code /private/ssd/extracted/keyboard/exefs/code.bin \
  --output /private/ssd/new-keyboard-audio/events.json
PYTHONPATH=tests TMPDIR=/private/ssd/scratch \
KEYBOARD_AUDIO_EXTRACTED=/private/ssd/extracted/keyboard \
KEYBOARD_AUDIO_REFERENCE=/private/ssd/vgmstream-cli KEYBOARD_AUDIO_EVENTS=1 \
  /private/venv/bin/python -B -m unittest test_keyboard_audio
```

Eight tests pass: six synthetic decoding/boundary checks and two original-source
checks covering all waves and 15 native event cases. No application build or
browser check is claimed for this offline-only change.

Frozen private root:
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/assets/keyboard-audio/verified/`.

| Artifact | SHA-256 |
| --- | --- |
| `resources/manifest.json` | `6e07dbe01677ba67dc117e8d80614d7d3da91485cc5c3830142e9bb13e1d8460` |
| `events-reviewed.json` | `23aa1e0892f45b1f55acb88f98ae262b93172e5c7b652c99f01a9b2eb1d8bb5f` |

The original archive, source executables, extracted members, vgmstream checkout,
disassembly and numeric replay scratch stay on the private SSD. No strict 1:1
audio acceptance or scene integration follows from this resource checkpoint.
