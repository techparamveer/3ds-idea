# Keyboard common_back control port

`src/os/native-keyboard-audio/sequence.ts` implements the isolated keyboard
return/cancel sequence for native cues 6 and 7. It matches the original
executable's backend control observations, float32 words, update/quantum order,
eight-note allocation and seventeen-wave ownership through natural completion
and explicit-stop release tails. This is a control port; no browser audio or
hardware decoder is exercised.

The source identity and prior track/command evidence are in
[sequence validation](firmware-keyboard-sequence-validation.md). This pass uses
the same keyboard executable SHA-256
`a0b78005b0a99116ca703bc9b7625ce1b0f2d4cc45f66fc6fb9ab8a34244d4f0`
and source-bound `common_back.sseq` plan. It does not change the frozen resource,
event, parameter or sequence artifacts, public delivery, HOME audio or scene.

## Host API

```ts
import { createKeyboardSequence } from './native-keyboard-audio/sequence.ts';

const sequence = createKeyboardSequence(6); // 6 return, 7 cancel; same source plan
const controls = sequence.advance();      // exactly one native player update
sequence.stop();                           // releases tracks, retains tails
const status = sequence.status;            // immutable snapshot
```

`advance()` returns an immutable ordered batch. Every event has `update` and
`quantum`; note events also have `noteSlot` and `waveSlot`. `play` includes source
resource ID 13 (Proton) or 14 (kalimba), and float32 `gain`, `pitch`, `pan`.
`gain`, `pitch` and `pan` changes carry a float32 `value`. `stop` releases that
wave owner. The final `wavePass` means service all seventeen wave slots in
ascending order, after all due sequence service quanta.

`play` prepares/queues a wave. The transport must defer its audible start and
pending gain/pan application to `wavePass`, following the original wave contract.
Parameter changes may arrive between preparation and that first pass. The
original backend also performs resource/timer/loop initialization during prepare;
see [wave parameters](firmware-keyboard-audio-parameters.md). The control port
does not replace that downstream conversion or the loop codec state.

`status.sequenceActive` describes track execution. `status.silent` additionally
requires no pending note controls or owned wave voices. `status.owners` contains
the current note-to-wave mapping. Consumers must continue `advance()` until
silence when allowing a natural release. At natural completion quantum 161,
four wave owners remain. Final stop is quantum 252, update 76. Calling `stop()`
twice is harmless; it does not clear existing tails. An immediate host teardown
or audio-context interruption needs a separate transport lifecycle policy.

Each instance owns an exclusive synthetic seventeen-wave pool. Do not connect
two instances to the same physical slot namespace without arbitration. This
module does not implement the native two-sequence arbitration, additional SSEQ
opcodes, external channel loss or a general sequencer. Only cue IDs 6/7 are
accepted. No milliseconds, browser refresh rate or wall-clock schedule is
inferred from the native player update.

## Arithmetic and compact source data

The player accumulator adds float32 word `0x41855555` and subtracts float32 5.0
per service quantum. Each quantum flushes pending backend controls before
sequence progression and envelope advancement. The first six updates end at
quanta 3, 6, 9, 13, 16 and 19. Sequence ticks begin at quantum 1 and occur every
second quantum. Eight note slots use the first minimum priority; starts are
flushed in a second pass after all queued stops/changes. Freed wave slots return
to the seventeen-slot FIFO.

Track controls are a compact declarative transcription of the already-verified
40-opcode/10-note plan, not a pre-recorded backend event stream. Duration counters
advance before parsing a track tick. Current pan/gain propagate before a newly
expired note enters release; already-releasing notes retain their prior controls.
Track end and explicit stop detach notes while preserving their release phase.

The envelope starts at -723×128. Native attack coefficients are 26 and 137;
decay steps are 548 and 295; release steps are 65535 and 426. Attack uses integer
multiplication and shift, followed by decay/sustain/release attenuation. Velocity,
track volume, expression and master volume contribute signed attenuation before
the native gain quantizer. Native master volume is 110 for both cues.

`math.ts` carries only the math data necessary for this fixed sequence:

| Data | Original source | Use |
| --- | --- | --- |
| 724 strength bytes | `0x1a79e7`, conversion `0x13107c` | Exact gain quantization over attenuation -723..0 |
| Ten signed gain entries | `0x1a7cdc` | Required velocity, volume, expression and sustain inputs |
| Two attack entries | `0x1a79d4`, setter `0x138ab4` | Inputs 123/110 map to 26/137 |
| Three pitch float words | Native `0x1357e0 → 0x138bf8` | Key-root offsets +4/-3/-6; original power results |
| Divisor shifts and float constants | `0x1a79cc`, `0x130dec`, `0x1355dc` | Encoded gain and asymmetric signed-pan conversion |

