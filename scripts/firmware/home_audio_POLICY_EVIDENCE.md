# White-theme music entry, sleep gain and fade clock

2026-09-23. Bounded original-ARM fixtures distinguish music entry selection,
sleep gain restoration and BasicSound pause state. This is evidence for an
adapter contract, not a completed mapping of every app-to-HOME transition.
No browser, transport, public asset or emulator changes are part of this pass.

Source: owner-supplied EUR HOME `0004003000009802`, version 24576, code SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Private fixtures and source excerpts are on SSD under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/audio/native-policy-followup/`.
`check.py` SHA-256 is
`57957f70407a8103145deb63fbc7831dc9376ded064a3b8fde7fae4e323ebbad`;
`checked.json` is
`06cd7d2d0ce2caf7497d08d6ff99778b100b7e078d59e7219026fee3d76e98f9`.
The JSON includes per-excerpt hashes and stubbed call arguments. Reproduce with
the SSD `assets/research-venv/bin/python` and that `check.py`.

## Entry selector: what the predicates actually read

The preceding `audio/native-entry-policy/check.py` established sound IDs,
queue arguments and countdown order. This follow-up executes the ordinary
branch of caller `0x1d9328`, its actual predicates and selector `0x1e0af4`:

| Condition | Checked result |
| --- | --- |
| Main byte `+0x3a6b` nonzero | Returns before music setup or queue calls. |
| All four inputs below zero | Queues `0x0100001a` (`BGM_CTR_HOME`, `music`), ramp0, countdown0. |
| Any input nonzero | Queues `0x01000019` (`BGM_CTR_HOME_NO_INTRO`, `music-resume`), ramp180, countdown0. |

The four inputs are the word at `0x32e624`, main byte `+0x3a89`, presence of
sound-manager handle `+4`, and signed byte `0x345aec+0xa1`. `0x231b78(0,0)`
simply returns the first word; it is a retained bitmask, not an event query.
`0x2ea0ac` ORs handle presence with the signed global byte. The meaning of every
main-route/global-byte value remains unresolved. All 16 Boolean combinations
pass. The checked cold-style all-zero state selects the intro; this does not
prove that every possible boot route clears all those fields.

Each selected entry queues the already-proven stop30 before a fresh archive
sound start. `music-resume` names the no-intro archive entry: it is not a seek
operation or resumption of a saved synth. Other direct callers pass
`(intro=0, ramp=180, countdown=3)`; the prior fixture establishes dispatch on
the fourth queue pass, not a three-frame browser timeout.

## APT return limitation: power-button state is not generic HOME return

The native receive wrapper uses IPC header `0xD0080` and the output layout of
APT ReceiveParameter. Its raw commands10/11 normalize to2/3. The command and
notification names here use the primary [libctru APT header](https://github.com/devkitPro/libctru/blob/master/libctru/include/3ds/services/apt.h)
and [IPC implementation](https://github.com/devkitPro/libctru/blob/master/libctru/source/services/apt.c).

At `0x116ac4..116c04`, those normalized return commands can set entry-mask2
and event-mask `0x40000`, but **only with the power-button marker set** and
five special-route predicates clear. Getter `0x229de8` reads `0x32ee90+5`.
Notification8 sets that byte through `0x227900`; notification9 clears it.
The fixtures execute those setters/getter and both return cases. Calling this
an ordinary application-return flag would be wrong. With that marker clear,
the handler follows other branches, including message-dependent routes.
Ordinary app suspend/HOME return → final music caller remains unresolved in
this bounded pass; do not infer a universal policy from mask2.

## Accepted sleep and wake restore gains without selecting music

The notification IPC header is `0xB0040`. The original decoder maps raw
notifications3/4/5/6 (sleep query/cancel/enter/wake) to internal1/4/2/3.
The checked application path is:

1. Registered query callback `0x10d6fc`, with application handling enabled,
   returns deferred reply2. The dispatcher records sleep state1 at
   `0x32ee90+0xb`.
2. `0x10d2e4` publishes request event `0x18`; processing an accepted request
   changes main system state `0x32e5f8+0x18` to6.
3. Main callback `0x2b56e8` calls `0x26aec0` when `event & 0x18` survives its
   guards (`0x2b5b84..8c`). The state6 dispatcher waits on event `0x32e670`.
4. The registered wake callback `0x10d274`, reached by the wake-notification
   dispatcher, signals that same event. After the wait returns, `0x104b58`
   publishes event `0x20` and clears the system state.
5. The main callback's `event & 0x20` branch calls `0x26aeb4` at `0x2b5f3c`.

`0x26aec0 → 0x26a9ac` sets the manager's suppressed byte, stops secondary
handles `+0x20/+0x50/+0x58` and players `0x04000009/0x0400000a`, writes manager
gain0, sets the separate system/output master gains to0 and disables banner
updates. It does not stop or reselect ordinary HOME music. An existing
alternative handle `+4` receives a gain change rather than a stop.

`0x26aeb4 → 0x26a884` clears suppression and restores system/output master
gains1. It attempts secondary/banner restoration; when that succeeds, it
restores manager gain1 and adjusts any alternative handle using duration30.
That secondary restore call is stubbed successful in the fixture. Existing
mute/duck flags can modify the handle gain; this is not a hardware volume
slider measurement. Both wrappers are idempotent by the suppression byte.

The fixtures retain the original secondary-stop and master-gain setters,
stub command sinks, and fail if either wrapper reaches the music start/stop
queue or BasicSound pause setter. The broader main handler has a guarded
recovery branch at `0x2b5cf8..5d78` which can explicitly stop/reselect music
after a failed/deferred path. Do not turn the checked accepted sleep path
into a claim that no possible sleep-related path restarts.

## Fade180 is an application-update count

The source call chain is main loop `0x101aac` → application update `0x102288`
→ `0x1046bc` → `0x10c508` → archive update `0x11296c` → player update
`0x130c8c` → BasicSound `0x131100` → virtual `+0x28`. The sequence vtable
at `0x320650` resolves that slot to `0x1a6d28`, which calls `0x1a66bc`.
That function increments the fade counter `+0x70` by one until duration
`+0x6c`. It takes no elapsed-time or sample-count argument. The queue is
serviced earlier in the same host pump; neither counter is the 160-sample DSP
clock. A fixed wall-clock update cadence has not been proved.

The original float32 gain fragment yields 0, 1/180, 1/2, 179/180 and1 at
counters0,1,90,179,180, and stays1 thereafter. The BasicSound state gate at
`0x13120c` advances this fade in states0/3, not1/2. States1/3 separately advance
the pause ramp. This verifies a native pause mechanism; the sleep wrappers
above do not invoke it. No three-second fade or DSP continuity during hardware
sleep is established.

## Adapter boundary and verification

Keep cold entry, new no-intro entry, retained transport state, and master gain
as distinct operations. Browser M/volume can be an explicit host master-gain
adaptation. Restoring browser gain after mute or wake should not itself select
an archive entry. If browser sleep freezes the synth, identify that as a host
adaptation until hardware DSP sleep continuity is independently verified.

Passed: 16 entry combinations, early-skip case, two conditional power-button
return cases, notification and power-marker mapping, deferred request and
wake-event chain, suppression/restoration wrappers, 182 sequence-update passes,
six float32 gain samples and four pause-state gates. IPC, locks, event waits
and audio-command sinks are stubbed; no OS services or DSP execute. This
documentation-only commit requires no application rebuild. Physical volume
mapping, ordinary app-to-HOME policy, wall-clock fade cadence and hardware
sleep continuity remain explicit gaps.
