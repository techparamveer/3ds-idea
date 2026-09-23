# Streaming protocol v1

This describes endpoint mechanics only. OS mute/sleep/app-return and selection
of the main versus resume entry remain integration policy.

`transport-protocol.ts` is the shared definition. Every message carries
`version: 1`, a nonnegative integer `epoch`, and `type`. One worker, worklet
node and direct MessageChannel live for one main transport instance. Stop
retains this infrastructure and validated worker resources. Dispose destroys it.
The processor is registered as `native-home-music-output-v1`; construct the
AudioWorkletNode with zero inputs, one output and `outputChannelCount: [2]`.

## Main-thread setup and start

1. Attach the two MessageChannel ports once, sending
   `{version:1, epoch:0, type:'attach', port}` to worker and worklet control ports
   with the corresponding transfer list. Each returns `attached` with `source`
   (`worker` or `worklet`). The worklet's ordinary node port remains its main
   control/diagnostic channel.
2. Send worker `prepare` with current epoch, manifest and
   `files: [{name, buffer: ArrayBuffer}]`. Transfer owned byte copies. It validates
   resources inside the worker and returns `prepared`; an opaque decoded engine
   resource handle cannot cross workers. Prepare does not generate or play PCM.
3. Choose a fresh playback epoch greater than the worklet's current epoch. Send
   worklet `begin` with `config: musicBufferConfig(context.sampleRate)` and
   optional `whenContextFrame` (absolute AudioContext sample frame). Wait for
   `begun` before sending worker `start` with the same epoch, `entry` and
   `outputRate`. The worklet rejects duplicate begin epochs.
4. Worker sends `producer-ready` directly to the worklet, which grants initial
   credit. Worker reports `producer-started` to main; this is not audible start.
   Worklet reports `started` only after priming and reaching the requested frame,
   with `firstContextFrame` and `missedByFrames`. A missed time never causes a
   hidden sample skip. The actual output quantum length is honored.

No native PCM, output PCM or credit message is forwarded through main.

## Direct data port

- Worklet → worker: `credit {creditEnd}` authorizes output frames before the
  absolute exclusive end. It is monotonic per epoch and bounds accepted plus
  in-flight data. Credit messages do not mean that the data has been consumed.
- Worker → worklet: `pcm {startOutputFrame, frames:1024, buffer}` transfers
  interleaved stereo Float32 samples at the AudioContext rate. The first start
  is zero; every subsequent start equals the last accepted end. Wrong size,
  nonfinite values, unavailable credit, duplicate/gapped starts and overflow
  are visible errors, never silent overwrites.
- Worklet → worker: `recycle {buffer}` transfers copied/drained wire storage back
  for bounded reuse. The ring already owns its samples. Old-epoch PCM is ignored
  and its buffer may still be recycled; it cannot enter the current ring.

The settings round approximately 200 ms low-water, 300 ms target and
500 ms capacity to output chunks/powers of two. The original 100/200 ms refill
policy underran during concurrent full-suite CPU load; a measured 155.2 ms
chunk and 28.2 ms scheduling delay motivated this larger reserve. These are
measured test settings, not a guarantee against arbitrary host stalls. Credits never exceed ring capacity.
One worker task produces at most one output chunk, then yields.

## Pause, stop, disposal and failure

Send `pause`/`resume` to both endpoints with the current epoch. Worker pauses
future production without resetting it. Worklet freezes consumption and emits
`paused`/`resumed` at its next process boundary, including `contextFrame` and
`outputConsumed`. Retained PCM remains ordered when consumption continues.

For stop, gate music on main immediately and advance the epoch before sending
`stop` to both endpoints. They return `stopped`, reject older messages and
clear stream state. Only validated worker resources remain cached. A later
start uses another fresh epoch. Stop does not close the shared AudioContext.

`dispose` advances the epoch, closes direct ports and returns `disposed`.
Worker entry closes its scope; root should also terminate the Worker, close
main control ports and disconnect its node/gain/listeners. Disposing never
closes the AudioContext. Non-cancellable worklet-module loading and root fetch
completion still require main-thread generation checks.

Active underruns output zero only for missing frames. The read counter advances
only for actual music samples; after underrun the worklet waits for low-water,
then resumes at the exact next sample. `underrun` and `rebuffered` report the
transport gap; there is no dropped-source catch-up, repeated audio or seam fade.
Startup priming and pause are not counted as underruns. The processor remains
alive while paused/starved/stopped and returns false only when disposed.

Both endpoints report `error {source,error}` and support a main `status` request.
Worklet also sends status at most once per second of render time plus immediate
state transitions. Its status includes state, outputRate, firstContextFrame,
outputConsumed/Accepted, bufferedFrames, creditEnd, minimumBufferedFrames,
underrunFrames/events, staleMessages, discontinuities and failure. Worker status
includes state, entry, outputRate, creditEnd, outputProduced, staleMessages,
failure and bounded resampler counters/delay. No full engine snapshot crosses
this protocol. Main owns error presentation and keeping short cues available.
