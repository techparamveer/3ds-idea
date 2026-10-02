# Power Text Raster - 2 October 2026

Runtime `766888a2` retains only the measured lower-label correction. Source
worker `e1836ae2` was integrated as candidate `459d623f`; cleanup `60289548`
was integrated as `766888a2`. Comparison `ab13f48e` was integrated as
`8bfe8607`. Two existing Sol5.6/high chats used separate internal worktrees;
only the coordinator operated Azahar and the production browser.

## Source And Implementation

Power lower `Slp_D_00/T_BtnB_01` and `T_BtnF_01` now use the existing original
A4 font-atlas sampler at final LCD pixel centres. Their authored half-pixel
vertical phase is retained without filtering an already rasterized text pane
again. A validated pane allowlist leaves `Software closed.`, the footer and
all other text paths unchanged. No asset, font, color, offset or fitted
coverage curve was added. Missing selected panes fail explicitly.

[Source contract and failed upper experiment](home-power-glyph-sampling-2026-10-02.md)
and [element-to-manifest provenance](workstream-handoffs/home-power-menu-compare.md#native-element-and-source-contract)
identify HOME `0004003000009802` v24576, content0/`00000082`, source members,
hashes and converter versions. Native graphics/audio still come only from the
pinned dump. This slice changes sampling, not source delivery.

The upper multiline candidate changed 4334 to4329 pixels above2 but worsened
mean RGB1.748302 to1.749889. It was rejected and removed, including its new
mode, bitmap branch and tests. The final upper path is the prior implementation,
not an accepted approximation. The repeated fractional diagnostic `(+0.375,0)`
is only a source-trace lead for block-centering rounding, not a runtime offset.

## Verification

Final full suite:1777 pass,0fail,23skip,1TODO; production build and subsequent
typecheck pass. Shader/material code is unchanged. Tests cover pane selection,
invalid/missing names, unchanged sibling text and Power's exact opt-in scope.

Private evidence root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/power-raster-20261002/`.
The canonical before is `browser-settled-before`, candidate is
`browser-settled-after`, and final is `browser-final`. All are immutable named
captures. Raw browser LCDs use explicit120000ms settled presentation samples;
this clamps the source clip and is not a shared native epoch.

Fresh native own400x480 PNGs in sibling `native-close-clean-20261002/screenshots/`
are `_02.10.26_11.30.18.191.png` (HOME) and
`_02.10.26_11.32.39.199.png` (Health). Each is byte-identical to the prior
reference. [Comparison handoff](workstream-handoffs/home-power-raster-compare.md)
records SHA-256 identities, empty-mask reports, regional metrics and inspected
contact sheets. Both routes still fail whole-scenario acceptance.

Final lower comparisons improve668 ->0 pixels above2/255, maximum85 ->2,
mean RGB0.174926 ->0.006411. The app-origin12000-pixel `Software closed.`
region remains RGB-exact. Final HOME upper restores the baseline hash and
4334 high pixels. Final app upper instead has6512 high pixels, mean1.970861,
maximum211. An app-only fresh-navigation repeat is byte-identical to that
result. Main list and footer differ from the prior upper; heading is unchanged.
This discrepancy is preserved, not replaced by the cleaner HOME capture.

A controlled build at `766888a2+lower-sampler-disabled` removed only the two
lower draw options. Its app upper repeats the final hash exactly, while its
lower reverts to the old baseline hash. Thus the upper discrepancy also occurs
without the lower opt-in; its cause remains unproven. The temporary line was
restored exactly to `766888a2` before rebuilding. Control captures are separate
under `browser-disabled-control`; no temporary source change was committed.
The subsequent restored-build app capture (`browser-restored/app-power`)
returns to the baseline upper hash with4334 high pixels and retains the exact
corrected lower hash. Both upper outputs therefore occurred at the same final
runtime, and the discrepant output also occurred with the lower opt-in disabled.
The lower correction is repeatable; upper run-to-run stability remains open.

The production final passed HOME/app Power, inert footer touch, HOME return,
central Power Off, restart, and physical Power/HOME at1150x690 and390x700.
Screenshots were opened, nonblank and fully framed, with no page errors.
Browser-only final motion captured73 raw pairs through both Power entry/shutdown
routes; both sheets were inspected. Text remains visible through the sampled
fades. This is not matched native cadence or exhaustive frame coverage.

Five candidate regression lower LCDs and both Settings upper LCDs are
byte-identical. Health main/Usage/scrolled upper comparisons differ at
3349/5563/7419 pixels above2 (max35/34/41); their local animation clocks are
unmatched, and the visible background poses differ. No exact upper regression
claim is made for those captures.

Final regression replay initially failed the scrolled Health lower comparison:
the short physical Down press advanced8px rather than the baseline4px. The
named failed capture/report remains under `regression-final`. A separate replay
used the source one-update accessible Down tap (`healthScrollKeyTap`), yielding
the same4px content position. Under `regression-discrete`, all five lower and
both Settings upper LCDs are byte-identical. Health upper1878/1926/7026 pixels
above2 (max29/24/37) remain unmatched local animation. This does not claim
keyboard hold cadence or native input parity; no runtime input change was made.

## Safety And Remaining Work

Sidecar geometry was rechecked as desktop `(1920,367,1357,935)`; native and
browser windows were verified at `(1930,397)` before input. Native PID45291
was quit through its own Quit/Yes UI; absence was verified, exit code unavailable.
Only then were temporary Power Shift and unmapped-touch settings restored to
V/default and mapped touch true/nondefault. Static input2, Null output1 and
volume0 remain; the dedicated browser uses `--mute-audio`. System audio,
Spotify, microphone and unrelated preview3033 were not changed.

The owned temporary3022 server was stopped after final tests. Preview3021 was
refreshed from the restored runtime and verified HTTP200, ready HOME, muted,
with no page errors. The reference sessions are test-only; screenshots, logs,
scripts and comparison outputs stay in internal overflow storage.

Still non-native or unproven: upper Power list coverage and three footer
pixels, host transition/shutdown timing, LCD/backlight/indicator ordering,
exact input and muted audio, plus prior documented HOME/close fitted behavior
and intentional portfolio/local/read-only adaptations. Static lower pixel
agreement does not resolve those gates. No private matrix status, global1:1
claim, push, merge, deploy or DeveloperStorage artifact write is authorized.
