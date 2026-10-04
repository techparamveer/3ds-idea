# Notifications lower scrollbar 2,479 — 0x13a160 thumb fix — 4 October 2026

Stock/social worker on `codex/notifications-scrollbar-fix-20261004` from
HOME fidelity `aef9c144`. Sparse worktree; `node_modules` linked from HOME
fidelity. No `model/`. No Azahar. No preview 3021. No CDP 9320. No
recapture. No CSS, font, mip, sampler, snap, colour or `azahar-12p4-fit`.
The labelled Notifications upper HUD `[0,0,400,28]` **3347** stays under
adversarial review and is not reopened. Sound clusters, Settings Other
pages, Camera Welcome 1401 / pages 3–4 TxtDlg body, HOME 1-row leftovers,
HUD battery and Sound HUD 5/4 stay labelled and are not reopened.

Independent review **REJECTED** the earlier source-gap claim
(`176d112f` / `a70d80b6`): already-bound `SlideBar` needed controller
`0x13a160`, not a labelled gap. This slice applies that controller. This
is not a 1:1 claim. Tests and this note do not close pixels, input,
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
| Browser lower (pre-fix production) | `bf5909e54fd845b38d25fe8168134077327e269e1e3e8f8b93333fdaaad403ce` |
| `report.json` | `f952d5acd2b355479689c4b3ab4eea37e20049f20bc58da9fb2402eb96e78cc6` |
| `upper-contact-sheet.png` | `4ba3d2da61e9bbf508bdc7de12513ed451e072bb007485a353aa274ee38c935c` |
| `lower-contact-sheet.png` | `b1913774dfa9578cf9865acdafff7391534948a83eecbf62120cb4c01281edda` |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` |

Hashed production lower over 2/255 (before this painter):

| Region | Rectangle | Over 2 | Max | At |
| --- | ---: | ---: | ---: | --- |
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
That is one connected groove/thumb component. The previous browser painted
the authored 22×22 `SBBtn` at the unsupported `N_Slide_00` `[0,55,0]`
override. Native paints a long idle thumb. Upper HUD `[0,0,400,28]`
**3347** and body `[0,28,400,240]` **2892** stay out of this slice.

## Retracted gap

C-NTF-02 remaining lower scrollbar `[291,0,320,210]` **2,479** is **not**
a source gap. Dump `slidebar_LZ.bin` already delivers `SlideBar`; the
live pack already requests it. The unfinished piece was the `code.bin`
controller that writes pane `+0x4c` size and `N_Slide_00` translation.
Ten constructed / six marked / five drawn row objects are a code-trace
remainder, not a missing BCLYT. Adopting 55, 6/9 of 184, or the 69-pixel
official box as a live size/pose would still be a screenshot fit; this
slice does not do that.

## Already-bound source (controller owner)

EUR Notifications applet `000400300000a002`, version 4097, content
index 0 / ID `00000012`, product `CTR-N-HCRP`. Pinned `exefs/code.bin`
SHA-256
`b3993f1e4fe5ed7e5760f0f4c3926c95b42ea8de53c25bb95864499342e5b228`,
image base `0x100000`. Title RomFS SHA-256
`edbe3dec63e8ac70a033df4216baafe27d94e4ee11ea9407d88567a1ed5190ae`.
Published `slidebar.json` SHA-256
`4de274d4eded27e71af003c406fa3490473a73df8230199f35277c19963acf3c`
from dump `RomFS/slidebar_LZ.bin` SHA-256
`53f89c1107837d289c83c06783b5ffa0ddabc4298a622dbc3725990b483ffbbd`.
Firmware manifest converter `ctr-native-web` **1.2.0**. Host list layout
`NewsTopUI_D_00` from `news_LZ.bin` SHA-256
`4b4e5bd8b63d0c8859ba10e3daa4ac819b53e0f16ca3e9d4a401c0cdeb819366`.

| Element | Manifest / pack | Dump source | SHA-256 |
| --- | --- | --- | --- |
| `SlideBar` | `packs/notifications/slidebar.json` | `slidebar_LZ.bin/blyt/SlideBar.bclyt` | `95b8f85852202c608a0b7579777a6643bc577d2820a5eef1c55555c6841a2c6d` |
| `SlideBar_Select` | already requested frame 0 | `slidebar_LZ.bin/anim/SlideBar_Select.bclan` | `da211dd02ab53477e33716e36993e2d6f39254f0bb5749702350a7d98b28a7d9` |
| `N_Slider_00` | authored `[0,0,0]`; live override `[141,14,0]` | same BCLYT | parent mount equals list `N_SlideBar_00` |
| `N_Slide_00` | authored `[0,0,0]`; live translation from `0x13aa9c` | same BCLYT | thumb pose |
| `SBBtn` / `SBBtnShdw` / `SBBtnFrame` | authored 22×22; live height from `0x13a160` | same BCLYT | idle thumb chrome |
| `SBBaseWndw` / `SBBaseLine_00` / `B_Groove_00` | authored 16×132 / 8×112 / 24×132 | same BCLYT | groove align |
| `NewsTopUI_D_00` `N_SlideBar_00` | `packs/notifications/news.json` | `news_LZ.bin/blyt/NewsTopUI_D_00.bclyt` | `d11a58036237a9051b34a05a1bebdc0dae84c366fbc11e6d2f1c556fee00e66b` |

`N_SlideBar_00` is `pan1` **8×184** at `[141,14,0]`. Select has **no**
`translation` or `size` track. Unused `SlideBar_Invalid`, Select frame 1,
`NewsWndwNews_U_00`, `NewsElemCnt_00`, `NewsDetailUI_00` (host **8×132**
at `[300,-124,0]`) and HOME `packs/home/slidebar.json` (title
`0004003000009802`) still do not own this list strip.

Health `0x12894c` / Settings `0x1f37c4` are the same bind class
(stretch groove to host, write thumb `+0x4c` / `N_Slide_00` translation)
but there is no shared helper; those titles use different host heights
and count rules. This painter stays in
`src/os/stock-native-personal-tools.ts` and does not edit the HUD draw
in the same file.

## Controller `0x13a160` (image base `0x100000`)

Traced from
[list residual](notifications-list-residual-source-audit-2026-09-27.md)
and re-read on this `code.bin`.

Ctor `0x139080` looks up host `N_SlideBar_00` and stores
`+0x68` = authored `SBBtn` height **22** (minimum),
`+0x6c` = hostH × `0.95` (`0x139188` = `0x3f733333`),
`+0x70` = hostH × `0.05` (`0x13918c` = `0x3d4ccccd`).
List setup `0x17e098` copies descriptor `+0x04` = **3** into
controller `+0x08` and leaves `+0x0c` = **0** until rows exist.

Update `0x13a160`:

1. `extra = max(0, index + [0x0c] − [0x08])`.
2. Thumb height = `max(22, 0.95·hostH − 0.05·hostH·extra)` written to
   `+0x4c` of `SBBtn` / `SBBtnShdw` / `SBBtnFrame` / `B_Slide_00`.
   Those three button panes also copy `SBBtn` width (`+0x48` = 22);
   `B_Slide_00` keeps authored width 24.
3. Align: `SBBaseLine_00` size becomes host **8×184**;
   `SBBaseWndw` / `B_Groove_00` become
   `(hostW + wndwW − lineW, hostH + wndwH − lineH)` = **16×204**.
4. `0x1770cc` travel = grooveH − thumbH. `0x13aa9c` writes
   `B_Slide_00` / `N_Slide_00` translation.y =
   `wndw.ty + travel·(0.5 − ratio)` with literals `0.5` / `1.0`.
   After ctor, `+0x7c` / `+0x90` stay 0 so ratio is 0 and
   thumbY = travel/2 (top of the remaining travel, Y-up, origin 4).

Index is the 0x179660 `displacement/stride` argument (list window
start). Count is controller `+0x0c`. For the hashed nine-row unread-dot
still the painter passes `view.rows.length` (9) so
`extra = max(0, 0 + 9 − 3) = 6`, thumb height
`f32(0.95·184 − 0.05·184·6) = 119.60000610351562`, groove 204,
thumbY `42.19999694824219`. That is not 6/9 of 184
(122.66…) and not the 69px official box. Scrolled start=4 with nine
rows yields extra 10 and a shorter thumb from the same formula.
Detail `0x17ace4` writes `+0x0c` from text metrics on that sibling
path; it is not this list still.

## Offline source-render recount (not production recapture)

`scripts/verify-native-personal-tools.mjs --title notifications-list`
now compiles `stock-manual-index` so the existing collector can load
`stock-screen-layout`. This lane rendered the populated list through
`drawNativePersonalToolFrame` with `@napi-rs/canvas` (no preview 3021)
and compared the 320×240 lower buffer to the hashed native crop.
Artifacts:
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/runtime/notifications-scrollbar-2479-20261004/`.
Source lower SHA-256
`86add96fbff074bda89c73d239f9423a2a51efa9f92d0aa2d7a77be10cc5b8e6`.

