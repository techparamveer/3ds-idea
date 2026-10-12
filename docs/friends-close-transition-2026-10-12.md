# Friend List Close transition

## Captured defect

The 12 October baseline uses runtime `7ff67b3b16a906563fd2c9088989467c4ee22807`
and production build `OAnM8XeVOY2XnwhG0ctrc`, before a Friend List Close fix.
Ordinary touchscreen Close returns directly from the portfolio own card to
uncovered selected-Friend HOME. First and repeated runs both retain the card
through sequence 27 and show HOME from sequence 28. All exported transition
fields are null throughout those Close windows. Opening already has separate
outgoing cover, incoming cover and handoff stages.

The five browser windows contain 1,397 raw paired LCDs: selection 287, opening
305, Close 225, repeated opening 349 and repeated Close 231. Closed audit
`e487e2d1` verifies 4,191 unchanged originals and all 2,794 PNGs through CRC
and independent Sharp/pngjs decoding. There are no structural errors, warnings
or fully black LCDs. Each window includes its pointer down/up and ready endpoint.
Every pair through sequence 27 in each Close is byte-identical to its own-card
baseline, including the retained pointer-held samples. Receipt gaps are browser
observations, not native input or animation timing.

## Native reference

The isolated muted Azahar run captures Friend selection, first opening and
repeated opening followed by service-error OK, no-Mii OK and automatic HOME
return. That return clears the notice, briefly reveals the Friend List body,
then shows a HOME Menu belt over both brightening LCDs. HOME later reveals
controls, grid and the Friend banner. No stable direct-footer Close route was
reached. Native no-Mii OK and browser main Close are different inputs and body
fixtures; their equivalence is not established.

Closed native audit `1ac25405` verifies 28 unchanged originals, five silent
movies with 6,273 decoded frames, five Azahar own 400x480 PNGs and a byte-identical
restored config. All movie timestamps increase; the repeated full decode agrees.
The recorder first-image PNG and sequential decoder can differ by RGB delta 11,
preserved as a diagnostic. Lossy movie frames provide ordering, not raw native
LCD pixels or native cadence. Root inspected selected bracket pages, not all
807 extracted bracket frames. No masks, phase search or clock forcing were used.

## Source and implementation status

The baseline uses generic Friends completion, without the guarded footer-close
controller already used by Notes, Notifications and Manual. The read-only route
map identifies this path and the existing Friends incoming pack. The reviewed
decrypted-code trace identifies a return branch at `0x1d0164` selecting
`fri_title_menu`, the `FrdCmnFade_D/U` pair and the type-2 SceneOut helper at
`0x1cce60`. This is static source binding and does not establish the ordinary
footer/no-Mii trigger mapping.

The dedicated `codex/friends-close-transition-20261012` worktree, base `a1ca6f5`,
has frozen candidate `0d6746d23e296d04de320ae5877606e67bf4a3b4`. Main Friends
Close effects retain the owner through decoded Decide frames 0..5 and paired
SceneOut frames 0..20. Only accepted outgoing frame 20 retires the owner. The
existing HOME reveal then requires its own frames 0..20 and separate handoff
before banner growth. Profile Back, caller-owned completion and unready escape
keep their existing paths. Resource replacement preserves an accepted return
while rejecting stale receipts. Same-paint capture metadata includes Friends.

The only new resources are the two decoded SceneOut clips and original HOME
label/provenance in the existing incoming pack. Existing layouts, textures,
SceneIn clips, styles and font bindings are unchanged. Pack SHA-256 is
`71aa6906925dc9b04ecea8b666d7360dc9e5f36280c39c275f382346891766f8`.
The [source handoff](workstream-handoffs/friends-close-transition-20261012.md)
maps the native title/version, content index, internal paths, hashes and converter.

Source review `8ffc2372` and frozen-build review `e3456807` have no blockers.
Worker focused 183 and independent 259+2 tests pass. Full tests have 2,770 pass,
one unchanged missing historical Camera PNG failure, 102 skips and one TODO.
Both typechecks and the final production build pass. Build
`2-PE8STJtB8uO2e30W9ix`, manifest `099f28e1`, freezes 2,850 files / 154,952,980 bytes.
All 229 build files and 2,621 source/public/test/config files independently match.

Four ordinary muted MacBook candidate windows save 1,087 paired LCDs: first
Open 276, first Close 274, repeated Open 280 and repeated Close 257. Root observes
the HOME Menu return transition and ready selected-Friend HOME on both Close
actions. All exports completed, the candidate tab/server closed, and the frozen
build rehash stayed exact. Closed audit `e2a98a14` validates every triple and PNG,
with no errors, warnings or fully black LCD. Both Close runs include every
integer feedback 0..5 and outgoing/incoming 0..20 frame, plus a distinct handoff.
Their outgoing20-to-incoming0 covered boundaries are byte-exact on both LCDs.
Both fixed opening comparisons are also PNG/RGBA exact, with maximum delta 0.
Opening retains some integer-frame sampling gaps; no dropped-frame cause or
native cadence is inferred. Root inspection `742789b6` covers 15 chronological
pages and all four fixed comparison sheets, not every saved frame.

