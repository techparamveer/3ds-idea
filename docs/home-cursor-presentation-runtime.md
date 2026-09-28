# Retained HOME cursor presentation controllers

2026-09-23. `home-cursor-presentation.ts` owns primary Scale and the two
departed-selection effect instances. It does not paint, position the primary
cursor, advance primary Loop, infer scene visibility, or connect to System.
The integration task owns those boundaries.

## API and retained state

| API | Boundary |
| --- | --- |
| `createHomeCursorPresentation(initialPrimaryScale)` | Fresh controller state with exactly two hidden effects |
| `consumeHomeCursorObservation(state, observation)` | One ordered Scale seek or departed-selection effect |
| `advanceHomeCursorPresentation(state, updates, eligibility)` | Counted layout opportunities with explicit gates |
| `updateHomeCursorEffectPositions(state, geometry)` | Mode3 grid-effect following, without a controller update |
| `sampleHomeCursorPresentation(state)` | Same immutable retained state; no work |
| `getHomeToolbarCursorAnchor(focus)` | Verified pane name, LCD center and Scale frame for focus0–7 |

The state is deeply immutable. `primaryScale` and each effect's `scale` retain
`currentFrame` and `appliedFrame` independently. An effect also retains
`visible`, departed `target`, `context`, LCD `center`, and `disappear` with
current/applied frame and native status0/1/2. `nextEffectIndex` alternates0/1.
Scale is fixed in native mode5/status1; DisAppear uses step1 and nonlooping
frames0–20. Those constants are not redundant writable state.

The caller supplies the initial primary Scale. The adapter initializes its
applied frame to that same value, and initializes hidden effects' applied
frames to0. Unused effects have null targets and an unpainted center0,0.
**These initial applied/unused poses are adapter policy.** The source fixture
used−999 to expose submissions; it does not establish native initial transform
contents. Oracle comparisons normalize only that sentinel to the documented
adapter value. Subsequent current/applied separation follows source evidence.

A `scale-seek` changes only primary current frame. A `cursor-select` starts
the next effect, shows it, copies its target/context, sets its center, seeks
effect Scale, resets DisAppear current to0/status1, and advances the index
modulo2. Existing applied frames remain untouched, including reuse of a still
visible effect. Other observation kinds are inert. The host must deliver
observations at their original ordered boundary; their offsets do not tick
controllers inside this API.

Toolbar centers come from the eight verified `LncBase_D_01` named panes,
including half-pixel Y coordinates. Raw Scale10/11/12 is preserved. A grid
effect starts at `anchor.x - anchor.scrollPixels, anchor.y`, with a defensive
copy of the observation's departed slot and anchor. Mutating a caller-owned
observation later cannot change retained state.

## Update and position ordering

The required eligibility fields are `primaryWrapperEligible` and
`effectWrapperEligible: [boolean, boolean]`. They mean an opportunity to enter
the relevant layout wrapper. Primary visibility is host-owned. Hidden effects
are additionally skipped here, matching the native global layout list.

Optional `primaryControllersInhibited` and
`effectControllersInhibited: [boolean, boolean]` describe the separate inner
layout status+5c==2 gate; omitted means false. This separation matters at the
last effect update:

1. Eligible Scale submits current and retains it.
2. DisAppear submits0 through20. Submission20 retains current20 and status2,
   with the effect still visible (the authored alpha is already0).
3. On the following wrapper call, the wrapper hides the effect before the
   inner controller gate. An uninhibited controller then reaches status0.
4. If that final wrapper call is controller-inhibited, it still hides the
   effect but retains status2. Subsequent global hidden passes cannot finish
   it. A later selection can show/restart it, preserving the old applied frame
   until the next eligible submission.

Counts must be safe nonnegative integers. Zero counts, unavailable wrappers,
hidden effects and inhibited running controllers do not accumulate hidden
time. Batches use the bounded lifetime directly and equal partitioned updates
under unchanged gates, including very large counts. Gate, event and position
changes must be applied at their actual boundaries between batches.

Position updates accept current `mode`, `context`, `scrollPixels` and slots
containing unscrolled LCD coordinates. Only mode3 follows visible grid effects
by their departed slot. Toolbar effects stay fixed. Following never seeks or
submits a controller and does not replace the original target snapshot.

The result is `{ state, unmatchedEffectIndices }`. A visible grid effect from
another context is left unchanged and listed explicitly. The host must decide
how to reset/hide it at context replacement; this unit does not invent native
cross-context slot correspondence. Missing same-context geometry is an error.

## Evidence and validation

The implementation follows the integration contract and
`scripts/firmware/TOOLBAR_CURSOR_EVIDENCE.md`. Source EUR HOME
`0004003000009802` version24576 has SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.

[The committed numeric fixture](../tests/fixtures/home-cursor-presentation.json)
copies original-ARM observations; TypeScript does not generate its expectations.
It pins toolbar fixture
`00af50c4d548f39e5878f208298dcc48f98110f72652fe559852525316b46e0e`
and results
`05b378c0534019c8ea8d22a966d23ea3bdfd1ac265d8b70d07fc21308f6eaa86`.
All16 source excerpt hashes were checked. Tests compare all8 toolbar seeks,
two-effect alternation,24 lifecycle updates, restart current/applied separation
and original mode3 slot-follow positions.

An additional private bounded check uses the pinned original harness's setup
and executes the original global layout updater, effect wrapper and controller
updates with explicit visibility/status gates. It leaves the original audit
and its outputs untouched. Its15 snapshots include hidden, inhibited, resumed,
terminal-hidden and restarted states, plus independent primary inhibition.
Files live under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/audio/native-cursor-presentation/`.

- `check.py`: `358b188fe5ba216e0b3c7d055a03951a7c832b4314af6caae2ccf22e81d65c49`.
- `checked.json`: `5db0ae68e93ef76f90598adf7a7ed8bbd483cdf7ee8458965659208e654a2490`.
- `export-fixture.py` copies the numeric evidence and pins its own hash in the
  committed fixture. Tests require neither firmware nor Unicorn.

The new11 test groups and existing Loop/scroll tests pass40 tests,0 failures,
0 skips. They also cover all64 eligibility combinations at each lifetime
boundary, batch partitioning, safe large counts, immutable target copies,
sampling, and explicit context mismatch. Type checking passed.

No executable bytes, firmware resources or source disassembly are committed.
This scope does not implement full primary visibility, Select/Decide, host
lifecycle, context reset, audio, GPU painting, physical cadence or browser
acceptance. System, navigation, Loop, scene and painter files are unchanged.
