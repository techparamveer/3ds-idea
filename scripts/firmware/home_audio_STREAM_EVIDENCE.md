# Persistent music output transport

The pure engine now has a continuous output-rate resampler, credit-controlled
worker-to-worklet transport and standalone browser ES module emission. The
focused checks establish sample ordering and transport mechanics. Production
browser verification and OS policy remain integration responsibilities.

The protocol is [STREAM_PROTOCOL.md](../../src/os/native-home-audio/STREAM_PROTOCOL.md).
The engine's separate bounded model-conformance evidence is
[home_audio_ENGINE_EVIDENCE.md](home_audio_ENGINE_EVIDENCE.md). Output conversion
is host adaptation; it does not establish Nintendo DSP or hardware parity.

## Continuous conversion

The resampler accepts contiguous 160-frame stereo PCM16 packets at 32728 Hz.
An integer rational clock retains the exact numerator and native position for
each output sample. FIR history and phase survive every native packet and
1024-frame transport chunk. Samples are divided by 32768, with no gain fitting,
per-chunk padding, loop reset, seam fade or interpolation restart.

The kernel uses a normalized Blackman-Harris-windowed sinc with 1024 fractional
phase intervals and linear interpolation between their coefficient rows. Its
cutoff is 0.45 times the lower sample rate, with measured passband through 0.40
and stopband from 0.50 times that rate. The half-length is
`ceil(48 * max(1, 32728 / outputRate))` native frames. The conceptual lookahead
becomes a fixed causal delay; only stream startup uses zero history. Pulling
without sufficient input returns fewer samples without advancing the clock.
Native-rate output still traverses the FIR; there is no identity bypass.

| Output rate | Taps | FIR delay |
| --- | ---: | ---: |
| 8000 Hz | 394 | 6.019311 ms |
| 16000 Hz | 198 | 3.024933 ms |
| 32728, 44100, 48000, 96000, 192000 Hz | 96 | 1.466634 ms |

These are conversion delays only. They exclude priming, queued PCM, scheduling,
AudioContext/device latency and any accumulated underrun gap.

## Independent response and delay evidence

`measure-native-audio-stream.mjs` writes actual Float32 output for impulse, DC,
1 kHz sine and deterministic noise at seven rates from 8 to 192 kHz. At the two
downsample rates it also writes tones at 0.505, 0.6 and up to 0.9 times the output
rate. It records 17 evenly spaced kernel phases and source hashes.

`check_music_fir.py` independently evaluates NumPy FFT responses, least-squares
tone amplitudes, impulse location/centroid and 3000 noise sample positions per
rate using an analytic sinc/window calculation without the JS coefficient
table. Its report hashes every measurement input and the checker itself.

Across the seven tested rates:

- Largest absolute measured passband deviation: **0.000028642 dB**.
- Largest measured output impulse stopband: **−110.8567 dB**.
- Largest sampled-phase kernel stopband: **−111.2963 dB**.
- Largest measured above-Nyquist tone alias: **−124.3759 dB**.
- Steady DC error: **0** in stored Float32 output.
- Largest analytic-reference error: **3.871 × 10⁻⁷** normalized sample units.
- Largest absolute impulse centroid error: **0.000014147 output frames**;
  every impulse peak is within 0.6 output frame of the predicted delay.

These are finite synthetic measurements at the listed rates/phases, not a
claim about every rate, all input signals or audio-device behavior. Synthetic
fixture generation timing is recorded but is not a browser performance budget.

## Transport mechanics and bounds

The synthesis worker validates owned raw resource bytes, then owns one engine
and resampler per playback epoch. It produces at most one 1024-output-frame
chunk per task and yields before scheduling another. A direct MessageChannel
transfers interleaved Float32 stereo to the worklet. Main handles controls and
diagnostics only. The worklet copies blocks into its fixed ring, returns wire
buffers for reuse and grants monotonic absolute credits that include in-flight
data. The worker retains at most four recycled buffers; additional in-flight
storage is bounded by credit. No SharedArrayBuffer, isolation headers, package
dependency or Next bundler behavior is required.

