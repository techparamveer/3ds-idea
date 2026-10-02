# Browser LCD capture for matched firmware scenarios

For projected physical/touch replay, read `data-targets` after the actual
viewport has rendered. Runtime `a751b2dd` refreshes these coordinates on resize,
including same-aspect size changes. Earlier captures that reused a desktop
target after mobile resize can contain out-of-viewport input; a nonblank LCD
does not make that input valid. Validate target bounds and resulting state.
The [resize investigation](home-touch-projection-2026-10-02.md) separates this
diagnostic bug from unchanged real raycast/UV input.

The console scene paints the upper LCD into a **400×240** source canvas and
the lower LCD into a **320×240** canvas. The upper source is then stretched to
an 800×240 texture for the Three.js display plane. `captureScreensAt` encodes
the two source canvases directly as PNG data URLs. It never reads a resized
browser/page screenshot or the stretched display texture.

Set `LCD_CAPTURE_OUTPUT_ROOT` to the absolute private artifact root when
starting the local production server, and bind that server to loopback. For
example, after `npm run build`:

```sh
LCD_CAPTURE_OUTPUT_ROOT=/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E ./node_modules/.bin/next start --hostname 127.0.0.1
```

Then open a URL such as
`http://localhost:3000/?lcdCapture=1&lcdScenario=home-idle&lcdElapsedMs=8483.333333333334&lcdDate=2026-09-25T10%3A52%3A00Z`.
The hook is attached to
`.console-stage` after scene startup. It is absent on non-loopback production
hosts and on loopback production without the query parameter. It adds no
visible controls. In development it remains available without the parameter.

For computer-use tools that cannot read custom DOM properties, press
**Control–Shift–L** after reaching the state, or activate the accessibility
button named **Download LCD capture**. The page posts the capture to a local
verification route, which writes `capture.json`, `upper.png` and `lower.png`
under `reference/scenario-matrix/v1/captures/<scenario>/browser/` inside the
selected root. `capture.json` contains `schema`, `scenario`,
`elapsedMs`, `date`, state diagnostics, `dimensions`, and the `top` and `bottom`
PNG data URLs. The route requires the server environment variable, a loopback
request URL, matching loopback Origin and the `lcdCapture=1` query. It is
unavailable on ordinary production hosts. The page announces the saved path
and sets `data-lcd-capture-status="saved"` and `data-lcd-capture-path` on the
host; failed writes set `data-lcd-capture-error`. `lcdElapsedMs` and `lcdDate` are required for this path; the
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

For the selected Settings HOME banner, append `lcdBannerFrame=150` (or another
integer from 0 through 599) to the opt-in URL and give the sample a distinct
`lcdScenario`, such as `home-settings-frame150`. The same accessibility button
or shortcut then saves a **synthetic source-pose sample**. It applies the
firmware-traced 600-count HOME yaw and the Settings `COMMON` skeletal frame
only while painting that capture, reports the pose as `bannerSample` in
`capture.json`, and immediately restores live painting. The setting requires
an active Settings HOME selection; it does not set or advance the HOME host
clock. Frame samples are diagnostic brackets, not matched native timing
evidence. Omit `lcdBannerFrame` for an ordinary live-pose capture.

The route preserves the exact JSON payload and extracts the two PNGs from its
data URLs. Record their SHA-256s. The first
two target pairs are:

- `.../reference/scenario-matrix/v1/captures/home-idle/browser/upper.png`
  and `lower.png`, paired with the `native/` directory beside it.
- `.../reference/scenario-matrix/v1/captures/settings-other-page1/browser/upper.png`
  and `lower.png`, paired with its sibling `native/` directory.

The artifact root represented by `...` is
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E`.
The local fixture in `tests/lcd-capture.test.mjs` decodes both returned PNGs,
checks their dimensions and source pixels, and rejects an 800×240 upper canvas.

For the bounded Settings relative-clock diagnostic, append
`lcdBannerSkeletalFrame=302` alongside `lcdBannerFrame=304`. The independent
COMMON sample requires loopback, an active Settings selection and integer
frames0–599. It is available only through the existing gated capture hook;
ordinary drawing keeps the live clocks. `bannerSample` records yaw counter304,
`skeletalFrame:302` and `clockRelationship:"independent-diagnostic"`. Both
capture overrides are cleared in `finally`, including after failed encoding.
This diagnostic does not assert a native clock offset. Omit the parameter for
the original coupled-frame capture. Keep the existing elapsed time, date and
HUD97 query when comparing against the frame304 control.
