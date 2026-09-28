# Main-thread native music transport

`src/os/native-music-transport.ts` implements control and lifecycle around the
worker/worklet [stream protocol](../src/os/native-home-audio/STREAM_PROTOCOL.md).
It owns no synthesis, resampling, fetch, native entry-selection policy or fixed
WAV fallback. AudioContext creation, gesture unlock/resume, master volume,
short effects and OS sleep/app-return/mute policy remain integration-owned.

## Public API

`createNativeMusicTransport({context,destination,workerUrl,workletUrl,onDiagnostic?,environment?})`
returns:

- `prepare(rawPack, signal?) → Promise<void>`: create the transport infrastructure
  if necessary and await worker validation. `RawNativeMusicPack` is
  `{manifest:unknown, files:readonly {name:string,buffer:ArrayBuffer}[]}`.
  Buffers are transferred, not copied for retention on main; callers must treat
  them as consumed. The worker remains responsible for hashes/profile/grammar.
- `start({entry,when?}) → Promise<NativeMusicStart>`: choose `music` or
  `music-resume` explicitly; `when` is an absolute AudioContext time in seconds.
  The result is `{epoch,entry,firstContextFrame,missedByFrames}` from actual
  output start, not worker startup. Fractional requested times round up to a
  sample frame. Late starts report their delay without seeking or skipping.
- `pause()` / `resume() → Promise<NativeMusicBoundary>`: send both controls and
  await both acknowledgements, including the worklet's next processing boundary.
  Return `{epoch,contextFrame,outputConsumed}`. The epoch, queued PCM, engine and
  resampler are retained. Pause requires completed start; resume requires
  completed pause. Overlapping or redundant controls reject `InvalidStateError`.
- `stop() → Promise<void>`: gate music immediately, invalidate prior operations
  with `AbortError`, then await stopped acknowledgements. Successfully validated
  worker resources and attached infrastructure survive. A later start uses a
  fresh epoch and engine/resampler. It does not resume the stopped stream.
- `dispose() → void`: invalidate immediately, best-effort dispose both endpoints,
  terminate the worker, close control/direct handles, remove listeners and
  disconnect the node and gain. Repeated disposal is harmless. It never closes
  or resumes the shared AudioContext.
- `status() → NativeMusicTransportStatus`: return a bounded copied snapshot,
  with transport state/epoch, preparation and start result, failure and latest
  filtered worker/worklet counters. Reading status sends no messages.

Only prepare accepts an AbortSignal. A pre-aborted request does not disturb
existing playback. Aborting active preparation behaves as stop and preserves
any earlier validated resource pack. Start may supersede an earlier start or
pause/resume operation; it requires successful preparation and cannot start
during preparation or stop acknowledgement.

## Wiring, ordering and cancellation

After `audioWorklet.addModule`, create a zero-input, one-output stereo
`native-home-music-output-v1` node. Transfer one MessageChannel endpoint to the
worker and the other to the worklet with attach epoch0, and await both attached
acknowledgements. The ordinary node port is used only for main controls and
diagnostics. Main never forwards producer-ready, credit, PCM or recycle traffic.

Preparation has a fresh epoch and clears output while the worker validates
owned bytes. Playback gets another fresh epoch. Send worklet begin with
`musicBufferConfig(context.sampleRate)` and optional requested context frame;
await begun before sending worker start. A dedicated music gain is opened
before output can begin, so the first actual quantum is not muted while its
acknowledgement travels back to main. The worklet supplies silence while
priming or waiting for the requested frame.

Pause gates only after the worklet boundary acknowledgement, and resume opens
the gate before sending resume. Stop/dispose gate immediately. All control
messages carry version1 and epoch. Replies must belong to the current endpoint
instance and operation epoch; setup's attached epoch0 is accepted only while
attaching. Malformed current timing/configuration acknowledgements fail closed.
Stale messages cannot resolve pending operations, start synthesis or change
current status. Non-cancellable module completion checks its operation token
before creating nodes; stopped/disposed setup cannot resurrect itself.

Ordinary stop retains one worker/node/channel. Cancelled partial setup is
disposed and detached before any replacement setup. A transport failure also
tears down owned resources; a subsequent prepare needs a new raw pack. Module
load success may be reused, while a rejected load can be retried. Caller-owned
effects and master gain are untouched.

## Bounds and diagnostics

Each module/attach/prepare/control acknowledgement has a default 15-second
wall-clock timeout. Actual-start waiting adds the caller's explicit future
lead time; scheduling beyond the platform timer range is rejected. Suspended
contexts may not deliver worklet processing-boundary acknowledgements, so the
integration must unlock/run the shared context before requiring playback or
pause/resume completion. The transport does not circumvent gesture policy.

`environment` injects only Worker/node/channel construction and timeout
scheduling/cancellation, with an optional `timeoutMs` for deterministic tests.
Context/gain operations use the supplied shared context. Unsupported runtime
capabilities, endpoint/processor errors, transfer failures and timeouts gate
music and report failed state. There is no silent fallback to baked music.

Diagnostics contain bounded state/error transitions and allowlisted counters;
counter notifications are throttled to at most one per AudioContext second.
The latest counters remain available via status. Error text is bounded, no PCM
or engine snapshots are retained, and observer exceptions cannot break cleanup.

## Verification and integration limit

The mocked transport suite covers raw buffer ownership, direct port transfers,
stereo configuration, begun-before-start ordering, actual scheduled start,
two-endpoint process-boundary pause/resume, stop/restart resource retention,
non-cancellable module races, partial setup replacement, stale replies,
AbortSignal, bounded timeouts, malformed acknowledgements, endpoint/processor
failure, disposal, diagnostics and unsupported capabilities.

These tests validate main-thread mechanics, not real browser module serving,
thread scheduling, audio quality or underrun tolerance. Assets work owns
stream/resampler/PCM conformance, and integration owns production-origin
worker/worklet/transport playback verification. No public assets, `audio.ts`,
stream modules or scene code are changed by this transport implementation.
