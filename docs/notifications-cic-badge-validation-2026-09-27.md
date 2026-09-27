# Notifications CIC badge validation — 27 September 2026

Base: `79fac24`. The pinned EUR 10.7.0-32E Notifications applet
(`000400300000a002`, version 4097, content index 0 / `00000012`) contains
RomFS `special.cic` (SHA-256
`5e9170611dc93467c2e6b35fb71ed4f77ec387635eadea104ca5779fc4c3120f`).
The file is 5,760 bytes: 1,152 zero bytes for a 24×24 plane, then 4,608
bytes of 48×48 RGB565 texels. The latter use 8×8 Morton tiles and little
endian pixels. `scripts/firmware/decode_cic.py` version 1 rejects other shapes
and publishes the RGBA8 image as `textures/notifications-special-cic.png`.
Its converter SHA-256 is recorded in the manifest resource entry.

The decoded `special.cic` shows a gray circled information mark on a white
rounded square. The same image is byte-identical in the pinned HOME ROMFS.
`default.cic` (SHA-256
`510745458468c84f3afc17fb33a6560e7464a5a6d1df2ffc087ef6a863479eb1`)
decodes by the same rule to a gray question mark and is byte-identical in the
pinned Friends and HOME ROMFS. Only `special.cic` matches the native
Notifications list icons.

The isolated native Notifications list capture is
`/Volumes/Codex3DSIsolated/native-home-replay-20260927/screenshots/_27.09.26_12.12.20.627.png`
(SHA-256 `d9bd30ef373ce06bcc1a041ea9b3f15a9ffbf8d0d97798fe1a7d98e11e0d8591`).
On its first row, the native 40×40 icon crop starts at full-capture `(48,273)`.
The decoded source image, bilinear-scaled to 40×40, reaches mean RGB error
2.16 at this position; the decoded default question mark's best nearby error
is 32.71. With `special.cic` bound to `NewsWndwNews_D_00/P_Icon_00` texture
slot 0, the source layout render's crop `(8,33,40,40)` differs from the
corresponding native crop by mean RGB 0.121 and **zero pixels over 2/255**.
This proves the rendered first-row badge pixels and binding for the captured
pose. It does not establish the native executable's selection rule for other
notification types or list states.

The delivered pack retains `special.cic` as an explicit selected texture with
the pinned RomFS source path/hash. The existing 40×40 pane, UVs, second texture
map, shadow and placement remain source layout data. The runtime binds the new
texture to slot 0 for the isolated profile's list rows. No private firmware
package or database bytes are delivered. The blue unread dot, scrollbar, row
fit, upper HUD, transitions, input route and audio are still unresolved. The
whole Notifications scenario remains failing until a matched integrated
browser/native recapture.

Focused verification: `verify-native-personal-tools.mjs --title
notifications-list` produced both 400×240 and 320×240 source renders with no
diagnostics. The delivery audit reported `ok: true` with zero errors. This
source render and icon crop are not a whole-screen browser comparison.
