# Native upper HOME composition and proposed pass boundary

`LncBase_U_00` and its camera/capture hints draw **after** the BG/Frame/primary
3D scene. The earlier [stencil note](native-banner-stencil.md) inverted the
layout split comparison; priority 499 is post3D. `HudMenu_00` is also post3D,
at priority 100, after the upper base. The current Canvas `upperBase` placement
after the primary is directionally correct; its earlier HUD placement is not
the native ordering. This is source-only evidence and a proposal, not a code or
visibility change.

Addresses use HOME 10.7.0-32E `code.bin` base `0x100000`, SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Checked outputs and exact CLYT groups/pane paths are in
[native-upper-composition.json](evidence/native-upper-composition.json).
The private `presentation/upper-composition/execute-order.py` under the firmware
SSD artifact root executes original ARM in Unicorn. Its hash is recorded in
that JSON; the original firmware is not committed.

## Executed dispatcher, list order and split

Upper dispatch `0x102108`, including the calls at `0x10214c..17c`, gives:

1. Layout pass `0x2365d4(screen=1, r1=1, eye)`.
2. Scene `0x2362b4(scene=1, ...)`: BG group0, Frame group1, primary group2.
3. Layout pass `0x2365d4(screen=1, r1=0, eye)`.
4. Upper output/clear.

The fixture checks this in both mono and stereo dispatcher modes. The two
layout calls are not themselves synthetic: the dispatcher instructions execute,
with their rendering/platform callees replaced by call logs.

`0x11eae8` chooses the layout list using object `+0x54`. It compares the new
object's priority `+0x58` to the existing object's priority at `node+0x54`
(node is object+4). A strictly greater new priority inserts before the existing
node; equal priorities continue. Original insertion `0x230710` therefore
produces descending order and preserves insertion order for equal priorities.
The fixture inserts deliberately scrambled priorities using both original
functions rather than supplying a pre-sorted list.

Inside `0x2365d4`:

- Object `+0x60 == 0` skips the layout. This is an object gate, not a pane's
  alpha or visibility flag.
- `0x236668..670` skips priorities at or above 9990 (`0x2706`). Those reserved
  priorities are outside the normal draw range investigated here.
- For `r1=1`, `0x236680..688` stops at the first priority below 5000 (`0x1388`),
  retaining the cursor for the second pass. Thus 5000 itself is **pre3D**.
- For `r1=0`, `0x23668c..690` skips priorities at or above 5000 and draws lower
  ones. Thus 4999 and 499 are **post3D**.

The full original layout-pass function draws `[6000,5001,5000]` before 3D and
`[4999,499,499,346,100,99,3]` after it in the fixture. A disabled priority6001
and a reserved priority9990 are excluded. Renderer setup and the final virtual
draw calls are stubs; list traversal, comparisons, gates and cursor retention
are original instructions.

## Named upper layouts

Constructor `0x22a86c` stores screen argument r1 at `+0x54`, priority r2 at
`+0x58`, and initially enables the layout at `+0x60`. The bounded constructor
slices below execute that constructor and capture the exact resource name
passed to `0x22a72c`; heap, formatter and resource parsing are explicit stubs.
All rows are the upper-screen instance (`+0x54=1`).

| Native draw position | Layout | Priority | Construction evidence | Visibility limit |
| --- | --- | ---: | --- | --- |
| Before the 3D scene | `LncBgSlide_U_00` | 5001 | `0x266df4..266e14` | Enabled at slice end; activation/use in a settled white HOME frame is not established here. |
| After primary | `LncBase_U_00` | 499 | `0x286608..286628` | Enabled at slice end; pane, animation and suspended-software gates remain separate. |
| After upper base | `LncCaptureEfct_U_00` | 346 | `0x2b3834..2b3868` | Explicitly disabled by `0x232234(...,0)` after loading. Capture-event activation is outside this trace. |
| After capture effect | `HudMenu_00` | 100 | `0x27c144..27c164` | Enabled at slice end; HUD transition and system eligibility remain separate. |
| After HUD | `LncPopUp_U_00` | 99 | `0x2925c8..2925f4` | Explicitly disabled after loading. Notification activation is not inferred from the asset. |
| After these overlays | `LncBgThemeEfct_U_00` | 3 | `0x269f48..269f68` | Enabled object at slice end, but its authored `P_BgBtm_00` alpha is zero; theme transition activation is unresolved. |

This is a bounded inventory, not every upper-system layout. Names such as
“background” or “HUD” do not determine the pass. The source also has a dynamic
priority setter at `0x1f5a9c`, which writes `+0x58` and, when the global layout
registration gate is active, removes and reinserts the object. These are proven
constructor priorities; this investigation does not claim every transition
retains them or that unknown software overlays share these priorities.

## Exact layout and pane ownership

CLYT animation groups are binding selections inside a layout. They are not
independent entries in the native priority list. Do not split the upper base's
camera art into a different pass because a group is named `G_CamLR_00`.

