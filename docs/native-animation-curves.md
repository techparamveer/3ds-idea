# Original animation curve and color submission arithmetic

`sampleNativeTrack` now follows the original NintendoWare float32 Hermite
sampler, including its operation order and strict0.001 key-boundary interval.
Pane alpha and vertex-color animation channels now receive the native CLVC
byte conversion before the renderer consumes them. Previously they retained
fractional values. Material CLMC conversion already rounded and clamped bytes.

## Original-code evidence

The keyboard's sampler141f2c..14209f is byte-identical to HOME209cd0..209e43.
Its372-byte hash is
`181f5281cb182644e947eea70a171e0547bf5e624616347d36a8f32588cc37f3`.
`scripts/firmware/native_animation_curves.py` pins both executable hashes and
executes both original functions under Unicorn against the source key bytes.
There are no callback or arithmetic stubs. Synthetic memory holds the original
key arrays, animation object and destination pane/material objects. Execution
allowlists and instruction limits reject unexpected branches; original image
bytes must remain unchanged. This does not boot firmware or execute services.

The numeric fixture covers223 distinct curves and3665 frame samples from four
keyboard upper/lower opening/closing clips, four QWERTY clips and five HOME
clips. It includes half frames, exact keys and offsets on both sides of the
native snapping interval. All HOME and keyboard float words agree. The fixture
contains derived numeric values and resource hashes, not original executable
bytes. It is checked directly by the TypeScript tests without private inputs.

A second replay executes the actual original pane and material application
functions: keyboard175a68/175cf4 and HOME1a137c/1a1608. It supplies original pai1
sections and content indices, then observes destination memory. CLVC calls the
original pane-byte setter1767e4/1a2074; CLMC calls179340/209c90. All34 paired
applications agree, including32 keyboard fade checkpoints and two HOME
regressions. The fake pane vtable connects to the original alpha-byte setter;
no native virtual call is replaced with a JavaScript/Python calculation.

## Behavior corrected

The sampler rounds each VFP operation to float32. VMLA/VMLS round their multiply
before addition/subtraction; replacing this with double precision or fused
arithmetic changes results. The original reciprocal/delta polynomial order is
retained. Exact outside endpoints clamp to their stored values. Near an interior
key, a strict interval around that key returns its stored value, or the next
value when the next key shares that frame. This also preserves signed zero.

CLVC adds float32 0.5, converts to an unsigned32-bit value, then writes its low
byte. CLMC additionally clamps the rounded value to0..255. These are different
source operations. Runtime overrides remain explicit caller values; this change
only affects animation submissions.

The original-code checks reproduced four incorrect earlier expectations:

- FolderInT's authored constant key retains negative zero.
- Cursor effect DisAppear10 writes alpha21, not20.99600076675415.
- Folder FadeIn8 writes159 to N_Dlg and59 to N_BlankAnime; attachment inheritance
  consumes these bytes rather than fractional curve outputs.
- Tile Select/Decide at frame0.999999 already use the outgoing value because
  this is inside the original key-boundary interval.

The pre-fix regression fails against the original outputs. The corrected
sampler matches every recorded float word and the34 native submissions. The
focused HOME regression passes27 tests. The broader suite passes994 tests with
15 optional-environment skips. A separate real-Canvas/share-binding run passes
39 checks without skips. Logs and private evidence are under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/keyboard-transition/`.

Reproduce with the private Unicorn research Python runtime and explicit paths:

```sh
PYTHONPATH=scripts python -B scripts/firmware/native_animation_curves.py \
  --keyboard-code "$KEYBOARD_CODE" --home-code "$HOME_CODE" \
  --members "$KEYBOARD_MEMBERS" --home-animations "$HOME_ANIMATIONS" \
  --output "$CURVE_ARTIFACT_DIR/replayed.json" \
  --golden tests/fixtures/native-animation-curves.json
```

The code paths prove local curve sampling and color writes, not controller
cadence, retained capture lifetime, native world matrices or complete rendered
pixels. Primary-alpha inheritance during matrix calculation remains a separate
rounding boundary. Browser reconnection/screenshot attempts timed out during
this pass; no fresh browser or native-LCD fidelity claim follows from these
checks. Keyboard transition capture/underlay integration remains unfinished.