Strength table SHA-256:
`23f9a4739634a8efaf331affbd056dc0584e315fa26d31541a107529b3224660`.
Gain uses the integer shift first, then float32 multiplication by word
`0x3a010204`. Positive pan uses float32 `1/63` word `0x3c820821`; negative pan
uses `1/64`. Pitch results are source-evaluated float words `0x3fa14518`,
`0x3f5744fd`, `0x3f3504f3`. Host `Math.pow` is not used as an assumed substitute.
The private oracle evaluates the original pitch routine again and records
source addresses/hashes for the tables. No original executable instructions,
complete archive, numerical replay, disassembly or PCM is committed.

## Differential evidence

`tests/helpers/keyboard_sequence_control_oracle.py` extends the original native
probe with backend-entry observations and wave-slot ownership. It captures full
control float words and per-update status, then compares the TypeScript output.
It next creates a fresh original wave player, without requesting the native
sequencer, and feeds the TypeScript controls into its original backend methods.
At each `wavePass` it runs the seventeen original wave services in order.

That replay matches every full six-word CSND command record, including its
update/quantum stamp, and checks every note/wave handle after each backend call.
All 1,481 command records across eight cases match. This validates the control
boundary and ownership against the original wave engine; it does not establish
that a future TypeScript/WebAudio wave transport produces the same commands or
audible output.

| Cue | Stop after update | Controls including wave passes | CSND commands | Quiet update |
| --- | --- | --- | --- | --- |
| 6 | Natural | 521 | 290 | 77 |
| 7 | Natural | 521 | 290 | 77 |
| 6 | 0 | 2 | 0 | 2 |
| 6 | 1 | 107 | 57 | 42 |
| 6 | 10 | 226 | 89 | 58 |
| 6 | 20 | 373 | 175 | 66 |
| 6 | 48 | 521 | 290 | 77 |
| 6 | 60 | 521 | 290 | 77 |

Stop 48 falls just before natural sequence completion; stop 60 is after track
completion while detached tails remain. Stop 0 prevents note allocation. Stop
10 retains the previously documented final loop stop at quantum 187.

The probe retains the declared original-image mutation checks and synthetic
channel allocation/status, physical mapping, stereo and queue boundaries from
the prior native fixtures. Loop channels stay alive until native stop. It does
not execute CSND hardware, interpolation, mixing, decoder output or a host clock.

The committed compact fixture stores provenance, complete-stream SHA-256
digests and completion milestones. Default Node tests compare every ordered
control/status stream against these native digests. Supplying the private
evidence additionally compares every observation directly and checks the full
original/replayed CSND command arrays. Tests cover immutable snapshots,
idempotent stop, independent instances and rejection of unsupported cues.

```sh
PYTHONPATH=scripts /private/venv/bin/python -B \
  tests/helpers/keyboard_sequence_control_oracle.py \
  --extracted /private/ssd/extracted/keyboard \
  --output /private/ssd/new-control-port/replay.json

KEYBOARD_SEQUENCE_CONTROL_EVIDENCE=/private/ssd/reviewed-control-port/replay.json \
  node --test tests/native-keyboard-sequence.test.mjs
```

The second command pins the reviewed artifact hash. A newly generated artifact
also records current helper/module hashes, so changed helpers require review
before replacing that pinned hash even when control/command streams agree.

Final private artifact:
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/assets/keyboard-audio/sequence-control-port/replay-reviewed.json`
SHA-256: `32d1ddaf177367076eb87354afd8647939d433f689f7c5afe7c0e362af646971`.

The 13 focused Node tests pass with private evidence enabled, and
`npm run typecheck` passes. The four earlier frozen artifacts were rehashed and
remain unchanged; the current module/helper hashes match the new native report.

The application-wide `npm test` attempt reports 802 passing, 42 failing,
2 cancelled and 7 skipped tests. Its failures include model GLB files left as
Git LFS pointers and missing `fake-indexeddb` in this worktree's shared
`node_modules`. Two worker tests hit their five-second timeout in that broad
run; their isolated rerun passes all six enabled scheduler tests (two skipped).
These unrelated worktree dependencies are not changed by this port.

`npm run build` cannot run through Turbopack because the external `node_modules`
symlink points outside its inferred filesystem root. The documented
`npm run build -- --webpack` fallback reaches compilation but fails on the
existing `silver.wgsl` import: the project config supplies that loader only for
Turbopack. Neither production build is reported as passing. Browser and shader
checks do not apply to this isolated module; live integration remains pending.