The worklet does no synthesis, fetching or hashing in `process()`. It drains the
actual output quantum size, honors scheduled frame offsets and reports actual
start time. Pause preserves the exact prior priming/running/starved state and
acknowledges at a render boundary. Resume restores credit even when production
became ready during a startup pause. These two cases have regression tests.

Underrun fills only missing output frames with zero, records the missing count,
and waits for low-water before reading the exact next queued music sample.
Startup and intentional pause are not underruns. Stop invalidates stream state
but retains validated resources and endpoints. Disposal closes direct ports
and ends processing. Unsupported channel shape reports one stamped error and
stays silent/alive until disposal. The main adapter owns its immediate music
gate, endpoint cleanup and preservation of the shared AudioContext/effects.

Initial low-water/target/capacity values are approximately 100/200/500 ms rounded
to chunks and powers of two. They are test settings, not proven browser stall
tolerance. A worker pause does not retroactively cancel already transferred
PCM; the paired worklet pause freezes consumption.

## Verification and delivery

- **18 focused Node tests pass**: five engine tests plus thirteen streaming
  tests. Coverage includes exact arbitrary grouping, a ten-hour rational-clock
  calculation, wrap/overflow/order rejection, credit bounds, late epochs,
  scheduled/missed starts, arbitrary quanta, pause regressions, precise
  underruns/rebuffering, stale async decode and disposal. The ten-hour test is
  clock arithmetic, not ten hours of sustained playback.
- The emitted-module harness runs the actual worker module in a Node worker
  isolate with actual MessagePorts and the actual worklet module under emulated
  standard globals. It compares **32,000 consumed output frames exactly**, then
  checks pause/resume, a forced **512-frame gap / one underrun event**, lossless
  rebuffer, stop/restart with `music-resume`, and disposal. This is not a browser
  module-load or scheduling claim.
- `npm run typecheck` and the separate strict worker/worklet ESM compilation
  pass. All emitted imports resolve to emitted `.js` files; there are no `.ts`
  imports or CommonJS/runtime process dependencies.
- Two independent module emissions are byte-identical: **15 files / 74,184
  bytes**, including licence and manifest. The manifest records compiler
  version, source hashes, entries and every delivered file's hash/size.
- Full application/model tests and builds were not repeated for this isolated
  module change. The existing LFS-pointer and Turbopack symlink limitations are
  recorded in the engine evidence. No shader, public asset, OS policy, existing
  audio adapter, browser or Azahar session is changed in this assets worktree.

Private artifact root:
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/assets`.

Final modules are `audio-stream-modules-v2` and `audio-stream-modules-v2-repro`.
The earlier `dev1`, `dev2` and `v1` directories are superseded. Final module
manifest SHA-256:
`ea409a21636e2010d61f5199202a8f3434c9906140217a3e82c0ce6ddee2989f`.
FIR measurements/checks are `audio-stream-fir-v3`; the independent report hash is
`77f311539b4759a180e5d1499b7436ef84b70fabc05041095e7e47713d3fab71`.
`audio-research/audio-stream-validation-v2.json` verifies the current source
hashes, reproducibility and evidence links. The module harness report is
`audio-research/audio-stream-modules-v2-check.json` and focused test log is
`audio-research/audio-stream-focused-tests.log`.

Reproduce with fresh SSD output paths:

```sh
node --test tests/native-home-audio.test.mjs tests/native-audio-stream.test.mjs
npm run typecheck
node scripts/emit-native-audio-modules.mjs /Volumes/YourSSD/music-modules
node scripts/check-native-audio-modules.mjs /Volumes/YourSSD/music-modules \
  /Volumes/YourSSD/music-pack /Volumes/YourSSD/module-check.json
node scripts/measure-native-audio-stream.mjs /Volumes/YourSSD/music-fir
python scripts/firmware/check_music_fir.py /Volumes/YourSSD/music-fir
```

Integration must still verify the production-served module graph and stereo
handshake in a browser, sustained playback across source jumps under UI/effect
load and forced stalls, capability/error behavior and lifecycle cleanup. Entry
selection, mute, sleep and app-return mapping remain separate source/policy work.
