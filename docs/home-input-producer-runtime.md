# Pure native HOME input producer

2026-09-23. `src/os/home-input-producer.ts` reproduces the bounded
digital/primary-axis path through EUR HOME's producer at `0x1039d0`.
It is an **unconnected building block**: System, navigation, scene input,
generic application input and painters are unchanged. These tests do not
establish live HOME input acceptance or physical scheduling.

## Interface and ownership

`createHomeInputProducer()` returns frozen zero-initialized state:

```ts
{ repeatCandidate: 0, repeatCounter: 0, previousCapture: false }
```

`pollHomeInput(state, input)` returns frozen `{ state, events }`, including
frozen event records `{ type: 4 | 5 | 6 | 7, mask: number }` in native call order.
It consumes exactly one explicit producer call. There is no timestamp, frame
count, navigation state, cursor controller or DOM dependency.

All input fields are required:

| Field | Boundary |
| --- | --- |
| `held`, `pressed`, `released` | Normalized unsigned16 masks combining digital and primary-axis channels |
| `touchActive` | Native active-touch flag already determined by its service |
| `captureActive` | Aggregate capture flag from the native handler-list scan |
| `hostFlags` | Unsigned32 caller flags; bits `0x107` inhibit processing |
| `gateWord14` | Unsigned32 native producer field `G+0x14`; wider meaning unassigned |
| `readiness10dc20`, `readiness10cd20` | Boolean results of the two native readiness calls |

The later adapter must aggregate digital devices before deriving digital edges,
derive primary-axis edges independently, then OR corresponding channel masks.
This module does not derive edges from combined held bits. For example,
`held=right, released=right` is valid when primary analog right becomes neutral
while digital right stays held. The original fixture emits held5 then release7.
Threshold calibration, coordinate conversion and device aggregation remain
outside this commit.

## Retained native behavior

Press4 stores the **pressed** mask as the candidate and resets the shared
counter. Without a new press, held bits filtered by `0xc0f0` increment the
counter only when the nonzero candidate matches. A changed candidate replaces
the old one without clearing the counter. Repeat6 occurs at20 subsequent
eligible held polls, then every5. Held5 follows press/repeat; physical release7
follows held. Neutral polls leave the counter intact and set the candidate0.

The counter retains native unsigned32 storage and wrap. Its threshold test is
signed, matching the original ARM comparison; controlled source fixtures cover
the signed boundary and wrap. Invalid masks, counts, flags or missing booleans
throw before any state or notification is returned, even on inhibited calls.
No per-button timers or elapsed-millisecond interpretation is introduced.

Branch order matters:

1. Host flags `&0x107` return with candidate, counter and previous capture intact.
2. A nonzero `G+0x14` or failed readiness call clears only the candidate.
3. Active touch emits7 with a nonzero saved candidate, then clears it. Capture
   rising emits7 with `0xcfff` and does **not** itself clear the candidate.
   Both can occur in one poll, touch first. While either is active, ordinary
   press/repeat/held/release processing is suppressed.
4. An eligible call records current capture as previous capture. Early gates
   do not update it. This preserves capture transition behavior after a skip.

Event7 is only an output notification here. Its cursor-step reset, pending
scroll cancellation and phase retention belong to future scene consumers.

## Original-ARM oracle and reproduction

Source: owner-supplied EUR HOME title `0004003000009802`, version24576;
executable SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.

[The committed fixture](../tests/fixtures/home-input-producer.json) contains only
numeric input/state/event observations. Its provenance pins the existing
`native-input-events` and `native-cursor-acceleration` checks/results and the
additional producer check. No executable bytes or disassembly are copied.
Expected events and recorded state come from original ARM execution, never
from the TypeScript implementation. Analog fixture normalization combines the
supplied digital sequence with recorded native primary-axis edges.

Private evidence root:
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/audio/`.
The additional `native-input-producer-runtime/check.py` reads the pinned
original harness declarations without executing its old top-level experiments
or rewriting their evidence. It executes the original producer with controlled
sample, readiness and capture endpoints for22 cases/57 polls. The existing
17 source excerpts were also hash-verified.

Additional harness SHA-256:
`5b94116db7ce7854c3c658ebbb776d67f9017693a1c2df37687fa05e3d4d7b83`.
Additional result SHA-256:
`28814e9d3bc29b0073230d15fe226f28797773c0e4525bf52a2fc01b2c67f54d`.
The adjacent private `export-fixture.py` verifies pinned inputs and exports the
synthetic fixture; its own hash is recorded in that fixture's provenance.

Run the additional check with the private firmware tree's
`assets/research-venv/bin/python -B`, then its exporter with Python3.
Normal repository tests need neither private firmware nor Unicorn.

## Validation and limits

`node --test tests/home-input-producer.test.mjs`:49 passed,0 failed,0 skipped.
`npm run typecheck`:passed. No browser or application build was needed for this
unconnected pure module.
Coverage includes35 original-ARM traces/329 recorded polls, eight repeat-mask
cases, immutability, invalid inputs, mixed candidates, both78-poll experiments,
touch/capture overlap, gate precedence and counter boundaries.

The78-poll producer stream is identical with zero or one scene update after
each poll: press1, repeats21,26,…,76, release77. This does not assert any actual
scene/display cadence, nor333ms/83ms timing. The generic application latch's
420/150ms policy remains untouched.

The separately gated additional normalized-axis channel is excluded: its
getters can trigger producer callbacks independently of the primary masks,
and HOME's callback thunk augments masks. It must not simply be merged into
this producer's masks without further integration work. Handler callback
reentrancy, service side effects, physical input acquisition and scheduling
are also outside this pure boundary. Root owns the subsequent joint System
integration contract and architecture update.
