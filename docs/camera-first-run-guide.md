# Camera Welcome route

Camera now enters the five-page EUR Welcome guide, then opens the existing
read-only portfolio folders. The Camera helper keeps its existing entry route.
The page owns only a guide index inside the existing AppModule; shared physical,
keyboard and touch dispatch, native readiness and paired LCD publication remain
in force. No camera, recording, import or persistence effect is enabled.

## Source binding

The private pinned Camera `romfs/res/Guide_snk.gbin`, SHA-256
`a82c23b20f1638ff6c6f4acf8aa9c26cb012bbb184965281fa1ca69a6fbdc293`,
contains 110 GUID records. Its first record at offset 8 is T_003 with five
20-byte page entries after its 48-byte header. Each entry contains the original
P_tips message label and button mode. `scripts/audit_camera_welcome.py`
validates the file hash, complete record traversal and this exact descriptor.
The 48 + 20 × page-count structure is also documented in the separately traced
[Sound guide owner](sound-welcome-owner-audit.md). The audit does not claim a new
Camera executable controller replay.

| Page | Message | Mode | Buttons | Upper illustration token |
| --- | --- | --- | --- | --- |
| 1 | D_003_0 | 2 | Next | None |
| 2 | D_003_1 | 3 | Back, Next | None |
| 3 | D_003_2 | 3 | Back, Next | P_Guid05_U |
| 4 | D_003_3 | 3 | Back, Next | P_Guid01_U |
| 5 | D_003_4 | 4 | Back, OK | P_Guid02_U |

Each illustration is selected by the original message group 4/type 1 token,
not by the page number. The same source descriptor modes and Guide_D button
message families are used by the decoded shared Sound guide implementation.
The lower C_DlgGuid1BtnW/C_DlgGuid2Btn mounts C_DlgChA at identity. The latter
includes the original Bird image. RI.mstl message colour +8 supplies text RGBA.
The 1×1 counter panes use original 48px message width and the existing Sound
adapter's 24px raster height, with the original parameter strings and page count.
The first hit pane is 128×40 centered at (160,204); paired hit panes are 88×40
centered at (112,204) and (208,204), directly from source BB panes.

All visible art and original messages are selected from the delivered Camera
pack, title `0004001000022400`, content index 0 / ID `0000001a`. See the
[additive resource delivery](camera-first-run-character-panel-delivery.md) for
layout/texture hashes and converter provenance. P_tips source is
`msg/EU_English.LZ/P_tips.msbt`, SHA-256
`0fd449e7831698969cd8d0f20a351990c6ddbe89f59df16bbe96ccf9b55bb1e0`.
The existing source style table is recorded in
[browse message colours](camera-browse-message-colors.md).

## Captured state and explicit limits

The preserved `camera-first-run/native/combined.png` was inspected: page 1 has
a black upper finder, photo capacity 3000, 3D and SD icons, and the lower
character dialog. The adapter uses P_Finder_U and its source Storage/-L-SD
mount at (387,225), populated with C_IconSD. Capacity 3000 and SD are fixed
reference-fixture values, not browser device/storage readings. The camera glyph
comes from Finder_Pho_00_00. Capture controls remain inert.

These gaps remain visible or behaviorally different:

- The lower shoot scene behind the guide perimeter is not composed; its surface
  is cleared to black. This is an explicit missing background, not native black
  artwork. Background attenuation/compositing remains untraced.
- Page 3/4 red inline emphasis tokens are currently flattened by the shared
  message renderer. Native mixed-colour text remains unresolved.
- Counter raster height, fixed capacity/SD fixture and static pose are adapters.
  Entry/exit motion, bird scheduling, audio and input timing remain unverified.
- Welcome repeats on application creation; no native first-run save flag is
  inferred or written. Suspend/resume retains the active page.
- OK ends in the portfolio folder screen rather than native capture mode.
  This is the authorized read-only scope adaptation.

No native/browser pass is claimed. The coordinator must build integration,
capture the raw browser LCD pair and compare it to the preserved native page 1;
pages 2–5 and transitions still need equivalent native/browser scenarios.

## Verification

The hash-pinned private descriptor audit passes. 76 focused presentation,
stock reducer, gallery lifecycle and runtime-effect tests pass. Typecheck and
production build pass. The full suite has 1,365 passes, 40 failures, 23 skips and 1 todo; its 40 failure
identities match the pre-guide run. It retains unrelated absent model/Blender
fixtures and the external ENOSPC artifact-write failure; those do not validate
or invalidate the guide pixels. `git diff --check` passes. Gallery fixtures
now explicitly traverse Welcome before testing browsing and owner reset.
