# Notifications remaining lower scrollbar 2,479 source gap — 4 October 2026

Stock/social worker on `codex/next-residual-3-20261004` from HOME fidelity
`038802a1`. Sparse worktree; `node_modules` linked from HOME fidelity.
No `model/`. No runtime change. No Azahar. No preview 3021. No CDP 9320.
No recapture. No CSS, font, mip, sampler, snap, colour or
`azahar-12p4-fit`. The labelled Notifications upper HUD `[0,0,400,28]`
**3347** stays under adversarial review and is not reopened. Sound
clusters, Settings Other pages, Camera Welcome 1401 / pages 3–4 TxtDlg
body, HOME 1-row leftovers, HUD battery and Sound HUD 5/4 stay labelled
and are not reopened.

This is not a 1:1 claim. Tests and this note do not close pixels, input,
motion or audio. Coordinator recapture remains the acceptance gate.

## Pair (reused, not recaptured)

Private comparison
`/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260927-postfix/reference/scenario-matrix/v1/comparisons/notifications-unread-dot-f073581/`.
Production browser LCDs under the sibling `captures/notifications-unread-dot-f073581/browser/`.
Native 400×480 PNG
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/native-reference/screenshots/_27.09.26_13.16.53.105.png`
(same bytes as the isolated Vulkan still named in
[unread-marker](notifications-unread-marker-source-trace-2026-09-27.md)).
Empty mask. Threshold any RGB channel >2/255. Official lower crop of the
native PNG is `(40,240,320,240)`.

| Item | SHA-256 |
| --- | --- |
| Native `_27.09.26_13.16.53.105.png` | `58fff71424e1301e6ead6d7ef9281689faa368bf0e6403dc6dccaef1f9afa389` |
| Browser upper | `78ff0a5ac9db09ebcb85799d23292a5c26f698c414851d46738e79dc51a16d02` |
| Browser lower | `bf5909e54fd845b38d25fe8168134077327e269e1e3e8f8b93333fdaaad403ce` |
| `report.json` | `f952d5acd2b355479689c4b3ab4eea37e20049f20bc58da9fb2402eb96e78cc6` |
| `upper-contact-sheet.png` | `4ba3d2da61e9bbf508bdc7de12513ed451e072bb007485a353aa274ee38c935c` |
| `lower-contact-sheet.png` | `b1913774dfa9578cf9865acdafff7391534948a83eecbf62120cb4c01281edda` |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` |

Inspected the lower contact sheet. Native paints a long idle thumb that
fills most of the right-hand groove (four full rows plus the clipped
fifth). Browser paints the authored 22×22 `SBBtn` at the unsupported
`N_Slide_00` `[0,55,0]` override, so a short capsule sits mid-groove
with a thin line above and below. Row balloons, information badges and
unread lamps already align; Close footer glyphs are a separate leftover.

Recorded empty-mask counts over 2/255:

| Region | Rectangle | Over 2 | Max | At |
| --- | --- | ---: | ---: | --- |
| Whole lower | `[0,0,320,240]` | **3876** | 140 | `(165,227)` Close, not this strip |
| Scrollbar strip | `[291,0,320,210]` | **2479** | 117 | `(300,63)` native `(238,238,237)` / browser `(121,121,121)` |
| Same count, 20-wide | `[291,0,311,210]` | **2479** | 117 | same pixel |
| List body | `[0,0,291,210]` | **820** | 18 | row AA; not this slice |
| Close footer | `[0,210,320,240]` | **577** | 140 | labelled leftover, not reopened here |
| Whole upper | `[0,0,400,240]` | **6239** | 255 | labelled HUD 3347 + body 2892 |

`meanRgbError` 0.9509765625. The 2,479 pixels are exactly the union of
official `report.screens.lower.regions[0]` **1336** `{x:291,y:56,width:20,height:69}`,
`[1]` **727** `{x:291,y:5,width:20,height:41}`,
`[2]` **308** `{x:297,y:162,width:8,height:44}`,
`[9]` **54** `{x:294,y:46,width:14,height:4}` and
`[10]` **54** `{x:294,y:52,width:14,height:4}`.
That is one connected groove/thumb component, not Close and not the
list cards. Upper HUD `[0,0,400,28]` **3347** and body `[0,28,400,240]`
**2892** stay out of this slice.

## Already-bound source (no unique delivered owner)

EUR Notifications applet `000400300000a002`, version 4097, content
index 0 / ID `00000012`, product `CTR-N-HCRP`. Pinned `exefs/code.bin`
SHA-256
`b3993f1e4fe5ed7e5760f0f4c3926c95b42ea8de53c25bb95864499342e5b228`,
image base `0x100000`. Title RomFS SHA-256
`edbe3dec63e8ac70a033df4216baafe27d94e4ee11ea9407d88567a1ed5190ae`.
Published `slidebar.json` SHA-256
`4de274d4eded27e71af003c406fa3490473a73df8230199f35277c19963acf3c`
from dump `RomFS/slidebar_LZ.bin` SHA-256
`53f89c1107837d289c83c06783b5ffa0ddabc4298a622dbc3725990b483ffbbd`
(title `uiSelection.sourceConverter` **1.3.1**). Host list layout
`NewsTopUI_D_00` from `news_LZ.bin` SHA-256
`4b4e5bd8b63d0c8859ba10e3daa4ac819b53e0f16ca3e9d4a401c0cdeb819366`.

