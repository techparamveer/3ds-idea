# HOME Toolbar Banner Ownership - 3 October 2026

## Correction and Scope

Runtime `6d6e29a2` integrates worker `865d16e7`, based on `4da2073b`.
Notes, Browser and Miiverse now use the same ticketed host lifecycle as Friends
and Notifications. Selection, per-resource readiness/failure, stale request
rejection and HOME-entry paired publication retain their existing guards.
Unsupported portfolio titles remain unsupported.

The coordinator's initial missing-banner diagnosis was incorrect. Before raw
PNGs already show decoded Notes/Browser/Miiverse artwork through an unsupported
fallback; unsupported host telemetry was not proof of absent pixels. This is
a lifecycle/readiness correction, not restoration of missing settled artwork.
No settled pixel improvement or whole-scenario acceptance is claimed.

The source dispatcher maps focus/category/type as Notes1/5/15, Friends2/4/14,
Notifications3/6/16, Browser4/7/17 and Miiverse5/8/18. Notes, Browser and Miiverse
still draw with their existing front-pose/browser-time animation adaptation.
Their host motion metadata does not establish ownership of the rendered yaw,
scale or clip clock. Friends and Notifications retain their hosted frame path.

## Source Assets

No asset or shader/material changed. Existing pinned EUR10.7.0-32E HOME title
`0004003000009802`, version24576, content index0/`00000082`, remains the source.
The following keys resolve to existing `ctr-cgfx-web`1.4.2 model conversions:

| Visible element | Manifest key | CIA-internal source |
| --- | --- | --- |
| Notes pencil/banner | `models.bannerAppletMemo` | `romfs/3D/BannerAppletMemo_LZ.bin` |
| Friends face/banner | `models.bannerAppletFriend` | `romfs/3D/BannerAppletFriend_LZ.bin` |
| Notifications balloon/banner | `models.bannerAppletNews` | `romfs/3D/BannerAppletNews_LZ.bin` |
| Browser globe/banner | `models.bannerAppletWeb` | `romfs/3D/BannerAppletWeb_LZ.bin` |
| Miiverse banner | `models.bannerAppletMiiverse` | `romfs/3D/BannerAppletMvs_LZ.bin` |

Source SHA-256 identities are preserved in the
[resource inventory](home-toolbar-banner-source-inventory-2026-09-28.md),
[Notes/Friends mapping](home-toolbar-banner-mapping-2026-10-01.md),
[Web source record](home-web-banner-source-2026-09-28.md) and
[Miiverse source record](home-miiverse-banner-source-2026-09-28.md).
Labels reuse the existing native applet label resources; none were redrawn.

## Native Evidence

Private root `A` is
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001`;
run root `R` is `A/home-toolbar-sweep-20261003`.
Silent isolated clones preserve original hardware, English, EUR and factor1.
Their 11-file preparation manifests and five external anchors were independently
rehashed before launch. Executable SHA-256 is
`3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`;
HOME content is `c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.

| Native selection | Own400x480 PNG under A | SHA-256 |
| --- | --- | --- |
| Notes | `native-toolbar-notes-20261003/screenshots/_03.10.26_07.43.25.434.png` | `ea29e1598052e437ebb46d698054666d0ca8c2c377c09ca37c4a3372321e9d96` |
| Friends | `native-toolbar-sweep-20261003/screenshots/_03.10.26_07.37.31.573.png` | `145d9acc7dfd46faca47643206776bc59b7d09a03bdf1574cba486988cf383e0` |
| Browser | `native-toolbar-sweep-20261003/screenshots/_03.10.26_07.38.08.778.png` | `6de76f9e43f740d4a6863297e3d4767e3924bf9e722d3d0858c5257b8a764cd1` |
| Miiverse | `native-toolbar-sweep-20261003/screenshots/_03.10.26_07.39.24.561.png` | `3413ef059d532892346f98034600f7743fa039cd998299e31d8686fb04cfa2f5` |

All four first touches select HOME. This does not prove each repeated-touch
activation route. Notes uses a supplemental Notes-only movie after the first
sweep's Notes own-PNG was missed. Nearby AX counters are observations, not
precise capture epochs. Native and browser input/capture timing remain unmatched.
Both native sessions complete and close normally, exit0; PIDs75282/83337 absent.
Default profile and system audio remain unchanged.

