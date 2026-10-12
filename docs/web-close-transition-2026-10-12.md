# Browser and Miiverse Close transitions

## Captured defect

The 12 October production baseline uses frozen source `0d6746d`, build
`2-PE8STJtB8uO2e30W9ix`. Its runtime/assets/tests/config equal integrated
`ea39e12`. Ordinary main Close jumps directly from each local app to uncovered
selected-app HOME. Browser changes at sequence14/receipt1591 to15/1592;
Miiverse at sequence13/receipt3358 to14/3359. Every exported exit field is null.

Four windows contain 1,136 raw paired LCDs: Browser opening 466 and Close 138,
Miiverse opening 402 and Close 130. Closed audit `adf43d92` validates all triples,
2,272 PNGs, input and paired-receipt chronology. No fully black LCDs occur.
All exports complete with user-stop and no recording failure. Opening retains
the existing outgoing/incoming/handoff stages; some integer outgoing samples
are absent and do not establish a dropped-frame cause or native cadence.
Root opened all eight compact opening/Close sheets, not every saved frame.

## Native reference

Fresh isolated Azahar captures Browser's update-required notice and Miiverse's
error 022-5362 followed by its separate close notice. Browser notice OK fades
the dialog, exposes its search/bookmark menu, then introduces the HOME Menu
cover. Miiverse error OK first leads to a close notice; its second OK clears
that notice before the HOME cover. In both returns HOME controls/grid reveal
before the selected-app banner. These are different fixtures and inputs from
ordinary local footer Close. No direct-footer timing or pixel match follows.

Closed audit `c9ef88c2` validates five silent movies with 6,471 decoded frames,
four own 400x480 endpoint PNGs and all 25 originals unchanged. Repeated movie
decoding agrees, but it repeats one decoder. Recorder first-image and offline
decoder output can differ by RGB delta 11. Movies supply ordering, not raw native
LCD equality or native epochs. Root opened 15 of 30 consecutive-bracket pages and
all four own PNGs. No mask, alignment or native pixel comparison was performed.

All GUI work used the built-in MacBook and muted dedicated sessions. Azahar
quit, and the only temporary screenshotPath field was restored byte-exactly
to config `031bc535`. No system or unrelated audio changed.

## Source and next check

Source audit `f12f341e` maps the main footer/B path to generic app completion.
Browser subpage Back and Miiverse detail Back are separate local navigation.
Delivered Browser `ExitButton_DecidedOn` and Miiverse `OliveBack_DecidedOn`
each provide six authored feedback frames. Existing HOME common resources
provide the outgoing cover and incoming reveal. The selected native footer
dispatch and exact timing are not traced; source clips alone do not prove them.

Candidate `88640bc` in `codex/web-close-transition-20261012` starts at
`c7a1922`. It retains the app through its decoded six-frame feedback and HOME
outgoing cover, retiring the owner only after accepted paired outgoing20.
The existing guarded HOME reveal and separate handoff gate the selected banner.
Local Back and caller-owned completion keep their previous paths. Lifecycle
and timing reuse remain labelled portfolio adaptations. No native graphics,
fonts, converters, manifest bytes or audio changed.

Independent source review `a16292a2` has no blocking findings. Focused checks
and the independent rerun each pass 190 tests with one existing skip. Full
tests have 2,799 passes, the unchanged missing historical Camera PNG failure,
102 skips and one TODO. Both typechecks and the production build pass.
Freeze review `bc04b18a` verifies build `N3pRiRWZMnkz9E_t3GYlI` and all
2,848 frozen files. These are candidate checks, not an integrated rebuild.

Candidate policy `1b510dc8` precedes candidate pixels. It requires first/repeated
opening and Close for both apps, retained body/owner, complete cover, distinct
HOME reveal/handoff, and selected-app endpoints. Fixed opening-cover regression
pairs use Browser baseline 261/730 and Miiverse 145/2474 with empty whole-LCD masks.
No nearest-frame search, transforms or native pass are authorized.

