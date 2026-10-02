# Power Block Centering - 2 October 2026

Runtime `57c4c824` integrates source worker `294dfb0c`; comparison `bf0c0376`
is integrated as `74fc7d5f`. Two existing GPT-5.6
Sol/high chats used separate internal worktrees; only the coordinator operated
Azahar and the production browser. No service-tier change is claimed.

## Source And Implementation

The decrypted HOME writer measures the complete multiline rectangle and applies
`paneWidth / 2 - ceil(float32(float32(left + right) * 0.5f))` for flags
`0x110`. Power's English list therefore starts at 84, not the generic
approximately 84.375. CWDH bearing, width and advance calculations retain
float32 arithmetic. This is a decoded rule, not a fitted pixel offset.

Only upper `Slp_U_00/T_Main_00` opts in. Default text callers, the heading,
footer, lower labels and the previous lower LCD sampler are unchanged. Invalid
selected text shapes fail explicitly; the full text descriptor remains part
of the raster cache key. No asset, font, color or coverage curve was added.

[Source addresses and hashes](home-power-block-centering-2026-10-02.md) and
[element-to-manifest mapping](workstream-handoffs/home-power-menu-compare.md#native-element-and-source-contract)
identify HOME `0004003000009802` v24576, content 0 / `00000082`, native layouts,
MSBT, RI styles, shared font and converter versions. Source identification and
existing asset delivery are separate from the new renderer implementation.

## Native Comparison

Private artifact root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/power-centering-20261002/`.

Fresh own 400x480 native PNGs in sibling `native-close-clean-20261002/screenshots/`
are HOME idle `_02.10.26_11.56.30.02.png`, HOME Power
`_02.10.26_11.56.52.015.png` and app Power `_02.10.26_11.58.26.171.png`.
Both Power references are byte-identical to prior references. `native-session.json`
records hashes, input history, isolation, display geometry and cleanup.

The immutable production pairs are `browser-before`, `browser-after` and
`browser-app-repeat`. Raw upper 400x240 and lower 320x240 captures use an explicit
120000 ms settled presentation sample, not a wall-clock wait or native event
epoch. Inputs are semantically Power from HOME/Health, but selection, launch
method and exact cadence remain unmatched.

| Empty-mask comparison | Before pixels >2 | After pixels >2 | After mean RGB / maximum |
| --- | ---: | ---: | --- |
| HOME upper | 4334 | 3 | 0.048521 / 50 |
| App upper | 4334 | 3 | 0.048521 / 50 |
| HOME lower | 0 | 0 | 0.006411 / 2 |
| App lower | 0 | 0 | 0.006411 / 2 |

The upper list alone improves 4331 to 0 high pixels, maximum 2. The three
remaining upper pixels are the unchanged footer cluster at x146, y188..190.
Both lower PNGs are byte-identical before/after, and app `Software closed.`
remains RGB-exact across its 12000-pixel region. The fresh app-only navigation
repeat is byte-identical to the first app after pair. This repeat does not
explain or erase the prior same-code app upper variance.

[Comparison handoff](workstream-handoffs/home-power-centering-compare.md)
records the named input, empty-mask, report and sheet SHA-256 identities. The
coordinator opened all four upper/lower contact sheets. No difference is masked.
Both whole scenarios remain fail; no private matrix acceptance was changed.
The final artifact inventory hashes 292 private capture/report/script/log files;
306 relative documentation links and `git diff --check` pass.

## Supporting Verification

Full `npm test`: 1778 pass, 0 fail, 23 skip, 1 TODO. Production build and
subsequent `npm run typecheck` pass. Shader/material code is unchanged.
Focused tests cover source bounds, origin, rounding, unchanged vertical
advances, default behavior, explicit pane propagation and invalid shape.

Browser-inspected: both Power origins, inert footer touch, HOME return,
central Power Off and reboot passed muted without page errors. Desktop
1150x690 and mobile 390x700 physical Power/HOME controls passed, with nonblank,
fully framed screenshots inspected. Browser-only motion produced 32 HOME and
32 app raw pairs; both sheets were opened. These do not prove native timing.

Regression replay preserves five lower LCDs and both Settings upper LCDs
byte-for-byte. Health main/Usage/scrolled upper animated backgrounds differ
at 8377/7624/9245 pixels above 2, maximum 34/34/41; their local phases are not
matched. The scroll fixture uses one discrete accessible Down tap (4 pixels),
not a claim of native or keyboard hold cadence. Reports retain those limits.

## Safety And Remaining Work

Sidecar desktop bounds `(1920,367,1357,935)` were rechecked. Native and browser
windows were verified at `(1930,397)` before interaction. Native PID92754 exited
via Quit/Yes; absence was verified, exit code unavailable. Only after exit were
temporary Power Shift and touch settings restored. Static input 2, Null output
1 and volume 0 are preserved. Dedicated Chromium used `--mute-audio` and was
closed; launcher exit 0. No system audio, Spotify or microphone setting changed.

Temporary preview 3022 was stopped. Preview 3021 was restarted from the new
build, HTTP 200 / ready HOME / active banner / muted / no page errors verified.
No new DeveloperStorage artifacts, push, merge or deploy occurred.

Still unproven or non-native: three upper footer pixels, previous app upper
run variance, host transition/shutdown clocks and assembly, LCD/backlight/blue
indicator ordering, exact input/motion and muted audio, plus documented HOME
and close fits and intentional portfolio/local/read-only adaptations. The next
captured static defect is the footer cluster. The full HOME goal remains active.
