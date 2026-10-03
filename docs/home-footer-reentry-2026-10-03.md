# HOME Footer Re-entry - 3 October 2026

## Captured Defect and Fix

Runtime `632646d2` integrates worker `9479dfae` from base `ec49a438`.
Fresh native CTM input holds Camera's Manual button, moves onto Open without
releasing, returns to Manual and releases. Native Manual loses then regains
Select, and release opens Camera Manual. The previous browser permanently
cancelled at eight pixels of motion, leaving Manual idle and release on HOME.

Genuine footer-origin contacts now retain their original gesture ownership
across motion. Shared `homeFooterHit` geometry recognizes the origin;
`ownedHomeFooterContact` still requires the original action, side, selection
revision, container and focus for feedback/release. Cross-button release,
gap origin, selection replacement, lifecycle cancel and outside release stay
non-actions. Footer-origin travel cannot paint foreign toolbar Select.
Grid pickup/scroll, themes and unrelated chrome retain their existing rules.

This is a capture-backed input adaptation, not a recovered native controller
or timing claim. Existing native layout/Select resources remain unchanged;
no new asset, graphics, font, renderer geometry or audio is introduced.

## Native Evidence

Private artifact root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-footer-reentry-20261003`.
Its `native-input-record.md` records the fresh isolated
`native-footer-reentry-20261003` clone, exact process/window, commands and
own400x480 PNGs. Clone original/EUR, Static mic2, Null output1, volume0 and
screenshot factor1 are audited. No user symlinks; source config remains
`d2118bc611142e0febb95415bb45487fe83b36c407b6cdad869a01697e92e698`.
The clone's launch config SHA is
`a75ac23b03a506f30e60b21496544e84ca4ec7f2e200338b4c013eddea1b4d89`.

CTM SHA `2f802f3138f2309e84be1ce3b65d2f34296bcabc599b4f3437daa31cbe387e91`
retains the verified template's header, revision, length and sample order.
Neutral0..7020, Manual(50,226)7020..11700, Open(217,226)11700..15210,
Manual15210..18720, release18720..27596. These nominal30/50/65/80s boundaries
are HID sample counts, not screenshot-frame or browser wall-clock identity.
Playback reaches EOF with no logged mismatch; normal Quit exits0, PID absent.
Five own-PNGs cover baseline, initial held, outside, re-entry and Manual release.
Unlike earlier atomic live-drag runs, CTM supplies genuine native held frames.

Visible footer base/text/Select map to manifest `home.launcher`, HOME title
`0004003000009802` v24576/content0/id`00000082`, RomFS launcher archive and
decoded footer layout/animation; full CIA/internal-file/SHA/converter mapping
is in [Camera footer provenance](home-camera-manual-footer-2026-10-03.md).
Camera Manual retains its existing native title/manual pack provenance there.

## Checks and Limits

`browser-before`, `browser-after` and `browser-mobile-after` each contain five
actual-painted raw paired LCDs from the same nominal30/50/65/80s gesture plan.
Desktop1150x690 and mobile390x844 after captures both restore Manual Select
on re-entry and open Camera Manual on release. Coordinator inspected the
desktop re-entry/released lower LCDs and both full console viewports. No page
errors or native-screen failures; audio remains muted. These prove captured
behavior, not shared native/browser input sampling or motion epochs.

The fixed comparison uses empty masks, delta2 and footer ROI(0,210,320,30)
for the four HOME states, without registration or phase fitting. Re-entry
improves from2826 pixels above2 to zero in both desktop and mobile. All eight
after footer comparisons have zero above2/maximum2, independently recomputed
by the coordinator. Released Manual is a separate semantic/state pair, not
a comparison of HOME footer pixels with applet chrome. Whole LCD differences
remain and this regional result does not establish strict1:1.

Final evidence is `comparison/report.json`, `report.md`,
`comparison-sheet.png` and `manifest.json` under the private root above.
The coordinator opened the final sheet and independently rehashed all71 final
manifest records plus all30 frozen-before records, with no discrepancies.
The original before generator and outputs remain byte-identical.
Frozen plan SHA `6c747711d14338d4d3c3ffe50981f2d6e5a6a0cd55204cc9bf199885000e84d9`;
after-binding addendum `37a4e1837e1063efb40fd73f55df960ec15cbf039559ecf8cb2e0bb383766300`;
machine report `9108155ca6eb23212fe6d2361eae1338c3573199987c2c0998d8c0beafcf65fe`;
sheet `9bc3c2c6d050a355a7a3797c0e7b4b2b688881d9b4781abbb2d8828a9d197494`;
manifest `e2e0373f091fcd3ccecb7127c25c58ad4ddc812879a43e8eeb3a57c1dde73ce0`.
All20 after whole-LCD comparisons still fail, with adaptations and unexplained
residuals: HOME upper41892..53545 and lower9609..9681 pixels above2;
released Manual upper446/lower1038 on both viewports. Neither the footer match
nor the release behavior pass upgrades these whole-screen failures.

`browser-controls` separately replays ten pairs: Manual-to-Open release and
Open-to-Manual release cancel; density decreases6->5 and boundaryx293.5 selects
the increase press before restoring6. All assertions pass, errors[]/mute.
The owned browser53560 and native55825 exit0 and are absent. Preview3021 stays
HTTP200 at `632646d2`; unrelated apps, default profile, systemaudio and Spotify
remain untouched. No new native resource is delivered.

Full suite:1944pass,0fail,23skip,1TODO,1968total. Build passes. Initial concurrent
typecheck saw two generated `.next/types` files disappear during the build;
the preserved log records that harness race. Sequential post-build typecheck
passes. Independent exact-commit146-test review finds no issues; worker197
affected tests also pass. No shader/material change, so shader check is not
applicable. No private matrix update or whole1:1 pass is claimed.

Portfolio content/population/placement/status, reduced-motion endpoints,
fitted lifecycle/source-clock scheduling and static microphone input remain
adaptations. Banner/cursor/background epochs, exact motion/input cadence and
audio remain open. The captured re-entry behavior does not establish every
footer variant or native lifecycle edge. Existing app designs are preserved.
