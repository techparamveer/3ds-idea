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

Portfolio content should remain concise and factual. Native crops, original
sounds, authored reconstruction and unavailable firmware assets must be labeled
honestly in provenance documents. Never infer achievements, measurements,
factory fonts or firmware extraction that the evidence does not establish.
