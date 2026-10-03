# HOME Launch Onset

Baseline runtime `c6c567d7`, checkout `d17eb8be`. This pass captures the
previously missed HOME-to-logo interval rather than repeating the already
corrected Health reveal. It does not establish a shared native launch epoch.

## Visible Defect

Native keeps the selected Health banner and Open footer after A. Open has a
pressed interval, returns white, then leaves while the HOME composition fades.
Browser first launch paint immediately removes the banner and substitutes
Close/Resume. The first inspected browser paint is at 0.4ms; the next presented
launch sample exhibits the same defect. Browser also introduces the Nintendo
logo while HOME remains visible; native first shows the logo after black.
That overlap, cursor retention and exact timing are separate open residuals.

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-launch-onset-20261003/`.
Own native PNGs are in sibling
`native-home-launch-onset-20261003/screenshots/home-launch-onset-20261003/`.
Coordinator inspected `native-analysis/explore.png`, `explore-browser.png`,
browser first-paint upper/lower PNGs and the restored full-console viewport.

## Capture Identity

The isolated replay uses the same proven CTM, SHA-256
`c3c1b3b06eed56d63ac6f4afddfc8422ed286f02951c145f6e899d244cac636b`.
Prepared config SHA is
`2d83f0dfa2514220b1b1a0fd040626cf5561ca83929a2839468f6ffd20561794`.
Executable SHA is
`3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`.
Full source/title/content anchors remain in `R/native/` and the compact
`preparation-manifest.json` (SHA
`c45590e069a6f47be00b1877f70e863aed11356416d862e7cec28c9b1d42cd46`).

Native PID 38235 used verified bounds 1160,50,630,780 and exited 0. Playback
changed 20% to 5% at observed counter 1098. The 150-request continuous capture
loop ran 08:48:04.469Z to 08:49:21.289Z, spanning observed counters 1101..1328
and the CTM A event 1200. AX observations follow screenshot dispatch and are
not exact PNG frame identifiers. `coordinator-session.json` records endpoints.
Native filename fractions must be padded numerically, not sorted lexically.

All 150 requests produced own PNGs. Their parsed timestamps span
08:48:03.981Z to 08:49:20.788Z, with maximum gap 809ms; birthtime order agrees.
The frozen baseline `native-analysis/report.json` SHA is
`3ccca31552b49ed84416f9d7ceea3ac41188769027635e6b12f922a8bd327fde`;
manifest SHA is
`fc0baf1bfb2cba46504c662615fec609306debdc79d6286cb4b33b5f6d391778`.
The coordinator opened `native-browser-onset.png`, SHA
`4322a8107672414f2e841953c75c321e4d94c8c34032e1947406ae7b6ec299b4`.
Its "footer departure" N065 label means first pressed feedback, not SceneOut;
its "last retained banner" N073 means last pre-fade sample, not disappearance.
The banner remains visible under subsequent darkening. Supplemental evidence
must preserve these frozen artifacts and clarify those labels.

`before-desktop` contains 53 chronological paired 400x240/320x240 captures,
actual Enter/A input, muted state, no page errors and completed cleanup.
Terminal C14 presentation 343 at 1750.5ms precedes app 344. The separately saved
cleanup record completes the frozen result's pending cleanup field. Preferences
are byte-identical before/after, SHA
`f57212148d65b2dcf8bee9eb088d8007ff2be015f06bbe1575e7d21eb8774228`.
Folder 19 versus native 13 remains a placement adaptation.

Independent audit was rerun by the coordinator:
`review/audit-launch-onset.mjs`, SHA
`bcff372c8630eadd109243ade76b8935837decfb64455508efc70d032321b41e`;
receipt `review/launch-onset-audit.json`, SHA
`49ea5109a6e7598d17d65004aaa750e910df0353cb26fa45f3778040c8bf8653`.
This verifies browser evidence integrity, not native acceptance.

## Delivered Source

Worker `bef3f8bc` and review correction `2f03a179` integrate as `b1ca54d5`
and `b4077380`. Source chat `01a0f9a5-b3a9-79c1-b6d1-beeb544fcf13` owns
`3ds-home-launch-onset-20261003` / `codex/home-launch-onset-20261003`.
The reviewed final commit has no remaining actionable finding.

Retention is optional and requires the exact selected/runtime application
owner plus a settled, visible banner whose selection, primary, generation and
request epoch agree. Eligible launch paints retain that banner and pre-launch
Open actions beneath the existing fade, with decoded footer SceneOut. Pending,
stale or absent hosts and nested helpers keep the previous launch path; they
must not become sticky errors. Once eligible, native banner/footer draw failure
enters paired recovery, preserves the owner and supports retry, without a
reconstructed footer fallback. Helpers, real-host delayed readiness, shortcut,
ordinary HOME switch and reduced-motion endpoints have focused coverage.

Footer mapping: manifest `home.launcher` -> `packs/home/launcher.json`, HOME
title `0004003000009802` v24576, content index 0 / `00000082`, content SHA
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.
Converter `ctr-native-web` 1.2.0 / CTRTool 1.3.0. CIA-internal RomFS members:

| Element | Member | SHA-256 |
| --- | --- | --- |
| Footer layout | `launcher_LZ.bin/blyt/LncBtmBtn_02.bclyt` | `1be988eda6f3d2374d8445d0773688fa1c6dd118590cb986d526c0dc4f326a44` |
| Footer departure | `launcher_LZ.bin/anim/LncBtmBtn_02_SceneOut.bclan` | `df95bfcc74135a116fe14b39604cdd1300197e48b2c864989d3b40d35f13cf1d` |

The nonlooping clip has 15 decoded frames, source range 200..214,
`G_Scene_00`, translation Y 0 to -32 and alpha 255 to 0. Its origin on the
browser launch clock is an adaptation, not a recovered native dispatch.
Reduced motion uses the authored endpoint. No asset or shader changed.

Retained Health artwork uses unchanged manifest `models.healthBannerCommon`
and `models.healthBannerEur`, Health `0004001000022300` v3077, content index 0
/ `00000008`, content SHA
`6c135f500a77070633a0308182b75aa0a672d5403c3535ce4bcbba29fe5f2492`.
`ExeFS/banner.bin` SHA is
`bb810ecddba00bf196d7f480d8c1c13fc569a707416fded522b78ae5679f0755`.
Converter `ctr-cgfx-web` 1.4.1 preserves common BCRES SHA
`e1560e2ca6dfe8d01932c78eaa81ca5c93389c13852e2e4adcf20cb46d5b8032`
and decoded EUR BCRES SHA
`97a1a31d289451077579c641c3826968907c2e16f6bf3855afbbf55f9653ea21`.
Full member/texture mappings remain in the [banner audit](stock-home-banner-asset-audit.md).

## Integrated Verification

Full suite: 1991 pass, 0 fail, 23 skip, 1 TODO. Production build and sequential
typecheck pass; logs are `R/tests-integrated.log`, `build-integrated.log` and
`typecheck-integrated.log`. Sparse-worker missing-model tests and external
node_modules build restrictions are not integration failures.

Production `b4077380` replays: `after-desktop` 55, `after-mobile` 54 and
`after-reduced` 19 paired captures. All complete with page errors empty, mute
and successful cleanup. Desktop uses the same actual Enter/A route; mobile
and reduced use the earlier footer-Open collector and are supporting controls,
not matched native input. The coordinator opened desktop raw launch LCDs,
the narrow viewport and the native/after semantic sheet. The first presented
desktop launch sample, B001 at 40ms/receipt 350, retains the Health banner
and departing Open footer. The baseline B001 instead has neither correct
element. Native counter and browser paint epochs remain unmatched.

The declared N065 versus first-presented B001 diagnostic uses direct
coordinates, zero shift and empty masks, without phase search. Upper-banner
mean RGB error changes 23.9664 to 10.2998; footer 48.0383 to 37.3507;
selected-icon error stays 7.1917. These are unsynchronized semantic anchors,
not whole-screen acceptance. The missing green brackets and pressed footer
tone remain visible. Coordinator inspected the before/native/after sheet.

Final artifacts under `R/native-analysis/semantic-anchor-v2/`:

- `after-desktop/report.json`: `d1075021affc57e8f8364a8e80c32ccec05c1eed9f2d75831925515da8b77c19`.
- `after-desktop/manifest.json`: `95ef592b54978f42293b9bb72d21b0d73e3a1212f625fa8aec7b1b891e56a582`.
- `after-desktop/semantic-anchors.png`: `6a8c9dbdb2f3ff9e04d550dec0b0073ad99358cc808c594b5a4e04869198a051`.
- `desktop-summary/report.json`: `efd7f76ef7ba38834e9455f90d30985aefaf201399c5dfef0eb79e733d1e91ef`.
- `desktop-summary/before-native-after.png`: `ef8b4f10c0a34f03c9019132a4f0ba949926e3aad85020652a31efb527b93dac`.
- `desktop-summary/manifest.json`: `32b8a60d55b2a51448262bc7867513c8926111e05049ceee0789daeae11ffca2`.

The dedicated browser PID 42719 and native PID 38235 exited 0 and are absent;
unrelated browser PID 28433 was left untouched. Preview 3021 is rebuilt.
Browser stderr still records framebuffer-clear warnings around navigation;
valid captures and empty page errors do not establish a warning-free GPU run.

Coordinator reran the independent 128-pair audit successfully:
`review/final-live-runs-audit.mjs`, SHA
`21252a7030d7ce7cc26b59ded30e83b4943e14fda49f29d4f29a1ad868632652`;
receipt SHA
`4db161da50f1f2118c4430b75ead2f557c9d0715613d05117526c13493d2f7d0`.
Desktop explicit C14 receipt 392 at 1764.7ms precedes app 393. Mobile and
reduced have observed presentation order and source-pose corroboration only,
not the v2 collector's explicit semantic terminal receipt. Normal Health
still enters with a black upper and complete lower, then reveals only upper;
the first and settled lower are byte-identical. Reduced skips that reveal.

Whole-scenario status remains fail. Native epoch/input/cadence/audio, existing HOME residual pixels,
the browser 1750/120ms launch clocks and reduced-motion adaptation remain open.
All 3DS audio stays muted; system/Spotify audio and default Azahar are untouched.
No private scenario-matrix change, push, merge or deployment is made here.
