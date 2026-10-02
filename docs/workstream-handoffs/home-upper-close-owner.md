# HOME upper close owner source audit

Base: `4f44e500666fc399fe03e91ecc5d60f625cb680a`

Branch: `codex/home-upper-close-owner-20261002`

## Outcome

The native software-close composition callback is `0x1e6bbc`. When given an
upper HOME owner, it calls `0x1ed1c4(owner, 0)` at `0x1e6bdc`, then calls
`0x1eda18(owner, seekEnd)` at `0x1e6be8`. The second call is a thin wrapper:
`0x1eda24` forwards the upper owner's `+0x2f0` BannerBG controller to
`0x24dc2c`, which starts **`BannerBG_AppQuit`**. This is the real start path for
the fixed-bounds native close fade. It is not `BannerBG_SceneOut`,
`LncBase_U_00_SceneOut`, or an upper `DlgMask` binding.

The same bounded trace does **not** find a native scalar that applies AppQuit's
alpha to `LncBase_U_00`. The upper layout remains a distinct priority-499
post-3D layout, while BannerBG is in the earlier 3D pass. The callback's mode-0
call restarts `BannerBG_Loop` and operates the upper layout's `+0x280`
`LncBase_U_00_WhiteBlack` controller. That two-frame clip selects white/black
caption and camera-hint variants; it is not a whole-window fade. No instruction
in the bounded callback, wrapper, mode setter, upper update completion check,
or relevant constructors starts `LncBase_U_00_SceneOut` or copies
`BannerBG_AppQuit` Constant4 alpha into the upper layout.

The actionable mapping is therefore limited but concrete: use the AppQuit
0..20 scalar as the source-backed close composition clock; treating it as a
fixed-bounds scalar over the browser's retained app capture **and** separately
drawn upper panel is still a host composition adaptation pending a matched
native/browser fit and recapture. Do not wire the authored scale-coupled upper
SceneOut or claim a native shared-alpha implementation.

## Exact call chain

Addresses are for pinned EUR 10.7.0-32E HOME `code.bin` loaded at `0x100000`.

| Address | Native action | Evidence boundary |
| --- | --- | --- |
| `0x1de178`, `0x1de23c` | Dialog paths call the shared close composition callback `0x1e6bbc`; the surrounding branches select native `lau_dlg_quit*` resources | Connects dialog close flow to the callback; it does not assign a browser epoch |
| `0x1e6bdc` | `0x1ed1c4(upper, 0)` | Switches the upper owner to mode 0 |
| `0x1e6be8` | `0x1eda18(upper, seekEnd)` | Starts the close-owned BannerBG clip |
| `0x1eda20..0x1eda24` | Loads upper `+0x2f0`, calls `0x24dc2c` | Resolves the owner as BannerBG and the clip slot as `+0x60` |
| `0x24db64..0x24db70` | Constructs `BannerBG_AppQuit` into slot `+0x60` | Exact clip identity |
| `0x24dc34..0x24dc74` | Starts slot `+0x60`; optional nonzero argument seeks to duration minus one | Exact start/seek behavior |
| `0x286f18..0x286f28` | Tests AppQuit slot `+0x60` for state 2, then calls `0x24dc14` | AppQuit completion restarts `BannerBG_Loop` |

Direct-call inventory reinforces the distinction. `0x24dc2c`
(`BannerBG_AppQuit`) is called at `0x1ed574` and `0x1eda24`. The shared close
callback reaches the latter. `0x24dab0` (`BannerBG_SceneOut`) is called at
`0x285480`, `0x287b1c`, and conditionally at `0x287b84`; none is in the close
callback chain above. This audit does not assign those SceneOut callers to a
software-close epoch.

## Clip and composition facts

The source `BannerBG_AppQuit` material clip is 20 frames. It animates
`mt_BG` MaterialConstant4 alpha from 0 at frame 0 to 1 at frame 20 and capture
UV scale from 0.87 to 1. This is the scalar already used for the retained app
capture. `BannerBG_SceneOut` is instead a 40-frame skeletal scale/translation
departure.

