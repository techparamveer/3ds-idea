# HOME navigation runtime

The renderer-independent `home-navigation.ts` owns context records and geometry.
`system.ts` owns lifecycle/input; `home-gestures.ts` owns pointer previews;
`home-layout.ts` moves folder labels, contents and history together. All menu
geometry and touch hits derive from `getHomeNavigationView`/`menuTiles`.

## Source and bounded defaults

The private 10.7.0-32E executable investigation is at
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/runtime/reference/folder-navigation/`.
`report.md`, `tables.json`, `fixtures.json` and the repeatable `analyse.py` pin
23 instruction anchors plus the new-folder density store. No private executable
or firmware assets are copied into this implementation.

| Density index | Root rows | Folder rows | Columns | Centre X | Root Y | Folder Y | X/Y pitch | Box |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | 1 | 1 | 3 | 76 | 161 | 161 | 84/82 | 72 |
| 1 | 2 | 1 | 3 | 76 | 82 | 137 | 84/84 | 72 |
| 2 | 3 | 2 | 5 | 52 | 70 | 109 | 54/54 | 50 |
| 3 | 4 | 3 | 7 | 40 | 64 | 95 | 40/40 | 36 |
| 4 | 5 | 4 | 9 | 32 | 60 | 87 | 32/32 | 28 |
| 5 | 6 | 5 | 10 | 34 | 54 | 80 | 28/28 | 24 |

Coordinates are slot centres. Child capacity is60; root capacity remains the
existing portfolio300 (not a claim of native360 parity). Folder maximum left
slots are57,57,50,39,24,10. Slots use column-major order, including empty slots.
The legacy `columns` token is3,4,6,8,10,12; it does not count visible columns.

A newly created folder has density1: native state47 creates through `0x1bfc30`,
then `0x1e4520–0x1e452c` stores1 in its density record. Fresh browser selection0
and left0 are explicit defaults; native reuse of old folder IDs is not claimed.
Entering restores that folder's record and guards an out-of-view selection.
Back restores root density, selection and left slot. HOME closes overlays or
suspends/resumes software while retaining the active HOME context. Full native
APT app-location reconciliation remains outside this change.

Directional movement follows the viewport edge. Density changes choose the
ascending left-slot candidate closest to the previous selected X, using native
float32 comparisons. New geometry does not use the folder's row count as a
surrogate density/animation frame. Presentation must bind the exposed density.

## Histories, gestures and storage

`rootView` and slot-keyed `folderViews` are authoritative. The public menu fields
are projections written by navigation actions. System-less menu consumers use
an optional `homeNavigation` field with the same contract. Folder moves/swaps
move the complete view record; deleting and recreating a folder creates a fresh
record. A retained active folder reference follows its moved identity.

Pointer previews carry an original immutable navigation record and transient
scroll pixels. Saving during drag/hover/pan serializes the original record;
cancel/focus/sleep restore it. A completed pan saves its aligned viewport.
App launch and HOME return retain histories and active folder. Explicit reset
layout discards these histories, retaining the global folder-name counter.

Preferences version4 adds `homeView` with active folder and root/folder records.
It saves no pointer state or animation clock. Version1–3 migration uses the
legacy root density and initializes each folder to density1, selected0,left0;
these are migration defaults, not recovered history. Invalid view records reset
individually while a valid layout and valid sibling records survive. Invalid
layout data still rejects the saved layout through the existing validator.

## Verification and limits

Focused tests exercise all six geometry tables, independent histories, nearest-X
placement, moves/swaps/delete/recreate, retained context through lifecycle,
version4 round-trip and malformed-record isolation, plus existing gesture,
menu, app runtime and persistence suites. In this worker checkout, full model
suites are blocked by LFS pointer fixtures; integration owns those heavy assets
and browser verification. Native interpolation is the next separate commit;
this checkpoint settles navigation endpoints immediately.
