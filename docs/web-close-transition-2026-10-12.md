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

The assigned `codex/web-close-transition-20261012` worktree starts at `c7a1922`.
The bounded repair retains the app through feedback and accepted paired cover
completion, then uses the guarded HOME reveal. Until reviewed and captured this
is pending work, not a delivered correction. Lifecycle/timing reuse remains a
labelled portfolio adaptation. No new native graphics are authorized.

Candidate policy `1b510dc8` precedes candidate pixels. It requires first/repeated
opening and Close for both apps, retained body/owner, complete cover, distinct
HOME reveal/handoff, and selected-app endpoints. Fixed opening-cover regression
pairs use Browser baseline 261/730 and Miiverse 145/2474 with empty whole-LCD masks.
No nearest-frame search, transforms or native pass are authorized.

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

The audits pin exact original paths, source/title identities, decoder/tool
versions, input records and hashes. Policies, originals and closed audit trees
are immutable. Their integrity checks and root inspection have separate scopes.
