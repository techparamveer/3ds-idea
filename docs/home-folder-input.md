# Open-folder Back and empty-slot footer input

The pure input path uses the settled native `LncFolder_00/Bounding_00` rectangle:
**x23…95, y43…65, inclusive** in the lower screen's 320×240 coordinates. `state.ts`
exports `HOME_FOLDER_BACK_BOUNDS` and `isHomeFolderBackTouch(state,x,y)`;
`system.ts` checks it before the grid. `home-gestures.ts` treats it as chrome,
requires press and release inside the tab, and never starts grid scrolling or
icon lifting there. The existing movement slop remains an authored input policy.
Touch Back and physical B share `reduceSystem('back')` and preserve root/folder
selection, viewport and density histories.

`hasEmptyHomeFolderSelection(state)` is the shared footer predicate. It returns
true when a folder is open and the **selected child slot** has no software; other
occupied children do not change the result. For that condition the presentation
owner must return no footer and paint neither its background nor labels/buttons.
There is no footer action: lower blank-area taps and A do nothing. Back/B still
leave the folder. Blank root slots keep Create Folder. This change preserves the
existing occupied-software footer behavior without claiming that its left action
is native-verified.

## Evidence

The private investigation lives under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/runtime/reference/folder-input/`.
`analyse.py` checks 36 ARM instruction anchors against executable SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`, decodes the original
layout, checks the existing screenshot hash, and emits `evidence.json` plus
bounded assembly excerpts. No firmware bytes are added to the repository.

| Source | Supported result |
| --- | --- |
| `LncFolder_00.bclyt`, `Bounding_00` | Translation (-101,55), size72×22, origin7, identity parent transforms in the settled open layout |
| `0x21e1b0–0x21e250` | Origin7 is bottom-centre: local x[-36,36], y[0,22]; screen centre(160,120) yields x[23,95], y[43,65] |
| `0x224814–0x224908` | Native bounds comparisons admit equality at all four edges |
| `0x2b4640–0x2b46c4`, `0x2555f8–0x255658` | Back control stored at runtime+0xf30 binds key mask2 (B) |
| `0x2a451c–0x2a4530` | That control requests folder-exit state44 |
| `0x29af68–0x29b04c` | Recurring footer routing hides a selected empty child in an active folder through `0x1e0cb4`; root blank slots take the normal footer updater |
| `0x294090–0x2940d4` | Resume path separately skips the footer show setter for an empty selected child |
| `0x1d66a0–0x1d66c4`, `0x2af938–0x2af974` | Empty root slot selects footer type3; its activation requests create-folder state47 |
| `0x2a3e08–0x2a3e38`, `0x2a3ef8–0x2a3f10` | Density button requests read/change pending target+0x1190 before mode5; rapid accepted requests should not use the still-current density |

The existing `reference/home-folder-open-a.png` has no bottom footer. Its Back
artwork is approximately x24…94,y46…66 after subtracting the lower screen offset
(40,240); artwork pixels are not the native hit rectangle. This screenshot was
inspected without running Azahar or opening a browser.

## Verification boundary

`home-folder-input.test.mjs` checks all six densities and boundary edges,
root/folder history equivalence for B/touch, cancellation and cross-boundary
releases, empty selected children in empty and occupied folders, and retained
root creation/occupied-child launch. The motion suite adds rapid successive zoom
and shared monotonic clip-clock coverage. Rendering and browser verification
belong to the integration task.

The static hit rectangle describes the settled normal folder. Animated wrapper
transforms, palette/rearrangement mode, native press timing, drag-out boundaries,
and native occupied-footer left actions are outside this bounded correction.
The native rapid-request arithmetic is verified from source; event delivery
during every transitional native state has not been executed here.

The later [folder-close source trace](native-folder-close-boundary.md) establishes
the normal animation completion and clear-to-restored-selection request boundary.
That proposal does not yet replace this input correction's immediate Back reducer.
