# Native folder-close integration

Normal Back now keeps the folder context while its source reverse folder and
capture clips run. Setup applies frames16/8 at shared update C; the normal
visible root returns at C+18. An explicit type13 clear owns the banner request
until root selection is ready. If a browser tick spans that boundary, the scene
installs the restored request at the recorded count, then consumes remaining
updates. Delayed rendering cannot postpone the request to the end of the batch.

The pure controller and System adapter are described in
[the System contract](home-folder-close-system.md). The offscreen-root duration10
remains a named defensive policy while native acceleration ownership is unknown.
Native lower/upper task ordering and exact wall-clock cadence remain unverified.

## Source drawing and sound

The painter samples applied frames, without advancing them. Decoded folder
FadeIn and capture Fade run backward; the normal cursor is hidden and the footer
uses its decoded SceneOut frame. Native child reparenting attaches ordinary tiles
to N_Dlg_00 and vacancies to N_BlankAnime_00. NativeLayoutRenderer.withPaneParent
carries the source ancestor transforms and InfluenceAlpha chain into each child's
primary color before TEV evaluation. Canvas portfolio artwork receives the same
inherited transform/alpha. See the [overlay trace](../scripts/firmware/FOLDER_CLOSE_OVERLAY_EVIDENCE.md).
Root footer reentry and exceptional overlays remain outside this bounded close
implementation. Balloon metadata/lifecycle coverage is incomplete; there is no
new blanket hide rule.

Reduced motion holds settled folder/capture/tile/footer poses during the counted
transition, hides the cursor, and switches context at the same logical endpoint.
This is an intentional accessibility policy, not a native animation claim.

Action sounds compare post-clock-advance state with the result of the action.
Close plays once when a new generation/transition identity begins. Cancellation
and later root restoration do not replay it. An Open action after a delayed
close completion still plays folder-open. Child slot changes now emit the
existing select cue, whose actual archive name is SE_CTR_HOME_ICON_SELECT,
ID0100002c. [Original ARM evidence](../scripts/firmware/home_audio_CHILD_SELECTION_EVIDENCE.md)
proves that occupied and vacant child movement share that route. Invalid-range
and toolbar-focus cues and their event mapping are not implemented by this change.

## Verification and known rendering cost

Focused close/System/banner boundary, action sound, native renderer and actual
layout tests pass (52 tests, no skips); type checking passes. Tests compare
single-step and large-batch banner outcomes, cancellation and source pane alpha,
including ordinary vs blank child inheritance and scoped restoration after errors.

SSD artifacts under the firmware root's reference/ include:

- browser-close-live.json and browser-close-live-summary.json: actual accessible
  Back, retained source count and restored active folder banner. Screenshot work
  skipped most intermediate frames, so these are not matched animation captures.
- browser-close-performance.json: a second real input run with RAF observations
  and no screenshot calls still found a907ms close task and repeated100ms-plus
  native paints. The visible transition is therefore not accepted as smooth.
- close-render.cpuprofile and close-render-profile-summary.json: Chrome trace on
  actual ANGLE Metal/Apple M2. Cursor rasterization dominates native drawing;
  upper-base uncommon blending is another recurring cost.
- browser-default-mobile-reduced.png and browser-default-reduced-stability.json:
  fully framed390x844 console, stable upper/lower pixels across77 logical updates,
  and no browser errors. This precedes the directional-light correction.

The default lighting correction is source-proven and integrated separately.
Matched explicit before/after samples are browser-light-sign-before/after-*.png
and their JSON companions. Corrected default ink is blue/green/orange on shaded
translucent cubes, consistent with the native home-folder-open-a.png reference.
Native and browser animation phases are not matched, and the post-reload folder
sample omitted its dynamic label during boot; these captures establish the color
correction, not complete pixel parity. Float16 light packing remains a precision
gap. Complete close-frame comparison and renderer performance work remain open.