| Layout / subtree or group | Pass at the traced priority | Content |
| --- | --- | --- |
| `LncBgSlide_U_00`: `RootPane/P_Bg_00`, `G_Bg_00` | pre3D | The 2D slide background, distinct from the CGFX `BannerBG`. |
| `LncBase_U_00`: `RootPane/N_Root_00`, `G_Scene_00` | post3D | Upper-base scene transform; owns both the HUD hook and bottom subtree. |
| Upper base: `N_Root_00/N_Hud_00`, `G_Hud_00` | post3D | Empty hook in this exported layout; it is not the separate `HudMenu_00` asset. |
| Upper base: `N_Root_00/N_Btm_00`, `G_Btm_00` | post3D | Parent of the banner caption `P_BnrText_00` and `N_TextInOut_00`. |
| Upper base: `N_Btm_00/N_TextInOut_00/N_Wrapper_00` | post3D | Complete camera/capture hint subtree, including its backgrounds and icons. |
| Upper base: wrapper child `N_Wrapper_01` | post3D | `CameraBaseS_00`, then `CameraBase_00`. |
| Upper base: wrapper child `N_R_00` | post3D | `P_PictCam_00`, `P_PictL_00`, `P_Plus_00`, `P_PictR_00`. |
| Upper base: wrapper child `N_L_00` | post3D | `P_PictL_01`, `P_PictR_01`, `P_PictCam_01`. |
| Upper base: wrapper children `N_TxtW_00`, `N_TxtB_00` | post3D | White/black camera-caption variants; `T_CamText_00`, `T_CamText_02` and `T_CamText_01`. |
| Upper base: `RootPane/N_Wndw_00`, `G_Wndw_00` / `G_WndwScale_00` | post3D | Suspended-software window, title, HOME/resume text and icon wrapper. Current presenter forces this subtree hidden. |
| `LncCaptureEfct_U_00`: `RootPane/P_Capture_00`, `G_Capture_00` | post3D, priority346 | Capture effect, not the persistent camera hint strip. |
| Entire `HudMenu_00`, including `G_Scene_00`, `G_NetMode_00`, `G_NetAtn_00`, `G_Bat_00`, `G_WalkCoin_00`, `G_WhiteBlack_00` | post3D, priority100 | Native status/date/time/battery/network/step/coin chrome. |
| `LncPopUp_U_00`: `P_PopUp_00` subtree, `G_Scene_00` / `G_WhiteBlack_00` | post3D, priority99 | Pop-up caption and conditional icon variants. |
| `LncBgThemeEfct_U_00`: `RootPane/P_BgBtm_00`, `G_Mask` | post3D, priority3 | Theme effect overlay despite its “Bg” name. |

`G_CamLR_00` selects `N_Wrapper_00`, `N_Wrapper_01`, `CameraBaseS_00`,
`CameraBase_00`, `N_R_00`, `N_L_00`, `T_CamText_01`, and `N_TxtW_01`.
`G_CamLR_01` selects only the last two. `G_PressL_00`, `G_PressR_00`,
`G_PressL_01`, `G_PressR_01` select their named shoulder icons; `G_Loop_00`
selects `T_CamText_00` and `T_CamText_02`. `G_TextInOut_00` and
`G_WhiteBlack_00` span multiple hint/caption nodes. None receives a separate
pre3D assignment. The evidence JSON retains their exact source membership.

## Proposed smallest typed boundary — not implemented

Only two upper layout presenters currently exist. Keep their implementations
and boolean fallback results, and export a typed pass plan:

```ts
type UpperHomePass = 'pre3d' | 'post3d';
type UpperHomeLayer = 'upperBase' | 'hud';
const upperHomeLayers: Readonly<Record<UpperHomePass, readonly UpperHomeLayer[]>> = {
  pre3d: [],
  post3d: ['upperBase', 'hud'],
};
```

The scene/Canvas caller consumes this plan and invokes the existing
`upperBase(ctx)` / `hud(ctx,date,time)` methods in order, keeping each existing
fallback result available. No new banner-renderer callback, speculative state
field, generic priority scheduler or pane-level pass API is needed. A future
convenience dispatcher can wrap these same two methods if integration prefers
one entrypoint; it must preserve their individual fallback results.

For the current supported idle slice, the proposed order is fallback background,
empty supported pre3D pass, existing BG Canvas transaction, existing Frame and
selected-primary transaction, then `upperBase` and HUD. The empty supported
pre3D list does not assert that native HOME has no pre3D layouts. The future
slide presenter belongs there; capture/pop-up/theme-effect presenters require
their own evidenced eligibility and insertion positions shown above.

This leaves BG/Frame/primary sorting and the tested transparent transfer intact.
It does not move the camera strip below the primary. If a rotated primary appears
under that strip, the ordering alone does not establish a defect. HUD fallback
must accompany HUD's post3D position rather than remain before the banner.

## Limits and next checks

- Current `upperBase` samples SceneIn40, Appear10 and WhiteBlack0, hides
  `N_Wndw_00`, and clips to `[0,212,400,28]`. Ordering evidence does not prove
  that forced visibility/crop or those samples for every HOME state.
- Camera/capture-caption selection, L/R press animation, software caption,
  suspended window, HUD transitions and the other overlay activation rules
  remain outside this bounded trace. A loaded layout or constructor-enabled
  object is not proof that its panes should be painted in the current frame.
- No complete census of external app/system overlays, dynamic priority writes,
  GPU pane drawing, stereo pane projection or blend/depth interaction was run.
  The list fixture enables disabled capture/pop-up instances deliberately to
  measure order; it does not simulate their activation.
- Root owns contract agreement, any caller changes, browser clipping challenges
  and matched native captures. No application, public asset, browser, Azahar,
  runtime or audio edits are included. Documentation-only work needs no app
  rebuild; the ARM fixture passes and JSON/diff validation is the relevant check.
