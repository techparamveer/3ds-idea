# Native folder-opening input route and cue mixtures

2026-09-23, after voice profile v7. This follow-up tests the hypothesis that an
extra footer-confirmation sound explains the remaining folder-opening waveform
difference. It changes no converter, source sequence/bank/wave, sound volume,
public asset or application input mapping. The hypothesis is not sufficient:
confirmation is present, but the best matching short cue ends before the
mismatched folder sweep. `COMMON_BUTTON` at the opening event is rejected by
the original-volume comparison.

Source identity is the same EUR HOME title/version, executable and archive as
[voice evidence](home_audio_VOICE_EVIDENCE.md). Executable bytes were inspected
as data. No native executable, disassembly or firmware audio is added to Git.

## Footer listener and action ordering

The layout-name array at `0x33c6bc` references `LncBtmBtn_02` at `0x32653e`.
Its constructor is `0x258408`, initializer `0x257d88`; main initialization calls
it at `0x2b2964`, with the footer held at main `+0xab0`. The 15 group-name
pointers start at `0x33c6dc`, and the corresponding Decide-animation pointers
at `0x33c718`. The animation name uses the `Decide` suffix at `0x3237af`.

The listener builder at `0x253448` supplies the Decide animation in its config
and obtains a sound-event value through `0x257ad0`. This reads the current form
from footer `+0x11c`, then a per-form/group override at `+0x130` or the default
20-by-15 signed-word matrix at `0x314054`. An override value of -1 requests the
default. The result goes in config `+0x2c`; constructor `0x1f6854` copies it to
listener `+0x5c`. The corresponding key-mask table is at `0x314504`, copied to
listener `+0x68`. The listener vtable is `0x3214b0`.

Both native input paths consume that same configured sound field:

| Trigger | Native behavior |
| --- | --- |
| Matching key, `0x2555f8..658` | Check key mask; start Decide animation from `+0x40`; pass sound event from `+0x5c` to `0x1f7198`; enter state 2. |
| Touch release inside, `0x255774..7d0` | Check release and hit region; start the same Decide animation; pass the same `+0x5c` event to `0x1f7198`; enter state 2. |
| Decide completion, `0x255670..6a4` | Wait for animation through `0x1f70b0`; emit logical action 1 through `0x233a4c` after completion. |

Touch-down separately uses the Select animation and the sound field `+0x50`
(`0x2555c4..5dc`). A physical key therefore does not inherently bypass Decide
confirmation. `0x1f7198` ignores nonpositive event IDs and sends positive IDs to
global dispatcher `0x3452c4` through `0x233a6c`.

The default matrix includes event `0x01000009` in several forms, and
`0x0100003d` for groups 12/14 in forms 1/12. This does **not** establish which
form/group the recorded folder action used. Overrides are set through
`0x257d74`, including callers `0x1d6998` and `0x298ca4`; no live listener/form
snapshot was captured. The table is not evidence that every footer action
plays `COMMON_BUTTON`.

The separate folder-opening path emits `0x01000034` at `0x2a3544..554` through
the global dispatcher, subject to branches at `0x2a3500..53c`. The close path
loads `0x01000035` at `0x1de560`. These are distinct from listener confirmation.
Do not mistake `0x1e8f38` with argument 0x34/0x35 for sound playback: that
function writes the main state and calls `0x1e3a70`.

This is a static listener/action trace, not a runtime proof of the exact
confirmation event, all event-bus handlers, or its delay in a particular frame.
The waveform measurements below separately test the relevant original cues.

## New physical-A capture

The coordinator restored the isolated baseline nand/sdmc and recorded
`reference/home-folder-open-a-native.wav`, stereo signed 16-bit at 32728 Hz,
104.068 seconds. SHA-256:
`211960536b53cf0b2b7772d4f0a971eeee7c96935389f562fc9b3837a10708d9`.
The input movie requests B at nominal 12 s, six RIGHT presses at 14–19 s,
Create Folder by touch at 24 s, and physical A at 28 s, then neutral. The
coordinator visually confirmed an open empty folder at movie frame 2265.
This establishes the resulting state, not the precise transition frame.
Metadata, input plan, CTM, config snapshots and screenshot remain alongside
the recording. Its metadata records normal UI quit/audio finalization followed
by forced termination of the lingering isolated process.

The prior footer-touch capture and independent idle baseline retain the hashes
listed in [entry-volume evidence](home_audio_ENTRY_VOLUME_EVIDENCE.md).
New-capture music alignment gives baseline index equal to capture index
**+1920** in the early 8-second anchor and **-44640** in later anchors. The
one-second anchors at 20, 32, 40 and 90 seconds match exactly: correlation 1,
unity difference RMS 0. No fitted baseline gain is applied.

That offset does not make every later passage identical. In the new capture,
0.2-second windows from 24.25 through 26.0 and 27.5 through 28.75 seconds have
nonzero residuals despite the best local alignment retaining -44640 samples.
For example, 24.75 s has residual RMS 0.00413, 25.5 s has 0.00430, and 28 s
has 0.00383. Windows at 26.25 through 27.25 s are exact. The extra residual
starts before the opening confirmation and recurs afterwards. Its cause has
not been established; it must not be treated as isolated folder audio.

