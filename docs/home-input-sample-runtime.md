# Pure HOME source sampling

2026-09-23. `src/os/home-input-sample.ts` provides immutable source snapshots
and explicit sampling for HOME's digital and primary analog channels. It is
unconnected to System, scene input and persistence. Generic `app-input.ts`,
navigation and painters remain unchanged.

## API

| Function | Effect |
| --- | --- |
| `createHomeInputSampler()` | Empty digital sources, neutral primary axis, zero previous masks |
| `setHomeDigitalSource(state, sourceId, heldMask)` | Replace one source's whole held mask; zero removes it |
| `setHomePrimaryAxis(state, x, y)` | Replace the single primary axis with a float32 normalized snapshot |
| `sampleHomeInput(state)` | Derive both channel edges, advance their histories and return combined masks |

The retained state contains `digitalSources`, `primaryAxis`,
`previousDigitalHeld` and `previousPrimaryHeld`. All returned states and their
source records are frozen and detached from mutable caller records. Source
updates leave both previous masks intact. Only sampling consumes a snapshot:

```ts
const sampled = sampleHomeInput(sourceState);
sourceState = sampled.state;
const produced = pollHomeInput(producerState, {
  ...explicitProducerGates,
  ...sampled.combined,
});
```

`sampled.digital`, `sampled.primary` and `sampled.combined` are frozen
`{ held, pressed, released }` records. There are no timestamps, autonomous
polling, queued events or inferred display updates. Multiple source updates
can precede a single sample. A down/up pair entirely between samples therefore
leaves no edge; integration must explicitly decide its sampling boundary.

Source snapshots and previous masks are transient input state. They belong
outside persisted HOME view histories. No settings schema is changed here.

## Channel semantics

All digital sources are ORed **before** calculating digital edges. Native
reader bit `0x2000` is then cleared before the edge calculation, as established
by `0x12cb48..6c` and the original reader fixture. No hardware name is assigned
to that bit or to `0xc000`; source masks use unsigned16 native bit positions.
Source IDs are adapter identities, not claims about native device registration.

The primary axis uses normalized native coordinates: positive X is right,
positive Y is up. Both components are retained as float32. Comparisons are
strict and independent:

| Comparison | Mask |
| --- | --- |
| `x > 0.5` | right `0x10` |
| `x < -0.5` | left `0x20` |
| `y > 0.5` | up `0x40` |
| `y < -0.5` | down `0x80` |

Equality is neutral; diagonals can contain both axes. Browser positive-Y-down
conversion belongs to a later scene/System adapter. There is one primary
analog channel, with no invented arbitration between analog devices.

Each channel computes `pressed = held & ~previous` and
`released = previous & ~held`. Corresponding channel masks are then ORed.
Combined edges are never recalculated from combined held bits. Two digital
sources holding right keep it held until both release, but primary analog
right returning to neutral emits a right release even if digital right remains
held. The pure producer consequently emits held5 then release7 in that case.

Invalid/nonfinite/out-of-range axes, non-uint16 masks, invalid source identities
and malformed histories throw before returning a new state. Samples are not
silently clamped, neutralized or accepted as stuck controls. The caller owns
handling an error and any explicit input-release policy.

## Native evidence and validation

Source: owner-supplied EUR HOME `0004003000009802`, version24576; executable
SHA-256 `243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
The existing `HOME_INPUT_EVENT_EVIDENCE.md` documents the reader, primary-axis
thresholds/edges and producer ordering.

[The numeric fixture](../tests/fixtures/home-input-sample.json) pins the original
harness/results and copies its 9 threshold cases, 28 analog polls, 4 overlapping
source polls and 8 digital reader transitions. An additional private original-ARM
check provides 7 traces/55 polls, including digital source handoffs, independent
channel edges, quadrants, bit clearing and float32 neighbors of both thresholds.
In those additional cases, browser-source OR is supplied as an aggregate
endpoint to the actual native reader; native code establishes the resulting
edges, not the browser source-identity policy.

Private additions are under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/audio/native-input-sample-runtime/`.
`check.py` uses only declarations from the pinned original input harness;
it does not rerun or rewrite its existing experiments. It executes the native
reader once through `0x117024`, then the original producer `0x1039d0`, with
supplied ring data and normalized-axis endpoints. The original 17 source
excerpts were hash-verified again.

Additional check SHA-256:
`282020c60290d5696e0e89686772e0643a1ccd1c21df0493e7697503910f5e4c`.
Additional result SHA-256:
`1be5d590dfea653314188e43e6816e9973371a1a65200b3a0ccdb468649afb48`.
The adjacent `export-fixture.py` validates those pins and exports observations;
its hash is recorded in fixture provenance. No executable bytes are committed.
Run the check with the private firmware tree's `assets/research-venv/bin/python
-B`, then the exporter with Python3. Repository tests use only committed numeric
observations and do not require firmware or Unicorn.

Focused sampler/producer verification: 76 passed, 0 failed, 0 skipped (27 sampler
tests, 49 producer tests). The sampler covers 19 native traces/104 polls, source
snapshot consumption, freezing, source identity safety and invalid values.
The producer tests consume sampled masks and compare recorded native events.
`npm run typecheck` passed.

This establishes the pure normalization boundary. Physical calibration, raw
service readiness, the additional gated analog channel, handler reentrancy,
browser coordinate mapping, sampling frequency and live scheduling remain
outside this commit. Root owns the reviewed live integration contract.
