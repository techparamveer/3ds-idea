# Stationary pickup: mode 14 and first completed pass

2026-09-23. Continuing eligible callback 3 through mode 14 hides the primary
cursor and the original tile **before the H21 global 2D update**. Their
controllers retain the H20 frame. The separate pickup and pickup-blank
Scale controllers submit density frame 2. Mode entry directly requests
`SE_CTR_HOME_ICON_GRAB` during input. One additional stationary H22
preserves these states without another callback or grab cue.

This result extends the frozen [threshold-entry audit](GRID_LONG_PRESS_EVIDENCE.md),
which stopped before resource installation. It does not alter that result
or the frozen [ordinary-touch audit](GRID_STYLUS_EVIDENCE.md). Only the new
fixture and this note are added. No runtime, public asset, browser or
Azahar work is included.

## Reproduction and scope

Run [home_grid_pickup_entry.py](home_grid_pickup_entry.py) with Unicorn
2.1.4 and Capstone 5:

```sh
python scripts/firmware/home_grid_pickup_entry.py \
  --code /private/path/exefs/code.bin \
  --resources /private/path/launcher_LZ \
  --output /private/path/native-grid-pickup-entry/verified-final
```

Source: owner-supplied EUR HOME `0004003000009802`, version 24576, mapped
at `0x100000`. Executable SHA-256:
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.

