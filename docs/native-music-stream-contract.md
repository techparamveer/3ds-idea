# Native music streaming boundary

The persistent engine is verified independently; browser output transport is
the next separate boundary. Integration owns `audio.ts`, the shared
gesture-unlocked AudioContext/master gain, OS policy and public promotion.
Assets work owns pure resampling/ring/protocol modules and dedicated worker/
worklet entries under `native-home-audio/`, plus a standalone ESM emitter and
focused conformance evidence. First emit only to an explicit SSD output path.
No new package dependency, guessed Next worklet bundling, SAB or isolation
headers are required. Carry the module licence into emitted delivery.

## Agreed data path

A synthesis worker receives owned raw manifest/resource bytes and validates
them there; opaque decoded handles cannot be cloned across workers. It owns
one persistent engine and continuous output-rate resampler per epoch. Transfer
output-rate Float32 stereo blocks directly over a MessageChannel to an
AudioWorklet, whose fixed ring buffer only accepts and drains ordered PCM.
No fetching, hashing, synthesis or heavy diagnostics run in `process()`.

The resampler accepts contiguous160-frame native32728Hz packets and preserves
its rational32728/outputRate phase, FIR history and lookahead across every
transport chunk. Use a deterministic windowed-sinc FIR with documented kernel
delay and independently measured passband/alias response. Normalize int16 by
32768; do not fit gain, pad each chunk, restart loops or reset interpolation
history. This output-rate conversion is host adaptation, not native DSP parity.

Every control, PCM, acknowledgement, credit and diagnostic carries protocol
version and epoch. Worklet begin acknowledgement precedes worker start.
Reject duplicate/gapped/out-of-order/oversize blocks without overwriting unread
samples. Bound credits by accepted plus in-flight frames. Use1024-output-frame
chunks and initial approximate100ms low-water/200ms target/500ms capacity for
initial browser tests, not as measured underrun guarantees. The worker yields
between bounded chunks; recycle transferred buffers where practical.

Pause/resume mechanically retain synthesis/resampling/queue state and freeze
consumption, with boundary acknowledgements. Stop immediately gates music,
invalidates the epoch and destroys stream state, retaining only validated
resources. Dispose closes ports, listeners and worker/node resources but never
closes the shared AudioContext. Unknown/unsupported runtime capabilities or
processor errors report music unavailable while short effects remain usable.
No fallback to the rejected fixed WAV music loop is allowed.

During an active underrun, emit zero only for missing output frames, count
exact missing frames/events, and rebuffer to low-water without discarding or
repeating source samples. Report the resulting transport delay. Startup
priming and intentional pause are not underruns. Honor actual quantum length.

## Integration API and remaining policy

Integration will own `createNativeMusicTransport({context,destination,workerUrl,
workletUrl,onDiagnostic,environment?})`: prepare(rawPack,signal),
start({entry,when?}), pause(), resume(), stop(), dispose() and status(). Start
creates a new engine/resampler epoch and reports its actual firstContextFrame.
Generation-check non-cancellable addModule completion; stale completion cannot
create or start a stopped node. No secret catch-up or modulo-loop seek.

These primitives deliberately do not decide native main/resume entry choice,
mute, app-return, sleep or hidden-tab policy. Those mappings remain an explicit
integration/source task. Keep short effects on the existing master gain, with
a separate music gate for immediate music cancellation.

## Required gates

Prove chunk-grouping independence, long rational phase counts, impulse/DC/sine
and alias response, queue wrap/credits, arbitrary quantum sizes, stale epochs,
precise underrun/rebuffer ordering and disposal. Validate standalone ES module
imports and absence of TypeScript paths. Root performs the first actual
production-served worker/worklet module-load and stereo handshake smoke before
public promotion, then sustained playback across jumps, UI/effect load and
forced worker stalls. Runtime diagnostics are bounded low-frequency counters
and state/error transitions, never per-quantum logs or full engine snapshots.

`native-music-pack.ts` supplies the browser fetch boundary. It loads exactly the
eight named sequence/table/sample resources, streams with declared and actual
byte limits, rejects redirects and truncated resources, and aborts sibling
requests on failure. It returns raw manifest plus owned ArrayBuffers; the worker
still validates source identity, digests and grammar before synthesis. No
AudioContext is created by loading a pack. Five focused loader tests cover
normal bytes, malformed manifests, streaming limits, HTTP errors and aborts.