The upper layout constructor at `0x286608..0x286618` creates
`LncBase_U_00` for upper screen 1 with priority 499. Its table at `0x32f50c`
maps `+0x0c` to `WhiteBlack`, `+0x24` to `G_Scene_00`, `+0x2c` to `SceneIn`,
and `+0x30` to `SceneOut`. Constructor code `0x286808..0x286834` binds
`WhiteBlack` to `G_WhiteBlack_00` and stores that controller at upper owner
`+0x280`. Mode 0 in `0x1ed230..0x1ed268` operates this `+0x280` controller,
not the `G_Scene_00` SceneOut controller. The delivered `WhiteBlack` tracks
only change named caption/camera visibility and material colors; they do not
animate `N_Wndw_00` or the root alpha across the AppQuit span.

The existing native pass trace remains authoritative: BannerBG draws in the 3D
scene, then `LncBase_U_00` draws post-3D at priority 499, then `HudMenu_00` at
priority 100. Native capture shows the app content and panel fading at fixed
bounds while HUD remains. Because the panel is later than BannerBG and the
bounded close path exposes no shared framebuffer/layout alpha, source evidence
does not establish whether the real system uses an untraced compositor stage,
a capture/presentation state not represented by the static pass trace, or
another owner outside this one-pass slice.

## Source identity and private output

The pinned executable is HOME title `0004003000009802`, version 24576, content
index 0 / content ID `00000082`, SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
The BannerBG source is `romfs/3D/BannerBG_LZ.bin`, compressed SHA-256
`27d58c2113d2c2d46e3bcc36bb2ae56c35e19d9823488287b6759df998108711`,
decoded CGFX SHA-256
`092c8682d0cfabf0a1823a8e3a2c12556515c437afba2aa6f6ac7fc4d5e34595`.
The delivered model JSON SHA-256 is
`45b3c6a470f681a10443f90fc73aff016b97a077b977b62649465524dffd3615`,
converted with `ctr-cgfx-web` 1.1.0.

The launcher source is `romfs/launcher_LZ.bin`, SHA-256
`826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`;
the delivered launcher pack SHA-256 is
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`.
The relevant layout member is `blyt/LncBase_U_00.bclyt`, SHA-256
`b1afe7bece548a4ffad1211d011b4822349f61b002616e3a173e2923f06f6a50`;
the rejected SceneOut member is `anim/LncBase_U_00_SceneOut.bclan`, SHA-256
`ba54b2de5825ab966a6bfd1e480d84c4479510688b1e36a20336493afdb174e9`.
Launcher conversion is `ctr-native-web` 1.2.0 with CTRTool 1.3.0.

Run [the bounded audit script](../../scripts/firmware/home_upper_close_owner.py)
with absolute input/output paths. This slice's private `audit.json` and
`audit.asm` are under
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-upper-close/`.
They contain the exact input hashes, clipped disassembly, direct-call inventory,
and decoded AppQuit/SceneOut/WhiteBlack track summaries; no firmware is copied
into the repository.

## Verification and remaining gap

This is source-audit/documentation-only work. The script hash-checks all three
inputs and asserts the critical direct calls before writing its output.
Relative links and `git diff --check` are the required repository checks. No
runtime source, native asset, matrix, browser, GUI, Azahar, audio, test suite,
typecheck, build, or shader check belongs to this worker slice.

The coordinator's normal-speed native capture
`native-close-clean-20261002/screenshots/_02.10.26_08.20.50.671.png`
(SHA-256
`a33cdb74b96f8456ba430be27e840977d8c6de71707bd5d3cdc47506eeb74afa`)
confirms empty upper wallpaper while the lower closing screen remains. It is
additional native timing/state evidence, not proof of the missing downstream
composition implementation. The coordinator must quantify the proposed
fixed-bounds AppQuit-scalar adaptation against matched captures and recapture
after integration; the whole close scenario remains a source gap/fail until
that work is complete.