Create Folder does reproduce `COMMON_BUTTON`: the new capture's first 0.08 s
matches at 21.408335 s with correlation 0.998020 and native-minus-candidate
RMS -0.1400 dB. The following 0.1–0.3 s segment matches with correlation
0.991013 at a slightly different inferred origin, 21.412864 s. This supports
the create cue while retaining the small within-cue timing discrepancy.

Directly comparing the two native confirmation residuals, the old
25.44–25.50 s slice matches the new recording at 25.205329 s with correlation
**0.998125** and RMS ratio **1.001944**. Physical A retains this confirmation;
it occurs about 0.23467 s earlier in the new recording. This difference is
consistent with key-down versus touch-release timing, but separate recording
origins mean it is not an independent measurement of the input hold duration.

## Original-volume mixture diagnostic

Private diagnostic renders use v7 and the original archive/banks. They include
sound 9 `SE_CTR_COMMON_BUTTON` (archive volume 86) and sound 61
`SE_CTR_HOME_SUB_MENU_BTN` (volume 64), without expanding the public allowlist.
No gain fit, pitch fit, time stretch or envelope modification is used.

The older opening event is evaluated over **25.40–25.94 s** after unity
subtraction with baseline offset -46080. Folder origin is fixed by aligning
candidate samples 6872..9162, its approximately 0.21–0.28 s tail. The best
native origin is sample **835931**, or **25.541768516 s**, with correlation
0.991528. This is a waveform origin, not measured native trigger latency.
Whole-sample offsets are retained: rounding a printed seconds value differently
by one sample materially changes correlation in this high-frequency tail.
Button origin is independently aligned using the first 0.06 s of each cue
within the bounded confirmation neighborhood.

| Original cue added to folder-open | Confirmation origin | Confirmation correlation | Whole-event correlation | Whole-event unity error RMS |
| --- | ---: | ---: | ---: | ---: |
| None | — | — | 0.003440 | 0.006666 |
| COMMON_BUTTON | 25.413866 s | 0.012052 | 0.008613 | 0.111727 |
| SUB_MENU_BTN | 25.441335 s | 0.897478 | 0.871917 | 0.003388 |

The COMMON_BUTTON hypothesis is inconsistent with the opening: its confirmation
window RMS is 0.243617 versus observed 0.019411, about **21.97 dB too high**,
and its waveform correlation is near zero. This cue does match creation; that
does not establish it at opening.

The SUB_MENU_BTN mixture better accounts for the short confirmation. Its
confirmation RMS is only 0.2940 dB above the observed value, but correlation
0.8975 does not prove exact native event identity. It is described as a
SUB_MENU_BTN-like component rather than a verified runtime cue assignment.

Crucially, that 2240-sample cue finishes at approximately **25.50978 s**, while
the folder candidate becomes active near **25.6053 s**. It contributes **zero**
to the folder's early sweep and tail windows. For candidate-relative
0.0636–0.21 s, correlation is -0.005518 and unity error RMS 0.003064 both with
and without SUB_MENU_BTN; native-minus-candidate level is only +0.1320 dB.
For 0.21–0.32 s, correlation is 0.990831 and unity error RMS 0.00005459 both
with and without it. Thus the mixture improves a metric dominated by the
loud confirmation, while leaving the early sweep mismatch unchanged.
These numbers use the tail-aligned origin; they are not comparable to the
freely whole-cue-aligned correlation 0.218836 reported for v7 earlier.

The new A confirmation similarly matches SUB_MENU_BTN at 25.206673 s with
correlation 0.895820 and native-minus-candidate RMS -0.2769 dB. Using the
old folder origin shifted by the measured native confirmation offset is only
a timing hypothesis: the corresponding new tail residual RMS is 0.005198,
versus candidate 0.000404, a 22.19 dB excess. Given the independently observed
extra residual in that neighborhood, neither its poor folder correlation nor
the improved whole-event mixture is accepted as a clean synth comparison.

## Outcome and reproducibility

Keep the v7 converter unchanged. The original-volume COMMON_BUTTON opening
mixture is rejected; the short confirmation component is insufficient to
explain the sweep mismatch. Remaining work is to isolate the native opening
sweep reliably and inspect source-backed DSP/sweep/sample interpolation
behavior. A live form/group/event trace would settle exact confirmation
routing. None of these diagnostics justify a measured boost, fitted sweep,
new public cue assignment or public audio replacement. The separately recorded
baked music-loop defect also remains unresolved.

Private artifacts are under the SSD `assets/audio-research` directory:

- `render-sfx-comparison-cues-v7.py`, `sfx-comparison-cues-v7/`;
- `compare-open-a-v7.py`, `open-a-native-comparison-v7.json`;
- `open-route-crosscheck.py`, `open-route-native-crosscheck.json`;
- `open-a-wide-search.py`, `open-a-wide-search.json`;
- `open-route-mixture.py`, `open-route-mixture.json`.

The scripts and reports preserve the exact sample offsets, windows, original
cue volumes and unity-error measurements. This is an evidence-only update;
application build/test reruns are not required. The existing v7 31-test result
and two identical candidate renders remain the implementation validation.