| Region | Before (production browser vs native) | After (this painter vs native) |
| --- | ---: | ---: |
| Scrollbar `[291,0,320,210]` | **2479** max 117 at `(300,63)` | **38** max 39 at `(301,112)` |
| Same, 20-wide `[291,0,311,210]` | **2479** | **38** |
| Whole lower | **3876** | **1805** (source painter, not production LCD) |
| List body `[0,0,291,210]` | **820** | **1154** (separate leftover + painter pipeline) |
| Close footer `[0,210,320,240]` | **577** | **613** (labelled leftover, not reopened) |

The remaining **38** are grip-line AA at y=62/68 (28 px, delta 3–11) and
thumb-bottom AA at y=112 x=301–310 (10 px, max 39). They are not the
old mid-groove 22×22 capsule. Whole-lower / body / footer after-counts
mix this painter with Close 577 and list 820 leftovers and are not a
production-browser delta.

## Remaining residual

Production unread-dot `f073581` still hashes to lower **3876** /
scrollbar **2479** until the coordinator recaptures. After integration,
offline source-render of the strip is **38** over 2/255. Input cadence,
pulse/motion, audio, labelled HUD 3347, list body 820 and Close 577
remain open. Not 1:1.

Coordinator recapture (do not drive from this worktree): hashed pair
unread-dot `f073581`, native
`58fff71424e1301e6ead6d7ef9281689faa368bf0e6403dc6dccaef1f9afa389`.
Re-run the existing notifications-list collector after integration:

```
node scripts/verify-native-personal-tools.mjs \
  --title notifications-list \
  --artifact-dir <abs> \
  --asset-root <abs public/os/firmware/10.7.0-32E> \
  --canvas-module <abs @napi-rs/canvas/index.js> \
  --interface-root <abs UI checkout>
```

Then capture production browser LCDs through the matrix unread-dot
route (not preview 3021 / CDP 9320) and diff the lower crop against the
same native PNG with the empty mask. First named ROI:
`[291,0,320,210]`.

## Checks

Focused `tests/notifications-scrollbar-2479.test.mjs` **3/3**. Full
`npm test`: **2001** pass, **36** fail, **23** skip, **1** todo. The 36
failures are sparse-worktree `ENOENT` on `model/` (source-rig /
compressed GLB); none are this painter. `npm run typecheck` passed.
`npm run build` is blocked here by Turbopack rejecting the linked
`node_modules` symlink (`points out of the filesystem root`).
`git diff --check` clean. This lane did not drive Azahar or preview
3021.
