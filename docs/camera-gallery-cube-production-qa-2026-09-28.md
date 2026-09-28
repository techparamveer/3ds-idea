# Camera gallery cube production QA — 28 September 2026

At `4bce94a`, the production browser was driven through HOME → Camera → five
Welcome pages → folder → populated gallery → photo, then back to the gallery.
Both raw 400×240 upper and 320×240 lower LCD pairs were saved:

- Gallery: `/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260928-camera-cube/reference/scenario-matrix/v1/captures/camera-gallery-populated-cube-4bce94a/browser/`
- Photo: `/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260928-camera-cube/reference/scenario-matrix/v1/captures/camera-photo-populated-cube-4bce94a/browser/`

Each directory contains `upper.png`, `lower.png`, and `capture.json`. The
read-only portfolio images were available during both captures. The source
finder's grey `2DView` cube is visible at the upper right in both states.

The native comparator is the upper 400×240 half of
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/scenario-matrix/v1/captures/camera-populated-browse-global/native/combined.png`.
Within the cube ROI `[x=360,y=0,w=40,h=40]`, a foreground mask using native
grayscale `<130` and browser grayscale `>20` has **0.971 intersection over
union** (734 native and 713 browser foreground pixels). The older browser
capture at `camera-browse-message-color-61e2e6f-20260926/browser/upper.png`
has zero pixels above grayscale 20 in that ROI. These thresholds isolate the
dark cube against the native light photo and the grey cube against the browser
black background; the figure measures shape and placement, not colour parity.

The native fixture is a stereo Camera MPO while the browser displays a mono
portfolio JPEG. The raw ROI mean RGB error is 95.99 because their backgrounds
and image framing differ. This production check validates the cube correction
only; the Camera gallery and photo scenarios do not have a whole-screen or
whole-session native pass.
