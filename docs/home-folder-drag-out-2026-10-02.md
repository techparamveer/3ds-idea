# HOME folder-child drag through Back

## Outcome

Holding an already lifted folder child over the open-folder Back tab now exits
to the retained root HOME view without ending the pointer stroke. The same
source and pickup owner remain active, the pointer is immediately resolved
against the root grid, and release uses the existing atomic `moveHomeItem`
path. An occupied root target swaps the displaced app into the child's former
folder slot; an empty target moves the child and leaves the folder record
intact. Cancel, a stale source or an invalid release restores the original
folder navigation and clears every transient pickup/capture owner.

The exit deadline is an explicit portfolio adaptation. It reuses the existing
unmeasured `HOME_GESTURE_TIMING.folderHoverMs` value of 500 ms; this slice does
not claim a decoded native drag-out timer. The Back rectangle itself remains
source-backed as documented in [the folder input note](home-folder-input.md).

## Captured defect and native endpoint

The immutable baseline comparison is under:

`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-pickup-held-20261002/comparison/`

It compares a drag from Health folder child 2 at `(244,137)` to Back at
`(59,54)`, over 10 seconds and 100 steps. At browser commit
`d8f6cd7dfc50e18e214a3f26dc097debfd84c916`, release incorrectly remained in
the folder with child 2 selected and the pickup cleared. The native settled
endpoint returned to root HOME, removed Health from its folder slot and
selected it near `(62,54)`.

| Evidence | SHA-256 |
| --- | --- |
| Baseline manifest `baseline-manifest-d8f6cd7d.json` | `f84cf27b23181980fffde2e6ac5eb1741f1bfea7b0124887c21dd3112e4b01bb` |
| Baseline report `baseline-report-d8f6cd7d.json` | `df67bc4c783ffa6b39edc29a06d12adcf4891eec01cafbbc4cb6b09874a1e805` |
| Browser result `browser-before/result.json` | `862e27324ebc23e4c71f645c42be1ef4310e7abe9c95b10ece66cbbc52f254ad` |
| Browser released lower LCD | `e9d9772759b9382ce3dd42b5b01cc10b878ce9f932af05347459f9dcb407c515` |
| Native settled root own-PNG `_02.10.26_20.04.47.635.png` | `cb7f18a6aeecf03511ef108ac563421315e96c732fcfbf94848600aa5be2469e` |
| Settled endpoint sheet | `02c577a342bb64fbb0b146ea6e23587de34a450ce9b9d47e9a9e2da9f1a5bca8` |

The baseline uses raw paired LCDs, threshold 2, an empty mask, no offset and no
fit. Its status is `fail`: the before endpoints match semantically, while the
after-release menu and placement do not. The native attempts are settled
frames, not native held-pose evidence. The coordinator captured and inspected
these inputs; this worker did not operate Azahar or the production browser.

## Implementation contract

`home-gestures.ts` represents Back hover with a private negative sentinel in
the existing `hoverFolder`/`hoverSince` clock; real folder slots are
non-negative. Reaching the adapted deadline calls the established
`leaveHomeFolder`, retains the gesture source, item, pointer and root viewport,
then reruns root hit testing at the unchanged pointer. It does not commit a
layout change until pointer-up. Moving away before the deadline clears the
candidate and starts a fresh deadline on re-entry. The earlier immediate
drag-out route outside the folder content band remains unchanged.

`home-controls.ts` narrowly retains native stationary-pickup ownership when
that exact, still-current source is carried from a non-null folder to the root
view. This guard also covers the scene's outer context reconciler, which runs
around tick reducers and would otherwise apply the ordinary container reset.
The guard requires the prior drag to have an armed Back hover, an unchanged
pointer identity/position, and a position inside Back and the folder content
band. On that one later-tick transition, departed folder input, cursor
presentation, widgets and tile poses are rebased to root while the live stroke
point and independent pickup controller continue. The older immediate exit
outside the folder content band retains its generic reset. Other context
changes, cancel, stale source and completed drop still release the owner.
Gesture state remains in the existing HOME navigation model; no parallel app
state or renderer recognizer was added.

