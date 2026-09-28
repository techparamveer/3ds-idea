# HOME Notifications banner pose audit

The pinned EUR HOME executable `code.bin` (SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`)
resolves toolbar focus 3 to category 6. The dispatcher jump table at `0x1d7278`
sends category 6 to `0x1d75e0`, which puts native type **16** in `r0` before
the request setter at `0x1ed6ec`. The resource constructor's type table at
`0x1f9344` sends type 16 to `0x1f9978`; that branch reads the
`BannerAppletNews` name pointer at `0x32ed44`. This confirms the source model
identity and request type. It does not establish the settled yaw, manager scale,
material frame or text-surface binding.

One fresh production browser capture from the isolated branch at the same
`2026-09-28T00:44:00Z` diagnostic clock is byte-identical to the earlier first
visual (SHA-256 `df90572cb3498cc1b969a80639a3abae04eb1459e8df7f992bdcad40e831bd45`).
Against native capture SHA-256
`a161d6e1bbcbd6ecc81a3cf27d23a499627a802b84ce32dd622bc93f4c09cbf3`,
the empty-mask upper count remains **46,756** pixels over 2/255. The named
model crop `(130,35,140,120)` has **8,710** differing pixels, but **6,025**
are outside the union of green model pixels and include the HOME wallpaper.
The green union has 5,469 pixels; 2,685 differ, and its silhouette IoU is
0.631. The native and browser green bounds are `(155,49)–(248,145)` and
`(149,49)–(247,145)`, respectively. Simple translation search over ±8 pixels
peaks at one pixel down with only 0.654 IoU. A single pose cannot distinguish
host transform, animation phase and raster/material behavior.

The source model already authors a 0.5 root scale, 0.95 wrapper scale and
0.349066 radian wrapper rotation. Its only skeletal channel is a 0→2→0 unit
vertical bob across frames 0/149/299, while material clips change texture
coordinates. No additional source transform or phase was established that
would justify changing the browser's captured front pose. No runtime or asset
files changed, and the scenario remains failing. Raw browser upper pixels and
comparison scratch are under
`/Users/paramveer/.codex/3ds-artifact-overflow/presentation/news-banner-pose-20260928/`.
