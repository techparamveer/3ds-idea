# HOME Density Press Boundary - 3 October 2026

Later [density re-entry evidence](home-density-reentry-2026-10-03.md) captures
native initial/returned held states through CTM and corrects cancellation at
`d53cbe32`. The held-state limitation below describes this earlier run only;
exact cadence and whole-scenario acceptance remain open.

## Correction

Runtime `f85e1396` integrates source worker `8bb6b249` from `a7826743`.
At lower-LCD x293.5/y16.5, the old browser painted the decrease button as
pressed but increased density on release. Fresh isolated Azahar input near
native x293/y16 changed five rows to six, supporting the existing release
side. Host-coordinate rounding is recorded; this is not a traced native HID
boundary or native held-frame proof.

`stock-screen-layout.ts::homeDensityActionAt` now supplies the same half-open
rectangle, x266..320/y0..32, and split x293 to the reducer and pressed presenter.
The source `G_Up_00` Select pose owns x293 and above. Pending-density disabled
rules remain unchanged. Density y32..33 no longer paints a press that cannot
activate. The six unrelated applet buttons retain their prior y<33 paint
geometry. No layout, texture, font, source animation, app design or audio changed.

## Source Identity

Visible density-button base and pressed feedback map to manifest `home.launcher`,
HOME title `0004003000009802`, version24576, content index0/id`00000082`.
The pinned title source SHA is
`2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`;
decrypted code SHA is
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
CIA RomFS `launcher_LZ.bin` SHA is
`826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`.
Internal `blyt/LncBase_D_01.bclyt` SHA is
`787e6b58e0455130ae1f7f4f35a5edf4472c8a21151a53bbce782e813fab5adf`;
`anim/LncBase_D_01_Select.bclan` SHA is
`77887eff1bf874d8f330b15c31d5a92fe968d3e57441921d7a977a8fc23697b8`.
Delivered `packs/home/launcher.json` SHA is
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`.
Converters: ctr-native-web1.2.0 / CTRTool1.3.0. Source Select frame1 is reused;
native caller timing and exact held frame remain unknown. The existing
[density availability contract](native-density-controls.md) remains in force.

## Verification Scope

Private artifact root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-footer-press-20261003`.
Five fresh Azahar own400x480 PNGs record Camera idle, two cross-footer
cancellations, five-row density and the boundary's six-row result. Named
input history and native identities are in `native-input-record.md`.
Native selection/population differ from the portfolio. Pressed native PNGs
are unavailable in this run; the exposed input tools perform atomic drags.

Full suite:1940pass,0fail,23skip,1TODO,1964total; typecheck/build pass.
Independent exact-commit review:103 focused tests pass, no findings.
Tests cover below/at/above293, both disabled density ends and unchanged applet
geometry. No shader/material changes, so shader validation is not applicable.

Five stock regression pairs replay Health main/usage/scrolled and Settings
main/Other page1. Every lower LCD and both Settings upper LCDs remain byte-exact
before/after. Health upper animation epochs differ, so their residuals are not
static parity evidence. Both runs complete with no page errors. The recorded
Health Down command is a four-pixel step, not the older eight-pixel scenario.

Native and browser Manual-to-Open and Open-to-Manual drags cancel at release.
These endpoints do not prove intermediate press pixels, cadence or audio.
The first mobile run incorrectly re-tapped an already selected Camera and
launched it; its incomplete captures remain `browser-mobile-after`, excluded
from acceptance. The corrected harness checks the current selection first.

Accepted desktop `browser-after` and mobile `browser-mobile-after-v2` each
contain ten actual-painted raw LCD pairs with errors[] and mute retained.
Coordinator inspected both held lower LCDs and full console viewports: the
increase button now lights under the boundary press, followed by six rows on
release. These are browser-inspected pixels, not native held-state matches.
The original plan SHA is
`5b4de9c624e66a26987e06a3709d67fd5ad29867026db8a4f5ffd785bbb092ac`;
mobile setup addendum SHA is
`13d7734cfa630e432de682b37f33771b84b962a681718ab226248626be82939a`.
Both were frozen before their respective after captures. Native pairs,
empty masks and channel delta2 are fixed, with no registration or phase fit.

The inspected comparison sheet shows the held group change on both sizes:
1052 pixels above2 in the density ROI, maximum112, relative to the old browser.
All twelve native endpoint footer/density ROI comparisons have zero pixels
above2, maximum2. Every whole native comparison still fails; released lower
LCD residuals are9700 desktop and9673 mobile pixels above2. These regional
matches do not establish matched input, intermediate motion or audio.
Coordinator independently verifies57 bounded manifest records and recomputes
all24 native comparisons. Final identities:

- `report.md`: `f6892ab9852ce8608be950c8af22298a2028f253be03d64a756ff59ea1d62a6a`.
- `comparison-sheet.png`: `76d2ac71f9ede78340f8bc4abecf4d5cc80c6d91840242b88b71cce3c47b9bda`.
- `manifest.json`: `eae345fefefc99e39e21a0aa70eac97fd941796d56fb8e34c4ed9e7ccd404e9a`.

Owned native22763 and browser24149 exit0 and are absent. Native config restores
exactly to SHA
`d2118bc611142e0febb95415bb45487fe83b36c407b6cdad869a01697e92e698`.
Production preview remains at `http://127.0.0.1:3021/`. Default Azahar profile,
system audio, source ROMs and DeveloperStorage artifacts are untouched.

Whole 1:1 remains unproven. Portfolio content, population, placement, status,
reduced-motion endpoints, fitted lifecycle/source-clock scheduling and static
native microphone input remain adaptations. Banner/cursor/background epochs,
native held feedback, exact motion/input and audio remain open. The private
scenario matrix is unchanged; this slice does not establish a whole pass.
