# Ordinary HOME direction masks and toolbar boundaries

2026-09-23. Ordinary event4/new-press and event6/repeat dispatch compares
**exact masks**. It recognizes the four cardinals and four two-axis diagonals.
In the grid, a diagonal calls vertical first, then horizontal, except that
newly entering toolbar focus stops the horizontal component. In the toolbar,
a diagonal calls horizontal first, then vertical to return to the grid.
The tested opposing masks`0x30/0xc0/0xf0` call no directional helper and
produce no selection change or selection cue.

This resolves the mode0 diagonal boundary left open in
[cursor acceleration](CURSOR_ACCELERATION_EVIDENCE.md). It complements
[input production](HOME_INPUT_EVENT_EVIDENCE.md) and
[host ordering](HOME_HOST_ORDER_EVIDENCE.md); it supplies source evidence for
the input-consumer contract without changing runtime, UI or public assets.

## Source and reproduction

Owner-supplied EUR HOME `0004003000009802`, version24576. Executable mapping
starts at`0x100000`; `code.bin` SHA-256:
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.

Run [home_direction_masks.py](home_direction_masks.py) with Unicorn2.1.4 and
Capstone5:

```sh
python scripts/firmware/home_direction_masks.py \
  --code /private/path/exefs/code.bin \
  --output /private/path/native-direction-masks/verified
```

