# Empty-folder entry and held Back

12 October 2026. This checkpoint adds first/repeated ordinary-input captures
to AN-03. It does not change runtime code or establish native 1:1 acceptance.
The old [cursor/orbit ordering repair](workstream-handoffs/folder-back-orbit-20261010.md)
remains in place. Root/orbit overlap alone is not a defect.

## Capture identity

Private root for every path below:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/toprow-current-20261010/folder-held-back-20261012-v1`.

The production source is `dd1a9e1575ae6b116905081ebea7e4b4d45e1bf4`, built in
the frozen clean integrated checkout as `X_PEHoqEx5Cyi-WhOw3JK`. Pre/post
capture rehashes verify all 2,848 source/build files, 154,769,838 bytes, unchanged
against manifest `a766ffb5e33f6395d89bff1e067069fc8f2a96681f9ed68afecfa5265184af97`.
The coordinator's unrelated human `system.ts` edit was not built or served.

All GUI input used the MacBook's built-in display. Chrome retained
`--mute-audio`; isolated Azahar retained volume 0 and Null output. System audio
was not changed. The temporary browser tab/server on 3036 closed after all four
exports completed. The user's normal preview on 3035 and older tabs remain.
Azahar quit before its temporary screenshot path was restored. Config SHA-256
returned exactly to `031bc53517a1557c1b6fab2d341a2b9b10a304eb79665decaeccdb89a05ed1ad`.

Native executable SHA-256 is
`3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`.
Pinned HOME content `00040030/00009802/content/00000082.app` hashes
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.
The approved exact-window recorder hashes
`38de24f07f2149be4b7df524ad3811d35a311d4a347942ea3b666375dfaaed54`.
The decoded two-second pilot showed only Azahar before four 20-second movies.

## Fixture and input limits

The capture policy preceded input. The fresh browser origin had no folder;
the fresh native HOME session did not show the historical six-row fixture.
Root created one ordinary empty folder in each before recording, documenting
the amendments in `fixture-policy-v2.md` and `native-fixture-policy-v3.md`.
No items were moved and no density control was changed. This explicitly changes
the isolated HOME/NAND fixture, not the original firmware/profile.

Both views show two root rows and `1 (New Folder)`, with an empty child grid.
Browser metadata identifies root slot 16 and child slot 0. Native root slot is
unknown; surrounding root populations differ. Folder identity/name/population
and density are not browser metadata fields. Their visible state and preparation
come from pixels and the coordinator ledger, not invented exported fields.
These are not identical whole-screen fixtures.

Each window used one stationary Open or Back touch with a requested 500ms
hold. Browser serialized intervals are 539.8, 525.8, 506.9 and 509.6ms in route
order. Native input epochs are not recorded. Requested duration, browser receipt
times and native movie timestamps are not interchangeable clocks.

## Browser observations

| Window | Saved raw LCD pairs | First transition after release | Later observed events |
| --- | ---: | --- | --- |
| First entry | 298 | sequence 13, +39.7ms | Child cursor 22; upper wallpaper 25; orbit 34 |
| First Back | 258 | sequence 20, +7.2ms | Upper wallpaper 23; root cursor 32; folder banner 36 |
| Repeat entry | 305 | sequence 21, +34.4ms | Child cursor 29; upper wallpaper 33; orbit 42 |
| Repeat Back | 241 | sequence 21, +7.7ms | Upper wallpaper 25; root cursor 33; folder banner 36 |

All four windows stopped by user input and completed their exports. Each
contains 11 saved pairs during its hold, retaining the pre-transition state.
The transition begins after release. Entry shows the child tray/cursor before
upper folder retirement, followed by wallpaper and orbit. Back exposes root
under the departing tray while the orbit retires, then restores the root cursor
before the folder banner. No ordering reversal or recurrence of the fixed
cursor-over-orbit defect was found in these captures.

The closed browser audit validates all 1,102 triples and 2,204 PNGs, with exact
400x240 upper and 320x240 lower dimensions and no malformed or fully black LCD.
All 3,306 originals, 768,434,873 bytes, remain unchanged. Some integer animation
poses are not sampled; the audit lists them rather than filling the gaps.
Root inspected all 30 compact chronological pages, not every saved pair.

| Browser evidence | SHA-256 |
| --- | --- |
| `browser-audit-astra-v1/report.md` | `9bca3c3029bd0c1973f701864135d2f1dae3c088afd94f141630f81b09b2ac50` |
| `browser-audit-astra-v1/manifest.json` | `54838e82e84bbada3e3043363c1deb45124c298c99a3921b3aa67fde43fad191` |
| `browser-audit-astra-v1/checksums.sha256` | `398d701472fe60c23f0530c863988e90bcd3441339f7f184918791708921ec70` |

## Native observations

The closed native audit validates five silent movies, including the pilot,
4,729 decoded frames, and five own 400x480 PNGs. All 31 originals, 68,083,748
bytes, remain unchanged. All four motion recorders finalized successfully.
The movies contain zero audio tracks. Root opened all five own PNGs:
baseline `04.12.25.476`, first entry `04.13.14.805`, first Back `04.13.49.73`,
repeat entry `04.14.27.777` and repeat Back `04.15.09.938`. They show the expected
selected-folder and empty-child endpoints, with different HUD/time/yaw and root
population. These endpoint observations do not prove intermediate motion.

| Native visual event, decoded movie frame | First route | Repeat route |
| --- | ---: | ---: |
| Entry child cursor appears | 469 | 564 |
| Entry upper wallpaper without folder/label | 474 | 569 |
| Entry orbit appears | 481 | 578 |
| Back dark pressed appearance begins | 538 | 436 |
| Back becomes pale, with child cursor retained | 572 | 469 |
| Back child cursor disappears | 573 | 470 |
| Back upper wallpaper without orbit | 577 | 475 |
| Back root cursor returns | 590 | 488 |
| Back upper folder/banner returns | 600 | 498 |

Native root/slot content is faintly visible under the departing tray while the
orbit retires. The tray has a soft rectangular perimeter/shadow and underlying
slot rectangles during motion. These observations broadly agree with browser
ordering; their presence does not justify a new correction. The first native
pale-Back sample still has a child cursor, unlike the first retained browser
transition sample. Preserve that boundary uncertainty: absent input epochs and
unsampled browser poses do not establish a one-frame timing defect.

Root inspected 14 selected native paired bracket pages, four key-event pages,
two Back-button ROI sheets and full-size first-Back frames 576/577, in addition
to the five own PNGs. `coordinator-inspection.md` lists the exact pages and
records the corrected wallpaper boundary after full-size inspection.
The movies are lossy display captures; compact sheets resample fixed display
regions. The recorder's live first PNG and offline first decoded movie frame
differ, with maximum RGB delta 11. They retain separate transport identities.
Neither these sheets nor native visual ordering establish exact LCD pixels.

| Native evidence | SHA-256 |
| --- | --- |
| `native-audit-astra-v1/report.md` | `f354f3ec1c0e9b93968c1555b97a766fb55aa8c0b1b2050897cb714b6286d0dc` |
| `native-audit-astra-v1/manifest.json` | `60f76b5a9cb0d1cb5a2e2b4cd7a182ad53d7761777d156d7fe050d1c8c7dfacc` |
| `native-audit-astra-v1/checksums.sha256` | `8ba78ef4c94c60c66e74e4c4910d42520763239753c2e806bdc428616c9d24da` |
| `coordinator-inspection.md` | `666fae1c05d1534a3c571c2419836c6c73d575716694fb07532b8d7534acaf4f` |

## Evidence boundaries

No new assets, fonts, audio, manifests or converters were delivered. Existing
[native window](native-folder-window.md), [animation resource mapping](workstream-handoffs/animation-folder-home-20261007.md)
and [folder footer provenance](home-open-folder-footer-2026-10-02.md) remain
unchanged. Portfolio/root population and capture-fitted lifecycle timing remain
adaptations. Native moving pixels, matched input/cadence and muted audio remain
unverified. No mask, phase fit or native pixel-diff pass is claimed.

No runtime tests or build were rerun for this documentation/capture-only slice.
The frozen build's prior integrated checks remain separately reported in the
[Web Close record](web-close-transition-2026-10-12.md), including the known
missing historical Camera PNG test failure. All four whole animation flows
remain fail/unproven; the goal remains active.
