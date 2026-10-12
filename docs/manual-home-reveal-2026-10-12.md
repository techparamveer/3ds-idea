# Manual HOME reveal, 12 October 2026

AN-02 remains fail/unproven. This is the selected-icon versus populated-grid
residual after the [Manual feedback repair](manual-feedback-2026-10-12.md).
It does not reopen the repaired Close cover or held/released footer feedback.

## Captured defect

At runtime2b08f0a, the production browser paints all occupied HOME tiles beneath
Manual's incoming cover. Native first and repeated Camera Manual returns show
the selected Camera first, with blank neighbouring positions. Other icons
populate before the upper Camera banner appears.

The bounded comparison used every browser incoming0..20 and handoff sample
and consecutive windows from the closed normal-speed native movies. Audit
`257649bc` confirms broad within-route ordering, not matching fixtures or
native pixels. Camera occupies different columns and the surrounding titles
differ. The native blank positions later populate in the same route.

Root then captured123 own400x480 native PNGs: HOME and two Contents baselines,
plus60 samples from each Close at5% emulator speed. Every route uses the actual
Contents Close touch and retains all three20-image batches. These slowed
images establish visible states, not normal cadence or native input epochs.
There are explicit10.03s/14.05s host gaps before the third batches.

| Raw native state | First Close ordinal | Repeat ordinal |
| --- | --- | --- |
| Clear selected-only HOME | 47..48 | 45..46 |
| Partial neighbouring population | 49 | 47 |
| Health/Sound populated; upper banner absent | 50 | 48 |
| First saved Camera banner | 54 | 52 |

The coordinator inspected all11 sheets: six lower chronology, two upper
chronology, two paired-boundary sheets and the three paired baselines.
Native PID83097 quit with exit0; the complete isolated
profile returned to SHA-256
`031bc53517a1557c1b6fab2d341a2b9b10a304eb79665decaeccdb89a05ed1ad`.
Only the MacBook display was used. All3DS audio remained muted.

## Source and scope

The pinned HOME EUR title0004003000009802 v24576, content0/00000082, has
decrypted application SHA-256
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.
Code SHA-256 is
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.

The bounded source report `cf95fc9c` identifies record+0x36 bit1 gating ordinary
artwork. The fallback at0x1e3040 hides artwork and selects blank category5.
Registration clears the bit; accepted payload/texture installation sets it.
Calling this readiness is an inference. The Manual-return caller, live record
values and selected-Camera retention path remain unresolved. No native reveal
clock or fixed delay was recovered; no further source-only pass is assigned.

The [source handoff](workstream-handoffs/manual-home-reveal-20261012.md)
records the manifest key, CIA-internal path, converter and source hashes.
The fitted candidate uses existing `LncIconSetSrc_00` empty graphics through
the accepted incoming endpoint, then restores ordinary neighbours at the
existing handoff before banner admission. It changes no logical grid,
selection, source asset or cover clock. This is a browser visibility
adaptation, not an implementation of the native loader schedule. Native
per-neighbour stagger, exact timing/raster/input and muted audio remain open.
Existing portfolio and compositor adaptations remain unchanged.

## Evidence location

