# Cold-entry context and timing boundary

This follow-up narrows the unresolved caller evidence in the
[cold-boot reveal audit](native-cold-boot-reveal-source-audit.md). It does **not**
establish the original EUR 10.7.0-32E cold-power-on duration, first visible
frame, LCD backlight order or power-indicator timing. No runtime change is
justified by this pass; the current three-second boot and final 350 ms fade
remain browser adaptations described in [power transitions](portfolio-power-transitions.md).

The isolated worktree starts at integration `12e2267`. The original HOME
executable is the same base-`0x100000` binary used by the preceding audit,
SHA-256 `243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
This is a static source audit. No browser, Azahar session or firmware execution
was driven.

## The reveal context is owner +0x3a89

The preceding audit describes the reveal routine's register-relative `+0x89`.
The enclosing routine at `0x293594` retains its incoming owner in `r4`.
At `0x293684` it sets `r8 = r4 + 0x3a00`; the signed byte read at `0x293940`
therefore consumes **owner +0x3a89**, not an independently identified small
object's field. Searching every unrelated `+0x89` store would mix different
owners.

The initialization sequence at `0x2ba9a4–0x2baadc` selects that field from
multiple predicates. Its queried helper, `0x231b78`, returns the word at
`0x32e5f8 + 0x2c` (`0x32e624`). The following table records the tested masks
and resulting values in branch order; the masks are deliberately not assigned
boot/resume names without their producer trace.

| Predicate reached | Value written to owner +0x3a89 | Source |
| --- | --- | --- |
| Returned word has `0x20` | 3 | `0x2ba9b4–0x2ba9c8` |
| Otherwise, word has `0x80` | 7 | `0x2ba9f8–0x2baa18`, shared store `0x2baa60` |
| Otherwise, word has `0x100` | 8 | `0x2baa28–0x2baa3c` |
| Otherwise, byte at `0x32f1ac` is nonzero | 5, then clear that byte | `0x2baa44–0x2baa60` |
| Otherwise, word has `0x10` | 2 | `0x2baa74–0x2baa84`, shared store `0x2baa60` |
| Otherwise, word has `0x200` | 9 | `0x2baa94–0x2baaa4`, shared store `0x2baa60` |
| Otherwise, `0x21ba70` returns zero/nonzero | 0/1 respectively | `0x2baaa8–0x2baac0` |

The zero/one registers come from `r6 = 0` at `0x2b9bc8` and `fp = 1` at
`0x2b9fd0`; `r8` receives the auxiliary byte pointer at `0x2ba734`.
The `0x20` route also conditionally sets the adjacent `+0x3a8b` field.
Other paths write this same context later: `0x29587c` writes 6 and
`0x2b4bec` writes 4. The separate dispatcher at `0x2aa888` also writes 3, 7,
8 and 9 under related flag tests and submits common fade requests.

This resolves concrete writers and the common queried word. It does not prove
which writer/flag combination an original-3DS cold entry reaches, the meaning
of each value, or the final caller chain into `0x293594`. In particular,
"context zero means cold boot" remains unproven.

## Predicate waits cannot be converted into a fixed boot hold

Before the common reveal request, `0x293778–0x2937f4` contains a loop governed
by several helper results. The waiting edge calls `0x12b178` with
`r0 = 0x4c4b40`, `r1 = 0`, then returns to the predicate checks.

The later context branch bypasses another wait for values 0 and 3. Other
values check byte `0x32e6d5`; while it remains zero,
`0x293964–0x293978` repeatedly calls `0x12b178` with
`r0 = 0x989680`, `r1 = 0` and checks it again. The wrapper itself is
`mov r0, r0; svc #0xa; bx lr` at `0x12b178–0x12b180`.

These are repeatable supervisor-call arguments and predicate-dependent source
order. Neither loop has a fixed iteration count in the inspected block. Even
identifying the supervisor call's time unit would not turn the unknown number
of iterations or preceding work into an exact startup duration. Neither
constant is evidence for the browser's three-second hold.

## What is still needed for visible timing

The existing paired SceneIn resources still establish matching alpha endpoints
at source frames 0 and 20 within 21-frame clips. No new frame or motion fact
changes that result. The initialization and wait trace above does not join:

1. The producer of `0x32e624` and cold-entry state to the selected reveal call.
2. Common animation advancement/completion to the actual paired display
   publication and first visible frame.
3. That publication to identified display/backlight/power service operations
   and their completion.

Thus the identical upper/lower clip curves cannot establish simultaneous
physical backlight activation. A source image, emulator first screenshot or
browser capture alone also cannot measure power-button-to-light latency.
Any future native capture should label its starting point and original-hardware
mode and distinguish process entry from a physical cold-power-on measurement.

## Validation

Private evidence is under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/power-cold-timing-source/`.
Its parameterized `verify.py` checks the executable hash, matches all 555 words
of 12 bounded listing ranges against the executable bytes, asserts 10 specific
instructions and one literal pointer, and writes `source-validation.json` plus
the bounded annotated listings. All assertions pass. This validates the stated
static evidence, not native execution or elapsed timing.

Relative documentation links and `git diff --check` pass. No application rebuild
is required for this documentation-only slice. Browser inspection and native
comparison were not performed; the coordinator retains those surfaces.
