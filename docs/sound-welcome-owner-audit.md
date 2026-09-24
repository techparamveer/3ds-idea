# Sound Welcome: descriptor and controller audit

This follow-up narrows the [earlier Welcome gate](sound-welcome-source-gate.md).
It establishes the original three-page descriptor and the shared guide controller's
page/button behavior. It does **not** add a browser Welcome flow: startup selection,
the upper title/body presentation and persisted seen-state still need their complete
source chain or a matched native capture. No emulator or browser was operated.

## Original descriptor, not a guessed tutorial

`romfs/res/Guide.gbin` is loaded by the executable at `0x2c1e00–0x2c1e1c`.
Its SHA-256 is
`c84d03b655156c81196341a613a855ce7544820a530cabe1099a697dc9e2f021`.
The file has a `GBIN` header and 91 `GUID` records. Record traversal at
`0x206000–0x20604c` advances by `0x30 + pageCount * 0x14`; the page getter at
`0x28f390–0x28f3b0` selects `record + 0x30 + index * 0x14`. Each page is a
16-byte message label followed by a 32-bit button mode. The first record at
file offset `0x8` has title `T_001` and exactly three pages:

| Page | Message | Descriptor mode | Source buttons |
| --- | --- | --- | --- |
| 1 | `D_001_0` | 2 | Next |
| 2 | `D_001_1` | 3 | Back, Next |
| 3 | `D_001_2` | 4 | Back, OK |

Mode meanings come from the executable's five 20-byte entries at `0x2f6d38`
and their actual `S_tips` messages. They are not inferred from conventional
tutorial behavior. Mode 0 is OK; mode 1 is Cancel/Next. Neither is selected
by the unmodified Welcome descriptor. The descriptor copier at `0x182318`
reads each page's `+0x10` mode and writes its controller record mode.

## Page owner, counter and boundary behavior

The application constructs the guide controller through `0x181b8c`, called at
`0x239028` with application-relative address `+0x15964`. Its wrapper starts at
application `+0x15958`. The wrapper's activation routes at `0x182540` and
`0x1825b4` pass a selected descriptor to `0x181864`; which route selects
Welcome on the observed startup remains unresolved.

Within the inner controller, `+8` is the zero-based current page, `+0x394`
the copied descriptor page count, and `+0x39c` the selected page record.
`0x181864` resets the index to zero, copies descriptor data, selects page zero
and calls the page and count text binders. `0x181294` writes `index + 1` to
`+0x480`; `0x1813d4` writes total count to `+0x47c`. The text parameter object
at `+0x478` uses vtable `0x31f8a4`, whose integer getter `0x28f3b4` returns
the two values for parameter indices 0 and 1, and zero outside that range.
The original messages agree with that shape: `Guide_D_00_00` contains `/ `
then group 3/type 39 parameter 0; `Guide_D_00_01` contains parameter 1 then
a space. This resolves the shared lower-guide count data. It does **not**
resolve `T_001`'s separate group 3/type 42 control or prove that its observed
upper title renders these same two text panes.

Handler `0x181928` receives event kind 4 and compares the event sender to the
source button objects at controller `+0x3bc`, `+0x3c0` and `+0x3c4`:

- Single/right next advances the index while another page exists. Left/back
  decrements it when the index is positive. Index changes call `0x180ea8`.
- A right/single action on the last page calls the common close gate and, on
  success, records outcome 3. Back at page zero similarly records outcome 2.
  The unmodified Welcome modes expose Next first and Back/OK last, so the
  descriptor never asks for a first-page Back button.
- The close function `0x2051c8` succeeds only when lower transition state
  `+0x475` equals 2. It starts upper/lower closing through the controller,
  marks lower state 1, and emits cue ID `0x100007c`. A browser handler that
  dismisses during every transition would bypass this source gate.
- Wrapper `0x18274c` forwards the event. Outcome 3 calls `0x180398`; outcome
  2 calls `0x180378`. Transition event `0x26` later moves the wrapper to
  state 5. These numeric events are not, by themselves, a proven HID mapping.

The button constructor also writes masks 1/2/1 at `+0x40` for the three
button objects (`0x181ef4–0x181f1c`). This audit does not label those masks
as A/B without tracing their consumer. It proves neither touch rectangles
nor physical button timing. No timer-driven page advance is established.

## Page-three illustration path

The page metadata parser `0x182264` resolves each body message from `S_tips`.
At `0x18244c–0x1824e4` it reads group 4/type 1's length-prefixed UTF-16 name
into a page string object. The `D_001_2` token names `S_Guid03_U` exactly.
The selected page passes that string to `0x180c0c` at `0x1812b4–0x1812bc`.

That function attaches the upper guide container at the named `GuideU` mount
(`0x180c38–0x180c58`) and calls `0x180a14` with the illustration name.
The latter checks two registered resource-family locations, creates a layout
object with `0x20bb38`, stores it at controller `+0x3ac`, and attaches it
under upper container `+0x3a8` using `0x20bd3c`. It also applies a named
operation at `0x180bf0`. The exact registered family values, that operation,
the final child transform/clipping, and the visible upper body/title owner
are not yet resolved. This establishes more than an incidental filename
reference, but does not yet justify drawing the guide layout directly at
LCD origin or selecting `S_Inf_U-Txt` as the Welcome body.

## Entry and persistence gate

The host update around `0x1c2ebc–0x1c2ff4` conditionally refreshes the tip
wrapper, can call its activation routine, and can externally request closure
through `0x181908`. Its predicates are not yet named and traced end to end.
The coordinator's observed transient Welcome therefore remains compatible
with multiple host-state causes; it does not establish auto-dismiss duration.

Completion is more than a local dismiss boolean. `0x180398` uses a tip-state
object, updates queue/index state and calls `0x17fb18` at `0x180510` with
value 1. That helper updates a two-bit entry in memory (16 entries per word).
The audit has not connected this memory to a particular save file, its load
and commit boundaries, or the exact first-run eligibility predicate. Do not
invent a localStorage `welcomeSeen` equivalent from this partial chain.

The remaining implementation gate is consequently precise: trace the selected
Welcome record from the host's launch predicates, resolve upper title/body and
guide transforms with registered source layouts, map the input/transition
events and count formatting, then establish seen-state loading/commit and a
matched native three-page/exit capture. No account, recording, SD or network
behavior is needed for the eventual portfolio presentation.

## Reproduction and limits

[`sound_welcome_audit.py`](../scripts/firmware/sound_welcome_audit.py) requires
absolute paths for `--code`, `--guide`, `--messages` and `--report`. It accepts
only the pinned executable, original GBIN and full converted English bank;
it disassembles statically and never launches or modifies firmware.

The audit passes **71 instruction assertions**, parses all **91 records** to
the exact file boundary, checks the three Welcome page/mode pairs, the source
button labels, counter parameter tokens and page-three illustration token.
Wrong-hash inputs are rejected before decoding. A private report is at
`/Users/paramveer/.codex/artifacts/sound-welcome-owner-2026-09-24/audit.json`;
the adjacent `controller.txt` is private source-trace scratch. No binary,
resource pack, new public asset or runtime behavior is committed.

These checks establish bounded source facts, not rendered native equivalence.
There is no new source render or native screenshot in this slice. Application
tests/typecheck/build are unnecessary for this offline audit and documentation;
relative links and `git diff --check` were checked.
