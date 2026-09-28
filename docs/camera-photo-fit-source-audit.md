# Camera mono/stereo photo fit — 26 September 2026

This source audit supersedes the provisional centered-cover recommendation in
[camera-upper-photo-framing](camera-upper-photo-framing.md). Native mono JPEGs
are contained. The compared native fixture is a stereo MPO with baked capture
processing and parallax metadata, while the portfolio supplies the original
mono JPEG. Applying the fixture's stereo crop to every portfolio photograph
would be incorrect.

## Executable evidence

Pinned EUR Camera title `0004001000022400`, content index 0 / `0000001a`,
ExeFS `code.bin`, SHA-256
`3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`,
ARM base `0x100000`. [Replay script](../scripts/replay_camera_photo_fit.py)
executes the original `0x210230` instructions without intercepts or patches;
[nine-case result](evidence/camera-photo-fit-replay.json) is reproducible with
the private executable and Unicorn 2.1.4.

`0x210230` receives decoded width/height, original width/height, mode, stereo
flag and floating margin. It uses the stereo branch only when the flag is set,
mode is 1 or 2, original width ≥480, height ≥240, and width ≤2×height.

- **Mono/ineligible:** `min(1,400/decodedWidth,240/decodedHeight)`.
- **Eligible stereo:** `max((400+2×margin)/decodedWidth,240/decodedHeight)`.
  The comparisons also return 1 where both limits coincide with the input.

Browse image binding `0x284b54` obtains decoded dimensions from the image
record and original dimensions from image `+0x140/+0x144`. Its eligible stereo
branch calls the fit routine at `0x284c70` with mode 2 and **40-pixel margin**,
loaded at `0x284c50` from literal `0x284f1c`. A 640×480 stereo fixture therefore
uses scale **0.75**, while a 640×480 mono image uses **0.5**. The original
2000×1500 mono portfolio photograph uses **0.16**, rendering **320×240**.

The metadata read is independently visible: `0x20b00c` gets the Nintendo
64-byte note and loads its float at `+0x28`, accepting finite values and
otherwise returning 0. Decode completion `0x2ef184–0x2ef188` stores that float
at image `+0x13c`. `0x210200` scales it by decoded/original width before browse
binding consumes it. Thus the stereo horizontal adjustment has a metadata
source; it is not an arbitrary visual-fit constant.

## Read-only fixture examination

The isolated `reference/user/config/qt-config.ini` selects the `image` camera
engine for all cameras, with flip 0 and the continuation worktree's Renu JPEG.
That configured file and the integration portfolio JPEG are both 2000×1500,
SHA-256 `6f58eb909c20907c56179dbf35f39024057f62e203503973eccbf3918b3de5a0`.

The three isolated `DCIM/100NIN03/HNI_000*.JPG` files are 640×480, Nintendo 3DS
EXIF software `00204`; their MPO partners each contain two 640×480 frames.
For `HNI_0002`, frame 0 decodes identically to the JPG; frame 1 differs. All
three MPO Nintendo notes contain **−44.553070068359375** at `3DS1+0x28`.
`HNI_0002.MPO` SHA-256 is
`c9529ed29ec5ae988180c5f0cdb7bb6508db5d8a5872e0517acf5b79eb5b2c37`.
No fixture or capture pixels are shipped in the website.

Numerical image registration against the preserved native upper approximately
selects `[8.75,80,541.5,400]` from the first decoded 640×480 photo. The source
scale predicts a 533⅓×320 source crop; centering and the recorded parallax
predict x=`(640−533⅓)/2−44.55307` = **8.78026**, y=**80**. This agrees with
the fitted geometry. The horizontal sign and full sampling pipeline remain a
capture-supported inference, not a replay of the final GPU writer. The native
3D indicator and edge appearance also still require their own correction.

The original JPEG → DCIM photo is itself transformed. Approximate registration
selects `[274.75,91.25,1999.75,1384]` from the original for the first DCIM frame.
This is measured evidence, **not runtime crop metadata**. The earlier note's
attribution of that crop to Azahar's image engine alone was premature:
[Azahar ProcessImage](https://github.com/azahar-emu/azahar/blob/master/src/citra_qt/camera/camera_util.cpp)
uses centered aspect-preserving expansion followed by crop; at matching 4:3
aspect this introduces no crop. Its [resolution setter](https://github.com/azahar-emu/azahar/blob/master/src/citra_qt/camera/qt_camera_base.cpp)
uses the requested width/height, and the [still-image provider](https://github.com/azahar-emu/azahar/blob/master/src/citra_qt/camera/still_image_camera.cpp)
returns the configured image. Those current upstream files support a pipeline
hypothesis; the exact installed emulator revision and firmware capture transform
have not been replayed. Do not attribute all baked framing to one stage.

## Runtime correction and acceptance

The provisional cover option is removed. Camera upper requests `camera-mono`:
contain with no upscaling, following the native non-stereo branch. Other media
callers retain their pre-existing contain behavior. There is no stereo runtime
path because portfolio records contain no MPO frames or parallax metadata.
This avoids presenting the native fixture's −44.55 shift and 40-pixel stereo
margin as properties of the user's JPEG.

The native/source renderer remains responsible for all chrome, with its existing
provenance. No screenshot is an asset, and no capture/edit/import UI is added.
Compared against the existing mismatched MPO fixture, upper numerical error
will increase relative to provisional cover even though the mono fit now follows
the executable. The coordinator must compare equivalent mono/stereo media and
fit state before judging image pixels. Native framing should not be fabricated
to make this mismatched pair score better. §5.5 remains open.

All 98 focused Camera painter, preparation, target and stock reducer tests pass;
`npm run typecheck` and `npm run build` pass. Nine original-ARM arithmetic cases
pass, covering mono 4:3/portrait/small images and stereo eligibility boundaries.
No Azahar or browser was driven from this lane.
