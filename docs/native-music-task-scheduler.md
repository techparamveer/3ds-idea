# Worker chunk scheduling

The music worker now uses `createTaskScheduler` from
`src/os/native-home-audio/task-scheduler.ts`. A worker-local MessageChannel
replaces nested zero-delay timers, avoiding their minimum-delay clamp. Each
posted task still produces at most one 1024-frame output chunk before yielding.
This scheduling channel is separate from the direct worker–worklet PCM channel.
It changes no engine, resampler, PCM, credit or buffer configuration.

Pending tasks hold callbacks in a map. Delivery removes one callback before
running it. Cancellation deletes it, so an already posted message cannot run
cancelled work. The controller also keeps its existing schedule-ticket guard.
Disposal drops callbacks and closes both scheduling ports before the worker
scope closes. Posting errors and task exceptions remain visible through the
controller's worker-source error or the worker's uncaught-error path.

The existing worker status response includes three additional scalar counters:

- `maxScheduleDelayMs`: largest interval from scheduling a chunk to its task
  beginning, including contention while other work runs.
- `maxChunkMs`: largest synchronous chunk synthesis/resampling/transfer duration.
- `chunksProcessed`: successfully transferred output chunks.

The controller accepts an optional fourth constructor argument, a monotonic
millisecond clock, defaulting to `performance.now`. Counters reset with cleared
stream state on prepare/start/stop/dispose/failure; pause/resume retain them.
They add no per-chunk messages or samples to main. The main transport allowlists
these fields when a status reply arrives; `status()` itself remains read-only.

`tests/native-music-scheduler.test.mjs` covers posting, cancellation, disposal,
error propagation, real local MessageChannel task/microtask ordering and worker
exit. Its two controller cases optionally use the audited private resource pack
through `NATIVE_MUSIC_TEST_PACK=/absolute/path/to/pack`. They check deterministic
queue/work timings, per-stream reset, cancellation, status-only reporting,
worker source errors and exact PCM against the unchanged engine/resampler.
The fixture's bytes remain outside the repository. Without that variable,
those two cases are explicitly skipped.

Local standards implementations and deterministic checks do not prove browser
latency or underrun tolerance under GPU/CPU load. Integration owns re-emission
and production-browser comparison of these counters with output underruns.
