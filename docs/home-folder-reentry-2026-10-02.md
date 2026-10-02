# HOME continuous folder re-entry

## Captured Defect

A fresh isolated Azahar replay holds Health at folder child2 `(244,137)`,
passes through Back `(59,54)` into root HOME, hovers the same folder at
`(90,82)`, returns to child2, and releases. Native retains its lifted tile
through re-entry. Its toolbar/backing stay dimmed, its footer stays hidden,
and the upper title remains absent after the intervening root-held phase.
Initial in-folder pickup still has the upper title.

Production `deea852c` reaches the folder but loses `tilePickup` and the native
tile-touch ownership/latch inside the counted reducer pass. The browser drag
source and outer System touch survive, so the old fallback ghost paints too
low, Open reappears, and the backing is no longer dimmed. The scene's outer
reconciliation cannot recover the owner after the reducer has cleared it.

The before replay uses actual projected pointer input, first moving the
browser folder from19 to13 to match native's location, then restoring the
original layout/folders/children exactly. No application state is injected.
The two failed harness preparations are retained separately: an incorrect
Health ID assertion stopped before mutation, then a redundant selected-folder
tap launched Health. The successful `before-desktop-v3` reload restores the
known preparation before capturing; those failed attempts are not native pairs.

## Correction Contract

Ownership source `6f299639` integrates as `d58bc92a`. The new guard admits
only the same live app stroke crossing an armed, eligible folder-hover
boundary. It validates pointer, original source/item, current target, retained
touch and destination. Departed-container widgets/input/poses are rebuilt,
while source and blank geometry remain owned and moving Scale/anchor are
retargeted to the destination grid. Generic navigation and invalid contexts
retain cancellation. The existing500ms hover deadline is an adaptation,
not a new native timing claim.

Visibility source `7aa079b6` integrates as `95989614`. A latch on the existing
pickup owner records suppression after a validated Back visit to root and
retains it through folder re-entry. Initial folder-held paint is unchanged;
release/cancel clear it with the owner. This is a **capture-fitted visibility
history adaptation**, not recovery of a native controller. Banner resource
ownership/readiness and motion clocks are not discarded by the paint gate.

Independent review identified a follow-on guard gap in the first ownership
commit: source folder -> different preview folder -> Back, and root source ->
folder -> Back, still compared the departure folder with the original source.
Source `33fb1c96` integrates as `7727fa35` and validates the live departure
container instead, preserving the original pickup source. Pointer, armed Back,
touch ownership and source/item lineage checks remain. Independent review
reproduces both corrected chains through the reducer and outer scene wrapper;
immediate band exits and unrelated context replacements still reset ownership.
No actionable review finding remains in these three changes.

## Evidence

