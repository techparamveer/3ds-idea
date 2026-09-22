# OS, state and input architecture

## Modules

| Module | Responsibility |
| --- | --- |
| `apps.ts` | Portfolio application and entry data |
| `state.ts` | HOME Menu layout, folders, themes and low-level menu types |
| `system.ts` | Boot, HOME, launch, suspend, app, dialog, power and persistence transitions |
| `layout.ts` | Native screen geometry and hit regions |
| `screens.ts` | HOME Menu and system-panel canvas painting |
| `portfolio-screens.ts` | App icons, banners and application interiors |
| `bitmap-font.ts` | Parsed HOME font metrics and glyph drawing |
| `resources.ts` | Validated optional firmware-derived resource loading |
| `native-chrome.ts` | Authored/cropped native chrome asset loading |
| `audio.ts` | Gesture-unlocked sound decoding and playback |
| `animation.ts` | Layout animation sampling utilities |

## Reducer flow

The menu is an explicit state machine. Inputs pass through `reduceSystem`, touch
coordinates through `touchSystem`, and time-dependent phases through
`tickSystem`. Reducers return new state and do not manipulate DOM, canvas,
Three.js or audio directly. External links are emitted as a state effect and
consumed by the scene after the transition.

```text
keyboard / model control / touchscreen / accessible control
                         ↓
                 normalized Input
                         ↓
          reduceSystem or touchSystem
                         ↓
       new state → sound + persistence + paint
```

This single path keeps touch and hardware behavior equivalent and makes the OS
testable in Node without a browser renderer.

## Application lifecycle

The system models cold boot, HOME, launch splash, running software, suspension,
resume, close confirmation, power menu, off and sleep. HOME suspends the current
application rather than discarding its selected item, page or photograph.
Launching a different application while one is suspended requires confirmation.

Persist only user preferences and safe layout data. Restore functions must
validate stored values so corrupt storage cannot hide portfolio content or put
selection outside valid bounds.

## Screen painting

Screens are derived views of state. Paint at native logical sizes, avoid CSS or
DOM UI inside the console, and reuse cached images/icon canvases. Animated
banners may use the small secondary renderer, but every feature requires a flat
fallback for context-constrained browsers.

Firmware resources are optional and provenance-controlled. Do not describe a
procedural or photograph-constrained reconstruction as firmware-rendered.