The fixture rejects other executable hashes and executes original ARM without
patching instructions. Private results, native tables and15 hashed source/
table excerpts are at:
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/audio/native-direction-masks/verified/`.
Only this note and its portable fixture belong in the repository.

| Artifact | SHA-256 |
| --- | --- |
| Fixture | `1300920def0257646df7eff01323a4b3bd52a7518a16938242fcaee1f5cdaf29` |
| `checked.json` | `691da7dd8455f0e0327d7237ec17c236caa9493c2466d9bae1b51cdaffc13589` |

All2,206 scenarios pass:1,188 grid cases,792 supplied-toolbar cases,144
three-action grid/toolbar round trips,12 remembered-focus overrides, and70
gate cases. Root/folder densities0,2,5 cover row counts1,2,3,5,6. Grid cases
include interior, top/bottom, viewport left/right, absolute left/right and
corner positions, for both events4/6. Each uses four cardinals, four diagonals
and the three opposing masks. Complete numeric case matrices remain private.

## Exact dispatch and the focus-dependent order

Handler`0x2968fc` saves the original selected slot and toolbar focus, then
compares the complete mask in`r2` at`0x296940..0x2969e0`:

| Mask | Meaning | Grid order | Toolbar order |
| --- | --- | --- | --- |
| `0x10` | Right | Right | Right |
| `0x20` | Left | Left | Left |
| `0x40` | Up | Up | Up |
| `0x80` | Down | Down | Down |
| `0x50` | Right + up | Up, then right if still eligible | Right, then up |
| `0x90` | Right + down | Down, then right if still eligible | Right, then down |
| `0x60` | Left + up | Up, then left if still eligible | Left, then up |
| `0xa0` | Left + down | Down, then left if still eligible | Left, then down |
| `0x30`, `0xc0`, `0xf0` | Opposing-direction combinations | No directional helper | No directional helper |

This is exact comparison, rather than a sequence of independent tests of
individual direction bits. Other full-mask branches handle unrelated buttons;
this note does not expand their behavior or normalize arbitrary masks.

The diagonal branches are`0x296c00`, `0x296ca0`, `0x296d34`, `0x296dc8`.
They test toolbar byte`S+0x3ca8` before selecting the order. In the grid route,
after vertical movement, they compare the saved old focus with`-1` and the
new focus at`S+0x3c8c` with`-1`. If old focus was`-1` and new focus is not,
they skip horizontal movement. This is the concrete comparison to preserve;
it is not a dominant-axis calculation or a general rule that vertical always
wins. An interior diagonal normally executes both helpers.

Native directional helpers are right`0x1d8468`, left`0x1d85f8`,
down`0x1d874c`, up`0x1d88ec`. Their entry snapshots and ordering are recorded.
For mode0 grid movement, vertical changes the row before horizontal computes
its candidate and viewport crossing. A successful horizontal component that
crosses the viewport then runs the existing mode3 state setter/entry, sets
the relevant direction marker, and increments acceleration once. A vertical
transfer to the toolbar does not enter mode3 or increment acceleration.

## Ordinary grid and toolbar boundary behavior

Let`R` be the native rows value,`P` selected slot,`V` current viewport left,
and`T` target viewport left. Slots are column-major. The executed vertical
helpers behave as follows:

| Starting grid state | Result |
| --- | --- |
| Up with`P % R != 0` | Select`P-1` |
| Down with`(P+1) % R != 0` | Select`P+1` |
| Up at top row, or down at bottom row | Keep selected slot, enter toolbar focus, save viewport-relative column |

With one row, either vertical direction reaches the toolbar boundary.
The saved column at`S+0x3c94` is the integer quotient of the relative
selection`S+0x117c` divided by`R`. If remembered toolbar focus`S+0x3c90`
is not`-1`, that focus is reused. Otherwise the native density/folder table
selects the focus for the saved column. Actual entry helper`0x1d8a94`
sets toolbar byte`S+0x3ca8=1`, writes focus`S+0x3c8c`, clears remembered
focus, and seeks the Scale controller to its focus-specific frame.

The native mapping tables are deliberately retained as private source data:

| Mapping | Root address | Folder address | Indexed layout |
| --- | --- | --- | --- |
| Grid column → toolbar focus | `0x314e74` | `0x314eec` | Six density rows,10 signed16 entries per row |
| Toolbar focus → grid column | `0x314f64` | `0x315024` | Six density rows,8 signed32 entries per row |

The fixture executes the original table-copy/index instructions and validates
against the corresponding source bytes. It does not replace those mappings
with evenly spaced geometry or guessed feature labels. The private result
contains all table values, byte hashes and case results for adapter work.

Starting in the toolbar, right advances focus modulo8 and left decrements
modulo8. Horizontal movement also resets saved column to`-1`. Up/down then
choose a grid column: use saved column when present; otherwise use the
focus-to-column source table. Down selects`T + column*R`, the first row;
up selects`T + column*R + R-1`, the last row.

Returning to the grid clears the toolbar flag, remembers the exited focus
at`S+0x3c90`, clears current focus and saved column, and seeks Scale to the
density frame. Therefore a toolbar diagonal first changes focus and discards
any saved column, then its vertical component uses the **new** focus's table
column. It does not preserve the old saved column. The144 native round trips
cover every visible column in the representative densities and both return
directions. The12 override cases confirm that a remembered focus can take
precedence over the column's normal focus mapping.

Scale wrapper`0x1da050` uses the actual controller virtual at
`0x321828+0x2c`, target`0x1bbd8c`, to store the requested frame. The fixture
verifies that write. Scale frame requests are10 for focus0,12 for focus6/7,
11 for the other toolbar indices, and the current density on grid return.
Loop phase and step are unchanged in these direction cases.

## Cue requests, partial moves and ordering

Cue names are established by
[selection-cue evidence](home_audio_CHILD_SELECTION_EVIDENCE.md). This
fixture records the actual call to`0x233a6c`, without playing sound:

| Outcome | Native cue requests, in order |
| --- | --- |
| Successful grid move | `0x0100002c`, `SE_CTR_HOME_ICON_SELECT` |
| Enter toolbar or change toolbar focus | `0x0100003f`, `SE_CTR_HOME_SELECT` |
| Return from toolbar to grid | `0x0100002c` |
| Absolute horizontal rejection, event4, no selection change | `0x0100002e`, `SE_CTR_HOME_ICON_SCROLL_INVALID` |
| Absolute horizontal rejection, event6, no selection change | None |
| Diagonal moves vertically, then horizontal rejects, event4 | `0x0100002e`, then`0x0100002c` |
| Same partial diagonal, event6 | `0x0100002c` |
| Tested opposing masks | None |

Thus a two-component move can have a successful vertical component and an
invalid horizontal component. Preserve both the changed selection and the
request order. Collapsing that event into one success/failure decision would
lose observed behavior. Event6 passes the horizontal invalid-cue suppression
argument while retaining the successful component's selection cue.

The outer handler compares final selected slot/focus against its saved values
and requests one common selection effect through`0x1de858` after the final
selection cue. The fixture verifies this ordering, as well as mode3 entry
before the selection cue when the horizontal component scrolls. An invalid
horizontal move alone has no common selection effect. A toolbar diagonal
requests the final grid selection cue, even though its first helper temporarily
changed toolbar focus; it does not emit an extra common toolbar cue between
those two helpers.

## Gates and bounded scope

For the ordinary paths, input overlay pointer`S+0x3fd0`, absent manager
`S+0x3aa0`, manager inhibit byte`+0x469`, or scene inhibit byte`S+0x3fb7`
prevents the directional helpers. The70 gate cases exercise both events and
all seven requested composite masks with each gate and with current mode3.
The four diagonals in mode3 produce no selection, pending-horizontal marker,
helper or cue. Existing acceleration evidence separately establishes that
single-axis horizontal events can set pending markers while busy; do not
extend that behavior to diagonal masks.

Only four non-audio calls are endpoints in this fixture: grid coordinates
`0x1d7d00`, selection status`0x297b20`, widget setup`0x1de8ec`, and common
cursor effect`0x1de858`. Sound`0x233a6c` is a recording endpoint. The dispatcher,
directional helpers, table copies, focus changes, state setter, mode3 entry
and Scale seek run their original ARM bytes. Supplied statistics state has no
active record. No rendering or audible result is claimed.

The fixture invokes event4/6 handlers directly. Analog thresholds and edge
production remain in the earlier input evidence, while shared main-loop
ordering remains in the host note. Toolbar indices here describe navigation
state only: feature activation, density buttons, touch hit testing, overlay
features, system transitions and full toolbar UI are outside this bounded task.