Reviewed source is integrated and pushed as
`ea39e123250c37d01b422d1bec0c9e5528272886` to draft PR7. Committed source,
public assets, tests and build config exactly equal the tested candidate.
The human import-line edit stays unstaged and unserved. Tests and the production
run above were performed in the clean candidate checkout before integration,
not on dirty coordinator source. No fresh integrated build or matched native
post-integration run is claimed. The captured missing-cover defect is corrected;
full native acceptance remains open.

Independent integration/evidence review `268f6c6b` approves committed source
equivalence and the five-document checkpoint. Its exact reviewed patch is
`66463462e74bfb4be15d3f47c7da46ee06be17f1a272aeb309544ceb9dd6a458`.
The later normal-preview operational update is outside that review snapshot.
A muted MacBook normal-URL preview now serves the same frozen candidate build
at port 3034 and shows the sourced console and both HOME LCDs with Work selected.
Post-preview rehash verifies all 2,850 files unchanged. This is basic inspection,
not a fresh integrated build or matched native post-integration run.

The read-only own-card content, hidden dynamic Mii surfaces and existing title
text adapter remain portfolio adaptations. Feedback scheduling, 60 Hz accepted
publication, cover hold, footer-to-return mapping and the shared HOME reveal
also remain adaptations. First-use Mii/account/network setup
is not added. Exact moving pixels, feedback, hold timing, matched native inputs,
cadence and muted audio remain unverified. All four whole animation flows stay
fail/unproven.

## Evidence identities

Private root is
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/toprow-current-20261010/friends-motion-20261012-v1`.
Browser originals remain under the sibling
`camera-lower-readback-v1/integrated-preview-v1/reference/scenario-matrix/v1/captures`.
The audit manifests pin exact session IDs, capture IDs and every original hash.

| Artifact under the private root | SHA-256 |
| --- | --- |
| `source-route.md` | `da861f0ce098142c5a61782bb9e611a58beff884776b5507b0188cb2e86e5d3b` |
| `native-audit-astra-v1/report.md` | `1ac25405ce0a15db6b63423847c2e0bd7299bb3eda64680bc104ebd04351d48b` |
| `native-audit-astra-v1/manifest.json` | `1f206523f6fdcaa46df5298761685ff06e12ed18431ac6b14031186870eeaa19` |
| `browser-audit-astra-v1/report.md` | `e487e2d1030fa329e40ebd7e65baab46526d74f8b04b410c8c2768b958a46853` |
| `browser-audit-astra-v1/manifest.json` | `108b6baf925dbc8f6bff398febd9861cbb7397564f12d9edc7de4a9dac8533da` |
| `coordinator-inspection-v1.md` | `d77fd19a3143dc64d74fe4d9859088b1c7d90eae118f275ccef1d6ad7108f681` |
| `candidate-review-astra-v1/report.md` | `e34568072752c9a48a236dfd405728fbdbf613f53884045732b6520a88f4da2a` |
| `candidate-browser-audit-astra-v1/report.md` | `e2a98a142f61652df7282bf6d366dc3ecae4f17e138d4dd9e65e215deceb626e` |
| `candidate-browser-audit-astra-v1/manifest.json` | `0aa563714fcfa91a8ad4c4a22f1999fff42d37f6222db70169d4648775edc507` |
| `candidate-coordinator-inspection-v1.md` | `742789b68b61e8b4d289061248b6b0832935ce9bb1391376dc613558ea7c62e3` |
| `integration-review-astra-v1/report.md` | `268f6c6bba6db401897d8f85292bcd1aaf6852b3806509f38a5dedde67c02ac7` |

Root opened the first/repeated browser Close boundary sheets and opening cover
sheets. Their exact lists and native inspection limits are in the coordinator
record. Post-run rehash at `2026-10-12T00:51:48.983Z` verifies all 2,840 integrated
source/build files unchanged. Native exited and its profile was restored. Only
the capture tab closed; the ordinary muted MacBook preview remains at port 3033.

Candidate artifacts live under `candidate-verification-v1`,
`candidate-review-astra-v1` and `candidate-production-v1` in the private root.
The unchanged capture policy `ae59213f` pins the fixed first saved opening
out20 comparisons to baseline first sequence44/receipt1416 and repeated
sequence43/receipt3078, without masks or phase search. Baseline HOME preparation
selected Camera; candidate preparation selected Work. That difference remains
explicit. No whole-flow pass follows from source identification or browser checks.
