# Notifications unread marker source trace — 27 September 2026

Base: `e3c3ec6`. This is a bounded source audit of the blue dots visible in
the isolated EUR 10.7.0-32E Notifications list. It makes no browser visual
change. The pinned Notifications applet is `000400300000a002`, version 4097,
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
  attachment than the static layout alone, but the attached object's render
  content and source bytes are not identified.
- The other two lookups occur in two-item constructor loops; each passes a
  separate row-owned object to `0x114cfc`. The trace does not establish which
  constructor is active for the captured list, the draw call or texture used
  by that object, or its visibility/update condition after a notification is
  read.
- The current browser painter sets `N_IconNew_00.visible` from a row whose
  fixture value is `New`. This toggles an empty pane and cannot draw the dot.
  The fixture's `read` field establishes browser state only; it is not proof
  of the native executable's read lifecycle.

## Decision and next proof

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
