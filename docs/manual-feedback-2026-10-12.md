# Manual feedback, 12 October 2026

AN-02 remains fail/unproven. These captures establish two feedback defects;
they do not reopen the repaired missing Close cover.

## Captured behavior

At coordinator456fdc8, root used normal-speed isolated Azahar and frozen
production source5884417, build `BTzL7zVs57q-6RDe4Y9jR`. The route was Camera
selected on HOME without launching it, Manual, Contents Close, Camera HOME,
then repeat. Each footer contact requested500ms. Testing used the MacBook
display and muted3DS sessions. Native pointer epochs remain unknown.

| Defect | Native observation | Browser observation |
| --- | --- | --- |
| Held Contents Close | Dark idle changes to lighter gray, then white before the cover | All held footer pixels remain identical to idle; lighter feedback begins only after release |
| Released Manual entry | Dark held button becomes white before the cover | Released out0 retains the dark held footer, also visible under early cover samples |

First browser Close held sequences127..137 and repeat271..281 are byte-identical
to their own pre-touch footer at0,208,320,32. Actual trusted pointer holds are
521.5ms and528.9ms. Released feedback0 is138/282 and white feedback1 is139/283.
Entry held190..199/135..145 and released out0 at200/146 retain the same dark
footer. Unsaved intermediate entry frames are explicitly unknown.

Native lossy movie indices identify visible states, not animation/input epochs.
First Close changes at313/346 and repeat381/412 for lighter/white. Entry
dark/white appears at360/398 and394/429. The outgoing cover and later HOME
reveal exist on both sides. Native selected Camera appears before the other
HOME icons; browser reveals its populated grid. Different root populations,
Camera positions and sampling prevent a whole-motion match.

## Closed evidence

