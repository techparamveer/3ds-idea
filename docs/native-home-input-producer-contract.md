# Native HOME input producer boundary

First implement the pure input producer independently from the live scheduler.
Runtime owns a new `src/os/home-input-producer.ts`, focused tests, synthetic
oracle fixtures and a dedicated note. No System, scene, generic app-input,
navigation or painter changes in this bounded commit. Root will agree their
joint integration after the pending main-loop ordering evidence is reviewed.

Use `HOME_INPUT_EVENT_EVIDENCE.md` and `CURSOR_ACCELERATION_EVIDENCE.md` under
`scripts/firmware/`, plus their pinned original-ARM fixture results. Emit ordered
`HomeKeyEvent` records `{ type: 4 | 5 | 6 | 7, mask: number }`. Export an immutable
constructor and poll function accepting explicit normalized held/pressed/released
bitmasks and source-proven touch/capture/gate inputs. Name gates conservatively
when their native field meaning is not established. Keep per-poll producer state
separate from scene-update, elapsed milliseconds, cursor phase and navigation.

Reproduce the aggregate repeat candidate/counter, mask0xc0f0, press/held/repeat/
release ordering, first20 subsequent eligible held polls and later5-poll repeats,
candidate changes without a new press, skip-with-retention versus skip-with-clear
branches, and source-proven touch/capture cancellation. Event7 may occur without
a physical release. Never turn it into an automatic cursor reset inside this
module; consumers own that behavior. Non-finite or invalid masks/counts must not
silently create a stuck or fabricated input stream.

Do not convert counts to333/83ms or assume one poll per RAF/native display frame.
The live generic application latch and its420/150ms repeat policy stay untouched.
Digital-device aggregation and independently derived primary-analog edges belong
in a later normalization adapter; accepting explicit source masks here prevents
mixing that unresolved integration with verified producer arithmetic.

Tests must use expected observations from the original ARM fixture, including
the78-poll hold/release experiment (press1, repeats21,26…76, release77), changed
candidate and gate/cancellation cases, event order and immutable state. Record
the source executable and private evidence hashes with the synthetic fixtures.
Do not copy executable bytes into the repository. Run focused tests/typecheck,
commit coherently and report limitations. The module remains an unconnected
building block until the subsequent source-backed System scheduler integration;
its tests alone are not a live HOME input acceptance claim.