Root recorded eight muted MacBook candidate windows: Browser opening 324,
Close 439, repeated opening 400 and repeated Close 337; Miiverse opening 324,
Close 554, repeated opening 600 and repeated Close 231. All 3,209 pairs were
saved. The seventh window hit the recorder limit during context compaction.
The saved window contains incoming20, handoff51 and 549 byte-stable ready
pairs from sequence52 through600. The cap remains a recorded deviation; it
does not truncate the opening. The other seven stopped by user action.
The live Close screenshots show the HOME cover over each retained app, then
the correct selected-app HOME banner. The temporary capture tab/server are
closed. The post-run
rehash at 2026-10-12T02:32:56.211Z finds all frozen files unchanged.

All 3,209 triples and 6,418 PNGs validate, including CRC and exact full-RGBA
agreement between Sharp and pngjs. No malformed, incomplete or fully black
LCD occurs. Every Close contains feedback0..5, outgoing0..20, HOME incoming0..20
and a distinct handoff. App phase and owner survive through outgoing20.
Each outgoing20 and HOME incoming0 pair has exact PNG/RGBA continuity.
Some opening integer samples remain absent; first Browser incoming has no
saved frame7 or frame10. No causal or native-cadence inference follows.

The fixed Browser opening pairs are candidate30/801 and repeated27/3161 against
baseline261/730. Miiverse pairs are candidate31/5552 and repeated29/8314 against
baseline145/2474. All four comparisons are exact PNG/RGBA on both LCDs, with
empty masks. Root inspected 28 of 36 chronological pages and all eight fixed
comparison sheets. These pass the bounded browser missing-cover and opening
regression checks, not native acceptance. Closed audit `5fdd90d1` validates
all 9,627 originals unchanged. Reviewed source is integrated and pushed as
`dd1a9e1`; committed source/public/tests/config exactly match the candidate.
The human edit remains unstaged. Candidate checks and captures remain
pre-integration evidence; a fresh integrated build is a separate verification.

All whole animation flows remain fail/unproven. Exact native main-footer
dispatch, feedback, input/hold, moving pixels, cadence and muted audio are open.
Local Browser/Miiverse bodies and fitted lifecycle composition remain adaptations.

## Evidence identities

Private root:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/toprow-current-20261010/web-close-20261012-v1/`.

| Record | SHA-256 |
| --- | --- |
| baseline-audit-astra-v1/report.md | adf43d9228ea9bb4814d227b176ccd0fa257e23f90dca3a7d3a7f270e78b39f7 |
| native-audit-astra-v1/report.md | c9ef88c2cfcce996b6a70bea6b8f2e88933eb8af1073547ba9430a96c67654fd |
| native-audit-astra-v1/manifest.json | 3a67d05d72eb695ced574cfb04b0dcfddd4132c896d0159a8c5a9b4808ac9684 |
| source-audit/report.md | f12f341ee10d02148e1f749ccca7a641f869536e767cf0e34a58a8edb98491af |
| coordinator-baseline-inspection-v1.md | 11c5f7537501a5876a92172416009c9c9d50abe085579a9bc39faa56c7e4c979 |
| candidate-capture-policy-v1.md | 1b510dc85123b1affa86711c580863666e61ef3f6554c05fb65c4d298768496a |
| source-review-astra-v1/source-review.md | a16292a2f825bebbf4f8fd3b99630b745d0d9b21adc94be3d8479d1aa6c37a68 |
| source-review-astra-v1/freeze-review.md | bc04b18aaf475d3ac1d14d3d0d3f3978d80d94bffdd44ee8cf784c1b1d8f73a0 |
| verification/manifest.json | d8e4179cc8cf6d3e6d8ea32899d0f2e30cff45127240d0bcad3d1c7a60000ed8 |
| candidate-coordinator-inspection-v1.md | dc3b87a0c8929837b6bab4738713d2a7c5db015d8d6bc24f2780cb55bf68e14f |
| candidate-browser-audit-astra-v1/report.md | 5fdd90d1d0152e90cde74462480e4fce40297eb887bce30367996a6d0c2a7844 |
| candidate-browser-audit-astra-v1/manifest.json | d8ce10c5679353f2def58de8c0891b972f57aaacc2719b1a7477829d1a76bc0e |
| integration-review-astra-v1/procedure-review.md | b42168330fa523950a11653c25f001bd4237406eb236fe363533da51eefb8a5a |

The audits pin exact original paths, source/title identities, decoder/tool
versions, input records and hashes. Policies, originals and closed audit trees
are immutable. Their integrity checks and root inspection have separate scopes.
