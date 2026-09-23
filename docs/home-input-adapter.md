# Browser adapter for HOME direction input

2026-09-23. `src/os/home-input-adapter.ts` implements the bounded
[browser input contract](native-home-input-adapter-contract.md). It is a pure,
unconnected adapter around the existing native sampler. System, scene routing,
application input, producer/consumer, clocks and painters are unchanged by this
unit. Root owns their live integration.

## API and sampling boundary

| Export | Effect |
| --- | --- |
| `createHomeInputAdapter()` | Empty sources, neutral primary axis and zero native edge histories |
| `updateHomeInputAdapterButton(state, { source, command, phase })` | Retain a directional source's newest down/up intent; ignore browser repeat |
| `setHomeInputAdapterAxis(state, x, y)` | Replace the one primary analog endpoint, converting browser positive-Y-down to native positive-Y-up |
| `sampleHomeInputAdapter(state)` | Consume exactly one native sample, then expire pending browser pulses |
| `resetHomeInputAdapter()` | Create completely cleared adapter state; emit no cancellation |

`HomeInputDirection` is `right | left | up | down`, mapped to native masks
`0x10 | 0x20 | 0x40 | 0x80`. `HomeInputAdapterButton` has a string source,
directional command, and `down | up | repeat` phase. It accepts the corresponding
fields of the current button protocol without depending on application types.
Each digital source owns its whole current mask. A new direction replaces the
old one, and a stale up for the old direction cannot release its replacement.

`HomeInputAdapter` retains a `sampler: HomeInputSampler` and a frozen `sources`
record with each source's `{ mask, observed, pendingRelease }`. These are transient
input records, not persisted menu state. Use adapter-created state and its update
functions; do not independently replace its sampler or bookkeeping.

`HomeInputAdapterSample` contains `{ state, sample }`. `sample` is the unmodified
`HomeInputSampleResult` from the single raw sampler call, including its digital,
primary and combined masks. Retain the returned adapter `state`, which has
already removed expired pulses; retaining `sample.state` instead would lose the
adapter's release bookkeeping.

```ts
const sampled = sampleHomeInputAdapter(adapter);
adapter = sampled.state;
const produced = pollHomeInput(producer, {
  ...explicitProducerGates,
  ...sampled.sample.combined,
});
producer = produced.state;
```

The host decides when a sample is eligible and calls this operation explicitly.
Every call consumes a sample; the adapter neither knows nor duplicates producer
readiness, touch/capture, power, sleep, app ownership or shared-clock policy.
Button/axis updates never sample or call the producer. With no explicit sample,
an unobserved pulse remains pending. There are no timers or inferred frame counts.

## Explicit browser quick-click policy

A browser or accessibility click can deliver down and up before the next host
sample. This adapter holds that unobserved direction through one sample, removes
the source immediately afterward, and lets the following sample calculate its
release. This **minimum one-sample pulse is browser adaptation**, not native HID
behavior or a measured physical latency. The raw sampler is unchanged: raw
down/up between samples still produces no edge.

A down already observed by a sample releases normally. Duplicate downs preserve
that observed status, so they cannot accidentally re-arm a pulse. A new down
cancels any pending release and retains the newest direction. Multiple clicks
before a sample are not an event queue: the newest intent for each source wins.
An up/down before a release sample also preserves aggregate continuity when the
same bit remains held.

All edges still come from the native sampler. Digital sources are ORed before
deriving digital edges, so independent sources or a quick click on an already
held direction cannot manufacture another digital press. Digital and primary
edges remain independent, then their corresponding masks are ORed. A primary
release can therefore coexist with digital held for the same bit, and vice versa.
No direction priority, diagonal arbitration or repeat timing is added here.

## Primary axis and reset

The scene currently supplies one primary analog source, `pointer:CIRCLE`.
The host routes its normalized endpoints to `setHomeInputAdapterAxis`; there is
no additional axis source registry or multiple-device arbitration. The setter
inverts Y, rejects nonfinite/out-of-range values before coercion, and delegates
float32 retention and strict independent `> 0.5` / `< -0.5` thresholds to the raw
sampler. Exact equality remains neutral. The minimum pulse policy applies only
to digital downs; analog endpoints retain their ordinary sampled behavior.

Reset clears held sources, pending pulses, the analog endpoint and both native
edge histories. It returns no release events and does not reset the separately
owned producer. The host must deliver any required consumer cancellation before
reset and decide the corresponding producer lifecycle separately. This unit
does not infer cursor, navigation, close-transition or service actions.

## Validation and limits

`node --test tests/home-input-adapter.test.mjs tests/home-input-sample.test.mjs
tests/home-input-producer.test.mjs`: **102 passed, 0 failed, 0 skipped**, comprising
26 new adapter tests plus the existing 27 sampler and 49 producer tests.
`npm run typecheck` passed. Focused output is retained on the SSD under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/presentation/home-input-adapter/`.

The adapter tests use the real sampler and producer. They cover all four quick
clicks, ordinary hold/release, native repeats at polls21/26/.../76 after press1,
browser repeats, duplicate downs, independent sources, replacement and stale up,
pending release cancellation, source handoff, simultaneous channel edges,
float32 threshold neighbors and Y conversion, invalid values, reset, immutable
snapshots and the absence of implicit sampling. Existing source-oracle tests
retain their independent original-ARM pins; no new ARM experiment is claimed
for this browser policy.

This verifies the pure adapter composition. Live host routing and sampling
eligibility, browser event delivery, physical calibration and actual browser
navigation remain integration work. No browser/Azahar session, application build,
GPU check or visual-fidelity claim was part of this isolated input change.
