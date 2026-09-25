# Browser LCD capture for matched firmware scenarios

The console scene paints the upper LCD into a **400×240** source canvas and
the lower LCD into a **320×240** canvas. The upper source is then stretched to
an 800×240 texture for the Three.js display plane. `captureScreensAt` encodes
the two source canvases directly as PNG data URLs. It never reads a resized
browser/page screenshot or the stretched display texture.

On the coordinator's local production build, open a URL such as
`http://localhost:3000/?lcdCapture=1&lcdScenario=home-idle&lcdElapsedMs=8483.333333333334&lcdDate=2026-09-25T10%3A52%3A00Z`.
The hook is attached to
`.console-stage` after scene startup. It is absent on non-loopback production
hosts and on loopback production without the query parameter. It adds no
visible controls. In development it remains available without the parameter.

For computer-use tools that cannot read custom DOM properties, press
**Control–Shift–L** after reaching the state, or activate the accessibility
button named **Download LCD capture**. The browser downloads one
`home-idle.json` file (named by `lcdScenario`) containing `schema`, `scenario`,
`elapsedMs`, `date`, state diagnostics, `dimensions`, and the `top` and `bottom`
PNG data URLs. `lcdElapsedMs` and `lcdDate` are required for this path; the
scenario name may contain lowercase letters, digits and hyphens. An invalid
query reports an accessibility announcement and `data-lcd-capture-error` on
the console host. The shortcut and button exist only when the hook is enabled.

After using the real site controls to reach a scenario, sample its LCDs:

```js
const host = document.querySelector('.console-stage');
const frame = host.captureScreensAt(509 * 1000 / 60, '2026-09-25T10:52:00Z');
// frame.top and frame.bottom are data:image/png;base64,...
// frame.dimensions = {top:{width:400,height:240},bottom:{width:320,height:240}}
```

`elapsedMs` is the presentation time from scene startup; the ISO date fixes
HUD clock painting. The call validates both values, paints the current software
state at those values, encodes both raw canvases, and restores live painting in
`finally`. It does not advance input, software state, effects or HOME's counted
clock. The result also includes the sampled time, date, HOME update count,
cursor diagnostic and banner host view. Use exact same entry state and inputs
on Azahar; this hook alone is only a browser presentation sample.

Extract each data URL's base64 payload from the downloaded JSON as a PNG and
record its SHA-256. The first
two target pairs are:

- `.../reference/scenario-matrix/v1/captures/home-idle/browser/upper.png`
  and `lower.png`, paired with the `native/` directory beside it.
- `.../reference/scenario-matrix/v1/captures/settings-other-page1/browser/upper.png`
  and `lower.png`, paired with its sibling `native/` directory.

The artifact root represented by `...` is
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E`.
The local fixture in `tests/lcd-capture.test.mjs` decodes both returned PNGs,
checks their dimensions and source pixels, and rejects an 800×240 upper canvas.
