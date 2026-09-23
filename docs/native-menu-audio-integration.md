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

The checked ordinary native state10 return enqueues stop30/play-now/stop30 in
queue pass1 and a no-intro180 entry due on pass4. Pass1 follows the return callback
in the same application update. Original ready/start/stop execution tears down
the temporary fresh first start before any sound update, so the browser omits
that inaudible intermediate allocation on this successful path. It schedules the
actual no-intro engine after three further shared updates, then begins calculated
gain at float32 1/180 on its first ready update. Repeated paints at the same count
do not consume queue passes. Resource preparation can happen while pending.
See scripts/firmware/home_audio_HOME_RETURN_EVIDENCE.md for checked gates, sinks
and failure cases.

This reproduces counted ordering under the current host update adaptation, not
native wall-clock/sample timing or every return route. Native state11 disables
music in this helper; the current portfolio phase transition has no corresponding
full APT state distinction. Ordinary launch's exact stop producer/timing, native
readiness on pass4, stop30 mixing of an existing sound and first DSP sample timing
remain unverified. A slow browser preparation starts only when ready without
seeking ahead or claiming that it met a native deadline.

Short effects now use the reproduced cue-only v8 pack: ten native WAVs and a
provenance manifest,1,255,395 bytes total. All ten WAVs equal the previously
checked v8 candidate; the native select/folder waveform evidence therefore
carries forward by byte identity. The old thirteen-file delivery was preserved
on SSD at audio/public-before-cues-v8, and both unused music WAVs were removed
from public delivery. Complete input-to-native-sound event mapping remains a
separate check; asset identity does not prove trigger timing.

## Verification

The focused owner/transport/pack suite passes37 tests; typecheck passes. Owner
coverage includes gesture gating, shared context, no baked music fetch/seek,
overlapping cues, mute/sleep identity, counted gain, power cycling, fetch/start
cancellation, rapid-return race, failed worker retry, asleep startup and disposal.
The production transport's513.77-second stress proof is documented separately in
native-music-browser-validation.md. The combined default/music integration passed523 tests, followed by37 relevant
audio tests after counted return changes. The final production application
build passed; its live console fetched one music pack, played cold entry at
epoch2, stopped to prepared epoch3 in Work, and returned with a fresh no-intro
entry at epoch4, with no reported underrun. All served music resources returned
HTTP200; no music WAV was fetched. The development capture hooks were absent
in production. Details are in reference/production-native-owner-lifecycle.json
and production-native-owner-start.json under the firmware SSD root.

Real keyboard mute and lid sleep retained music epoch2. Sleep froze the HOME
count at7244 while synthesis continued silently; wake retained the same stream.
The cue-only exporter suite passed44 tests with the pinned renderer and real
archive configured. Production decoded all ten v8 effects and a real selection
input reported select with no asset/transport error. The initial converter test
attempt lacked its required renderer environment, and a second used the source
research Python without NumPy; the correctly configured audio runtime passed.
Those setup failures did not change the application or public cue data.
