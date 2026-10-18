# GitHub integration and folder regression

The 9 October fetch resolves `origin/main` to
`c76775731fe539473934365d35210d79c3cbb551`. Reviewed merge
`b84e1b25fe0c98613546dc3a97d2d877f1d3b7c0` incorporates its NVIDIA and Hack LDN
work into animation base `47f01fe`. The primary checkout remains unchanged.
All incoming runtime/assets match upstream except the combined
`portfolio-screens.ts` cleanup/API line. Both progress histories are retained;
the committed STATUS blob remains unchanged so the coordinator's unstaged
history survives integration. No native firmware asset changed.

The worker used a separate branch/worktree and passed 238 focused tests.
Independent review passed 103 checks and found no merge regression. All
declared asset hashes match; both hydrated Blender files and all 160 atlas
frames were checked. The added portfolio artwork and ninth app are adaptations,
not native firmware replacements.

## Verification changes

`e0aa927` fixes two consequences of integration. Hack LDN occupies slot 14,
so the folder collector now uses ordinary ArrowRight inputs to find a verified
vacant first-row slot. It validates HOME, density, grid focus, actual selection,
default banner and the empty-slot announcement. It does not move an app or
inject state. The existing native-six-row fixture path is unchanged.

The native-only stock-screen preparation fixture also needs explicit adapters
for the two new banner imports. The first full run records that loader failure
alongside the historical missing Camera PNG. The corrected run passes 2537,
with only that historical failure, 98 skipped and one TODO. The collector and
stock-screen checks pass 37. Production build and post-build nonincremental
typecheck pass. Build ID is `mTYe4Vy1Kgwdj4FG1yvdU`, SHA-256
`c130a76b03a6a85814425df4fa703d49c30a3b9c4c3a21ed8928584fba37092d`.

## iPad regression

Two muted first/repeat runs use runtime `e0aa927`. Normal folder entry captures
90/91 pairs; reduced motion captures 9/9. The collector selects vacant slot 16,
leaving Hack LDN at 14. Actual browser bounds are `1830,420,1102x700`, inside
Sidecar display 4 at `1800,367,1164x802`. Codex remains on the Dell. No native
instance was launched for this integration regression.

Normal folder frame 16/capture frame 8 is first observed at 308.0/313.5 ms
from each capture start; child-ready publication follows at 581.0/583.4 ms.
Reduced motion first publishes folder16/capture8 at 62.8/33.0 ms, with child
readiness at 996.7/987.5 ms. Those are browser capture-relative observations,
not matched native durations or proof of a complete instant reduced transition.
Some intermediate normal poses are not sampled.

The baseline post-navigation observation precedes the first navigation input.
For reduced motion, it follows the first ArrowRight by 1794 ms and the folder
creation touch, but precedes the first entry input by 996 ms. Pre-navigation
placement was verified before any input and both observed bounds match. This
does not prove continuous placement during the reduced setup interval.

Artifacts are under
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/upstream-sync/`.
Independent GPT-6.1 Sol extra-high review verifies all 199 pairs and 398 raw
PNGs, including hashes, PNG CRCs, full decode, dimensions and chronological
receipts. It opens all 16 contact sheets and four console images and observes
no new unexplained temporal defect. Hack LDN pixels remain present in all four
root controls. Reduced receipt gaps 86 to 88 and 103 to 105 each omit one
observation; no missing pose is inferred. This does not constitute native
acceptance. The private report SHA-256 is
`15085a07f69caa93717d7625cfe7a697bc5dcc95d47b181b08d064e6648b4cc7`;
its JSON evidence is
`7500c5abd9abb4da0684d835b075804a110b5b18963f0114053005c4bd0150ae`.

The owned browsers closed after capture. Production session 1953 exited 130
after the two runs; port 3025 has no listener. No system audio changed.

## Next matched case

The corrected empty-folder captures do not justify another guessed motion
change. Populated-folder first/repeat entry is still missing. Rebuild and
observe the isolated native fixture: six-row root at the left origin, folder 1
at the matched browser slot-28 position, Health at child slot 2, one-row child
view at the left origin with Health selected. The historical native fixture
did not retain contents through cold boot, so do not assume it persists.

Use the actual Back touch at lower `59,54`, then the same folder-entry touch
route in both runtimes. Capture the occupied-child banner and full-width Open
footer, Back, and repeat. This is not covered by the empty/default child runs.
Exact timing, pixels, input epochs and muted audio remain unaccepted. All four
whole animation flows remain fail.
