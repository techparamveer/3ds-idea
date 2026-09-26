# Camera guide top-control pose audit

The fresh page-2 production pair `camera-guide-page2-glyph-1fda6c7` retains
638 top-control pixels above 2/255: 306 in `(80,0)..(131,6)` and 332 in
`(183,0)..(240,6)`. This pass at integration `3e046e7` identifies a promising
source-pose candidate but does not establish the settled native controller
binding. No runtime change is promoted.

The existing native screenshot has SHA-256
`fd4a660ef47879a3535ec6fa9f83fffe1caaa9c1973bd0580ca9cbced4dacc21`;
its lower LCD is `(40,240)..(360,480)`. The production pair and report are under
`/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260926/reference/scenario-matrix/v1/captures/camera-guide-page2-glyph-1fda6c7/`.
The native/browser top-strip crop was inspected enlarged. At `(100,0)`, native
RGB is `(123,121,119)` and browser `(61,61,60)`; at `(210,5)`, native is
`(119,119,119)` and browser `(120,119,117)`. Black gaps at `(80,0)` and
`(239,0)` correspond to native `(115,111,103)`, also seen in the side backdrop.
Thus the residual includes both button pose/alpha and the unbound base surface.

## Original poses, unchanged resources

[Published source members](camera-shoot-child-delivery.md) establish:

- `P_CamBtn_Default` frame 0 has CamBase alpha 255; the currently held
  `P_CamBtn_Disable` frame 0 has alpha 128. Both have local Y translation 0.
- `P_Shoot_D_Default` frame 0 has PhoBase/MovBase Y translation 0; the currently
  held `P_Shoot_D_Disable` frame 0 raises them by 8 source units.
- Both animation choices retain source material-color channels `(95,75,33)`.
  Changing those channels is not part of this diagnostic.

An isolated CPU Canvas probe substituted only those original Default clips in
memory, preserving all textures, theme handling, the existing 0.5 brightness
adaptation and the same production painter. No repository runtime file changed.

| Diagnostic clips | Left pixels over 2/255 | Right pixels over 2/255 |
| --- | ---: | ---: |
| Existing parent Disable / child Disable | 306 | 331 |
| Parent Default / child Disable | 306 | 24 |
| Parent Disable / child Default | 51 | 331 |
| Parent Default / child Default | 51 | 24 |

The 637-pixel CPU baseline differs from the 638-pixel browser baseline.
The unchanged lower footer region `(0,204)..(320,240)` has 102 CPU differing
pixels in all four variants. Default is therefore a useful candidate to trace;
a visually better pose is not proof of the native controller state. The 75
remaining top pixels also show that changing these clips cannot alone close
the top strip. Evidence and the diagnostic probe are at
`/Users/paramveer/.codex/artifacts/camera-guide-top-controls-20260926/`.

## Controller trace and exact gap

The pinned executable SHA-256 remains
`3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`.
Fresh Capstone decoding confirms a generic 0x254-byte object retained at
Camera owner `+0x500`: constructor code at `0x2a6168` starts the wrapper at
`+0x4e4`, stores the object through wrapper `+0x1c`, assigns pass mask 8,
and registers it at `0x2a6200`. At `0x2a621c–0x2a622c`, it writes literal
`0x01000080` and the result of OR with its arithmetic shift by 24
(`0x01000081`) to object `+0x240/+0x244`. These are not resource-name
pointers; their field semantics are unbound. Nearby `P_Shoot_D` string
literals are at `0x2a64d0/0x2a64d4`, while this write loads `0x2a64dc`.
The generic object's identity must be resolved before treating its reset
path as the shoot button controller.

The nearby paths `0x2a5810` and `0x2a590c` obtain a generic controller via
`0x204a04`, with retained handle at Camera owner `+0x4e8`, then call
`0x21b0c4` with arguments 0/0. Inspection of `0x21b0c4` shows controller flags,
collections and phase fields being reset; these zero arguments have **not**
been identified as an animation index or a `Default` clip selection. The
wrapper's lazy construction itself calls virtual methods. A constructor or
zero-valued reset argument cannot establish the later settled animation.

The remaining binding is the Welcome-time controller update that selects the
animation groups for PhoBase/MovBase and nested CamBase, including their final
local frame and inherited alpha. The draw pass beneath their transparent
edges and any modal attenuation must also be resolved. Until that state is
traced or replayed, replacing Disable with Default would be another capture
fit. The original `P_CamIcon_IconPtrn` camera choice is not resolved by the
six-pixel strip, either.

`git diff --check` passes. This documentation-only audit used existing captures
and private source reads; it did not drive shared browser, Azahar or server,
modify other worktrees, or rerun application builds.
