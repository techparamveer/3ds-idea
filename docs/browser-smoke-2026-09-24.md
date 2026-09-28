# Live browser smoke check — 24 September 2026

Integration `1166c7e`, production `next start` at `http://localhost:3000/`,
Codex in-app browser. These are operated browser scenarios, not matched
native-LCD comparisons or 1:1 acceptance.

| Sequence | Observed result |
| --- | --- |
| eShop welcome → Power → A | Source power-options screens appeared, then both LCDs became dark. Accessibility announced `Powered off. Press Power to turn on.` |
| Power | Startup returned to HOME with Work selected. The last boot-frame duration and native backlight order were not measured. |
| HOME → Camera | The Nintendo DS/Nintendo loading sequence appeared, followed by the read-only folder list. |
| Camera selected folder → A → A | Existing Renu folder opened to one portfolio thumbnail; the selected image opened in the lower photo mount and remained in the upper viewfinder replacement. |
| HOME → Sound (confirm close-software prompt) | Source Sound empty-library screen opened; no song manifest is supplied yet. |

The browser warning/error log was empty after these routes. The Camera
folder-list upper viewfinder is black because the portfolio does not supply
a live camera feed. Its gallery/photo route substitutes existing portfolio
images. The native Camera footer is deliberately replaced with basic
Back/Open navigation under the portfolio scope. Sound playback still needs
user-supplied songs and a live native/player comparison. Power and app-opening
timing remain unverified against Azahar.

Captures are on the SSD under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/live-smoke-2026-09-24/`
as `camera-photo.jpg` and `sound-empty.jpg`.