All private paths are under
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/toprow-current-20261010/manual-held-close-20261012-v1/`.

- Native audit `native-audit-astra-v1/report.md`, SHA-256
  `c6b2e6bcab8db587318e3aae141f3627cc9d27491707520d71c5d9a4e898d2af`;
  manifest `017fa6e467472a9e435a1a82d74962e70b39080284d6a3370b6c18089aaa2b52`.
  All27 originals are unchanged. Five silent movies include the pilot and four
  routes,4740 decoded frames. Five own PNGs validate at400x480.
- Browser audit `browser-audit-astra-v1/report.md`, SHA-256
  `e11e71a6ed1e8b4ae6fd493be0532dcf46ecefc56acfb742c72b07b7307e1bd7`;
  manifest `74f8184e27e7b41c445468f97ec119241c3c8a55be1ab005570c67eeb29e926b`.
  All1865 triples/3730 PNGs validate, with zero structural errors/warnings and
  no fully black LCDs. All5595 original files remain unchanged. Route counts
  are491/403/434/537; all four exports finished and had user stops.
- `root-baseline-inspection.md` records the opened sheets:12 native event,
  eight native footer, four browser footer, eight browser boundary and one
  browser endpoint sheet, plus the five own PNGs. The browser audit binds117
  exact1x crops; native movie crops are lossy/resized and are not raw LCDs.
- Native PID55219 quit and its profile returned to exact SHA-256
  `031bc53517a1557c1b6fab2d341a2b9b10a304eb79665decaeccdb89a05ed1ad`.
  Temporary3038 closed. Normal3037 and the frozen source/build were unchanged.

## Repair scope

The held-Close repair uses the existing Manual Select resource, not authored
graphics. Manifest `packs/manual/layout-BtnCloseLng00.json`, title
0004003000009b02 v5120/content0, contains
`layout/BtnCloseLng00.arc/anim/BtnCloseLng00_Select.bclan`, SHA-256
`6f2c11ed9412c874f12cba5f3232ce2690f1756a592acf58c5533ba571af0d21`.
The source container is e4c80059; the existing converter is
`ctr-native-web1.4.0`. Full layout/Decide/texture provenance and the unchanged
fitted group-binding adaptation are in the
[Close contract](manual-close-transition-2026-10-11.md#native-resources-and-adaptations).

The baseline Manual reducer ignored non-up touch. Entry separately retained
the last presented caller pair, including its held footer. Two disjoint
worktrees repaired these paths and independent reviews checked them. The fixes
preserve owner/readiness/paired publication guards, source assets and cover
scheduling. Root recaptured ordinary first/repeated routes after checks. No native
pixel metric, mask, timing fit or whole-flow pass is claimed. Muted audio and
all previously labelled portfolio/compositor/timing adaptations remain open.

## Reviewed source and production candidate

The combined candidate is `2b08f0a1e05fc8caa03222024648e6cb9a76a6e1` in
`manual-feedback-candidate-20261012/3ds-idea`. It contains four coherent commits:
held Close `91c01e1`, contact cancellation correction `bea9aed`, released entry
`a10af11` and selected-resource validation `2b08f0a`. Root fast-forwarded these
commits into `codex/animation-fidelity-20261007`, preserving the exact tested
SHA. No runtime rewrite or separate integration build was needed. Delivery
is tracked by [STATUS](../STATUS.md) and draft PR7.

- Held Close keeps the public pointer latch and records an armed/disarmed
  contact in the pure Manual reducer. The existing painter uses Select1 while
  armed. Leaving the button cannot rearm the same touch. Ignored keys/actions
  preserve cancellation; actual navigation clears the contact. Released
  Decide4/5 and cover scheduling remain unchanged. See the
  [held-Close handoff](workstream-handoffs/manual-close-held-20261012.md).
- Entry retains the state of the actual presented caller pair alongside its
  existing owner identity. A matching HOME Manual contact repaints only the
  retained footer with the delivered HOME Decide5 group. The upper LCD and
  existing cover clocks are unchanged. Selected unsupported clips fail before
  drawing. See the [entry handoff](workstream-handoffs/manual-entry-release-20261012.md).

Entry source is HOME title `0004003000009802`, v24576, content index0/ID00000082,
manifest `home.launcher`, `packs/home/launcher.json`,
`RomFS/launcher_LZ.bin/anim/LncBtmBtn_02_Decide.bclan`, SHA-256
`65eb55af8110e51cf8efdc9bafb70d681fdbf528a211a0df5d9ca172546de4bc`.
Converter remains `ctr-native-web1.2.0` / CTRTool1.3.0. The handoffs preserve
layout/container identities and existing text/texture provenance. No public
asset, extraction, shader or material change was made.

Independent held review `source-review-astra-v1/report.md`, SHA-256
`3f4d03c1ec2abe0e7d4e84b8506aaf4de15aa7411b40eeeb88092ca64887e723`,
found and verified the cancellation correction. Entry review
`entry-source-review-astra-v1/report.md`, SHA-256
`2744baa3d7d073c2c70e068db0a3604b3c0a6d139fdd6317b02b2c9feaacd8e8`,
found and verified the unsupported-source guard. Both reviews are closed with
no remaining findings; they are not native acceptance.

The exact combined source passes 153 focused tests with four existing skips.
Full tests report 2,824 passes, the one known missing historical Camera PNG
failure, 102 skips and one TODO. Both typechecks and production build pass.
Build `hOpO6-7Ggwg0malvjowVR` is frozen by
`candidate-verification-v1/manifest.json`, SHA-256
`0afee153cd8536c1666b167e84851bde99efd251ac0ee0925d4e3f18c2516cd3`.
Its scope is 2,851 source/build files, 39 private check artifacts, 14,826
dependency entries and 77 previously scoped GLB models. Pre/post-capture
checks found zero changes. Provisional checks before the final guard remain
explicitly identified in the preparation record, not substituted for this run.

The muted MacBook production run on temporary3039 recorded four ordinary
500ms-requested entry/Close routes, with 568/363/265/316 fully saved pairs,
1,512 total. Root saw both intended Contents and Camera HOME endpoints. The
capture tab and server closed; normal3037 is unchanged. Policy
`combined-candidate-policy.md` and the auditor's fixed selectors predate GUI
input. The closed `candidate-browser-ledger.md` records host brackets, the
unused3038 server and a rejected stale Cua lease.

## Candidate audit and inspection

Closed `candidate-browser-audit-astra-v1/report.md` has SHA-256
`68b914a3f73662344f126d3b5229b23e67cda2f203d9b30891128f176cf29101`;
manifest `350858b57c53b319bf57f84f11b69c056e6cbff6aaea509897fd4b9eef467b31`.
All1,512 triples/3,024 PNGs validate, with no structural, recorder, export or
decode errors and no fully black LCDs. All4,536 originals,1,480,168,212 bytes,
remain unchanged. The chronology wrapper's EEXIST failure is preserved;
independent verification of its completed outputs passed.

Root opened all22 candidate sheets: four footer, eight boundary, one endpoint
and nine fixed-comparison pages. Root also reopened four native footer sheets.
The private `root-candidate-inspection.md` separates those evidence tiers.
Its SHA-256 is
`01a691f03c6a6c082f9ad8662f7e86d5bd949100270b0ea0aa8e543acce721e7`.
All22 retained Close holds show the lighter Select state instead of idle.
Both released entry out0 footers show white rather than retained dark pixels.
The broad native held/released ordering supports both repairs. It does not
establish native pixel, input-epoch or cadence equality.

All16 predeclared browser regression pairs are exact PNG/RGBA on both LCDs,
with empty masks. They cover first/repeated released Close feedback, fixed
cover boundaries and settled Contents. Selector SHA-256 is
`4ebc4b57200096c24a927690b273d66c8fcc4ece54208f28ffa1e93d600f7c0e`.
The two changed entry out0 comparisons are observations, not equality gates:
63,822 upper/5,647 lower pixels differ on first entry and42,143/5,821 on repeat.
Unmasked clock/banner/cursor differences remain alongside the intended footer
change. No closest-frame substitution or fitted timing was used.

These results close the two captured feedback defects. Native exposes selected
Camera before surrounding HOME icons; browser reveals its populated grid.
Different root fixtures and sampling still need to be separated from reveal
scheduling before another runtime correction is justified.

The normal preview now serves the same frozen build at
`http://127.0.0.1:3039/`, session37010/listener78976. Root verified HTTP200,
exact cwd/build, Chrome mute and MacBook bounds, then opened the normal URL.
Both HOME LCDs render with Camera selected. Pre/post freeze checks find zero
changes. No software/recorder input or Azahar run followed. This is basic
preview inspection; the four captured candidate routes remain separate evidence.

The Select subtree binding and immediate terminal source-pose dispatch remain
host adaptations. A direct Manual invocation while the same owned held contact
was last presented is indistinguishable from release in the current state;
this change does not add trigger provenance. Native input epochs, cadence,
moving pixels, fixture differences and muted audio remain unresolved.
