# HOME sound fades: application updates and audio render frames

2026-09-23. BasicSound fade180 and stop30 advance on eligible **application
sound updates**, separately from the sequence clock's 160-sample render
callbacks. The music queue runs before those BasicSound updates. The normal
main loop synchronizes presentation with both display-event counters, but
this does **not** establish an unconditional 60 updates/second, elapsed-time
catch-up, or exact seconds for the fade and queue counts.

This is bounded source research. No audio, renderer, runtime, public asset,
browser, emulator profile, or HID-clock implementation changes are included.

## Source and reproduction

Owner-supplied EUR HOME `0004003000009802`, version 24576, original
`exefs/code.bin` SHA-256:
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
The executable is mapped at `0x100000`. Firmware bytes and disassembly remain
private; only the fixture and this evidence note belong in the repository.

Run [home_audio_fade_cadence.py](home_audio_fade_cadence.py) with Unicorn 2.1.4
and Capstone 5.0.7:

```sh
python scripts/firmware/home_audio_fade_cadence.py \
  --code /private/path/exefs/code.bin \
  --output /private/path/native-fade-cadence/verified
```

The script rejects other executable hashes. It executes original ARM without
patching its instructions, using synthetic object/list state and the explicit
hooks described below. It writes `checked.json` and 38 source excerpts, each
with hashes of the original bytes and rendered disassembly or vtable words.
The private result is under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/audio/native-fade-cadence/verified/`.

- Fixture SHA-256: `0046e0d05bc9ecd92226954a527e6fb0f5151914803c8f8ec51ccbfb6d7bea4d`.
- Result SHA-256: `2b5fbab8eb87b181393603996ff47890c97aabda5f44f6efe99a503d1d2c9757`.

## Application update chain and eligibility

The main loop calls `0x102288` at `0x101aac`. Its audio call at `0x1022e4`
reaches `0x1046bc→0x10c508`. With audio enabled at `0x32e864`, the latter
executes these calls in order:

| Call site | Target | Relevant work |
| --- | --- | --- |
| `0x10c520` | `0x1152a8`, object `0x3456ec` | Music queue wrapper |
| `0x10c528` | `0x115ad4` | Other sound-manager update |
| `0x10c530` | `0x115a38` | Other sound-manager update |
| `0x10c538` | `0x11296c`, object `0x3451fc` | Archive/player updates |

`0x11296c` walks archive players at `+0x24`, count `+0x20`, stride72.
It calls `0x130c8c` once per player. That function walks the player's sound
list, subtracts `0xdc` from each node, and calls `0x131100` at `0x130cac`.
Neither traversal passes elapsed time or an audio-sample count.

BasicSound `0x131100` checks playback/end/start readiness before the fade
branch. A pending start (`+0x85=1`, `+0x86=0`) returns before that branch if
its virtual readiness query is false. For the sequence object below, the
actual getter `0x2e4680` reads sound `+0x205`. Pause states then select:

| Sound `+0x8b` | Fade counter update | Pause counter update |
| --- | --- | --- |
| 0 | Yes | No |
| 1 | No | Yes |
| 2 | No | No |
| 3 | Yes | Yes |

The virtual call at `0x131264`, vtable `+0x28`, reaches `0x1a66bc`.
It increments `+0x70` by one while less than duration `+0x6c`, and separately
advances the handle-volume ramp at `+0xac/+0xa8`. The gain-submission virtual
call follows at `0x1313c0`; the stopping comparison follows at
`0x1313c4..0x1313dc`. These are call-count ramps, not sample-count ramps.

Executed checks retain the whole enabled host wrapper, archive/player
traversals, BasicSound eligibility, fade increment and stop comparison:

- 182 host passes produce counters1,90,179,180,180 at passes1,90,179,180,182.
  Every observed gain-submission entry sees the already-incremented counter.
- All four pause states above match; readiness0 holds and readiness1 advances.
  Disabling audio prevents the queue/BasicSound calls.
- Real `0x2349d0(sound,30)` from full fade gain writes duration30. The
  sequence object's virtual teardown is reached on eligible host call30.
  This fixture records that entry; handle detachment itself is covered by
  [launch-stop evidence](home_audio_LAUNCH_STOP_EVIDENCE.md).

The three manager-update bodies are recording sinks in this host fixture.
Queue countdown is checked separately using the actual `0x115364..0x1153e0`
pump and original list operations: initial3 becomes2,1,0 after pumps1–3;
dispatch occurs on pump4. Its dispatcher is a sink and no BasicSound or
sequence-clock call is permitted during this check. This preserves the
dispatch-before-decrement distinction established by
[HOME-return evidence](home_audio_HOME_RETURN_EVIDENCE.md).

## Exact sequence vtables and the separate audio worker

An earlier policy fixture called vtable `0x320650` a sequence table. The
following constructor/callback chain supplies the direct sequence-clock
identity and refines that naming without changing the shared ramp arithmetic:

| Source | Connection |
| --- | --- |
| `0x1316c8` | Installs BasicSound vtable `0x3206fc`; constructs inner player at sound `+0xf4` through `0x13b870` |
| `0x13b870` | Uses primary player table `0x32094c`; installs callback table `0x320994` at player `+0x4c` |
| `0x320994+8` | Points to `0x2ec034`, which reaches sequence clock `0x1aa174` |
| `0x3206fc+0x28` | Points **directly** to fade increment `0x1a66bc` |
| `0x320650+0x28` | Points to sibling `0x1a6d28`, which also calls `0x1a66bc` |

Both tables use the generic fade counter. This note does not infer a concrete
class name for the sibling from its size or from the earlier fixture name.

`0x1aa4f0→0x1a83f4` registers the sequence callback object at player `+0x4c`
in sound manager `0x365358`'s `+0x1d0` list. The list node is callback `+4`;
the sentinel is manager `+0x1d4`. Frame wrapper `0x13b320` falls through to
`0x13b370`. That function invokes callback `+0xc` in its earlier phase and
callback `+8` at `0x13b48c`. For this sequence table the former is the empty
`0x1a83f0`, and the latter is `0x2ec034`.

Sound setup `0x11d008` supplies `0x13b320` and manager `0x365358` through
`0x12d18c→0x1380c4`. `0x1380c4` calls worker setup `0x144990`, then stores
that function/argument at driver `+0x20/+0x24`. Worker creation supplies entry
`0x151344`, which obtains the driver and falls into loop `0x15135c`.
The loop waits through `0x155a9c` in its non-profiling branch, invokes the
stored frame callback at `0x151460`, and calls `0x1546b4` afterward. The
wait path includes `0x155dcc`'s `svc0x24` on its audio event handle when
initialized; other branches include event waits and a fallback sleep. This
is a distinct worker path, not a call from the scene-update loop.

The audio fixture executes 37 worker iterations, actual frame/list dispatch,
`0x2ec034`, and actual sequence arithmetic `0x1aa174`. All37 reach the
sequence clock, changing its fraction1000 to982.6355590820312; the separate
BasicSound fade counter stays0. It asserts against entry to the host wrapper,
music queue wrapper, BasicSound update, or shared fade increment. The large
initial fraction prevents any sequence track ticks in this synthetic case;
this is not an audio rendering test.

The sequence clock's constant `0x4e200000` is `160*8192*1000`. Its arithmetic
and the pinned emulator's 160-sample schedule are documented in
[sequence-clock evidence](home_audio_CLOCK_EVIDENCE.md). This trace connects
that clock to the worker callback. It does not run the DSP service or prove
a fixed ratio between worker frames and application updates. Other ramps,
including worker-side master processing, must not automatically be assigned
the BasicSound application's clock.

## Presentation pacing and its limits

After the normal application update, main call site `0x101b38` invokes
`0x102108` before returning to the next loop iteration. The normal presentation
chain is `0x102108→0x1027bc→0x106d6c(-1)→0x2301d4(0x402)`.
State5 also calls `0x106d6c(-1)` while bypassing ordinary drawing.

`0x2301d4` snapshots counters at `0x3518a8+0x154/+0x158`. Selector `0x400`
waits for the first to change, `0x401` the second, and `0x402` both. Its retry
calls `0x138eb0→0x145d3c`, which coordinates a graphics event wait. It tests
changed values rather than consuming the number of elapsed events.

The original setup at `0x134994..0x1349a8` registers `0x143624` for event2
and `0x143668` for event3 through `0x145df8`. Registration stores them in
the graphics worker's callback array at `+0x10+4*event`. Worker `0x14bb38`
reads the shared ring's event byte and dispatches through that array at
`0x14bc48`; the callbacks increment the two counters. The fixture executes
registration and both ring-dispatch cases, producing counter pairs(1,0)
then(1,1). Worker setup `0x145af0` obtains the relay queue through
`0x14bdf4`, whose IPC header is `0x00130042`.

The primary [libctru event enum](https://github.com/devkitPro/libctru/blob/master/libctru/include/3ds/services/gspgpu.h)
identifies event2/3 as VBlank0/VBlank1. Its
[GSP implementation](https://github.com/devkitPro/libctru/blob/master/libctru/source/services/gspgpu.c)
also supplies the relay-queue protocol reference. These references label
the observed source path; their hardware timings are not substituted for
a measurement of this HOME loop.

Executed wait cases show that changing only the first counter does not
release selector `0x402`; changing the second afterward does. Injecting
counter increases9 and7 releases it once, without nine or seven application
updates. `0x106d6c` skips this wait when `0x32e7a4+0x18` is nonzero; both
gate states are checked. `0x102108` also has an early return through
`0x32e7a6`. Source `0x106ca4` updates the presentation bypass state, and
the main path can separately wait for system/sleep events at `0x104b58`.

The defensible result is therefore **normally presentation-paced application
updates**, with explicit eligibility and bypass conditions. There is no
evidence here for hard60Hz, an unconditional one-to-one mapping to each
display interrupt, missed-frame catch-up, or fixed seconds for180/30/3.
In particular, these counts must not be reinterpreted as160-sample blocks.

## Fixture boundaries

The host fixture stubs manager bodies `0x1152a8/0x115ad4/0x115a38`, gain
submission `0x1a6414`, stop-time pool reprioritization `0x1a76d8`, virtual
teardown `0x1a79c0`, and archive output endpoints
`0x22c548/0x131914/0x226e90`. At `0x1313e0` it jumps to the original
epilogue `0x131518`, omitting subsequent output commands. It does not claim
that those omitted commands have zero latency.

The audio fixture stubs locks, wait `0x155a9c`, submission `0x1546b4`, and
master/command/voice endpoints listed in the script. The fixture itself
clears the worker-run byte after37 submissions. Display fixtures stub locks
and event endpoints, inject counter changes, and execute selected ring
fragments with their prologue register values supplied. They do not create
OS threads or execute GSP/DSP services. Static setup/presentation chains
and executed fragments are distinguished above. Actual scheduling under
load, hardware suspend, queued-command visibility to DSP, audible fade
endpoints, and shutdown before completion remain outside this result.