| Element | Manifest / pack | Dump source | SHA-256 |
| --- | --- | --- | --- |
| `SlideBar` | `packs/notifications/slidebar.json` | `slidebar_LZ.bin/blyt/SlideBar.bclyt` | `95b8f85852202c608a0b7579777a6643bc577d2820a5eef1c55555c6841a2c6d` |
| `SlideBar_Select` | already requested frame 0 | `slidebar_LZ.bin/anim/SlideBar_Select.bclan` | `da211dd02ab53477e33716e36993e2d6f39254f0bb5749702350a7d98b28a7d9` |
| `N_Slider_00` | authored `[0,0,0]`; live override `[141,14,0]` | same BCLYT | parent mount equals list `N_SlideBar_00` |
| `N_Slide_00` | authored `[0,0,0]`; live override `[0,55,0]` | same BCLYT | unsupported fixed thumb pose |
| `SBBtn` / `SBBtnShdw` / `SBBtnFrame` | authored 22×22 | same BCLYT | idle thumb chrome |
| `SBBaseWndw` | authored 16×132, alpha 80 | same BCLYT | groove window |
| `NewsTopUI_D_00` `N_SlideBar_00` | `packs/notifications/news.json` | `news_LZ.bin/blyt/NewsTopUI_D_00.bclyt` | `d11a58036237a9051b34a05a1bebdc0dae84c366fbc11e6d2f1c556fee00e66b` |

`N_SlideBar_00` is `pan1` **8×184** at `[141,14,0]`. `N_Scroll_00` is an
empty 30×40 parent. `drawNativePersonalToolFrame` already draws
`SlideBar` with `SlideBar_Select` frame 0 (idle; frame 1 only darkens
`SBBtn*` materialColor) and the two translation overrides above. Select
has **no** `translation` or `size` track. The `[0,55,0]` thumb is the
existing unsupported override named in
[list residual](notifications-list-residual-source-audit-2026-09-27.md);
it is not a decoded controller write.

## Unused members that do not uniquely own the 2,479

Published `slidebar.json` still contains unused `SlideBar_Invalid`
(SHA-256
`6f889db658277dbe6e150f5638628777d51ec7d79784f7cb6998d706e7c981f8`).
Frame 1 sets `N_Slide_00` and `SBBaseLine_00` `visible` to 0 and does
not write translation or size. Hiding the thumb cannot own native's
long idle capsule. Frame 0 of Invalid is the same idle materialColor as
Select 0. The live pack request omits Invalid.

`SlideBar_Select` frame 1 only darkens the 22×22 chrome (245→150 /
137→110). It has no size or translation key, so it cannot stretch the
authored thumb toward the native ~groove-length capsule.

Unused `news.json` members `NewsWndwNews_U_00` and `NewsElemCnt_00`
have no `N_SlideBar_00` / `N_Slide_00` pane. Unused `NewsDetailUI_00`
has a different host `N_SlideBar_00` **8×132** at `[300,-124,0]` for
the unpublished detail scene, not the list host **8×184** at
`[141,14,0]`. Row Decide/SceneOut and Close Decide/Select/SceneOut
do not uniquely own the list strip. The live pack request omits all
three unused layouts.
Dump `RomFS/slidebar_LZ.bin` decodes to this one layout plus Invalid /
Select; there is no second BCLYT with a pre-sized nine-row thumb.
HOME `packs/home/slidebar.json` is title `0004003000009802` and is not
this applet.

The executable path at `0x13a160` stores 0.95 / 0.05 multiples of a
host field and later writes `SBBtn` / `SBBtnShdw` / `SBBtnFrame` /
`B_Slide_00`, as already traced. That still does not establish the
field semantics, the `N_Slide_00` translation write, or the native
item count for this nine-row still (constructor builds ten row objects
and marks the first six; the painter draws five). Adopting 55, 6/9 of
184, or the 69-pixel official box as a live size/pose would be a
screenshot fit, not a unique delivered clip.

## Labelled gap

C-NTF-02 remaining lower scrollbar `[291,0,320,210]` **2,479** is a
**source gap**. Already-bound `SlideBar` + Select 0 plus the
unsupported `[0,55,0]` override do not paint the native count-derived
thumb. Until the controller's size and translation writes are uniquely
owned, the painter stays unchanged. Whole lower **3,876** remains fail.
List body **820** and Close footer **577** are separate leftovers.
Labelled upper HUD **3347** is not reopened.

## Checks

Focused `tests/notifications-scrollbar-2479.test.mjs` plus `git diff --check`.
Application typecheck/build were not rerun because no application files
changed. This lane did not drive Azahar or preview 3021.
