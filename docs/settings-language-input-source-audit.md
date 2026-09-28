# Language input routing: remaining implementation gate

This bounded follow-up makes no runtime change. It narrows the D-pad and drag
questions in the [Language audit](settings-language-source-audit.md) and
[arrow-motion validation](settings-language-motion-validation.md). Current
read-only arrows remain usable; rows/OK, D-pad focus, drag and hold/repeat remain
unimplemented. Their visible absence has not been established as a particular
native D-pad discrepancy by this source slice.

## Newly verified Language boundary

The original EUR Settings code is mapped at `0x100000`, SHA-256
`1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5`.
The Language vtable entry at `0x28c1f0` points to handler `0x22ce1c`.

That handler first calls `0x195358` with the event type and event code. The
classifier reads the current scene record through `0x19f028`; types 0/3/5
read a byte at record +2+code, type 1 reads +5+code, and type 2 retains zero.
This is a semantic scene-event classifier, not a proven hardware D-pad poll.

If its result is 2, EUR Language accepts a reusable row slot: at
`0x22cebc–0x22cedc`, item = top + code − 2, then `0x19f170` updates the
list's decided item. The handler continues through the cached configuration
writers `0x198be0`, `0x198618` and saved scene state `0x197724`. This path
cannot be repurposed as harmless focus without proving a separate pre-accept
selection event. This audit does not claim that these calls themselves commit
system configuration to hardware.

Otherwise, if the Language list exists and event type is 2, `0x22cf6c` forwards
the event code directly to `0x19f044`. The existing list dispatcher proves:

| Event code | List state at byte +0 | Source meaning established here |
| --- | --- | --- |
| 0 | 3 | Start upper arrow controller, only away from top bound |
| 1 | 4 | Start lower arrow controller, only away from bottom bound |
| 2 | 1 | Thumb-controlled list position |
| 3 | 2 | List-content drag, after checking active row controllers |

Busy arrow controllers reject these events before dispatch. The event codes
are not D-pad button IDs. The handler finally passes unconsumed handling to
`0x197530`; that shared dispatch and its input producer are still required to
prove D-pad eligibility, initial focus and repeat.

## Drag arithmetic is distinct from arrow motion

The slider frame dispatcher at `0x1f3b90` uses its own state byte +0xe and
active byte +0xc. Hit testing at `0x1f3c00` distinguishes two results: one
records pointer-minus-thumb offset and enters slider state 1; the other records
a target relative to a pane and enters state 2. Their callbacks go through
`0x19fe7c`/`0x1d28c4`; this slice does not establish the complete semantic
event-delivery order into Language.

Slider state 1 (`0x1f38c0`) subtracts the captured offset from the current
pointer coordinate, clamps to centre ± half travel, writes both visual thumb
and hit-pane Y, and publishes its retained +0x18 position. The list state-1
handler (`0x1f03d8`) obtains the slider ratio from `0x1f3cbc`, scales by list
range/pitch, and splits the result through `0x138b00`. Its half-row comparison
then adjusts top and the retained fractional offset. It does not merely round
and jump to a row at touch-up.

When slider activity clears, `0x1f0478–0x1f047c` enters list state 5.
`0x1f01c8` moves the retained offset toward zero by **8 source pixels per
update**, updates thumb ratio and content Y, then clears the list state. It
conditionally clears slider state 3, preserving other slider states.
The existing four-frame arrow clips are not this release/snap behavior.

List-content drag is a different handler (`0x1f05f4`) using object +0x30,
motion history and a release continuation. It must not be collapsed into the
thumb path. Detailed touch-coordinate transforms and that continuation remain
unported.

## Exact next gates

1. Trace the shared input producer into scene events, including the call to
   `0x197530`: D-pad/axis masks, focus graph and initial row, any Select clip,
   arrow hold/repeat policy, and state that survives or resets at touch entry.
2. For thumb drag, prove callback emission/delivery ordering from
   `0x19fe7c` and `0x1d28c4` into Language type 2/code 2, then ordering against
   slider and list updates. Resolve release, leaving bounds, cancellation,
   HOME/sleep and owner teardown. Confirm `0x138b00` numeric split semantics
   at row boundaries before porting the fractional position logic.
3. Trace the list-content drag object's own producer and release continuation
   separately. Keep accepted-row configuration mutations out of the portfolio.

A generic key-repeat timer, arbitrary row cursor, or touch-up-only thumb jump
would skip these source distinctions. None was added.

## Reproduction

`scripts/verify-settings-language-input.py --code <absolute private code.bin>
--report <absolute report.json>` checks the exact original executable identity,
27 instruction/call/vtable/literal facts and seven hashed source ranges.
The verifier passed; `git diff --check` passed. No application files changed,
so no app rebuild or visual acceptance claim is applicable.

New private evidence lives on the writable home disk at
`/Users/paramveer/.codex/artifacts/settings-language-input/`: five annotated
source listings plus `verification.json`. This follows the coordinator's
storage override while the SSD is full; source firmware is read-only on the
SSD. No Azahar, browser or integration checkout was modified.

The subsequent [thumb input validation](settings-language-input-validation.md)
closes the callback-identity and numeric-split gates for a bounded browser
thumb adapter. Native polling/draw cadence, D-pad/held-arrow input and list-body
drag remain open.
