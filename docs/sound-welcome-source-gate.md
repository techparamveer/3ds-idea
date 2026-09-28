# Sound Welcome sequence: source identity and native verification gate

Follow-up: the [descriptor/controller audit](sound-welcome-owner-audit.md)
now resolves the original three-page order, source button modes and shared
counter/illustration ownership. Startup eligibility, final presentation and
persistence remain gated. The native attempt below remains unchanged evidence.

## Evidence established

The coordinator observed “Welcome! 1/3” before the settled native Sound capture.
This bounded follow-up identifies the exact English messages in the original
`S_tips` bank. It does not establish whether this appears only on first run,
on every launch, or through another tips trigger.

| Source label | Text, preserving line breaks |
| --- | --- |
| `T_001` | ` Welcome!` (leading space follows a control token) |
| `D_001_0` | `Welcome to` / `Nintendo 3DS Sound!` |
| `D_001_1` | `Here, you can have` / `fun playing music and` / `recording sounds.` |
| `D_001_2` | `You can adjust the` / `volume using the` / `volume control.` |

`T_001_S` is the source placeholder `???`; it must not be substituted for the
actual title. The header is style 68 with scale approximately 0.68. All three
body messages use style 81 with scale approximately 0.84. These style values
alone do not establish the complete visible pane geometry or native font sizing.

The title starts with control 14, group 3, type 42, arguments `0000`. Its
semantics and the 1/3 page-counter binding are not resolved here. Page three
starts with control 14, group 4, type 1. Its argument is a little-endian string
length followed by UTF-16LE **`S_Guid03_U`**, establishing the named illustration
dependency. It changes “volume control” to RGBA `(255,50,0,255)` and restores
`(69,64,57,255)` before the final full stop. A plain-text renderer would lose
both the illustration and the highlighted words.

The converted `S_Guid03_U` is a supported 400×240 source layout with textures
`S_Guid_ChangArrow`, `S_Guid_ChangPoint`, `S_Guid_Cmr_DSBackClr` and `S_Guid_DS`.
The volume guidance is therefore backed by original console/arrow artwork;
no new hardware diagram is needed. This resource fact does not establish its
runtime mount, clipping, visibility interval or text/illustration stacking.

The executable contains `S_tips` references and the `S_Inf_U-Txt` layout name.
The latter contains a 336×184 `TextBox_00` at `(0,3)`, but this investigation
has **not** proven that it owns these Welcome messages. Do not wire it solely
because it is a plausible text box.

## Isolated native attempt

A real copy of the pinned Azahar bundle and an independent cloned `user/`
profile were created under the home-disk artifact directory
`native-sound-welcome-2026-09-24`. The executable SHA-256 matched
`3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`;
the user profile had no symlinks, custom storage remained false, and all copied
profile/screenshot paths were rewritten to the new directory.

Selecting the exact copied app path through CUA started copied PID 2849 but
returned `timeoutReached`. A second attempt returned
`Sky Computer Use native pipe startup failed`. `lsof` confirmed the copied
process's working directory and log were in its own artifact profile. No
native input was sent and no Sound title launch or Welcome frame was verified.
The process did not stop on SIGTERM; SIGKILL was applied only to this verified
copied PID. It was then absent from the process list. The coordinator's PID
45203 was not operated or stopped. The default Azahar profile's config hash
and nanosecond modification time remained identical to preflight.

## Remaining gate

No application, renderer or public resource is changed for Welcome. Before
implementing it, capture each of the three native pages and verify the actual
next/back/dismiss inputs, automatic progression or timeout, entry trigger,
persistence and exit destination. Resolve the title counter and page-three
illustration binding from those frames and the original owner. The transient
observation alone does not justify a three-page timer or first-run save flag.

This documentation-only result needs no application rebuild. Relative links
and `git diff --check` were checked. The private evidence directory is
`/Users/paramveer/.codex/artifacts/native-sound-welcome-2026-09-24/`, containing
`preflight.json`, `after.json` and `welcome-source-evidence.json`; no screenshot
was captured in this attempt. See the separate
[settled entry chrome comparison](sound-native-entry-2026-09-24.md).

Source converted message-pack SHA-256: `183ed6a820f36d2bcb4fb11dcec604746951822dde2bebe2b2db82ac1dd3b863`.
Original message-container SHA-256: `0f4aa1691478ed845de68a9aee26df9b74906e9b6b3f5361e48d461ea7c691f9`.
Guide layout-container SHA-256: `cff1933b3d7304427f953d5e70baa350c3ca813a260374c6c3d87513ece370fc`.
