# Camera identical-photo verification fixture

The isolated Azahar SDMC has two visible Camera photos, `HNI_0001.JPG` and
`HNI_0002.JPG`, in `DCIM/100NIN03`. The production browser Camera uses five
distinct portfolio photos. Comparing those populated galleries directly mixes
input-image and rendering differences.

For a local comparison, point the verification server at the **private SDMC
root**, then open the opt-in page:

```sh
CAMERA_FIXTURE_SDMC_ROOT=/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/user/sdmc \
LCD_CAPTURE_OUTPUT_ROOT=/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E \
npm run start:verify
```

Open `http://127.0.0.1:3000/?cameraFixture=hni&lcdCapture=1`. The Camera and
Camera applet show exactly two items in the `View Photos/Videos` folder, in
numeric order. Their image URLs serve the original JPG bytes from the private
SDMC; no reference image is copied into `public/` or committed. The endpoint
requires a loopback request from the opted-in page and the explicit absolute
SDMC root. All other apps and the normal Camera route retain portfolio media.

The opt-in HNI records carry the JPG EXIF capture time `2026:09:25 22:19`.
The gallery inserts the source orange date-group cell before the two photos,
prints `25/09` and `2026` through `P_BrwsFld`'s `TxtThmb` pane and bundled
`cbf_std.bcfnt`, and starts selection on `HNI_0001`. One Right press selects
`HNI_0002`, matching the populated native capture. Production portfolio
photos have no capture date and receive no dated cell.

On 28 September the raw 320×240 lower LCD at
`/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260928/reference/scenario-matrix/v1/captures/camera-identical-hni-date/browser/lower.png`
had 11,718 pixels differing by more than 2 RGB levels from the native
`camera-populated-browse-global` lower crop, down from the earlier 13,509.
The remaining difference includes source button states and date-tile details;
this is an improvement, not a fidelity acceptance.

The browser's existing `captureScreensAt` hook is available on
`document.querySelector('[role=application]')` when `lcdCapture=1`. It returns
raw 400×240 upper and 320×240 lower LCD PNG data URLs; see
`docs/browser-lcd-capture.md` for the save path. Capture both gallery LCDs
after the same input sequence and compare against fresh Azahar raw LCDs.

The HNI JPGs are the first mono frames of the native MPOs. The native upper
LCD may still use MPO stereo/parallax or Camera fit state; identical JPG bytes
alone do not establish visual acceptance.
