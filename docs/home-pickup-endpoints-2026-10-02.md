# HOME folder pickup/drop endpoint comparison

Runtime `28083c79933c6bafb2ecfc49a62c3078dfdb066e` is unchanged. This is a
fresh native/production comparison, not a new pickup implementation or whole
scenario pass. The preceding footer implementation remains `f031cca9`.

## Input and isolation

The exact private `native-close-clean-20261002` executable, SHA-256
`3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`, ran as
PID73488/window11393. Its actual executable and working directory were checked
with `lsof`; the user tree has no symlinks. Original hardware, EUR, normal100%
frame limit, Static input2, Null output1 and volume0 were verified. The direct
launch warning was dismissed. The entire Mac is now user-authorized; no iPad
was required. No default profile, system audio, Spotify or microphone changes.

The restored test folder contained Health in child2 at lower-LCD `(244,137)`.
A slow10-second/100-step drag to `(160,137)` moved it to child1; reversing the
path restored child2. Native coordinates are inferred from verified window
bounds, approximately `(243,136)` to `(160,136)`, not instrumented touch data.
Production uses actual projected touchscreen pointer input, not injected state.
Host timing and sample placement are not exact native-emulation cadence.

| Settled native own400x480 capture | State | SHA-256 |
| --- | --- | --- |
| `_02.10.26_19.46.14.191.png` | Health child2 before | `eb78833a3bad3ea30b986934484ade853f67c11c0543dfcb482a49be447bc925` |
| `_02.10.26_19.46.46.548.png` | Health child1 after left drag | `4d9c67f1b692faea342d7ea6bbc36979dc7af84a179b1300e69c58ecf187aed7` |
| `_02.10.26_19.49.15.91.png` | Health child2 restored | `41b82524e69f6cd94185618fd3dc12e0cfea06abb198de58764f5d2c878750d0` |

Native screenshots are beneath the private clone's `screenshots/` directory.
The input record, production scripts/captures and comparison are under
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-pickup-visible-20261002/`.
The first browser setup double-tapped selected Health and entered launch;
`browser-before` is excluded. Corrected `browser-before-v2`, `browser-mobile`
and `browser-reduced` each complete five raw400x240/320x240 pairs, muted and
without page errors. Each verifies child2 ->1 ->2. Native's preliminary
1800ms/two-step drag did not relocate the icon and remains unclassified.

## Pixel evidence

Empty masks, no offset, translation, fitted phase or color correction. Native
lower pixels are extracted at `(40,240,320,240)` from its own PNG. Fixed
comparison regions never erase cursor or background differences from totals.

| Region | Pixels above delta2 | Maximum delta |
| --- | ---: | ---: |
| Selected Health artwork core, each endpoint | 0 | 1 |
| Vacated blank-cell core, each endpoint | 0 | 1 |
| Folder/toolbar divider `(18,37,284,4)` | 840 / 1,136 | 4 |
| Footer top line `(22,210,276,1)` | 276 / 276 | 3 |
| Broader footer region | 464 | 6 |

The stable strip residuals repeat across all three native endpoints and all
browser variants. At `(100,37)`, native RGB is `(214,219,222)` versus browser
`(217,218,226)`; at `(100,210)`, native `(110,114,125)` versus browser
`(108,114,122)`. These are real non-epoch mismatches. Native backdrop format
and raster precision remain unproved; a keyboard-specific RGB565 descriptor
does not establish HOME's format. Do not apply a guessed color transform.

Whole desktop lower residuals are6,328 /5,420 /5,674 pixels above2; upper
24,153 /52,039 /17,321. All whole scenarios remain `fail`. Cursor phases,
upper wallpaper/banner/HUD epochs, retained-root population and backing
shades are not aligned or accepted.

Final `comparison/report.json` SHA-256:
`17bc027571296a42b63838c11241ce49501c160a1eb7cadfd88132eb2bdae3aa`.
The coordinator opened the paired-LCD, stable-region and variant sheets;
`comparison/manifest.json` tracks all report, capture and sheet identities.
Sheet hashes respectively are `7cf4aa63...`, `0550d335...` and `79a15aad...`.

## Boundaries

Held browser samples retain mode14, matching source/container ownership,
pickup/blank applied frames and hidden primary cursor. Released samples clear
pickup and touch ownership. Native held frames were not captured, so these
are browser ownership checks only, not matched pickup animation evidence.
Movement/drop/hover/edge timing remains an explicit browser adaptation under
the [pickup contract](home-pickup-entry-contract.md). Native visual provenance
is unchanged: [folder capture and panel mapping](home-folder-gutter-2026-10-02.md),
[Open footer mapping](home-open-folder-footer-2026-10-02.md), and
[cursor mapping](home-cursor-replay-2026-10-02.md). No new assets were delivered.

No runtime changed; full tests/build/typecheck were not rerun for this
documentation-only slice. Their preceding results remain1,827 pass/0 fail,
23 skips/1 TODO, build/typecheck pass, not new acceptance evidence. Native and
owned Chrome exited0, and preview3021 remains ready. Exact input, held motion,
cue/audio, other densities, root reordering, folder hover and edge scrolling
remain open. Next work must capture an unverified interaction or resolve the
specific backing source gap, not repeat the established endpoint comparison.
