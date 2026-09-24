# Sound entry room: native source and bounded live renderer

The entry view now requests the original `S_Back_U` model and textures through a
scene-owned lazy renderer. It paints the room after S_BG and before entry chrome.
Playback still uses its existing separate composition; no silent visualiser pose,
audio-driven animation or hidden native menu state is invented.

## Correcting the historical visibility audit

The earlier audit searched for `ldr ..., [owner,#0x8c]` followed by a `#0x1e`
flag change. It conflated two owners and missed conditional writes with smaller
masks. The eight StreetPass classes were real, but did not prove that the global
room was exclusive to them.

- Global `app+0x8c` comes from `0x192030` at `0x1c674c/0x1c6754` and loads
  `res/S--S_Back_U.bcmdl` at `0x191e98`. It begins disabled.
- The `0x272xxx` accesses belong to another owner. `0x27231c` takes that owner's
  +0x8c address; `0x272320` allocates 0xac bytes and `0x272378` constructs a
  **layout** through `0x20bb38`. This is not the global CGFX room object.
- The actual global update is `0x235e00..0x235e80`. It checks app+0x78 flags,
  the app+0x58 host and the app+0x70 mode predicate, then separately sets/clears
  disable bits 8, 4 and 0x10 on the room. Predicate `0x28fcf8` returns true when
  holder+0x254 is null; otherwise it returns the signed byte at child+0xa0.

`scripts/firmware/sound_room_replay.py` executes this exact ARM range with Unicorn,
including the real predicate function, for seven combinations. It preserves
unmanaged bits and records native inputs/outputs in
[evidence/sound-room-replay.json](evidence/sound-room-replay.json). The cases use
raw field values, not guessed native scene names. The settled native entry
capture confirms the room is visible in the portfolio's corresponding main view.
The full visualiser audit was regenerated; its unrelated same-offset matches are
retained explicitly as regression evidence rather than a room restriction.

## Resources, camera and alpha

S.pack entry `S_Back_U.bcmdl.LZ` is independently converted and registered under
`models/sound-room/`. Compressed SHA-256:
`8c7d41fee74034b22bbd39b3a35d24906057f996c9201de51596feb218f504f5`.
Decompressed SHA-256:
`134099e5050c465200be110ed53258c2d81c6bfc43456496bb60b53d69fd27bd`.
It has five meshes, six bones, two materials and no animation clips.
The two textures contain the window/tree and landscape/checkered room.

The loader's `0x191f48` selects camera index zero. The renderer preserves its
embedded Aim/Perspective camera: position (0,5,11.5), target (0,−13,−125),
FOVY 0.759536 radians, aspect 1.63636, near 0.01 and far 1000. No camera angle
was fitted to the screenshot. The website's existing single-eye LCD keeps this
centre camera; native stereo offsets are not reproduced.

Both materials' active RGB combiner is Replace(Texture0), followed by Previous
passes. `lambert1` blends texture alpha using SourceAlpha/OneMinusSourceAlpha.
`lambert2` uses One/Zero for RGB, so its FragmentPrimaryColor-derived **alpha
cannot affect native framebuffer RGB**. The room is the opaque LCD background:
readback copies RGB unchanged and writes Canvas alpha 255. This avoids applying
an irrelevant framebuffer alpha to the LCD a second time. No native lighting
alpha is guessed or changed, and no shared PICA shader behavior is altered.

## Ownership and integration

`src/scene/sound-room.ts` uses the existing `createFirmwareModel`, a 400×240
NoColorSpace target and the console's renderer. It allocates lazily for the
current Sound main owner, rejects stale load completions, caches one static
raster, restores the caller's target/viewport/scissor/clear/tone settings and
disposes GPU resources on leave, failure, retry or teardown. There is no second
WebGL context or animation loop. Required texture/camera/model identity failures
reach the existing explicit recovery path.

`StockModelBackground` is the OS-facing prepare/draw contract, injected through
`createScreens` and `createPortfolioGraphics`. Stock presentation keeps both LCDs
black until layouts **and** room are ready, preserves the existing deadline,
and publishes only complete pairs. Playback releases the room; returning to the
main view requests it again. Failure invalidates the room generation too.
The single Sound painter insertion is immediately after its base background.
Integrators applying this after the entry chrome work should keep that draw order,
then draw record/bird/title/footer layers over the room.

## Verification and remaining gaps

- Seven native visibility replay cases pass, with executable SHA pinned.
- The corrected twelve-model visualiser audit completes with 88 instruction facts.
- Room resource closure/camera/material tests, late-owner/disposal/cached readback,
  renderer restoration, draw ordering, paired readiness, timeout and retry tests
  pass; the existing record tests remain separate.
- TypeScript validation passes. Production build is recorded in the task handoff.
- CPU source-triangle specimen and supplied native upper LCD were visually
  inspected side by side. Using the unoccluded strips y34..103 and y113..170,
  mean absolute RGB error is **5.499/255**, maximum 138. This is evidence of
  source geometry/camera alignment, **not** GPU or strict pixel acceptance.
- Native minification/mipmap/sampling differs visibly in the window/landscape;
  the existing PICA renderer uses the base texture level. Those differences
  remain. The source verifier uses bilinear perspective interpolation and does
  not simulate PICA raster rounding or texture mip levels.
- The coordinator owns final integrated browser/GPU verification. No browser or
  native emulator instance was driven from this worktree.

Artifacts are on the home disk per the explicit SSD-space constraint:
`/Users/paramveer/.codex/artifacts/sound-room-source/render/room-source-native.png`,
`room-cpu-source.png`, `report.json`, and `visualiser-audit/`.

```sh
node scripts/verify-sound-room-source.mjs \
  --model /absolute/public/os/firmware/10.7.0-32E/models/sound-room/model.json \
  --output /absolute/artifacts \
  --native /absolute/native-stacked-lcd.png
```

The script renders only this audited material subset using the production model
transforms and camera. It refuses a different combiner/blend arrangement.
