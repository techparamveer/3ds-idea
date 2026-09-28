# Ordinary HOME return: caller and queue ordering

2026-09-23. This follows [entry/sleep policy](home_audio_POLICY_EVIDENCE.md).
The checked ordinary return selects a **fresh no-intro sound**, with countdown3
and fade180. The power-button marker stays clear. Native queue ordering also
contains a temporary immediate start; do not mistake it for a second audible
music entry or for resuming a saved synth.

Source is owner-supplied EUR HOME `0004003000009802`, version24576, executable
SHA-256 `243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Private fixture and hashed excerpts remain on SSD at
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/audio/native-home-return/`.
Run `check.py` with the adjacent firmware tree's
`assets/research-venv/bin/python`. Fixture SHA-256:
`6e9ea0b9236423fbfe33c0edfeca5dcb1f8933fc49c74a8c9d46459bab537d06`.
`checked.json` SHA-256:
`3b14bc71613da8977fbeb5a0c2d99ad1ef695c5998c8e4360b5b33714644c3ee`.
No executable, disassembly, firmware audio or application changes enter Git.

## Return event and actual caller

APT names use the primary [libctru header](https://github.com/devkitPro/libctru/blob/master/libctru/include/3ds/services/apt.h).
The original normalization and receive-handler fragments give:

| Incoming parameter | Explicit fixture conditions | Result |
| --- | --- | --- |
| Raw11, `WAKEUP_PAUSE` | Five special-route predicates false; power marker0; payload does not begin `ASHP`. | Internal3 → event `0x20000`; entry mask remains0. |
| Raw10, `WAKEUP_EXIT` | Same predicates/marker; additional 24-byte metadata does not match the special program/type2 case. | Internal2 → event `0x10000`; entry mask remains0. |

Normalization is `0x22f5d4..22f648`; ordinary receive is
`0x116ac4..116c64`. The actual power-marker getter and event setter execute.
IPC, special-route queries and the additional metadata lookup are stubbed.
This deliberately avoids the earlier conditional marker1 → mask2 route.

Main callback `0x2b56e8` has state10 and11 table entries pointing to
`0x2b740c`, which calls `0x1e1a7c(this,event)`. Executing that dispatch segment
and the original return handler, with main route byte `+0x3a89=0`, mask0 and
`+0x1819=0`, reaches `0x295680` as follows:

| Main state | Event | Six helper arguments |
| --- | --- | --- |
| 10 | `0x10000` or `0x20000` | `(this,1,1,1,1,0)` |
| 11 | Either | `(this,0,1,1,0,0)` |

Main `+0x1819` nonzero skips this helper. Route values10/11 rewrite the event
to specialized branches; mask bit4 also changes the path. The fixture does
not execute every preceding main-callback guard or every APT route.

## Why the queue contains two starts

The executed helper writes main `+0x3a89=6` at `0x295874..87c`.
In the state10 case its music gate is on. It acquires the music lock, calls
general entry `0x1d9328`, releases the lock, then directly calls
`0x1e0af4(manager,0,180,3)` at `0x295980`. The lock wrappers are
`0x1d9520/0x1d931c`; they are not theme-selection functions.

The general entry sees route6 and selects no-intro180/countdown0. Both calls
to `0x1e0af4` first queue stop30. With the white archive, an initially empty
queue, no existing music handle and main `+0x3a6b=0`, the real builder
`0x224a3c`, list insert/remove and dispatcher preserve this sequence:

| Order | Command | Countdown | Pump that dispatches it |
| --- | --- | --- | --- |
| 1 | Stop, ramp30 | 0 | 1 |
| 2 | Start `0x01000019`, fade180 | 0 | 1 |
| 3 | Stop, ramp30 | 0 | 1 |
| 4 | Start `0x01000019`, fade180 | 3 | 4 |

Equal countdowns preserve insertion order; there is no coalescing in this
builder. Pump `0x115364..1153e0` dispatches all nonpositive commands before
decrementing the remaining countdowns. The archive ID is
`BGM_CTR_HOME_NO_INTRO`, the existing `music-resume` alias.
The helper also requests `0x0100001b`, `SE_CTR_HOME_HOMEBUTTON`, through the
separate SFX dispatcher. State11 retains that SFX request but skips both
music calls through the first stack argument's gate (fifth argument overall).

## Temporary start, fade and the adapter boundary

The fixture retains real start wrapper `0x1330b0`, archive-start wrapper
`0x2249fc`, start-request setter `0x11ca80`, fade setter `0x220240` and stop
routine `0x2349d0`. Archive metadata lookup, successful sound allocation and
virtual teardown are explicit stubs. Allocated objects start in the state
written by the original BasicSound reset fragment.

The immediate start sets request byte `+0x85=1` and fade180/counter0. Before
any host BasicSound update, the next stop30 sees state `+0x8a=0` and takes
the immediate virtual teardown branch, not a 30-update fade. The fixture
records that sink and models handle detachment. Passes1–3 end without a
handle; pass4 creates a second fresh sound with fade180/counter0. This is a
bounded successful-allocation result, not execution of archive allocation,
teardown internals, DSP output or proof of audibility in every queue state.

The first queue pass occurs later in the **same application update** as the
return callback, provided the sound/queue enable gates remain on. Original
`0x102288` calls object update `0x1067dc → 0x10e228 → main vtable+0x20`
before `0x1046bc → 0x10c508`, which services music before archive sound update.
A separate ordering fixture retains these wrappers and object dispatch, with
main, queue and archive bodies as recording sinks. It confirms that order;
the main/helper and queue bodies are tested separately above. Sound gates
are `0x32e854`, `0x32e864` and queue `+0x4a0`.

The delayed start is initialized with fade counter0. BasicSound `0x131100`
returns without incrementing or calculating gain while sequence readiness is
false. On its first ready, unpaused update, virtual `+0x28` increments the
counter **before** virtual `+0x2c` calculates gain. The original readiness
predicate, update methods and gain code pass a separate fixture: not ready
keeps counter0; first ready calculates **counter1 / 180**, float32 bits
`0x3bb60b61`. Native readiness is not proved to become true on queue pass4.
The first DSP sample and output-submission latency remain unproved.

The earlier policy fixture establishes fade180 as 180 eligible host sound
updates. Neither countdown3 nor fade180 has a proved wall-clock cadence. Do
not encode them as three browser frames or a three-second fade from this
evidence alone.

For the checked ordinary state10 return, the adapter can distinguish a fresh
delayed no-intro entry from cold intro entry and from sleep/master-gain
restoration. An audible implementation may collapse the canceled temporary
start, while a native command trace should retain it. Existing mute, gain
restoration or retained transport state must not themselves select this entry.

## Other callers and the remaining launch boundary

Original argument setup at `0x297878`, `0x298f2c`, `0x2a6928` and
`0x2ab648` also passes `(intro0,fade180,countdown3)`. They are not evidence
that every return follows the ordinary state10 path. `0x2970f8` is reached
from return event `0x400000`; `0x298e64` has its own gate and general-entry
call. The state-entry table maps186 to `0x2a685c`, and176/177/178/182 to
`0x2ab614`. Their modal meanings are not assigned here.

The main callback's event5 branch independently queues **stop0/countdown0**
and stops archive player `0x04000005`; the fixture checks those sinks.
An ordinary app-launch producer for that event is still unresolved. Do not
label event5 universally as app launch. The state9 transition at
`0x2b735c..7408` does call `0x1de6f8` before setting state10; that gated
preparation can reach `0x26a340 → 0x26b040`, clear audio-enable `0x32e864`,
and call archive/output shutdown. That is a separate source observation,
not proof of the precise launch click-to-stop timing or every teardown call.

Passed: two ordinary receive cases, four caller cases, helper-skip guard,
two helper music gates, real four-command queue/pump order, conditional fresh
sound cancellation, event5 audio sinks, four other direct argument setups and
seven state-table entries, application phase ordering and first-ready gain
ordering. Preparation/UI/lock stubs are listed in the fixture and report.
Documentation only; no application rebuild was required.
