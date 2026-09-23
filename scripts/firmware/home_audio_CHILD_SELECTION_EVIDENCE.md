# Folder child selection: cue identity and trigger

2026-09-23. Ordinary directional movement between folder slots dispatches
**`0x0100002c`, `SE_CTR_HOME_ICON_SELECT`**, the existing `select` asset.
Root-grid movement uses the same path. Occupied and vacant destination slots
do not change that cue. The archive does not name this entry `HOME_CURSOR`.
Horizontal range rejection and transfer to toolbar focus have separate cues.

Source: owner-supplied EUR HOME `0004003000009802`, version24576.
Executable SHA-256:
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Archive SHA-256:
`1017eb4a367cb202ac6018fb432b5654222487149d16242fa7d1f205e63f3eb2`.
Private original-ARM fixture, results, archive identities and 12 hashed source
excerpts remain on SSD at
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/audio/native-child-selection/`.
Run `check.py` with that firmware tree's `assets/research-venv/bin/python -B`.
Fixture SHA-256:
`8db8e158f92187e52b3cd6435efc0c0b941f81088cd464d90c872a58cc2940ae`.
`checked.json` SHA-256:
`fd85a9ef49213861e85be34210fbfc15a2d1a8eb038a30039e49c20078a2dfbc`.

## Active selection, not a root-only field

Directional dispatch `0x295088..5094` passes the scene, numeric event class and
key mask to `0x2968fc`. That handler snapshots selected slot `scene+0x1178`
and secondary focus `scene+0x3c8c`, then calls the movement helpers:

| Mask | Helper | Grid operation |
| --- | --- | --- |
| `0x10` | `0x1d8468` | Add one column's row count |
| `0x20` | `0x1d85f8` | Subtract one column's row count |
| `0x40` | `0x1d88ec` | Previous row, or leave the grid at its upper edge |
| `0x80` | `0x1d874c` | Next row, or leave the grid at its lower edge |

The helpers inspect signed active-folder byte `scene+0x1170`: -1 uses root
rows `[1,2,3,4,5,6]` at `0x308778`; otherwise folder rows are `[1,1,2,3,4,5]`
at `0x3087a8`. Both update the same active selection field. Folder extent is
capacity60, written by the actual folder branch `0x217d34..48`, rather than
the number of occupied children.

Folder entry stores the folder ID at `0x2a3224` and restores its independent
history through `0x1d9ea0` at `0x2a327c`. That function copies the saved slot
into `+0x1178`, as well as scroll and density fields. Exit saves the child
history, restores the root history and writes active-folder -1 at
`0x2b0260..0294`. Consequently a browser root-only `selected` comparison
misses native selection changes represented there by `folderSelected`.

## Cue ordering and occupancy

After movement, `0x296e94..6ea8` compares the current active slot and secondary
focus with their snapshots. If both are unchanged, it returns without the
ordinary selection cue. If changed, no overlay is present, and toolbar flag
`scene+0x3ca8==0`, `0x296fd0..6fd8` dispatches `0x0100002c` through
`0x233a6c`. It then requests the cursor effect through `0x1de858`.

The cue is requested **after the slot write, in the same handler call**.
Crossing the viewport edge can enter scrolling state3 before this dispatch;
the handler does not wait for scroll completion. This establishes call order,
not audio output latency or a measured number of milliseconds.

The executed ordinary movement path does not read the slot metadata table.
Controlled occupied/vacant records produce the same slot change and cue,
with a read hook confirming zero metadata reads during the handler. Thus a
successful move onto an empty child slot still requests `select`; an item
identity change is not required. Touch contact/release, opening a folder and
restoring selection during a context switch are separate actions and are not
newly assigned this cue by this proof.

## Range rejection and other focus

| Checked condition | Native sound request |
| --- | --- |
| Changed ordinary root or child slot | `0x0100002c`, `SE_CTR_HOME_ICON_SELECT` |
| Left/right past the active extent, event4 | `0x0100002e`, `SE_CTR_HOME_ICON_SCROLL_INVALID` |
| Same horizontal rejection, event6 | None |
| Valid ordinary move, event6 | `0x0100002c` |
| Top/bottom grid edge transfers to toolbar focus | `0x0100003f`, `SE_CTR_HOME_SELECT` |
| No slot/focus change, neutral input, or blocked overlay | No ordinary selection cue |

Horizontal rejection occurs inside `0x1d8468` or `0x1d85f8`. Their final
branches emit `0x0100002e` unless the suppression argument is nonzero. The
caller supplies that argument for numeric event6. The ordinary change guard
then suppresses `0x0100002c` because the slot did not change. Event4/event6
are deliberately named numerically: their HID producer and repeat cadence
were not executed in this bounded pass.

At a vertical grid edge the helpers can set toolbar flag `+0x3ca8` and
secondary focus `+0x3c8c` through `0x1d8a94`. The changed-focus branch
`0x296ebc..6ee0` selects `0x0100003f`. Do not describe every unchanged tile
index as a silent boundary. The two additional cues are outside the existing
ten-cue delivery pack; this evidence does not add or synthesize them.

## Adjacent balloon context

History restoration confirms that `scene+0x118c/+0x1190` are current/target
density. The balloon predicate `0x2eb804` requires **both to be0**. Folder
density1 also has one row, but is ineligible; row count alone is insufficient.
The predicate does not reject an active folder itself. With its other guards
clear, a density0 slot with metadata bits0/1 set is eligible in root or folder;
a vacant controlled record or nonzero density is not.

This narrows the [close-balloon evidence](FOLDER_CLOSE_OVERLAY_EVIDENCE.md).
It does not establish the actual selection metadata and density of a reference
close recording, nor add unconditional balloon hiding to mode44.

## Verification and limits

Passed: **112 movement cases**, four vertical-edge cases, three history
restores and 24 balloon predicates. The fixture executes original ARM
`0x2968fc`, movement helpers, arithmetic, change guard and folder-capacity
write. Root extent300 is supplied. Scene-entry effects, cursor graphics and
the sound dispatcher are recording endpoints. The archive names were read
using pinned DualRip `c00e809ad4fcc44056a5b3c11d30f6a698b92be0`; the fixture
checks the original archive and frozen identity-record hashes.

No HID producer, audio mixer, browser or Azahar session was run. No runtime,
scene, System, public audio or converter changes are included. The integration
change supported here is to detect movement of the active child selection and
use the existing `select` cue, independently of destination occupancy.
