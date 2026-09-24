# Notes composed title/HUD publication

This continues the [material and list-gate contract](native-notes-material-publication.md).
The first **applied** ImageScreenUp title pose and one Open→Back owner cycle are
now reproducible from the published pack and the owner-bound scheduler. The
first **user-visible** title frame is not. Live title/HUD paint stays
disconnected.

## What this pass proves

`createNotesPanelPublisher` is a disconnected applied-layout composer. It is
not imported by `stock-native-personal-tools.ts` or `stock-apps.ts`. Each
`afterScene3` observation is posed onto the last applied layout with the
constructor group bindings:

| Controller | Resource clips | Native bind |
| --- | --- | --- |
| Title `+0x310` | `TextPanelInOut`, `TextPanelStay` | `G_Panel_01` only (`0x1678d0`) |
| HUD/Switch `+0x388` | Switch Double/Up/Down, HUD Double/Up/Down | `G_Panel_00` only (`0x167844`) |

Disabled slots are omitted so retained values survive. A changed command ticket
discards the retained layout and reseeds from the shared resource. The pack is
never mutated.

The published `memo-ImageScreenUp-arc-l.json` resource (source SHA-256
`8001ff24296fc5c1a627c238c1bf8e4682102cb66882411cae32362e2c442d7a`) hides the
title at rest: `W_TextPanel` flags=2, alpha=0, y=−90. `TextPanelInOut` visible
keys are frame 0 = 0, frame 1 = 1. Event 0 starts title slot 0 only
(`0x1675a8`) and does not sample pane properties. The first apply is the first
scene-3 update tail: InOut **frame 1**, title visible, alpha and y between the
authored 0/255 and −90/−80 keys. Capture panes stay at resource defaults
because HUD is not started at init.

Late Open/event 9 still only reset-enables HUD after that pass's apply. The
next scene-3 observation samples HUD over the retained title. Back/event 8
starts reverse HUD before scene 3, so that pass applies HUD frame 19 without
restarting the title. Owner replacement uses a new ticket: previous HUD
geometry cannot remain, and the first title apply is reseeded from the resource.

`G_Panel_00` contains only capture/shadow panes. `G_Panel_01` contains
`W_TextPanel`, `P_ObjIcnUp00` and `P_ObjIcnDown00`. HUD resource clips list
both groups; applying them globally would write the title. The publisher
overrides the constructor groups and forces `childBinding: false`.

## List and intro clocks that still surround that pose

List controllers now have pinned resource names:

| Object | Table | Slots |
| --- | --- | --- |
| `G_Scene_00` | `0x1aa810` | Base, SceneIn, SceneOut |
| selected-note `G_BtnMemo_%02d` | `0x1aa81c` | Base, SceneIn, SceneOut, **MemoReturn** (open/return slot 3) |
| `N_Scene_00` `+0xf80` | `0x1aa82c` | Base, SceneIn, SceneOut (open slot 2; return@frame5 slot 1) |
| `G_Cursor_00` `+0xfa0` | `0x1aa838` | 13 clips; entry slot 0 Base, open slot 10 MemoDecide, return slot 11 MemoReturn |

Accepted open (`0x13c8c8`, `0x13c8f0`) starts `+0xf80` slot 2 and `+0xfa0`
slot 10 after scene 3. List return event 1 starts selected-note slot 3 and
`+0xfa0` slot 11; the later frame-5 gate starts `+0xf80` slot 1. Those are
list-scene clocks, not ImageScreenUp title samples.

Scene 9 remains `ApltBoot_D`. Scene factory index 10 (`0x13aae4`) constructs
`0x166158`, which installs vtable `0x1b6b04`. Update `0x16601c` and layout
init `0x165fd0` load `ApltBoot_U_00.bclyt` / `ApltBoot_U_00_SceneIn`. Both
intros clear their own draw flag at +0x69 when their SceneIn slot finishes
(`0x13b93c`, `0x1660f4`). Draw walks priorities 8→0, so priority-0 scene 10
draws after priority-4 scene 3 and can hide an already-applied title.

The extracted archives
`romfs/memo/ApltBoot_U_00.arc.l` and `ApltBoot_D_00.arc.l` are now published
additively as `memo-ApltBoot_U_00-arc-l.json` and
`memo-ApltBoot_D_00-arc-l.json`. Follow-up:
[intro publication](native-notes-intro-publication.md) replays their SceneIn
clocks over scene 3 and proves the first user-visible title after scene-10
draw-disable.

## Why the live panel stays disconnected

The current main adapter still paints `MemoTutorialUp` help text on the list.
Drawing paints settled Switch capture and **hides** `W_TextPanel`. That is the
visible gap in
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/live-smoke-2026-09-24/notes-main-title-gap.jpg`:
the browser shows the tutorial upper, not capture plus a source title/HUD.

ApltBoot publication no longer blocks the first user-visible pose. Connecting
the composer now would still invent when those 21 manager passes occur,
because a browser-to-source update clock is missing. Window-leaf /
render-helper raster remains a later fidelity question.

No Software Keyboard or editing path is added.

## Precise next gate

See [intro publication](native-notes-intro-publication.md): establish a
browser-to-source update clock, then import the intro composer in place of
`MemoTutorialUp`. Keep `W_TextPanel` hidden until that live ownership is
proven.

## Verification

The composed pass wrote **122 original byte/resource checks** and **38 hashed
source ranges** under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/notes-composed-publication/`.
The intro follow-up extends the same verifier and writes
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/notes-intro-publication/`.
The composer is not a live paint path and makes no browser or native-raster
claim.
