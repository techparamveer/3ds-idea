# HOME empty-folder Delete native comparison

Date: 2 October 2026

Branch: `codex/home-folder-delete-compare-20261002`

Base: `e6802cfd2e1f31e6dc0509fc99d0517903f4ea0d`

## Scope

This is a comparison-only lane for the behavior of Delete in Folder Settings
when the selected folder is empty. It owns no runtime, asset, shared progress,
feature-map or private-matrix changes. The coordinator alone captures native
and browser states. Native/browser title population, exact input and animation
epoch remain unmatched.

## Native capture mapping

The fixed private manifest is
`home-folder-delete-20261002/comparison/native-manifest.json`. It records
Azahar's own 400x480 RGB PNGs with upper crop `(0,0,400,240)` and lower crop
`(40,240,320,240)`.

| Role | Native file | SHA-256 | Observed state |
| --- | --- | --- | --- |
| primary pre-Delete | `_02.10.26_17.01.11.853.png` | `16ec7ceb6af052a7663bcb1aca60160b03e4e3aa6fdb3c0eb7f77d73cd8325a9` | Folder Settings for empty Folder 1 |
| primary post-Delete | `_02.10.26_17.01.36.758.png` | `89c9934f782a5fd31b9b86cfc64d62a54ac4ae70cc740fffe3184d4a54762001` | Immediate root HOME, former folder vacancy selected, Create Folder footer visible |
| repeat pre-Delete | `_02.10.26_17.04.03.362.png` | `6e974965cdda3ac418faf2f1494055b1e0b7aabade3a31b11c552a74c063993b` | Folder Settings for empty Folder 2 |
| repeat post-Delete | `_02.10.26_17.04.17.601.png` | `263381a6c39a41358391179335d2d12cf49fd3df51b7227e9e5cc8b3ad26d441` | Repeat immediate root HOME/Create Folder result |

Both independent empty-folder runs went directly from the settled Folder
Settings panel to root HOME after Delete. No confirmation screen appeared.
After Folder 1 was deleted, creating the next folder produced Folder 2; the
repeat therefore also preserves the observed monotonic folder numbering.

Attempts to populate a folder by dragging Health or Camera did not move either
title. Those attempts are excluded. These captures establish empty-folder
deletion only; populated-folder deletion is not established.

## Baseline semantic discrepancy

At this base, the browser does not follow the native route. Activating Delete
from `folder-settings` sets `panel:'delete'`. `screens.ts` then draws a
reconstructed “Delete this folder?” panel with separate Cancel and Delete
buttons. A second activation is required before the reducer removes the empty
folder and returns to HOME.

That confirmation is not present in either native repeat and has no native
frame to pair against. It must be recorded as an unpaired source gap, not
force-fit to either native image. The required after behavior is one Delete
activation from the native Folder Settings row directly to root HOME, with the
same vacancy selected and Create Folder available. Rename remains inert because
software-keyboard input is outside scope.

## Frozen comparison plan

The production browser capture must retain the real action history and record
the state immediately before and after one Delete activation. The comparator
will hash and validate:

- `settings`: `menu=folder-settings`, six rows, selected folder retained;
- `post-delete`: `menu=home`, six rows, folder absent, the former vacancy
  selected, and Create Folder visible;
- no intermediate confirmation state in the after history;
- the baseline browser's reconstructed confirmation as a semantic source gap;
- raw native/baseline/after upper and lower PNGs with empty masks and threshold
  2, without translation, scale, geometry or phase fitting.

Fixed lower regions remain the existing source-backed coordinates: toolbar
`x0/y0/320x34`, root body `x0/y34/320x176`, footer
`x0/y210/320x30`, six-row cursor ROI `x119/y139/54x54`, and Folder Settings
modal `x20/y20/280x200`.

## Browser baseline capture

The coordinator completed browser session 54050 at baseline runtime
`79e77f58`. The browser process was PID 30014, window 10821, at frame
`(20,50,1150,780)`. The script exited zero with no page errors. Its root is
`home-folder-delete-20261002/browser-before`; `result.json` has SHA-256
`1ef42e3c6b3893c8869736ca2fbc2be0879e25a9071be128865d74965544ec33`.

All captures record six rows, selected global slot 34, selected source center
`(146,166)`, `inputMatched:false` and `nativeEpochMatched:false`:

| Browser capture | State after action | Capture JSON SHA-256 | Upper SHA-256 | Lower SHA-256 |
| --- | --- | --- | --- | --- |
| `folder` | `home`, created empty folder selected | `d638c2b650a237c1673bc95962c824f8abf3087fa04838718ef36910ed1d3a58` | `f298ae4ad82020a4fd05490eb5e2a33d737a35e08bbbe526b95ad16c93d293e6` | `e13c5c0a38c7a77589cd3b2a804372841d7e3bbcef8f49de65805c250dc91775` |
| `settings` | `folder-settings` | `6de519527957ffe75599d6711de0b6bcaab0bf329e13be484f0e6d7001c889c9` | `3d2251d7405875b7b6685a7edaa8c5dd8c0389ef06e2e1e506ec2dbcc902399f` | `9859a03ed60111cb9550722112071835b8f6c409a02aff5e45084bdf0c131613` |
| `delete-result` | reconstructed `delete` confirmation after one Delete touch | `bdc83f3c417144e7052773ec8a182ea1d72535afbfc6b3d3d925bbe3e1a79380` | `cbd864dc0e440ea4d1a3a43cc32f5546fb5f4af8a27f1ddc8d460c2d6c286f75` | `d6bf6b45c970035b2f9116e4d382bce1d931aa1fc421f390d924eb0d15f557c2` |

The action history is vacancy touch -> Folder Settings touch -> one Delete-row
touch at browser target `Touch_100_150`, each held for 50 ms. After the third
action the browser remains in `menu=delete`; native is already at root HOME.
The two states are therefore a semantic mismatch and must not be treated as an
equivalent-state pixel pair. The baseline confirmation images are retained and
hashed as evidence of the source gap only.

The native reference process PID 2591 used the isolated silent profile and
this time exited normally through Quit/Yes with status zero. PID absence was
verified and the muted configuration was retained.

## Acceptance boundary

This mapping is source-identified, native-observed and browser-captured. It
does not prove exact input, motion, audio, a populated-folder path or
whole-scenario fidelity. The baseline has a definite semantic failure. The
scenario remains fail/unverified until the integrated direct-delete route is
captured and compared.
