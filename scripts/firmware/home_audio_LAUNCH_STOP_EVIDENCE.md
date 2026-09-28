# Application launch: music stop and guarded handoff

2026-09-23. Successful new-application preparation requests **stop30,
countdown0**. For a playing sound at full fade gain, this fades and detaches
the music handle after 30 eligible host updates. It is not a muted continuing
sequence. An immediate transport stop on leaving HOME therefore matches the
eventual lifecycle but omits this source fade. No wall-clock duration is proven.

Source: owner-supplied EUR HOME `0004003000009802`, version24576, executable
SHA-256 `243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Private fixture and 34 hashed source excerpts remain on SSD at
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/audio/native-app-launch/`.
Run `check.py` with `assets/research-venv/bin/python` from that firmware tree.
Fixture SHA-256:
`f2ce01ff8d16c23f31e41c1820733cee987676678198f067881b80cc948be1c7`.
`checked.json` SHA-256:
`0c7480d436655b736a678b0edf2414fa714b2a5f1130a82958f31c027bd78d3e`.
No application, public asset, browser or emulator changes are included.

## Launch and resume are distinct callers

The fixture executes state6 preparation `0x2a7d5c`, its actual argument setup,
`0x1dc5c0` state6 dispatch and `0x2bdd70`, using a selected NAND program,
availability result1, and explicit service/UI stubs. The successful branch
reaches `0x2be290`; `0x2be2a0` calls `0x1df89c(manager,30)`.
The actual wrapper queues type2/ramp30/countdown0 through `0x1f3540` and
also stops the manager's alternative handle `+4` with30 when present.
`0x26a840` separately stops handles `+0x20/+0x50/+0x58` with30.
The branch requests SFX `0x0100001f`; this does not rename or replace the
existing start-selection cue `0x0100001e` in the delivery pack.

State22 entry `0x1e41cc` compares the selected and current 64-bit program IDs
and media bytes. With a running program, identical records choose state8;
different records do not. State8's `0x2ab978` separately requests stop30.
This prevents using that resume caller as the sole evidence for a new launch.

The successful state7 finish at `0x296078..2960a8` chooses state10. State10
entry invokes `0x1de6f8`. The fixture checks this finish fragment with its
earlier banner/service completion guards assumed. It does not execute the
entire input, security-check and prelaunch state graph.

## Stop execution and handle lifetime

The real queue pump and dispatcher reach `0x2349d0(sound,30)` in their first
eligible pump. For sound state `+0x8a=2` and pause state `+0x8b!=2`, it
interpolates the current fade gain, sets a zero target, writes duration
`trunc(currentFadeGain * 30)`, resets the counter and marks stopping.
State other than2 or pause state2 takes immediate virtual teardown instead.

| Initial conditions | Written duration | Eligible host calls until handle detaches |
| --- | --- | --- |
| Playing, gain1, unpaused | 30 | 30 |
| Playing, gain0.5, unpaused | 15 | 15 |
| Playing, gain0, unpaused | 0 | 1 |
| State0 | Immediate teardown | 0 |
| Playing, pause state2 | Immediate teardown | 0 |

The fixture executes `0x131100`, the real fade increment through
`0x1a6d28→0x1a66bc`, and the stopping comparison at `0x1313c4..1313dc`.
On completion, actual BasicSound teardown `0x1a6804` invokes actual
`0x220204`, which clears the queue handle's pointer and its backlink.
It clears the active/started flags and writes sound state3. Source commands6
and4 are recorded at the output-command sink. Gain submission, the sequence
pool wrapper and DSP processing are not emulated. The source sequence wrapper
`0x1a6f54` calls this BasicSound teardown before its pool/list cleanup.

Thus the handle survives the fade, then detaches. No saved sequence position
is implied. [HOME return](home_audio_HOME_RETURN_EVIDENCE.md) separately
selects a fresh no-intro sound. Count30 is neither milliseconds nor verified
display frames; eligibility and host/output scheduling still matter.

## Handoff is guarded; event5 is a different branch

`0x1de6f8` is **not unconditional audio shutdown for every application**.
Actual predicate `0x233538` reads APT attributes at `0x32eea8`: low three bits
must equal2, both `0x20000000` and `0x10000000` must be set, and main
`+0x4008` must still be0. No hardware label is inferred for those bits.
Four fixture cases check missing attributes, partial attributes, a passing
word `0x30000002`, and an already-completed handoff.

When allowed and audio enabled, `0x26a340→0x26b040` clears audio-enable,
calls archive close `0x11c050`, then driver teardown `0x1123d8`. Those last
two are recording sinks in the fixture. Static source shows worker shutdown,
voice-list teardown `0x11d408→0x131ab4`, clearing voice resource pointers,
and sound-thread callback cleanup. This is not merely a gain write. The
fixture does not establish whether every fade finishes before that teardown.

The successful preparation worker `0x26bfec→0x2295bc(0,1,0,0)`, with
successful service returns, sets its completion bytes without generating
event5. One concrete event5 producer is raw APT parameter12, normalized to4,
whose receive-table branch `0x116d34` sets event5. The previously checked
main event5 handler then queues stop0. This is separate from the successful
preparation fixture; special launch, error and reboot routes are not fully
classified. Do not use event5 alone to justify immediate stop for an ordinary
successful launch.

Child-slot cursor selection was not adjacent to this bounded launch trace
and remains unverified here. No cue mapping was changed.
