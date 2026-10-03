# HOME Density Hold Replay - 3 October 2026

## Result

No runtime change from `f85e1396`; replay checkout `267def52`.
The earlier200ms apparent multi-step observation in
[touch projection](home-touch-projection-2026-10-02.md) does not reproduce:
fresh native stationary2000ms decrease changes six rows to five, remains five
in another own-PNG over10s later, and stationary2000ms increase restores six.
The production browser follows the same released endpoints and remains stable
after four-second waits. No touch-repeat implementation is justified.

Only endpoint behavior is observed natively. Atomic CuaDriver gestures cannot
provide a held-before-release native PNG. Source review establishes enabled
state0 -> Select/state1, and one clamped density step per direct callback
`0x2a3db8`, but not the state1 callback edge, rearm or cadence. Directional20/5
poll-repeat counts do not establish density-touch repeat. The browser remains
release-only/single-shot; this replay does not prove that native activation
also occurs on release.

## Evidence

Private root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-density-hold-20261003`.
`native-input-record.md` records exact native window/coordinates, mute,
isolation, capture order and shutdown. Four fresh Azahar own400x480 PNGs pair
with browser `camera-idle`, `decrease-released`, `decrease-settled` and
`increase-released`. Browser also records two held pairs and settled increase,
seven raw paired LCDs total, with errors[], mute and no native screen failure.
The1150x690 viewport is inspected, nonblank and framed. Holds are at least2s
in the browser; capture overhead extends the hold and exact host durations
are recorded. Neither timing nor animation epochs are matched.

Frozen plan SHA256:
`9222cd1d55a2de4c236b71f07b191ffc7b9286559ad7b3ebf89a2304bf7762a8`.
Pairs use empty masks, channel delta2 and no registration or phase fitting.
The density ROI x266..319/y0..31 has zero pixels above2, maximum2, for all
four endpoints. All eight whole-LCD comparisons fail: upper residuals range
47463..53029 pixels above2, lower9664..15509. Both browser released-to-settled
density crops are byte-identical. Each held crop differs from its idle
baseline by526 pixels above2, but has no native held counterpart.
Coordinator inspected `comparison-sheet.png` and independently rehashed all32
manifest records. Evidence identities:

- `report.json`: `d3c383b3f5fbfaab2c06eceeb251886f3e72b119e688ebe48de24f9f068ba05a`.
- `report.md`: `8b41e0d49344a411d86844830c7bbe0f24e66631b52f857495536ff0bed80487`.
- `comparison-sheet.png`: `c2636911da91b9854cf7c3d63df9c1686683c95fef3d06a8a966b4ae25125aa2`.

No asset is changed or delivered in this slice. The native controls retain
the element-to-manifest/title/version/content/source/SHA/converter mapping in
[density boundary provenance](home-density-boundary-2026-10-03.md#source-identity):
`home.launcher`, title`0004003000009802` v24576, content0/id`00000082`,
RomFS launcher `LncBase_D_01` layout/Select, ctr-native-web1.2.0/CTRTool1.3.0.
The earlier runtime's1940pass/0fail/23skip/1TODO, typecheck/build and103-test
review remain the test evidence; documentation-only replay adds no test claim.

Owned native42722 and browser46251 exit0 and are absent. The isolated config
restores exactly to SHA256
`d2118bc611142e0febb95415bb45487fe83b36c407b6cdad869a01697e92e698`.
Production preview3021 remains HTTP200. Default Azahar, system audio, Spotify,
original ROMs, private matrix and DeveloperStorage artifacts are unchanged.

Whole native1:1 remains fail/unproven. Portfolio content/population/placement,
status, reduced-motion endpoints, fitted lifecycle/source-clock scheduling
and static microphone input remain adaptations. Banner/cursor/background
epochs, native held feedback, exact input/motion and audio remain open.
Next interaction evidence is footer out-and-back re-entry; do not infer a
sticky-cancel defect or redesign existing screens without native observation.
