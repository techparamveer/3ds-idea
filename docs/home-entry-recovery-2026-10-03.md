# HOME Entry Graphics Recovery

Runtime `650daa79a4b39d0988d2f1dfb64f1478ce16b5e4` integrates worker
`389ed4b310d8a8017e7beeae0abf8679c1516488` from base `e27784bb`.
This is a browser-host recovery adaptation. Native has no equivalent
WebGL-context-loss input; whole native fidelity remains fail.

## Captured Defect

The [previous ordering capture](home-entry-order-2026-10-03.md) jumps from
HOME13 to75 after graphics restoration: frame008 shows settled HUD/footer
without a banner; frame009 first activates the banner at78. A new instrumented
replay on unchanged `5bd0f99a` independently records context lost/restored
events and repeats HOME14 ->73 pending ->76 active, with the same visible
HUD-before-banner defect. Raw pairs are retained, not overwritten.

Private root for this slice:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-entry-recovery-20261003/`.
Original baseline remains under sibling `home-entry-order-20261003/`.
Instrumented supplemental baseline is `before-context-events/`.

## Ownership

The existing screen-owned entry state retains its boot identity, global HOME
update origin and footer receipt. While a dependent native banner has not been
successfully drawn and visibly presented, normal HUD sampling stops at decoded
SceneIn20, whose alpha is zero. After receipt, the remaining authored20..40
segment uses the later of the original20 boundary or the banner receipt's
HOME update. No global clock, wallpaper, source duration or asset is reset.
Normal early banner publication therefore retains the original HUD schedule.

Only a complete live paired paint can create a banner candidate, and only
after the matching footer receipt. Visible, awake, context-live scene rendering
promotes it after validating generation/request/activation identity against the
current active primary. Failed draws, diagnostic replacement, preemption,
hidden/sleeping/context-lost presentation, asset replacement and disposal cannot
promote a stale candidate. A late context loss does not restart settled entry.

Portfolio/clear/unsupported selections use a separately identified bypass,
not a fabricated native draw receipt; their original HUD epoch survives.
Unsupported resources remain unsupported. Reduced motion retains immediate
authored HUD40, its existing accessibility adaptation. Review caught and fixed
both pre-footer promotion and stale-primary promotion before integration.

## Sources

No delivered native assets changed. Footer and HUD use HOME
`0004003000009802` v24576, content0/`00000082`, converter
`ctr-native-web1.2.0` / CTRTool1.3.0:

| Element | Manifest / Internal Member | SHA-256 |
| --- | --- | --- |
| Entry footer | `home.launcher`, `launcher_LZ.bin/anim/LncBtmBtn_02_SceneIn.bclan` | `9b19c054cbb84c89a4b0c8669a2c05566f386dc7fd681410864065b8dee44a4e` |
| Entry HUD | `home.hud`, `hud_LZ.bin/anim/HudMenu_00_SceneIn.bclan` | `dd44a8b153374128fa7737e1663aafe52fb2d8c45f0bc9f8526e8b48b0c0c7f2` |

Layouts remain `blyt/LncBtmBtn_02.bclyt` and `blyt/HudMenu_00.bclyt`.
Selected Camera remains `0004001000022400` v4097, content0/`0000001a`,
`ExeFS/banner.bin` SHA
`e4808dcf84e490c73200ee5f9cb2ba72d096c93d6ccdf08d88d733988fd66280`.
Common/EUR model manifest keys, CGFX hashes and converter versions are
unchanged in the [prior source record](home-entry-order-2026-10-03.md).
Native caller dependency and exact epochs remain untraced.

## Verification

Full suite:1937 pass,0 fail,23 skipped,1 existing TODO (1961 total).
Production build and serialized typecheck pass. Independent exact-commit review:
145/145 focused tests, no blocking findings. No shader/material change.
These checks do not establish native acceptance.

Comparison plan `home-entry-recovery-comparison-plan.json` SHA
`627a5941a21023445d7c1b8f01274e47733e6d0e47e7ba4f96353c5198781354`;
selector addendum SHA
`7c7ffc7c8dd29a118342eb6ee8114430c666c51051b2e9db77291b860981a2ed`.
Both predate all after captures. The original baseline's presentation-frame gap
is explicitly a proxy; instrumented captures select the first matching
presented HOME paint after the recorded restored event with a live context.
First active primary is chosen by metadata identity, never pixel similarity.

Fixed native ordering reference remains index57
`_03.10.26_04.23.49.262.png`, SHA
`17d3ecc01a01d0e05a1eb1b31fc4f1782a7985bfe5211786a52287955e69a1db`.
Empty masks, delta2, no registration or phase optimization. It is an ordering
reference, not a native context-loss equivalent or matched-input pair.

Production context-long retains61 pairs, desktop28, mobile28 and reduced3,
all muted with errors[]. Direct restore selects frame008/HOME77: settled
footer, pending banner and no premature HUD. First active is frame009/HOME79
with HUD still absent. Subsequent captured samples visibly play the remaining
clip; source positions20,23,26,29,31,34,37,39 are inferred from the unchanged
counter policy, followed by a post40 sample. This is sparse browser playback
evidence, not exact native cadence.

Normal desktop first active is frame009/HOME20 (17 is still loading); mobile
is frame008/HOME17, reduced frame002/HOME7. Keep these actual selectors.
The mobile first-active raw pair is byte-identical to its earlier baseline.
Desktop has a different sampled banner pose and must not be called unchanged
pixel-for-pixel. All selected after footers retain0 pixels above2, maximum2
against native57. Context restored/first-active HUD diagnostics improve from
original5791/5869 to2892/2976 above2, maximum13 instead of219, but do not pass
the HUD region. Wallpaper phase remains unmatched. Normal desktop/mobile
whole differences are26055/25021, reduced41380; all whole native pairs fail.

Supporting controls:55 stall pairs,13 restart checkpoints,8 close/switch
captures with16 inputs, and2 Work-selected startup/late-context captures.
All complete with errors[] and mute. Coordinator opened raw recovery, normal
first-active and Work LCDs, desktop/mobile viewports and the comparison sheet.
The sheet shows order correction, not native timing or global pixel fidelity.

Final `home-entry-recovery-comparison.json` SHA
`0b6115cfba63d8d602bafb4d9d16f437037160050f6c0e9816f2e6e63f637b51`;
sheet `home-entry-recovery-comparison.png` SHA
`c007ef4059fc626841002a58f3ab047c33629f33be6f4eeb1b15e843b1f2946f`;
manifest SHA
`b1eff7ea490f46b2afc7bd37787587662d851c3ed9c28cf5398f62f1224909b0`.
Coordinator independently verified102 records with the private verifier and
Python3.14. Native was not relaunched; its isolated configuration remains
`d2118bc611142e0febb95415bb45487fe83b36c407b6cdad869a01697e92e698`.
Owned Chrome99805 exited, launcher29026 exited0, CUA session ended. Production
preview3021 remains available. No system audio or unrelated app was changed.

The private matrix is unchanged. Portfolio population/content/status/placement,
reduced endpoints and source-frame scheduling remain adaptations. Native whole
pixels, exact input, motion and audio remain unaccepted; tests stay muted.