Private run:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/toprow-current-20261010/manual-home-reveal-20261012-v1/`.

Read `native-capture-policy.md`, `native-capture-ledger.md`,
`ordering-audit-astra-v1/report.md`, `source-astra-v1/source-contract.md`
and `raw-ordering-audit-astra-v1/`. The candidate policy was declared before
browser input. Implementation, review, tests and production recapture are
reported separately below. No whole-flow acceptance follows from this
source and native diagnostic checkpoint.

## Candidate and checks

Candidate commit `0b890db58ec3ca4089b4c3ff31baabf5c0f30e86` changes only
the Manual incoming grid visibility and adds focused regression tests.
The worker's two test runs report 259 passes and two existing skips. Both
typechecks pass. Independent source review `22fb41f9` has no actionable
findings; its runs report 108 passes/two skips and six compositor probes,
including folder-child selection. These are code checks, not browser or
native acceptance.

The clean candidate full suite reports 2,829 passes, one known missing
historical Camera PNG failure, 102 skips and one TODO. The failure remains
`tests/camera-date-group.test.mjs:44`; it has not been bypassed. Production
build passes at `aliq5AWB4-hIMEWfdtw6D`. Manifest
`c6ad7fd6dce3e48e8a2884d0ee857d6d0b8128c7e9b5ec10331d513a93c0dbec`
binds 2,852 source/build files, 15 verification artifacts, the unchanged
dependencies and 77 hydrated models. Pre/post input verification returns
zero differences. Focused/typecheck and independent review records remain
separate from this root full-suite/build manifest.

The closed raw native audit report is
`07aee4ea970bfdfa06935a24ba73897a2acc82be9d7c1733320395e77384486a`,
with manifest
`1359bb553467123116c234b3524d835d2832c6349d902b5ab26bcd5c259914eb`.
It validates all 123 original PNGs and the 11 sheets inspected by root.

## Production recapture

Root drives the muted production build on the MacBook with ordinary HOME
navigation to Camera, followed by first entry/Close and repeated entry/Close.
All four footer contacts request 500ms. Every route reaches its visible
destination before Stop; every export completes before the next input.
The recorder saves 292, 309, 309 and 308 raw LCD pairs, 1,218 total.
Exact final directories and GUI observations are in the private
`candidate-capture-ledger.md`. Temporary capture tab/server3040 are closed;
the older normal3039 preview is untouched.

Root opened all 25 candidate sheets and reopened both native raw boundary
sheets. First Close incoming20 at sequence60 retains selected Camera and
blank ordinary neighbours; handoff61 restores the grid without the upper
banner; first cleared62 shows the banner. Repeated Close follows the same
order at sequences61,62,63. Native also shows partial-neighbour population,
which this single-handoff adaptation does not reproduce.

All 16 fixed whole-pair browser regressions are PNG/RGBA exact. The 22 held
Close crops and both released Manual-entry crops remain exact against the
previous candidate. These checks preserve the earlier feedback repairs.

The incoming20 comparison retains unmasked residuals. Selected Camera's
40x40 artwork and the footer match exactly. The surrounding 84x84 tile ring
differs by 2,444/2,438 pixels on first/repeat. The toolbar band differs by
82/88 pixels, confined to its bottom two rows beside that tile. Whole upper
LCDs differ by 54,609/73,025 pixels. Background/HUD bands are not isolated
static controls, so no cause or regression exemption is inferred from their
location. Entry out0 also retains unmasked background/banner/HUD/cursor
differences. No mask or phase substitution was used.

Closed audit `c20648a2988a36898722a1b7204b19e3a80caac4aa5a2cefad76f878dae8b326`,
manifest `e4931b2d205327801f92f29e0aaf541f4963a1e70210a0aea981ffc6bddbd92d`,
validates all 1,218 triples/2,436 PNGs and all 3,654 unchanged originals.
Both Close routes retain every feedback0..1, out0..20 and in0..20 value plus
handoff. Entry sampling gaps remain listed, not filled. All 46 supplementary
Close feedback/out comparisons are exact. No fully black LCD or recorder
failure was found. Root inspection SHA-256 is
`2252b3ba673f77722cc1858cab8e9fc736092b4dec2067a2ced532648d0bf391`.

Root fast-forwarded and pushed the coordinator to exact commit 0b890db; no equivalent
cherry-pick or rebuild is relabelled as this captured candidate. The unrelated
human system.ts edit remains unchanged and unstaged. This is a bounded
visibility-order improvement with fixed browser regressions, not whole-flow
parity. Native input epochs, cadence, per-neighbour stagger, remaining moving
pixels and muted audio remain open.

The normal preview at `http://127.0.0.1:3040/` serves that frozen build.
Root inspected the sourced console and both HOME LCDs with Camera selected
in a new muted MacBook tab. Address autocomplete briefly chose the old
diagnostic query; root corrected it before any app or recorder input. The
private `integrated-preview.md` records this deviation and process identity.
This basic preview inspection does not add native acceptance evidence.

## Settings neighbour comparison

The follow-up private run `manual-neighbour-order-20261012-v1` saves143
own400x480 PNGs from first/repeated System Settings Manual Close. The exact
isolated executable, HOME content and restored profile remain3dfdfbed,
c622d1c5 and031bc535. Requests use5% diagnostic speed and2,000ms Close contacts,
not normal-cadence measurements. Native PID97143 quits with exit0.

Repeat53..54 retain only selected Settings. Face Raiders and Activity appear
at55, Download Play and AR join at56, and eShop/exposed far-left tiles join
at57. The banner first appears in saved59. Six fixed40x40 interiors corroborate
the full-artwork grouping. The first run's selected-only60 to populated61
crosses a10,030ms file gap, so that population order is unknown.

This differs from Camera's earlier right-column group. It does not establish
a general geometric or title-loading schedule. The preliminary claim of blank
raised plates at repeat55 was incorrect and is explicitly withdrawn. Exact
paired sheets show Face Raiders/Activity artwork at55.

Closed report SHA-256
`6c60246d2d9861e7ecce51dbf2f33fc8608c84b4221dd09784375420a639ce3b`
and manifest
`60ecd20ca4f15de1bfc847e897a6a0ba06d60f37b12cf7085b9e146ad30d3084`
are in that run's `comparison-astra-v1`. All143 originals and142 recorded
request brackets validate and remain unchanged. Root opened all eleven sheets,
recorded in `root-inspection.md`. No browser comparison, mask or phase fit
was added. Keep the partial-neighbour scheduling gap; no runtime change is
justified. Continue AN-04 compact/expanded HOME and Resume comparison.
