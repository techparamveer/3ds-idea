# Other Settings focus source audit

This is a bounded static audit of the original EUR 10.7.0-32E System
Settings title. It covers touch entry to Other Settings, the first directional
focus, page changes, and Back from the delivered Profile and Date & Time
scenes. It does not establish whole-screen or transition-timing fidelity.

## Result

The logical-row-0 / visual-Select-frame-0 split is source-consistent.
Integration `21b41b3` is correct for touch entry and page changes: Other
Settings can logically start at Profile while all three buttons render in
their white frame 0. Down then targets row 1, Date & Time.

The integration also corrects the return from Profile and Date & Time. The
source reconstructs `basic_top1` with logical row 0 and the
cross-scene visual flag 0. It does not restore the detail's originating row as
an active yellow selection. Therefore Back from Profile or Date & Time should:

- return to page 1 with logical row 0;
- render Profile, Date & Time, and Touch Screen at Select frame 0;
- let the next Down target Date & Time.

The earlier Back path preserved the child index and forced
`selectionActive: true`. The corrected Profile/Date & Time return uses the
same inactive, selection-0 state as page entry. Other detail return branches
retain their existing behavior until their native routes are traced.

## Executable trace

The code image is mapped at `0x100000` and has SHA-256
`1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5`.

The scene focus setup at `0x215df4` constructs the selection manager at
`0x215e48`. Its constructor writes 0 to the current-index field at
`0x1982d8..0x1982e0`. `BasicTop_D_00` selects manager action 10 at
`0x215e80..0x215f80`, and `0x216038..0x216044` applies that action with target
0. This is the logical Profile state.

The BasicTop constructor at `0x22f854` separately tracks transition source and
target scenes. It resolves the current `basic_top` page and registers that
page's focus control with argument 0 at `0x22f888..0x22f8ac`. For each of the
three row widgets, `0x22f944..0x22f968` compares the source and target scene,
then inverts the result:

- same/no-source scene gives the row callback argument 1;
- a different source scene gives the row callback argument 0.

Touch entry, `basic_top1` → `basic_top2`, and `user_info` or `date_time` →
`basic_top1` are all different-scene transitions, so they take the same
argument-0 path. The transition resolver clears its saved source to `-1` at
`0x22ecd8..0x22ecdc` only after resolving the transition.

Page events are kind 2 at `0x22fc64`; `0x22fc80..0x22fce8` resolves the target
page and dispatches code 6 or 7. Row activation is kind 1:
`0x22fcf0..0x22fcf8` forwards the manager's target row to the detail opener.
Thus the observed first Down from logical row 0 reaches row 1 rather than
creating a first visual-only focus on Profile.

The hash-pinned scene table confirms the routes and common layout:

- `basic_top1` rows are `user_info`, `date_time`, `touch`, with
  `basic_top2` as its next page;
- pages 2–4 link to their adjacent `basic_top` scenes and all use
  `BasicTop_D_00`;
- both `user_info` and `date_time` name `basic_top1` as their return scene.

## Delivered layout evidence

The delivered resources match the private RomFS bytes:

| Resource | Source SHA-256 |
| --- | --- |
| `layout.json/BasicTop_D_00` | `1262f71b7b29cc91ac342cc56161f39bbd4dc2a5b8fb1c42aa31e90669943273` |
| `layout.json/BasicTop_D_00_SpecialIn_00` | `80d8afb285d827a649d85fbfd4358e956abfb15588c673198c4e7d0f08855f8a` |
| `button.json/I_User` | `b93a470881def69963791e5412bd0df01ccf9f55789a069d9df852071d97e139` |
| `button.json/I_User_Select` | `0c0fc2429e64697f1bb25c5896b32abf1753d13d2f23c0bee1fdb0c836ba9275` |

`I_User_Select` is the two-frame source clip shared by the presented Other
Settings icon buttons. Its source range is 0–1. Among its explicit
differences, `Window_01` is visible at frame 0 and hidden at frame 1, while
the text red channel changes from 117 to 200. Frame 0 and frame 1 are
therefore materially different poses, not aliases.

The native touch-entry capture
`reference/native-settings-2026-09-24/other-page1-opengl.jpg` has SHA-256
`38fc0d4cc78144064b6378969cbcb19cb702cb59d4e2588ca631a777e9f91192`.
The corrected browser capture
`reference/native-settings-2026-09-24/browser-other-page1-touch-unselected.jpg`
has SHA-256
`f97f1a215991c3795f3a5c75fcc6aeec24eccac7a1fe25ec492cf6ce9f7af249`.
Both visibly show all three rows white, corroborating the executable/layout
split for touch entry.

## Reproduction

`scripts/audit_settings_focus.py` checks the executable and table hashes,
exact ARM words, function-range hashes, scene routes, source-to-publication
resource hashes, Select clip keys, and both capture hashes. The generated
report is under the private SSD artifact root at
`presentation/settings-focus-source-audit/report.json`.

```sh
python3 -B scripts/audit_settings_focus.py \
  --romfs /Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/assets/multicontent/verified/extracted/settings/contents/0000-0000003d/romfs \
  --code /Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/assets/multicontent/verified/extracted/settings/contents/0000-0000003d/exefs/code.bin \
  --published "$PWD/public/os/firmware/10.7.0-32E/packs/settings/contents/0000-0000003d" \
  --native-capture /Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/native-settings-2026-09-24/other-page1-opengl.jpg \
  --browser-capture /Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/native-settings-2026-09-24/browser-other-page1-touch-unselected.jpg \
  --report /Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/presentation/settings-focus-source-audit/report.json
```

## Gaps

- The source-audit worker did not operate browser or emulator. The integration
  coordinator subsequently operated Profile Back and Date & Time Back in the
  production browser; both showed all three page-1 buttons white, with no
  browser warnings/errors. This is browser verification, not a native return
  capture.
- The native capture proves only touch entry. Page-change and detail-Back
  poses are static executable/layout conclusions without new live captures.
- The audit does not recover input polling latency, transition duration,
  touch-hover behavior, or every callback behind the generic focus manager.
- `I_User_Select` supplies the shared frame behavior; each row still uses its
  own source icon layout.
