# Compact HOME Window - 2 October 2026

Runtime `17eebbb0f83a9690ebe9adc7d8f81679fd366954` adds the source compact
retained-app icon and HOME glyph when another title is selected. This is
implemented and compared, **not accepted 1:1**. Previous goal turn was progress;
this slice starts from the captured missing icon beside Camera's banner.

## Implementation

`retainedSuspendedApplication` preserves the existing instance, suspended,
nonclosing, HOME-return, foreground, sleep, panel and toolbar gates without
requiring selected-title equality. The existing selected selector remains the
expanded-window gate. Metadata stays in one owner-keyed cache across selection;
asset replacement, owner removal and disposal invalidate it. Paired readiness
now distinguishes compact/expanded mode as well as owner identity.

The existing `home.launcher/LncBase_U_00` renderer samples `ScaleUpDown` frame0
for compact, frame15 for expanded. Native position(-176,78), icon scale0.67,
HOME glyph offset and icon/mask/sleep materials remain source values. Compact
mode leaves the selected banner active, hides the expanded app title, and does
not apply expanded caption centering. Host title visibility and settled endpoint
selection are explicit assembly adaptations; transition timing is not recovered.

Source mapping is in private summary `sourceElements` and `provenance`, including
all referenced layout textures, manifest keys, title/version, content index/id,
archive/member path, SHA-256 and converter. HOME0004003000009802 v24576 content0
00000082 `RomFS/launcher_LZ.bin`, launcher pack SHA
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`.
Health icon is its original SMDH, padded to64px for source UVs; second sampler
retained. Existing font content/MSBT-member provenance gaps stay explicit.
No new native asset extraction or reconstructed artwork.

## Evidence

Private root: `/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/compact-home-native/`.
`summary.json` SHA-256 `003ad5ed1216554f432d72482b728de80862d60180cac4228445ca648279a531`
tracks every native/browser capture, history, check, mask, diff sheet and source.

Fresh native: private Azahar PID92558/window4713, verified executable
`3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`, isolated
cwd/user tree, original EUR, Static input2/Null output1/volume0. Startup warning
was dismissed before menu boot. Held Open200ms, Shift HOME500ms, Camera200ms,
then Open200ms reached the two compact states. A transient menu focus refusal
was re-observed; the next same-menu attempt succeeded. Own400x480 PNGs in sibling
`native-close-clean-20261002/screenshots/`: 06:05:46.635 idle, 06:06:25.091
expanded Health, 06:07:01.583 Camera, 06:08:11.794 switch. Quit/Yes exited0;
PID absent and temporary HOME/touch bindings restored while stopped.

Browser-inspected: nine raw400x240/320x240 pairs and three sheets cover expanded,
Camera/moving/switch/footer-switch, resume/reselection/close and portfolio compact
adaptation. Page errors empty. Chrome94326/window4796 at1810,397,1150,780 and
Azahar1810,397,1153,781 were verified inside Sidecar1800,367,1357,935. All audio
muted. Camera continues animating; no compact ghost remains after Health closes.

Native-compared: all eight sheets opened. Empty-mask whole upper/lower residuals
are expanded95281/48061, Camera84915/48605, switch85158/12536. Against the same
fresh native Camera capture, prior browser upper residual was85276; phases differ,
so that whole-image reduction is not a controlled causal measurement. The icon
interior rectangle(10,28,28,28) mean RGB error improves64.16->14.46, maximum
delta160->30, but all784 pixels still exceed2. The wider icon/glyph rectangle
also includes the missing background and remains2174/2240 pixels above2.
No region or whole scenario passes. Native/browser input prefix, density,
population, HUD and animation phases are unmatched; matrix unchanged.

Tested: full1684 pass/0 fail/23 skip/1 TODO; focused, typecheck and build pass.
No shader/material edits. Scene, input and stock-app content are unchanged.

## Remaining

Compact geometry is delivered; exact tint/pulse and activation motion remain.
`LncBase_U_00_Sleep` has a source120-frame looping alpha140->240->140, while
this renderer still samples frame0. Do not mistake its static tint for native
phase parity. Suspended dark backdrop/warp and lower tile tint, modal footer
hiding, banner phase, close/power/input timing and muted audio remain open.
Flat expanded backing/caption centering, portfolio content/single-button policy,
Settings fits/local persistence/previews and offline behavior remain adaptations.
Next substantive HOME work is the source suspended backing and sleep presentation.
