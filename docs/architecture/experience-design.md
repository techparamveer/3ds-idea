# Experience design architecture

## Product frame

The console is the page. The neutral background, lighting and framing support
inspection; they must not become a separate website interface. Portfolio copy,
navigation and feedback belong on the simulated screens or physical controls.

## Visual hierarchy

1. The hardware silhouette and silver/black material separation establish the
   product identity.
2. The opening animation reveals the two displays and controls.
3. The upper display provides context, banners and application content.
4. The lower touchscreen carries selection and direct manipulation.
5. Physical controls provide equivalent navigation and tactile feedback.

Hardware fidelity and HOME Menu fidelity are separate evidence tracks. Correct
dimensions do not prove silhouette fidelity; a correct texture filename does
not prove visible material fidelity; a generic font does not prove Nintendo
lettering.

## Responsive behavior

Initial framing keeps the whole console visible across portrait and landscape.
The camera adapts field of view to the animated model bounds. Pinch and wheel
zoom are deliberate reading modes and may crop the shell after user input.
Touch gestures operate on the scene without allowing page overscroll.

## Accessibility

- The stage is keyboard focusable and describes all primary controls.
- Hidden semantic buttons expose direction, action, HOME, power and preferences.
- An `aria-live` announcement summarizes meaningful OS state changes.
- Keyboard and accessible buttons use the same reducer inputs as physical hits.
- `prefers-reduced-motion` skips the decorative intro and removes continuous
  screen animation while retaining interaction.
- The static fallback has useful alternative text and an explicit retry action.

The hidden semantic layer is an input adapter, not a second visible interface.

## Content and authenticity

Portfolio content should remain concise and factual. Every visible native
screen element and native sound must resolve to the pinned firmware dump through
the manifest. Hand/CSS graphics, community fonts and guessed sounds cannot
stand in for native material. Label portfolio media, deliberate adaptations
and unavailable resources honestly. Never infer achievements, measurements,
factory fonts or firmware extraction that the evidence does not establish.

## HOME defects and acceptance scenarios

At `92fc4d9`, Settings has a provisional selected HOME banner path; other
stock previews remain unsupported. The Settings pose and all stock selected
states still need raw production-browser LCD capture, matched Azahar capture,
per-LCD diff and side-by-side inspection. Test selected tile, upper context,
A action and accessibility announcement together. Correct lower artwork alone
does not complete the selection experience. See the
[activation contract](runtime-composition.md#home-banner-ownership-and-activation)
and [verification loop](verification.md).

The Miiverse → power off → power on → A stale-toolbar regression was corrected
and browser-inspected: A opens selected Work. Keep that sequence in HOME
regression coverage, along with rapid folder → stock → folder retargeting,
launch → HOME return, sleep/wake and toolbar/grid focus changes. Remaining
HOME motion, audio timing, indicators and complete native-screen composition
are unaccepted; use the [feature map](../feature-map.md) for current ownership.
Do not place engineering status or fidelity notices outside the console.
