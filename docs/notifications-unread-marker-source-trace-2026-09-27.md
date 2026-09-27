# Notifications unread marker source trace — 27 September 2026

Base: `e3c3ec6`. The first pass (`f95284d`) was a bounded source audit. The
follow-up below identifies and binds the source artwork for the blue dots
visible in the isolated EUR 10.7.0-32E Notifications list. The pinned
Notifications applet is `000400300000a002`, version 4097,
content index 0 (`00000012`). Its decrypted `exefs/code.bin` has SHA-256
`b3993f1e4fe5ed7e5760f0f4c3926c95b42ea8de53c25bb95864499342e5b228`.
The analysis mapped file offset zero to ARM address `0x100000`; addresses below
use that mapping. The executable and ROMFS remain private.

## What the source establishes

- `news_LZ.bin` (SHA-256
  `4b4e5bd8b63d0c8859ba10e3daa4ac819b53e0f16ca3e9d4a401c0cdeb819366`)
  decodes to a DARC with 16 `blyt/` layouts and 36 `timg/` entries. The
  `NewsWndwNews_D_00` and `NewsWndwNews_U_00` layouts both have an empty
  `N_IconNew_00` parent pane, size 16 × 16, at local `[3,-3,2]` under
  `N_News_00`. Neither has a child image pane. Their five/four named textures
  contain no unread-dot image. `NewsWndwNews_01`, the separate detail layout,
  has no `N_IconNew_00` pane. The other top-level Notifications DARC archives
  (`common`, `slidebar`, `debug_text`, `hud`, `dialog`, `waiticon` and
  `receivelamp`) contain no member named for an unread marker; that inventory cannot
  rule out a reused texture or executable-generated drawing.
- The executable looks up `N_IconNew_00` in the row setup at `0x178468`,
  `0x17cea4`, and `0x17d80c`. In the setup near `0x178468`, the code first
  calls `0x139520` with an object at row offset `0x1c`, then calls
  `0x139434` with state `1`, and passes a row-owned object at offset `0x24`
  plus the literal pane name to `0x114cfc`. That callee stores a parent
  pointer, sets a flag on the object's member at offset `0x38`, and performs
  a virtual lookup using the pane name. This is stronger evidence of runtime
  attachment than the static layout alone. The follow-up below identifies
  the object's layout and source bytes.
- The other two lookups occur in two-item constructor loops; each passes a
  separate row-owned object to `0x114cfc`. The trace does not establish which
  constructor is active for every list state, or the visibility/update
  condition after a notification is read.
- The current browser painter sets `N_IconNew_00.visible` from a row whose
  fixture value is `New`. This toggles an empty pane and cannot draw the dot.
  The fixture's `read` field establishes browser state only; it is not proof
  of the native executable's read lifecycle.

## First-pass decision, superseded by source resolution

The captured blue-dot pixels are not yet mapped to a pinned ROMFS image,
embedded ExeFS artwork, or a proven native primitive. A crop copied from the
native screenshot would be a reconstruction rather than the source resource.
No dot asset, canvas primitive or attachment override is published here.

To implement this, trace the row-owned object's constructor and draw path
from `0x139520`/`0x139434` and its `0x114cfc` attachment through the active
list constructor. Identify the bitmap/primitive and any colour state, then
prove the unread-to-read visibility transition. Bind that source to
`N_IconNew_00`, render the same captured pose, and compare the marker crop
against the isolated native LCD before an integrated browser recapture. The
gray information badge has a separate proved `special.cic` source and is
already delivered; this audit does not change it.

## Follow-up: receive-lamp layout and native crop

The pointer table at mapped `0x1a6c10`, loaded by `0x139520`, names
`receivelamp_LZ.bin`, `RcvLamp_00.bclyt`, and
`RcvLamp_00_ReceiveBlue/ReceiveGreen/ReceiveGreenBlue/ReceiveOrange` plus
SceneIn/SceneOut animations. This is the row-owned layout helper passed to
`0x114cfc` at the `N_IconNew_00` attachment. The pinned Notifications ROMFS
`receivelamp_LZ.bin` (SHA-256
`293255a901abe9b7e312aee4b0c00785c94db85192b150159b7d0ab8a3f98217`)
contains that layout, all six animations and two textures. The layout has
one `P_Rcv_00` picture and names `RL_00.bclim` (32×32 LA8, SHA-256
`77811c7e73947c5b5c901d7d0b0a302b85fdf8fff26568da2e87cb25969db1be`)
and `RL_01.bclim` (8×8 A8, SHA-256
`e5c29fd385a01384318eb13e7ff50c1e62f673687a5efd700231dcabf59a752e`).
`ReceiveBlue` drives the picture's material colour from `[0,140,220]` at
frame 0 through `[40,180,255]` at frame 60 and back at frame 120. `SceneIn`
raises the picture alpha to 255 by frame 20. Those source resources and the
pane attachment justify a native child-layout draw at the unread anchor.

`publish_notification_receive_lamp.py` decodes the pinned archive through
the existing layout/texture converter, hashes its input, and publishes only
PNG/JSON resources. The delivered pack is
`packs/notifications/contents/0000-00000012/receivelamp.json`; its two
texture entries and six clips retain member-level hashes and title/content
provenance. The browser attaches `RcvLamp_00` to `N_IconNew_00` for fixture
rows marked `New`, using `ReceiveBlue` frame 60 and settled `SceneIn` frame
20. This is a fixed settled pose; native pulse timing and the executable's
read-state update are still unverified.

The source renderer's lower LCD is
`/Users/paramveer/.codex/3ds-artifact-overflow/reference/notifications-unread-marker-20260927/render/notifications-0-bottom.png`
(SHA-256 `e0924075d2505e44c90376c51d810f731280f3a22d247f16d118d120221049bf`).
The isolated native screenshot is
`/Volumes/Codex3DSIsolated/native-home-replay-20260927/screenshots/_27.09.26_13.16.53.105.png`
(SHA-256 `58fff71424e1301e6ead6d7ef9281689faa368bf0e6403dc6dccaef1f9afa389`);
its lower 320×240 LCD begins at full-capture `(40,240)`. On the three visible
unread marker regions, source LCD `(4,83,19,21)`, `(4,136,19,21)` and
`(4,189,19,21)`, the mean absolute RGB errors are 0.118, 0.119 and 0.124,
with **zero pixels above 2/255** in each 399-pixel crop. The first read row
has no marker in both images. This local match supports the source artwork,
attachment and settled colour/position for the captured pose. It is not a
whole-screen browser comparison; remaining Notifications residuals and native
motion/input/audio acceptance remain open.

## Integrated production comparison

After integrating the source receive lamp at `f073581`, a fresh production
browser was driven from HOME through the Notifications toolbar and captured at
raw 400×240 / 320×240 LCD resolution. It was compared with the same isolated
Azahar settled list PNG and browser date/elapsed sample used for the neutral
entry comparison. With an empty mask, upper residual stays **6,239** and
lower residual falls from **5,860 to 3,876** pixels above 2/255. The three
large missing-dot regions disappear. Matrix v99 records paths and hashes at
`/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260927/reference/scenario-matrix/v99/matrix.json`.

The remaining lower scrollbar and footer regions, upper HUD, input timing,
dot pulse timing, motion and audio keep the scenario failing.
