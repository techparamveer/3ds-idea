# Live persistent HOME music integration

The console audio owner now connects the verified native worker/AudioWorklet to
the same gesture-unlocked AudioContext and master gain as its short cues. It
fetches the allowlisted eight-resource music pack, transfers it to the worker,
and starts a persistent engine. It never fetches or loops legacy music WAVs and
never seeks by elapsed page time. Unsupported or failed music reports an explicit
failure; short cues remain usable, and a new gesture can retry native setup.

AudioContext creation/resume remains inside unlock(). The owner serializes music
setup/start work, fences requests with revisions, aborts superseded fetches,
gates immediately on HOME exit, and retains validated worker resources across
stop/restart. A separate revision-scoped music gain prevents rapid HOME return
from opening an old request. Teardown aborts pending work, disposes the transport,
disconnects both gains and closes only this owner's context. The transport itself
continues to leave caller contexts open.

Mute and accepted sleep suppress master gain without choosing a new entry or
resetting synthesis. Sleep also cancels short cues. The browser keeps the synth
running silently: retaining its identity follows the checked sound-wrapper
contract, while hardware DSP progress during sleep is still unverified. Cold
start while already asleep waits for wake. Cue completion cannot override the
current master mute/volume state.

## Explicit transition limits

The current adapter chooses cold `music` on the first HOME entry of a power
session and a fresh `music-resume` engine on later HOME entry. Power-off resets
that policy. Native no-intro ramp180 is sampled from the existing shared HOME
update count using float32 gain, never converted to an asserted three-second
native duration. The shared nominal60 Hz host clock remains provisional and is
not yet the fully proven native sound application pump.

The newly traced ordinary native return helper can enqueue more than one stop
and play command, including a countdown3 entry. This initial browser owner does
not yet reproduce that queue/stop-ramp sequence. Its one fresh no-intro start is
a bounded interim policy, not a complete app-return fidelity claim. Source
fixtures and the counted queue integration must resolve this before final
acceptance. Cold entry, retained mute/sleep identity and raw transport are
independent of that remaining return-path work.

Short effects still use the prior public cue pack in this change; v8 candidate
cue promotion and complete input-to-native-sound event mapping remain separate.
The old music WAV files may remain in the historical pack but are unused.

## Verification

The focused owner/transport/pack suite passes37 tests; typecheck passes. Owner
coverage includes gesture gating, shared context, no baked music fetch/seek,
overlapping cues, mute/sleep identity, counted gain, power cycling, fetch/start
cancellation, rapid-return race, failed worker retry, asleep startup and disposal.
The production transport's513.77-second stress proof is documented separately in
native-music-browser-validation.md. Actual console browser verification and a
final production build follow integration with the default primary banner.