Private report and 33 hashed source excerpts:
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/audio/native-grid-pickup-entry/verified-final/`.

| Artifact | SHA-256 |
| --- | --- |
| New fixture | `c64b1e74f1fe9f1a5c1e6622e899179654215d18c5e4694cc75bd2f045de2a0f` |
| New `checked.json` | `6f18a19bed6bf3daf39fb5ba41e2852cb3a8b1e19bb184cc1eac4d82c446330c` |
| Frozen threshold fixture | `47c32cb2d07a1bd368a7f1d16565707838d389dad390a27b842359ca089d4be4` |
| Frozen ordinary fixture | `12ba8151881fdff12f0edf8bc14bfe14dd031bb4cc7642ee3bad6e9cc6b76c78` |

All **four sequences pass**: root context −1 / child context 2, initially
selected slot 3, held target 3 / 4, eligible ordinary records, density 2.
Each begins at P, reaches H21 and completes exactly one further unchanged
held H22. Child context means an ordinary tile inside a folder. No folder
icon, movement, release/drop, folder hover, scroll or later lifecycle is
tested. `P` leaves held count 0; `Hn=P+n` counts native held updates.

The hash-pinned threshold setup is reused in memory. This new fixture
removes its resource stopping boundary and enables actual visibility
setters for supplied layout objects. Mode-0 grid rendering remains the
frozen endpoint. In mode 14, the actual outer grid/pickup function
`0x1e2180`, its mapping, placement, visibility and control branches run,
with the explicit content/theme/service endpoints in the report.

Eighty mature widget/layout identities supply the viewport array. The held
widget occupies its matching target index; only it is registered for input.
The original tile's real animation links and pane remain intact. Other
tiles use inert pane identities, aliased across their required pane fields;
these are not complete parsed layouts. Pickup and blank roots are supplied,
their raw Scale controllers are real, and their binding groups are inert.
Matrices, pickup pixels, title textures and GPU raster are not executed.

## Resource installation is an explicit bridge

`0x1e801c(S, pickupLayout, packedCandidate)` is intercepted as supplied
completion. Its static body resolves the candidate record, looks up named
icon panes such as `P_Icon_00`, obtains their material and installs texture
descriptors through `0x1f6084` and texture coordinates through `0x206458`.
Other record variants use additional panes and content services. Those
operations are not executed or described as successful pixel rendering.

The two traced callers do not branch on a return value: the fixture returns
0 and allows their actual continuation. The interface is reached three
times per sequence:

| Pass / phase | Caller |
| --- | --- |
| H21 callback 3, input | `0x2a55b0` |
| H21 grid footer, lower task | `0x1e3638` |
| H22 grid footer, lower task | `0x1e3638` |

All pass the same HOME object, chosen pickup layout and retained packed
candidate. Thus the source repeatedly refreshes pickup content in this
entry slice. A portfolio implementation must supply its own content binding
at that interface; the source trace does not provide portfolio pixels.

Other explicit limits include supplied mature metadata/capacity, hit
booleans, task readiness, inactive overlays, theme/material helpers and
unrelated services inherited from the frozen host fixture. The upper
control's flags are cleared by native code, but its animation seek is an
endpoint without an upper animation resource. Default sound-table setup
and sound playback remain outside execution.

## Actual input continuation and mode setup

Let `S` be HOME and `W` the held tile widget. H21 retains the threshold
audit's established start: callback 3 selects the candidate, keeps candidate
folder/slot at `S+0x117e/0x1180`, chooses ordinary pickup layout `S+0xaf4`
and Scale `S+0xe60`, sets priority `0x177`, shows it, starts its mode-5
controller and seeks density 2. The following continuation now executes:

1. After the first supplied content installation, callback 3 calls the
   `S+0x1088` gesture control's enable virtual with 0. Native `0x251f24`
   writes gesture state 5 at control+0xd and capture 0 at control+0xc.
   It then clears the bytes at the `S+0xf3c` and `S+0xf40` controls +0x86.
2. `0x2a5698` calls mode setter `0x1e8f38(S,14)`. It stores old mode 0
   at `S+0x3a81`, writes mode 14 at `S+0x3a80`, and dispatches through
   the actual mode table to `0x29fa6c`.
3. Mode entry writes primary request **2** at `S+0x3a88`. It copies
   target-left to current-left, sets `S+0x1176`, `S+0x3acc` and
   `S+0x3ad4` to −1, clears `S+0x3ad0`, `S+0x3ad6` and `S+0x3adc`,
   and initializes float `S+0x3ad8` to **1**. Its ordinary selection
   refresh leaf `0x1de7fc` also executes.
4. It starts the separate controller at `S+0xe84` and seeks density 2.
   Construction `0x2b35cc..0x2b3648` identifies this as
   **LncIconPickUpBlank_00_Scale**, configured to mode 5. The blank
   layout `S+0xb18` has constructor priority `0x19b` (411).
5. Actual control setup `0x1de8ec` selects its mode-14 branch `0x1df684`.
   Since old mode is 0, it skips the branch that would re-enable/reset
   the `S+0x1088` gesture control. It disables `S+0xf30` via native
   `0x2501f8`, writing enabled 0 and capture 0.
6. `0x1e0cb4 → 0x1df8d4` resets the `S+0x1084` footer flags at +0x46,
   +0x47 and +0x48 to **[1,0,0]**, clears `S+0x3a4c` and sets focus
   `S+0x3c8e` to −1. Native upper-disable `0x1e0cec` clears upper+0x460,
   +0x464..0x469 and +0x46d, then requests its controller seek to 0.
   Bytes +0x46a..0x46c remain unchanged.
7. The ordinary-record branch calls sound endpoint `0x233a6c` with
   **0x0100002f** at `0x29fbc8`, before input finishes.

The held tile itself is not reset or disabled by this setup. It remains
state 1, enabled 1, long-press flag 1, held count 0 and capture 1. Its
candidate remains valid. The selected slot is the held target, including
the case that started on a different selected slot.

## First lower task and 2D

At the end of H21 input, mode is already 14 and primary request is 2,
but primary layout visibility is still 1. The original tile is still
visible, the pickup is visible and the blank is still hidden. Both pickup
controllers have current 2 with no submitted frame yet. The actual host
then traverses tasks, upper/banner manager and lower HOME before global 2D.

The lower mode-14 branch at `0x2b716c` sees no pending release/drop request.
Root proceeds to its common footer. Child evaluates `G_Out_00` with a
supplied miss, clears its edge counter and sets its gate; this audit does
not enter the edge/folder transition. No second callback 3 or callback 4
is emitted at stationary H22.

In `0x1e2180`, the visible grid loop recognizes the candidate and chosen
pickup. Its branch `0x1e2538` shows the blank, assigns its root the held
slot's grid position, and calls `0x1e8c50(tile,0)` for the original tile.
That native leaf clears tile+0xde and calls visibility setter `0x232234`
to hide its layout. The loop retains the slot/widget mapping and writes
the slot to widget+0x78. Because the widget still has capture and state 1,
the branch skips its enable setter; capture is preserved.

The pickup portion refreshes content at the supplied endpoint, writes
the pickup root position, checks its Scale against density through native
`0x1d9640`, and writes its root scale. The common lower footer then resolves
primary request 2 at `0x2b8550..0x2b8568`: shown becomes 0 and the actual
primary layout visibility setter receives 0. There is no primary position
update or Scale seek on this branch.

| State | H20 completed | H21 after input | H21 completed | H22 completed |
| --- | --- | --- | --- | --- |
| Mode / primary request | 0 / 0 | 14 / 2 | 14 / 2 | 14 / 2 |
| Primary shown / visible | 1 / 1 | 1 / 1 | 0 / 0 | 0 / 0 |
| Primary Loop current / submitted | 39.25 / 38.25 | Same | Same | Same |
| Original tile visible | 1 | 1 | 0 | 0 |
| Tile Select current / submitted / status | 0 / 1 / 1, reverse | Same | Same | Same |
| Tile native pane Y | −2 | −2 | −2 | −2 |
| Pickup visible / Scale submitted | 0 / unsent | 1 / unsent | 1 / 2 | 1 / 2 |
| Blank visible / Scale submitted | 0 / unsent | 0 / unsent | 1 / 2 | 1 / 2 |

The original tile's Select link remains enabled and Decide stays disabled;
there is no native pane write at H21 or H22. Hiding the layout prevents its
controller update, so reverse frame 0 is **not submitted** in these passes.
Likewise the hidden primary does not update Loop. This is now a completed
host-pass observation, beyond the threshold audit's earlier stopping point.
It establishes neither a permanent pose nor the later restoration policy.

In the supplied registered layout list with source priorities, global 2D
updates blank Scale then pickup Scale. Each submits frame 2, retains current
2 and status 1 in mode 5. Their empty binding groups mean this proves
controller submission, not applied pickup artwork. Primary Scale and its
Select/Decide retain their prior values. No unrelated layout is newly
claimed as faithfully rendered.

## Position, offset and size

The actual blank branch assigns:

```text
blank root = (gridX[candidate] − horizontal offset, gridY[candidate], 0)
```

The ordinary pickup branch `0x1e365c..0x1e369c` reads the supplied touch
object at `S+0x1094`, fields +0x10/+0x14, and the stored offset at
`S+0x1848/0x184c`. Native `0x1d9f38` writes:

```text
pickup root = (touch.x + offset.x, touch.y + offset.y, 0)
```

Each case supplies a stationary point three units right and four units
below its target grid point, plus offset **(−3,+4)**. Both nonzero summands
therefore participate in the executed addition. No traced entry write
changes this offset. Its acquisition and conversion from physical/browser
coordinates are not reconstructed; no millisecond or screen-pixel claim
is inferred from these supplied values.

| Context / target | Resulting blank and pickup root |
| --- | --- |
| Root / 3 | (−54, 50, 0) |
| Root / 4 | (−54, −4, 0) |
| Child / 3 | (−54, −43, 0) |
| Child / 4 | (0, 11, 0) |

Mode entry initializes size factor `S+0x3ad8=1`. In the tested entry with
comparison slot `S+0x3acc=−1`, native candidate comparison returns 4; the
size branch increments then clamps the factor to 1. It copies that value
to pickup-root scale.x/scale.y at `0x1e3908/0x1e390c`. Native
`0x1d9640` sees pickup Scale already equal to density 2 and performs no
additional seek. The scale remains 1 at stationary H22. No other target,
folder-hover scaling or movement interpolation is tested.

## Assets, cues and remaining bridge

The new blank asset is identified by native construction, not inferred
from its filename. Its Scale has six frames, source range 0–5, group
`G_Scale_00` and child binding enabled. Both pickup resources retain the
hashes recorded in the threshold note.

| New resource | SHA-256 |
| --- | --- |
| `LncIconPickUpBlank_00.bclyt` | `87ed044fca821a0f9adc98e9ab7c4367ccea1ac02d22d04b2ee4c89fee2de1ca` |
| `LncIconPickUpBlank_00_Scale.bclan` | `d4f4523ac19b8c780b899ff4eafc248ea23ca87940d7ec2221643a10acd57cc0` |

The only direct sound calls are initial touch `0x0100002b` at P from
`0x1f71b4`, and grab `0x0100002f` at H21 from `0x29fbc8`. The grab name
is cross-referenced in [cue delivery evidence](home_audio_CUE_DELIVERY_EVIDENCE.md).
There is no repeated direct cue at stationary H22. Sound playback and
omitted/default sound policies remain unexecuted.

The host can now distinguish the established entry effects: retained
candidate/capture, selected target, mode-14 control changes, input-phase
grab cue, later primary/tile hiding, blank placement, pickup placement
formula and density-held controller submissions. The portfolio-content
binding, rendered pickup/blank materials, touch-offset acquisition and
all subsequent movement/release/drop behavior remain explicit bridges.
This bounded result does not establish a complete drag implementation.