## Source mapping

The pinned source is EUR HOME title `0004003000009802`, version 24576, content
index 0 / content ID `00000082`. Its CIA SHA-256 is
`2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`,
decrypted `code.bin` is
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`,
and `launcher_LZ.bin` is
`826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`.
Conversion remains `ctr-native-web` 1.2.0 with CTRTool 1.3.0; the delivered
launcher pack SHA-256 is
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`.

| Visible role | Manifest key and decrypted member | SHA-256 |
| --- | --- | --- |
| Open folder and Back tab | `layouts.LncFolder_00` → `launcher_LZ.bin/blyt/LncFolder_00.bclyt` | `9581b9f24f79646159ee161e589fd62b92edd7b55dd5e0e2b2f1db6980fb6a24` |
| Settled folder pose | `animations.LncFolder_00_FadeIn` → `launcher_LZ.bin/anim/LncFolder_00_FadeIn.bclan` | `0cc21b182087829e94470dbd171a2c0af5d61118668eeb9a550b70e74cdecfda` |
| Folder selection pose | `animations.LncFolder_00_Select` → `launcher_LZ.bin/anim/LncFolder_00_Select.bclan` | `69b1e0c444c116ec93e65c9fbbdef8182490a5366338fd2eaa38890b1ffedabd` |
| Ordinary pickup shell | `layouts.LncIconPickUp_00` → `launcher_LZ.bin/blyt/LncIconPickUp_00.bclyt` | `6ec30917cd9ed047ce5e9937a4e776456696a265490fc5267cda5960f6341ca2` |
| Pickup scale | `animations.LncIconPickUp_00_Scale` → `launcher_LZ.bin/anim/LncIconPickUp_00_Scale.bclan` | `c4138973ce034f02f6e5049f945f3a69446f40a9b95d60ef3d0c4481d0343cce` |
| Pickup blank | `layouts.LncIconPickUpBlank_00` → `launcher_LZ.bin/blyt/LncIconPickUpBlank_00.bclyt` | `87ed044fca821a0f9adc98e9ab7c4367ccea1ac02d22d04b2ee4c89fee2de1ca` |
| Pickup blank scale | `animations.LncIconPickUpBlank_00_Scale` → `launcher_LZ.bin/anim/LncIconPickUpBlank_00_Scale.bclan` | `d4f4523ac19b8c780b899ff4eafc248ea23ca87940d7ec2221643a10acd57cc0` |

The decoded `Bounding_00` and ARM hit test establish the inclusive Back bounds
`x23…95, y43…65`. Existing pickup evidence establishes stationary entry and
mode 14 through H22. It does **not** establish movement, release, drop,
folder-hover behavior or the 500 ms deadline. The captured native endpoint
establishes the visible settled drag-out result, not its exact intermediate
animation, cadence or audio.

## Verification and remaining boundary

The focused HOME run covers gesture, tile-touch System, folder input and
identity, presentation, pickup presentation, cursor-loop and saved-layout
suites: 96 tests, 95 passed, 0 failed and one optional Canvas test skipped.
New assertions cover deadline/reset behavior, retained pointer/source/viewport
and pickup owner, occupied-root swap, empty-root move, app conservation, cancel,
stale source and capture cleanup. They also exercise the production context
wrapper across the exit deadline and additional held ticks, checking that the
pickup survives while departed folder widgets and poses do not. A separate
regression proves the pre-existing immediate folder-band exit still uses the
generic control reset. `npm run typecheck` also passes.

This worker made no browser or native capture. Coordinator integration must
repeat the identical drag path, record held and released browser states, compare
the settled native/browser endpoints, and rerun affected HOME scenarios. Until
that recapture, the whole scenario remains `fail`; native held animation,
exact exit timing, release motion and audio parity remain open. The portfolio
root contains all eight apps while the native reference has a vacant compared
slot, so that population difference remains an explicit adaptation and does not
excuse any unrelated native residual.
