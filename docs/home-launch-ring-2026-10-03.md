# HOME Launch Decide Ring

Runtime `8fada42d` (worker `05a2751c` on base `abd24f4a`). This pass adds the
teal ring that native draws from the selected icon while HOME fades for an
app launch. It reuses the frozen native capture from the
[launch onset pass](home-launch-onset-2026-10-03.md).

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-launch-ring-20261003/`.

## Visible Defect

Zoomed native lower crops (N065..N082 at the Health cursor centre 244,137)
show a small teal glow at the icon centre from N074, growing through N076,
becoming a spreading ring by N078 and fading as it expands (N080, N082).
The browser drew no ring after the [cursor retention pass](home-launch-cursor-2026-10-03.md).

## Rejected Candidate

Worker `4b8d4247`, integrated as `03c98e54`, advanced the retained cursor's
`LncCsr_00_Loop` (W_CsrLgt_00 alpha 180..60) during launch. Its 69-pair
recapture showed the loop advancing (applied 42..59..2) with no visible
change, and browser idle loop phases 1 and 45 look alike. The native glow is
not that pulse. Reverted as `abd24f4a`; evidence
`home-launch-cursor-loop-20261003/crop-sheet.png`, SHA in the sibling root.
Its independent review found no defect; the revert is evidence-driven.
Rejected-candidate crop sheet SHA
`4624d0589524b0a7a5619c3fdfa50ddd9e0c5b91a14da494319444439eb1546c`.

## Source

HOME `0004003000009802` v24576, manifest `home.launcher` ->
`packs/home/launcher.json` (unchanged pack and provenance as in the
[launch onset note](home-launch-onset-2026-10-03.md)). Layout `LncCsrEfct_01`
(texture `LncCsrShdw_50.bclim`, panes `N_EfctRoot_00/01`,
`P_CsrEfct_00/01`) and clips `LncCsrEfct_01_Scale` (16 frames) and
`LncCsrEfct_01_DisAppear` (61 frames): `P_CsrEfct_00` scale 0.48 -> 2.2 and
`P_CsrEfct_01` 0.38 -> 1.4 over frames 0..33; `N_EfctRoot_01` alpha
0 -> 255 by 5, held to 16, 0 by 35. The browser previously never requested
this layout.

## Change

The launcher pack requests `LncCsrEfct_01`. An eligible retained launch draws
it at the retained cursor centre with Scale at the cursor's applied density
frame, then DisAppear, whose `P_CsrEfct_00/01` expansion overrides Scale's
constant keys. DisAppear's `G_Scene_00` group excludes `N_EfctRoot_00`, so
its root scale stays with Scale (review follow-up `b0107e1d`, integrated `f3f05b91`, corrects the
comment; no runtime change). Its frame
is `systemTransitionFrame(launch elapsed, 60)`: origin at the launch fade
start, fitted to the captured native order. That origin is an adaptation;
the native dispatch is untraced. Reduced motion takes the empty end frame.
A failed draw enters paired recovery.

## Verification

Independent review found no correctness defect; it corrected the binding
comment. Worker: focused tests 98/98 (ring frame, eligible draw arguments, failure
recovery); full suite only the 36 known sparse model failures; typecheck.
Integrated `8fada42d`: full suite 1993 pass, 0 fail, 23 skip, 1 TODO;
typecheck and production build pass (`R/build-integrated.log`).

Desktop A-input recapture (same preview, muted CDP 9320 browser and collector
SHA `fd983a52...`): 69 pairs, terminal C14 before app, mute, errors `[]`,
cleanup complete; `result.json` SHA
`62176853404c066931956d434e6310a7f30915b4bc170054e3af89d899b77607`.
The coordinator inspected `R/crop-sheet.png` (3x crops, native N065..N082
beside browser B001..B007), SHA
`beba46d3b34d4b9f18328752e0b49f13450912d42fa78e03a68cf1df9175e0d3`:
browser B001 faint centre glow, B002 growing, B003 ring, B004..B006 spreading
and fading, matching the native stage order. The frozen N065 semantic anchor
precedes the ring and is unchanged (selected icon 0.7097, report SHA
`84781c03228ad96d2d0c826ea7e10ab2d186eedf1e9e8a4c411fc902301b773d`).
Direct coordinates, zero shift, empty masks; epochs unsynchronized and no
per-frame timing equivalence is claimed.

## Remaining

Ring timing relative to the native fade, its exact radius per stage, Open
pressed/release tone (footer MAE 45.8364), native black dwell, cursor pulse,
input, audio and HUD pixels remain open. Mobile/reduced not rerun.
Whole-scenario status remains fail.