Private root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-folder-reentry-20261002/`.
The native instance is its sibling `native-folder-reentry-20261002`.
`native-input-record.md` retains clone/config/executable/CTM identities, input
phases and process closure. Static input2, Null output1, volume0; original/EUR.
Only the coordinator used GUI, on the authorized Mac. No system audio changed.

All native images are its own400x480 PNGs; lower crop is `(40,240,320,240)`.

| Phase | Native filename | SHA-256 |
| --- | --- | --- |
| Initial held | `_02.10.26_22.05.46.339.png` | `06a4002f2b72472beff6cd6d3456f96439834ee8c3a62ffedbc4133a5fb9fd99` |
| Root held | `_02.10.26_22.06.15.23.png` | `c009b1265c1c2b8b416564c1656bc327e63af3162e661f6f9b0c645ff3792616` |
| Re-entered held | `_02.10.26_22.06.43.208.png` | `dabfe85e2c16d28e6f3135eb65938447e5af6f2d12f610e662f247a6a4ad590f` |
| Released | `_02.10.26_22.07.15.034.png` | `9baa48118c43aa53406bba7a280f8a35b2827c6d73f152d3497e466cb0305283` |

The fresh neutral and returned-child-held capture opportunities were missed;
do not invent these pairs. Native CTM holds use nominal20s phases, while the
before browser replay uses shorter settled holds. Neither capture timestamps
nor UI pad-derived counters establish an exact shared render/input epoch.

Before fixed raw re-entry ROIs, with empty masks/no shifts: pickup shell5,148
pixels above delta2/maximum235; artwork2,169/235; toolbar10,880/53;
footer8,960/140; upper title14,906/209. Original blank child2 is0/maximum2.
Whole upper/lower are31,390/37,137 above delta2; both remain fail.

The coordinator opened `comparison/before-native-reentry-deea852c.png`.
Its SHA-256 is `c60a9abe62591d0c1c92055b9cfbb968ddf548d07ffc1ffc8dac61385175cb0c`.
Before report SHA-256:
`8304c2d8f89a34094c9bab1fcab97a6a2db9910b7f53d63c9129dc29e397a23f`;
manifest: `11b645036f65e0195ed78b172685da3f9fbda9b7efad39d0b7046042965b44b3`.

## Source and Acceptance Boundary

No delivered native resource, sampler, raster, geometry or fitted anchor is
changed. Health title0004001000022300/v3077/content0/00000008 and HOME
title0004003000009802/v24576/content0/00000082 retain the
[held-artwork element/manifest/dump mapping](home-held-title-artwork-2026-10-02.md#source-and-delivered-identity)
and [folder-capture layout/animation mapping](home-folder-held-dimming-2026-10-02.md#bounded-resource-trace).
The source-backed pictures are distinct from adapted ownership/visibility policy.

At the first ownership integration, full tests pass 1,846 with 0 fail, 23 skip,
1 TODO; typecheck passes. This is not the final verification of later commits.
At final runtime `7727fa35`, full tests pass 1,848 with 0 fail, 23 skip, 1 TODO
(1,872 total); typecheck and production build pass. Logs are `final-tests.log`,
`final-typecheck.log` and `final-build.log` under the private root. No shader or
native material changed. Strict whole-scenario, exact input/motion and muted audio
acceptance remain open. Existing portfolio, fitted-anchor, hover/drop/edge,
coverage/high-slot, lifecycle and backing adaptations remain explicit.

## Final Production Comparison

`after-phases` is the primary desktop run at `7727fa35`. It completes eight
raw paired-LCD captures with owned pickup/stroke retention, same-child release,
re-entered outside cancellation and exact fixture restoration. Actual pointer
events occur at 20,071 / 40,045 / 60,041 / 80,037 / 100,016 ms. These nominal
phase holds do not establish native HID cadence or a common rendered epoch.
`after-mobile` and `after-reduced` also complete eight pairs each; all three
runs exit 0 with no page errors. `back-regression-desktop` completes seven
pairs: Back drag-out, occupied-root swap, item conservation, reverse fixture
restoration and outside cancellation all pass.

The earlier `after-desktop` captures all eight pairs and restores the fixture,
but exits 1 on an overly strict harness assertion: projected Y is
122.99996948242188 rather than exactly 123. The final harness uses a 0.01-pixel
tolerance. Its quick captures/report remain immutable supporting evidence,
not a successful full run or the primary comparison.

Raw re-entry comparison uses fixed coordinates, empty masks and no shifts:

| Region (x,y,width,height) | Before pixels above delta 2 / max | Final pixels above delta 2 / max |
| --- | --- | --- |
| Whole lower (0,0,320,240) | 37,137 / 235 | 5,284 / 98 |
| Pickup shell (50,28,80,80) | 5,148 / 235 | 598 / 22 |
| Artwork (65,44,50,50) | 2,169 / 235 | 47 / 8 |
| Toolbar (0,0,320,34) | 10,880 / 53 | 82 / 7 |
| Footer (0,212,320,28) | 8,960 / 140 | 1,576 / 4 |
| Original blank child (216,109,56,56) | 0 / 2 | 0 / 2 |
| Upper title diagnostic (48,88,320,86) | 14,906 / 209 | 13,070 / 13 |

The title is visibly absent after root/re-entry, as in native. Whole upper
still differs at 44,834 pixels above delta 2, maximum 220 (before 31,390 / 220):
wallpaper/HUD/content epochs are unmatched. Blank-child pixels are unchanged.
Pickup shell/artwork sampling, footer transport precision, exact input/motion,
audio and whole-screen parity remain unresolved. All whole states remain fail.

Primary evidence under `comparison/`:

| Artifact | SHA-256 |
| --- | --- |
| `primary-report-7727fa35.json` | `77d82a95d04194e080f7e135a114bd4249249f3f5aad55d437e6be67eac56080` |
| `primary-manifest-7727fa35.json` | `eec80d8a2004bdb1af2ebdd995e6c1f92a68c3b3af4b3c8a733cc6e9d712d602` |
| `before-native-phase-after-7727fa35.png` | `f11c5dab8a6f581d52bb91f495c70918708061b6c87b23efe6a1b8de3d5a2242` |

Coordinator opened the final sheet, raw lower captures and desktop/mobile
console screenshots, and independently verified all 140 manifest records.
The immutable quick report/manifest/sheet retain hashes
`f119e5c1ae616bffcf33a00773d57e816b6cd0e22222d38dfd1fda2d68f1514b`,
`9283f5601ccc9d20576b0d0de2df6013f3b88156db8a88c942a3e93e8732e0a3`,
and `c838a66cefc5d37bb8bff3a152652202f12a9c750bbbd918a3fd7bbb7de87879`.
Dedicated native and Chrome processes close normally with exit 0; production
preview remains on port 3021. No private matrix, original firmware, default
profile, system audio or DeveloperStorage artifact changes.
