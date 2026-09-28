# Camera upper stereo verification fit — 28 September 2026

The `P_FinderVS_U` layout supplies the 400×240 browse frame, not a photo plane or
sampling mode. The EUR Camera executable path audited in
`camera-photo-fit-source-audit.md` uses mode 2 and a 40-pixel margin for an
eligible stereo MPO. At 640×480, `max(480/640,240/480)` is 0.75. Its Nintendo
note supplies −44.553070068359375 horizontal parallax; the source rectangle
predicted from that value is `[8.78026,80,542.11359,400]`.

The browser now accepts explicit `verificationStereo` metadata on a Camera
photo and clips the enlarged image to the upper LCD. This field is for private
MPO fixtures; ordinary portfolio JPEGs omit it and retain native mono contain
with no upscaling. The website does not ship the private HNI photograph or MPO.

An offline raw LCD comparison using the original HNI_0002.JPG bytes and the
preserved native upper yields 3.338 RGB MAE and 37,008 pixels over 2/255 for
the predicted crop (Pillow bicubic). The existing browser capture was 63.476
and 75,080 respectively. A centered stereo crop without the note's offset was
29.531 and 62,107. This supports the executable mapping.

The isolated live browser capture at
`/Users/paramveer/.codex/3ds-artifact-overflow/camera-upper-stereo-capture/reference/scenario-matrix/v1/captures/camera-upper-stereo-20260928/browser/upper.png`
uses the same HNI fixture with explicit MPO metadata. Its raw upper comparison
falls to **16.482 RGB MAE and 44,703 pixels over 2/255**. The previous live
browser capture had 63.476 and 75,080. Browser sampling and source chrome,
including dark side edges absent from the predicted image, remain unresolved;
whole-scenario acceptance still fails.
