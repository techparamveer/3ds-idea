# Keyboard wave parameters and playback boundary

This extends the [resource and cue checkpoint](firmware-keyboard-audio-validation.md).
It establishes the supplied keyboard executable's wave parameter calculations
and CSND command order. It does not establish audible or browser equivalence.
The resource export and event checkpoint remain frozen; this pass writes only a
new private `assets/keyboard-audio/parameters/` directory.

## Original path and fixture boundaries

`scripts/firmware/keyboard_audio_parameters.py` requires the same pinned
keyboard code SHA-256 `a0b78005b0a99116ca703bc9b7625ce1b0f2d4cc45f66fc6fb9ab8a34244d4f0`
and sound archive SHA-256 `2172d8e08d58840b6e1450a6e5a3ee4e8159b4f2f908267ff3d92ecb3dc680a4`
as the resource checkpoint. Original ARM instructions execute under Unicorn
2.1.4 with VFP enabled. Unexpected instruction boundaries fail.

The synthetic state supplies an initialized manager, scheduler, one free voice,
handle and channel 7. The native vtable at `0x1ad6d0` remains original; its
cue getter `0x197fb4` reads manager+0xc and applies the 28-byte descriptor stride.
The only changed original-image cells are the 16 loaded-resource pointers at
`0x1b7ae0 + 8*i`. All other image bytes must remain identical. The fixture does
not execute archive loading or the manager constructor.

| Stage | Original address | Result |
| --- | --- | --- |
| Immediate cue request | `0x156300` | Uses the supplied handle, with hooks and stop/fade argument zero |
| Player and descriptor lookup | `0x1174e8` → `0x197fb4` | Retrieves the original cue descriptor |
| Cue consumer | `0x1310d0` | Silent null resource returns; kind 0 starts a wave; kind 1 is a separate sequence path |
| Wave prepare | `0x135874` → `0x1385b4` | Copies gain/pan/pitch, parses original BCWAV, prepares channel state |
| Pending start | `0x13597c` | Marks the voice pending |
| First voice service update | `0x117530` | Advances envelope counters, computes gain, then submits start |
| Channel gain | `0x12c228` → `0x12f228` | Native float32 lookup/arithmetic and integer channel packing |
| Pitch timer | `0x138814` → `0x165ba8` | Native float32 rate/pitch conversion |

Only four external boundaries are stubbed: channel allocator `0x1382a0` returns
the synthetic channel; physical mapping `0x14fa8c` returns virtual address plus
`0x10000000`; stereo query `0x1697b8` returns the case's explicit setting; CSND
submission `0x151b48` records its six argument words and returns success. The
actual queue, firmware services and audio decoder never execute. Stub calls,
executed source spans and hashes are included in the private report.

The 39 cases comprise 17 original non-sequence cue requests (including silent
cue 0), all 15 wave resources prepared directly, and seven controlled finite
parameter inputs. Cues 6 and 7 fail explicitly as unsupported SSEQ. The two
looped waves occur in the resource table but have no direct kind-0 cue; their
direct preparation proves the wave path only, not sequence orchestration.

## Parameter contract

Descriptor words at +0xc, +0x10 and +0x14 are float32 gain, pan and pitch. All
native wave cues have pan zero; their distinct gains and pitches survive the
full request path unchanged. The private report retains their raw words and
resulting integer commands.

Gain calculation multiplies two interpolated voice envelopes and cue gain,
then clamps to [0,1]. Preparation sets one envelope to unity and a startup
envelope from 0 to 1 over one service update. The first update increments the
counter before evaluation, so that update applies full cue gain. This is an
update count, not an established millisecond duration.

Pan combines cue pan and the voice offset, clamps to [-1,1], and selects a
257-entry float32 table at `0x1a00a8`. Player byte +0x622 forces centre pan when
nonzero. The left index is `trunc(0.5 + ((pan+1)*0.5)*256)` and the right index
uses negative pan, preserving the original float32 operation order. Each gain
is `trunc(float32(float32(gain * table[index]) * 32768))`. Channel gains are
clamped to [0,32768] and packed left in the low 16 bits, right in the high 16.
The separate stereo query, when false, replaces both gains with their integer
average. This is distinct from forcing centre pan.

At unity gain, centre produces 23170 per channel; hard left/right produces
32768/0 or 0/32768. The table resembles `sqrt((256-index)/256)`, but index 2
is not bit-identical to recomputing that expression with correctly rounded
float32 output. Preserve the native table or verified resulting integer gains;
do not substitute a generic panner curve.

Pitch multiplies a voice factor initialized to 1. A nonpositive product is
replaced with float32 0.1. `0x165ba8` calculates
`trunc(float32(67027964 / float32(sampleRate * effectivePitch)))`. The clock
literal is `0x4c7fb0ff`. Initial channel configuration clamps its unity-pitch
timer to [0x42,0x10000]; the subsequent timer setter does not perform that clamp.
All original cue timers are within normal range. A future transport should
retain the final integer timer rather than use the unquantized pitch alone.

