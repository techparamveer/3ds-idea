# Game Notes metadata and title controller follow-up

This pass supplies the original English long description for eight published
stock applications and narrows the remaining title/HUD implementation blockers.
It does **not** enable the incomplete title panel. The original Notes icon
conversion, native text fitting and scene scheduling still need validation.
It follows [the first title/HUD audit](native-notes-title-hud-source-audit.md).

## Suspended title metadata

The same hash-identified Notes executable loads the suspended application's
`icon` file as a 0x36c0-byte payload (`0x1053a0`), then uses `0x103608` to
prepare the metadata. The description comes from `language × 0x200 + 0x88`
(`0x10371c–0x103760`). English is index 1: **SMDH offset 0x288**, the long
description. The existing HOME manifest name came from **0x208**, the short
label. A current screen heading is a different input again.

The native destination at context +0x2c holds 0x80 UTF-16 code units. Strings
of 128 or more units are copied with a NUL at destination +0xfe, giving at
most 127 units. The converter now preserves that bound, original line breaks
and the first terminator. It does not substitute a short label for empty text.
Malformed payloads/UTF-16 are explicit errors.

`scripts/firmware/title_metadata.py` adds `longDescription`, its original
`longDescriptionSource`, and a hash-identified `longDescriptionConversion`
record. It requires the source payload hash to match the title's already
published ExeFS icon provenance, including retained content identity. The full
builder uses the same function; the narrow publisher changes no resource bytes,
icon, HOME name, pack or source identity.

Eight application titles had matching original files: Settings, Health and
Safety, Camera, Sound, eShop, System Transfer, Nintendo Zone and NNID Settings.
System Transfer's actual English long field is `???`; that source marker is
retained as data and is **not** an accepted title to display. Applications with
no published source icon, and portfolio apps without SMDH, get no invented
metadata. This is delivery infrastructure; the suspended-capture contract still
needs owner/generation-safe metadata binding before live use.

Reproduce a narrow update with explicit private inputs:

```sh
python3 -B scripts/firmware/title_metadata.py \
  --manifest /absolute/delivery/manifest.json \
  --icon TITLE_ID=/absolute/extracted/exefs/icon.bin
```

Repeat `--icon` for each explicitly selected title. All records are validated
before mutation; only safe relative source identities enter public metadata.
The private `icon-inputs.json` lists the exact files used for this pass.

## Icon is a conversion dependency, not a missing resize

`0x103694–0x1036ac` calls `0x106258`, then copies 0x2000 bytes from its
output +0x800 to the context's icon buffer. This becomes the dynamic 64×64
texture bound by `0x167f4c–0x167fd0`.

`0x106258–0x1066a0` does a tiled expansion with edge-copy tables at
`0x1aa000`. Its first loop copies six 0x300-byte blocks from source
`0x480 + i×0x300` to destination `0x800 + i×0x400`, fills each following
0x100-byte block with 0xff, and then applies table-driven 16-bit edge copies.
This differs from stretching the published 48×48 HOME PNG to 64×64.
The table-driven remainder and texture sampling/orientation have not been
independently validated, so no icon conversion or replacement is published.

## Controller semantics resolved

The shared animator helpers remove an ambiguity in the first audit:

| Source | Established behavior |
| --- | --- |
| `0x14ee28` | Writes a clip's current frame; the value 30 is a frame, not a timer duration. |
| `0x14efec` | Starts/enables a selected clip; argument 2 disables sibling clips, argument 3 resets the frame, final argument 0/1 selects forward/reverse; 2 preserves direction. |
| `0x14e830` | Reset chooses frame 0 for forward, or last frame for a nonlooping reverse clip. |
| `0x150bb4` | Reports active until forward reaches last frame or reverse reaches zero; a looping enabled clip remains active. |
| `0x152508` | Advances/decrements the current frame and clamps nonlooping endpoints. |

The title group is `G_Panel_01`. `0x167424–0x167514` selects the two screen
indicators and starts `TextPanelInOut` forward. If InOut or Stay is already
active, it preserves InOut's current frame; otherwise it resets to zero.

`0x168698–0x168774` then waits for InOut, starts the 121-frame Stay clip
at zero, waits for its last frame, writes frame **30** to InOut and starts it
in reverse **without resetting**. On completion it restores frame zero and
sets the title state to −1. At the end of the scene update, `0x168778–0x1687b4`
advances these controllers with **1.0**. The frame-30 reverse start must not
be silently reduced to the last authored key (20); ten source updates occur
before the authored reverse interval. This establishes local controller order,
not browser/native wall-clock latency or all cross-scene manager ordering.

The title string is measured after binding (`0x167d7c`). If its rendered
height exceeds **36**, `0x167df0–0x167f48` removes trailing UTF-16 units and
remeasures until it fits. There is no proven ellipsis insertion. Faithful
native measurement/wrapping, and its behavior with non-source portfolio
metadata, remain unvalidated.

## HUD binding and direction

Although HUD CLAN files list both panel groups, constructor
`0x167844–0x1678cc` registers the six Switch/HUD slots on **G_Panel_00 only**.
The separate title animator registers **G_Panel_01** at
`0x1678d0–0x167954`. A raw HUD clip must not overwrite the title group's
independent pose.

For suspended software, event 8 starts the selected HUD clip in reverse
(final argument 1); event 9 starts it forward (0), both with reset. Opening a
selected note dispatches scene-3 event 9 at `0x13c954–0x13c968`; its preceding
suspended-software branch also dispatches scene-8 event 2. The UI adapter lacks
the complete source manager ordering and both paths' matching exit schedule.
No new input route or combined HUD/title animation is enabled by this pass.

## Verification

The code hash remains
`8a2feea02c2a6ef62c8a8d3e4cc20faa5639fe5af47d3876f8a5d3ea43064cc6`.
Twelve bounded source ranges, their byte hashes and annotated listings are in
`reference/notes-title-controller/` on the firmware SSD artifact volume.
The probe checks group names, frame 30, update step 1 and maximum height 36.

Six metadata tests pass, covering native field/bound, line breaks/NUL, malformed
inputs, exact provenance, atomic publication and the full converter path.
The existing firmware suite passes 42 tests with 13 unavailable-fixture skips;
11 Notes capture/switch tests pass. The private hydrated delivery audit passes
for 1,605 resources with existing warning categories and zero errors. The
existing suspended Notes source renderer passes with the metadata-only manifest update;
its synthetic LCD specimen is not native title/HUD acceptance evidence.

No browser, native LCD or audio comparison was performed. No runtime title/HUD
UI, icon, audio, note editing or keyboard behavior changed.
