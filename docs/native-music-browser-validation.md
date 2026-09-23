# Native music production browser transport validation

The emitted worker/worklet and actual main-thread adapter passed an 8.56-minute
48 kHz production-origin playback run with zero reported underruns, stale PCM or
discontinuities. This validates the transport candidate, not complete native
entry policy, hardware mixing or every browser. The live OS wiring is a separate
integration step; the test used a gesture-unlocked probe context alongside the
actual console page.

All reports are under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/`.
The source is the verified persistent native engine and raw music pack, never a
fixed WAV loop. Worker and AudioWorklet modules were served by production Next
on localhost:3001. No SharedArrayBuffer or isolation-header dependency was added.

## Sustained run and measured reserve

`audio/browser-adapter/production-v4-full.json` records 24,660,896 consumed output
frames (513.768667 seconds), exact scheduled first frame175840 with missedByFrames0,
zero underrun events/frames, zero discontinuities and zero stale endpoint messages.
The 461-test full suite ran concurrently and passed with no skips in82.76 seconds
(`integration-audio-stream-v4-tests.log`). The lowest observed buffered reserve was
7,904 frames; maximum sampled producer chunk time47.1 ms and scheduling delay21 ms.
No endpoint errors were recorded. Dispose left the caller AudioContext running;
the harness then separately closed its own context.

This candidate uses the MessageChannel task scheduler and a200 ms low-water,
300 ms target and500 ms capacity request, rounded to chunks/power-of-two storage.
At48 kHz these are10,240/15,360/32,768 frames. They are measured operating bounds,
not a guarantee against arbitrary OS stalls or a universal performance claim.

The earlier nested-timer v2 run consumed24,438,656 frames, but concurrent tests
caused five underruns totaling28,192 missing frames (0.587333 s). The MessageChannel
v3 run with the earlier100/200 ms reserve reduced this to one9,248-frame underrun
(0.192667 s). Its timing counters observed a155.2 ms synthesis chunk and28.2 ms
scheduling delay. Those measurements motivated the current reserve and184 ms
stall regression. Different runs have different CPU contention; the counters do
not prove that either change alone accounts for every improvement.

Reports: `audio/browser-stream/production-v2-final.json`,
`audio/browser-adapter/production-v3-full.json`, and the v4 report above.

## Lifecycle, delivery and sample-order checks

`audio/browser-adapter/production-lifecycle-v2.json` exercises the same main
adapter: transferred ownership of all eight raw buffers, exact pause/resume
consumption position, stop/restart from retained validated resources, cancellation
of a scheduled future start, and disposal without closing the shared context.
An intentionally paused producer caused one56,608-frame underrun; resumed output
rebuffered without reported source discontinuity. Forced probe-only controls also
produced expected discarded control acknowledgements, distinct from stale PCM.
Twenty overlapping short effects on the probe context and real console input were
also exercised in the direct-protocol run. Final OS integration still requires
these behaviors through the actual audio owner and physical/keyboard controls.

`audio/browser-stream/emitted-v4-check.json` verifies the emitted JavaScript in a
real worker-thread/MessagePort harness with an emulated worklet global:43,264 exact
ordered output frames, exact pause/resume position, a forced512-frame underrun,
lossless ordered recovery, stop/restart and disposal. This is the PCM-order proof;
browser diagnostic counters alone are not a full captured-waveform comparison.

Independent re-emission matched all16 files byte for byte
(`audio/browser-stream/emitted-v4-repro.json`). The v4 delivery manifest SHA-256 is
`ee3c51b55b158834d546cf9fec261192e362c9deb4721b8e186fb0e0b071f4d9`.
Source hashes, compiled file hashes and compiler version are in that manifest.
The v3 production application build passed before the v4 numeric buffer change;
v4 standalone emission and all relevant/full tests passed. A final application
build follows live wiring.

Original native engine/state conformance, FIR measurements and protocol bounds
remain documented in native-home-audio-contract.md, native-music-transport.md and
scripts/firmware/home_audio_STREAM_EVIDENCE.md. Ordinary app-return music mapping,
application-pump fade cadence, hardware sleep DSP continuity, native allocator
pressure and cross-device audio performance are separate remaining checks.
