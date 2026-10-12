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
map identifies this path and the existing Friends incoming pack. The worker's
preliminary decrypted-code trace reports a return branch at `0x1d0164` selecting
`fri_title_menu`, the `FrdCmnFade_D/U` pair and the type-2 SceneOut helper at
`0x1cce60`. This trace awaits independent review of the frozen candidate and
does not establish the ordinary footer/no-Mii trigger mapping.

The dedicated `codex/friends-close-transition-20261012` worktree, base `a1ca6f5`,
is implementing the missing return using existing controller and converter
patterns. Runtime review, required tests, production recapture and integration
are pending. This record does not approve or deliver that candidate.

The read-only own-card content, hidden dynamic Mii surfaces and existing title
text adapter remain portfolio adaptations. First-use Mii/account/network setup
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

Root opened the first/repeated browser Close boundary sheets and opening cover
sheets. Their exact lists and native inspection limits are in the coordinator
record. Post-run rehash at `2026-10-12T00:51:48.983Z` verifies all 2,840 integrated
source/build files unchanged. Native exited and its profile was restored. Only
the capture tab closed; the ordinary muted MacBook preview remains at port 3033.

The next gate is reviewed source, required checks and new first/repeated
production Close captures, including opening regression. No whole-flow pass
follows from this baseline or source identification.