## BCWAV and CSND commands

The primary [libctru command implementation](https://github.com/devkitPro/libctru/blob/36fe1ada5b7ebe53ba4decda36d764a55f8fefb6/libctru/source/services/csnd.c)
and [header](https://github.com/devkitPro/libctru/blob/36fe1ada5b7ebe53ba4decda36d764a55f8fefb6/libctru/include/3ds/services/csnd.h)
corroborate the command IDs, packed channel flags and timer constant. Its
high-level volume helper is not the keyboard's pan implementation. The pinned
source copies and their hashes are retained privately.

| Command | Observed payload |
| --- | --- |
| 11 | Initial IMA history and step index |
| 14 | Timer/codec/loop/interpolation/channel flags, zero initial gains, first buffer address and byte count |
| 8 | Timer; issued at unity pitch and again with effective cue pitch |
| 0 | Loop-resource path only: play state 1, before configuring the second block |
| 3 | Loop-resource path only: second buffer address and byte count |
| 12 | Loop-resource path only: IMA loop history and step index |
| 9 | First service update: packed left/right gains, capture gains zero |
| 1 | First service update: play state 1 |

Command 14 enables linear interpolation and sets loop mode 1 for looped
resources or 2 for one-shot resources. Its enable bit is zero. Command 0 is a
play-state command, not a loop-mode setter. Consequently the loop-resource
path already requests play state 1 during setup with zero gains; do not claim
that every resource first starts at command 1. Queue execution timing is
outside this probe.

PCM16 byte length is `samples*2`; IMA byte length is `samples>>1`, including
odd sample counts. This differs from the exporter, which correctly preserves
all declared samples from `ceil(samples/2)` source bytes. Keep both the source
sample count and native submitted byte count. The last odd sample and any
hardware buffer alignment remain an audible equivalence question, not a reason
to silently alter the frozen resource export.

For IMA loops, the second address is `data + (loopStart>>1)` and its length is
`(totalSamples-loopStart)>>1`. Both supplied loop starts and lengths are even.
The two resource cases submit 2552 and 802 loop bytes respectively. The kalimba
header rate is 32020 Hz, regardless of the filename's 32000. Initial and loop
history/index words come from their separate BCWAV codec-state references;
signed history is sign-extended into the submitted 32-bit word. Loop-state
reload behaviour and hardware decoding have not been executed here.

## Future WebAudio transport boundary

The future runtime should accept a resolved voice request carrying source
identity, mono source PCM/rate, original sample count, native byte count,
integer timer, integer left/right gains, loop byte interval and initial/loop
IMA states, plus explicit start/update ordering. Keep cue IDs distinct from
resource IDs. Handle cue 0 as silent and reject the two SSEQ cues until their
separate synthesis path is implemented and verified.

For a candidate WebAudio implementation, derive the effective rate from
`67027964/timer` and divide by the decoded buffer rate for `playbackRate`.
Apply independently scaled channel gains from `left/32768` and `right/32768`.
These are transport mappings inferred from the command contract, not proven
WebAudio-to-CSND equivalence. Host scheduling, interpolation, device gain,
resampling, IMA decoding/loop reload, voice stealing, later updates and fades
still require separate evidence. A generic single-pass WAV plus nominal pitch
and browser pan is insufficient for strict 1:1 acceptance.

No application, scene, public delivery, browser, HOME audio or Azahar changes
are included. No browser or listening acceptance is claimed.

## Reproduction

```sh
PYTHONPATH=scripts /private/venv/bin/python -B -m firmware.keyboard_audio_parameters \
  --extracted /private/ssd/extracted/keyboard \
  --output /private/ssd/new-keyboard-parameters/replay.json
PYTHONPATH=tests KEYBOARD_AUDIO_EXTRACTED=/private/ssd/extracted/keyboard \
KEYBOARD_AUDIO_PARAMETERS=1 /private/venv/bin/python -B -m unittest test_keyboard_audio_parameters
```

Six opt-in original-source tests cover request ordering, untouched cue words,
float32 timer/gain calculations, all resource byte lengths and codec states,
loop command ordering, controlled clamp/pan/mono behaviour, source mutation and
unsupported sequence rejection. The earlier eight resource/event tests remain
applicable. Full numerical fixtures and raw research remain private.

All 14 resource/event/parameter tests passed together for this checkpoint.
Private final fixture:
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/assets/keyboard-audio/parameters/replay-reviewed.json`
SHA-256: `caa92c77f564c3a5cefab0c96f726146aec060b376e73e1d23e65811e8167c7b`.
The earlier resource manifest and event fixture still match their documented
SHA-256 values. `primary-source/provenance.json` records libctru revision and
file hashes; source disassembly and exploratory replay files are not delivery
artifacts.