## Verification and Residuals

Integrated full suite:1958pass/0fail/23skip/1TODO. Production build and sequential
typecheck pass. Independent review:135 focused tests pass, no actionable findings.
Worker sparse-checkout build/full-suite limitations are superseded only by
these coordinator checks, not by an assumption that the worker passed them.

`R/browser-before` is the accepted before sweep. `R/browser-desktop` stopped on
an invalid collector expectation that unsupported telemetry meant no primary
visual; its live follow-up is not the paired baseline. Initial after directories
`browser-after-desktop` and `browser-after-mobile` are excluded because collectors
overlapped. They remain preserved, not silently replaced.

Accepted `browser-after-desktop-v2` and `browser-after-mobile-v2` then completed
strictly sequentially, five raw pairs each, errors[]/mute, all four toolbar
selections active with the correct owner. Desktop1150x690 and narrow390x844
viewport images were opened; the console and both displays remain visible.
`browser-controls` completes21 pairs covering Notifications contact non-transfer,
first selection/repeated activation/return, density down/up re-entry, and Camera
Manual re-entry/return. It reports errors[] and restores six rows on HOME.
These are browser checks, not new native activation acceptance.

The coordinator opened the final combined comparison sheet and independently
verified76 manifest records and all72 metrics. All24 whole-LCD comparisons
(before plus both after sizes) fail. Empty masks, delta2, no registration or
phase fitting; lower native crop40,240,320,240. Browser footer remains1391
pixels above2/max152 in all three runs; Notes/Friends/Miiverse footer regions
have0 above2/max2. These regional results do not accept a whole scenario.

| Selection | Before whole upper/lower >2 | Desktop after | Narrow after |
| --- | --- | --- | --- |
| Notes | 50910 / 9394 | 50846 / 9389 | 51025 / 9423 |
| Friends | 25116 / 9653 | 26042 / 9653 | 26557 / 9653 |
| Browser | 37442 / 11063 | 36903 / 11063 | 37255 / 11063 |
| Miiverse | 28136 / 9586 | 28650 / 9589 | 27711 / 9587 |

`R/comparison/report.json` SHA-256:
`ce5f010670d7b86a7d3b9f90fb2000840fc047b4a4fda2fc81b10a75c49a1aa0`;
`sheet.png`: `7e0409074dc35eda13ca215aa3b01cda542228961abe2662b39645d2844a844c`;
`manifest.json`: `cc92613fad799a6824409c93ffaba12c4c7955481211f9f7ef0ee5b60b49e037`.
The39-record before bundle also independently verifies. Small changes in
unmatched animation/clock/cursor samples are not evidence that the patch
improved settled pixels. Owned browser exits0, PID74183 absent; production
preview3021 remains HTTP200. All captures were muted; audio is untested.

Remaining differences include front-pose/browser-time banner animation, native
wallpaper/HUD epochs, cursor phase, portfolio tile population, exact input/motion
and audio. Browser-selected native footer visibly has Manual/Open; production
has only Open. That is an independent captured defect, not fixed by this patch.
No private matrix or strict whole-scenario status is promoted.

## Next Visible Correction

Read-only source triage confirms the Browser footer can reuse decoded
`N_BtnW_L_03` / `N_BtnW_R_02` and native Manual/Open labels. `getHomeFooter`
must special-case toolbar focus4, and `touchSystemAction` must launch a
Browser-owned manual rather than use retained `selectedTitle()` grid identity.
Existing footer contact ownership and x100 split should be preserved.

Browser title `0004003000009d02`, version9232, content index1/`0000001d`, has
`Manual.bcma`, SHA-256
`9f04453f23476615912972530a99abccaee22361cc69bc80052d47acf907831b`.
The existing BCMA decoder handled its eight allowlisted index/page0 layouts
and three required textures in an isolated probe. Production still needs
converter profile, provenance/manifest and manual registry integration.
This is not delivered by `6d6e29a2`; no new decoder or reconstructed UI is needed.
Require footer boundary/contact tests, Browser-owned Manual versus Open dispatch,
other-toolbar regression tests, source/missing-resource tests, then native
Manual/Open and launched manual comparisons. A split button without a valid
manual route is not a complete correction.
