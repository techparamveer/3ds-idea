# HOME empty-folder Delete — native behavior and bounded correction

This slice corrects only the observed empty-folder route. In the isolated EUR
10.7.0-32E HOME Menu, activating **Delete** from Folder Settings for an empty
folder removed the folder immediately and returned to the root HOME view. No
confirmation appeared. The previous portfolio route always opened an authored
“Delete this folder?” confirmation and was behaviorally incorrect.

The native settled captures are:

- Folder Settings before Delete:
  `_02.10.26_17.01.11.853.png`, SHA-256
  `16ec7ceb6af052a7663bcb1aca60160b03e4e3aa6fdb3c0eb7f77d73cd8325a9`;
- root HOME/Create Folder after Delete:
  `_02.10.26_17.01.36.758.png`, SHA-256
  `89c9934f782a5fd31b9b86cfc64d62a54ac4ae70cc740fffe3184d4a54762001`.

Both are native 400x480 own-PNGs under the private
`native-close-clean-20261002/screenshots/` evidence directory. They establish
the settled before/after behavior only. Exact input cadence, transition frames
and native audio remain unverified.

## Runtime contract

Folder Settings Delete now makes the occupancy decision before entering the
legacy `delete` panel:

- an empty folder is removed immediately through the existing deletion
  transaction;
- a populated folder retains the existing non-native adapter pending a native
  capture. The failed populated-folder setup did not establish native behavior,
  so this slice does not invent an error or confirmation screen.

The direct transaction removes the folder label, empty `folderLayouts` entry,
session-local folder identity and saved navigation view, resets the panel
choice, and returns to root HOME. It does not alter application placement or
the monotonic New Folder numbering history. Touch still requires down/up on
the same source Delete row; physical/keyboard activation uses the same reducer
transaction. Rename remains inert because Software Keyboard is excluded.

## Source and provenance

No new native pixels or audio are introduced. The observed activation starts
from the already-delivered Folder Settings composition; the post-delete root
uses existing HOME chrome and footer presentation.

| Visible element / action | Manifest key and decrypted source | SHA-256 |
| --- | --- | --- |
| Folder Settings Delete row and source touch pane | `home.sequence` → `DlgBtn02_00` → `sequence_LZ.bin/blyt/DlgBtn02_00.bclyt` | `1c53a7c5608659f5e1a198221902d814a58745b871f96d211248fc9446e76365` |
| Delete row English label/style | `home.messages` → `menu_msbt_LZ/lau_dlg_folder_delete` → `RomFS/message/EU_English/menu_msbt_LZ.bin` | `1df2193c64e8d08b3b670923617ea1f0461537397b3da671d394304a664b4350` |
| Root Create Folder footer | `home.launcher` → `LncBtmBtn_02` → `launcher_LZ.bin/blyt/LncBtmBtn_02.bclyt`; label `lau_1b_make_folder` from the same English MSBT | layout `1be988eda6f3d2374d8445d0773688fa1c6dd118590cb986d526c0dc4f326a44`; MSBT as above |

The pinned source is HOME title `0004003000009802`, version 24576, content
index 0 / content ID `00000082`. The HOME CIA SHA-256 is
`2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`;
decrypted `code.bin` is
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Conversion is `ctr-native-web` 1.2.0 with CTRTool 1.3.0.
Delivered pack SHA-256 values are
`c38ca7d80b27ffa88875c1d9090d11e7cad7e9f23f9398de69032dc807b9b1a0`
for `home.sequence`,
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`
for `home.launcher`, and
`3df11ee9ad6b57e4c043da636c4b606f52e41fbf0a57022cc2696f8b895817d2`
for `home.messages`.

The decoded English message `lau_dlg_folder_delete_02` says “Folders
containing data cannot be deleted.” It is source identification for a possible
populated-folder notice, not permission to publish one without a matching
native capture. `Dlg_A_D_01` and other dialog candidates likewise remain
unwired.

## Verification boundary

Focused reducer/input tests cover immediate touch and physical activation,
same-target drag protection, nonempty preservation, application-layout
preservation, identity retirement and navigation-view cleanup. This worker did
not operate a GUI, browser or native session and did not run a production build.
The coordinator must integrate, capture the same native/browser empty-folder
route, compare raw LCDs, and verify transition/input/audio timing. The retained
populated-folder adapter remains visibly non-native and unverified.

The two focused batches pass 130/130 tests and `npm run typecheck` passes. The
full sparse-worktree suite reaches 1,716 passing, 23 skipped and one todo; its
36 failures are the pre-existing missing `model/candidates/joshua-xl/*.glb`
files (three delivery assertions and 33 source-model modules fail with
`ENOENT`). The coordinator's full integration checkout contains those sourced
model files and must rerun the complete suite after integration.

## Integrated production verification

Source `7d6cdbf2` integrated as `2f074d64`. The coordinator's full checkout
passes 1,801 tests with zero failures, 23 skips and one TODO; typecheck and
production build pass. Independent read-only review found no concrete defect.
Production actual touch Delete, keyboard choice plus console A, reload
persistence and mobile Delete all return to root HOME with the same vacancy
selected. Recreated folders advance numbering; no generic confirmation appears.
The dedicated browser stayed muted and reported no page errors. Both raw LCDs
and desktop/mobile views were inspected.

Artifacts are under
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-folder-delete-20261002/`:
`browser-before/`, `browser-after/`, `regression-before/`, `regression-after/`
and `regression-results-after.json`. All five stock lower and both Settings
upper regression LCDs are byte-identical. Health main upper epochs are
unmatched; no native motion regression conclusion follows from that pair.
The [comparison handoff](workstream-handoffs/home-folder-delete-compare.md)
records named hashes, empty-mask native comparisons and remaining full-screen
differences. Whole scenarios remain fail; this is not 1:1 acceptance.
