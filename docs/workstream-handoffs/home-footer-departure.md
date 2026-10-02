# HOME software-close lower departure handoff

Base: `100f2a94d046efe7b2b7a8d9ee4540e2e4f6fb05`

Branch: `codex/home-footer-departure-20261002`

Feature IDs: H-10, L-04

## Superseding native evidence

After the initial source-only delivery, the coordinator captured a clean native
software-close phase at temporary 5% emulator speed. Native own-PNG
`_02.10.26_07.57.33.617.png` (SHA-256
`b43f35f50cd1534592f637117eeba4c374b82659725ea1ae7efb748ad683fd8b`)
shows the source-styled `Closing software...` window and paired LCD scrims. The
Close / Resume footer remains visible beneath the lower scrim. That late sample
shows the empty light upper wallpaper, not the suspended panel. Earlier own-PNG
`_02.10.26_07.57.15.524.png` shows the closing text/window beginning while the
upper suspended panel and footer are still retained. The upper worker's later
source analysis finds fixed panel bounds while the application capture/panel
fades; it does not support a scale-based SceneOut interpretation.

That capture contradicts treating footer/highlight SceneOut as the immediate
software-close presentation. Do **not** apply this handoff's departure pose at
AppQuit start. `home-close-departure.ts` remains a pure, source-valid candidate
for a later departure phase only; the native predicate and epoch are still
unknown. The primary visible correction from this branch is now documented in
`home-software-closing-dialog.md`.

## Browser defect that prompted the source audit

The integrated browser capture
`home-buttons-border/close-after/health-close-sheet.png` under the private
internal-overflow artifact root shows the lower HOME suspended highlight and
Close / Resume footer unchanged throughout Health & Safety software close. The
recorded samples identify `appQuitFrame` 0 at `health-close-00`, frame 12 at
`health-close-06`, and terminal frame 20 at `health-close-10`; both elements
remain fully present in all three. They disappear only at `health-close-11`,
after application ownership has already been removed and HOME has returned to
its Open footer.

The browser capture is missing the newly observed closing dialog and scrims.
Stationary Close / Resume at the beginning of native close is not itself a
defect. Whether the footer or suspended highlight departs later is unresolved
because the clean native evidence does not yet bind those source clips to a
later close phase. No file in the separately owned upper-panel lane is changed
here.

## Delivered pure pose contract

`home-close-departure.ts` selects two exact delivered source poses from the
existing `HomeApplicationTransition.appQuitFrame` clock:

| Existing close frame | Lower suspended highlight | Close / Resume footer |
| --- | --- | --- |
| 0..14 | `LncIconSleep_00_DisAppear` at the same frame | `LncBtmBtn_02_SceneOut` at the same frame |
| 15..20 | `LncIconSleep_00_DisAppear` at the same frame | `LncBtmBtn_02_SceneOut` held at its authored endpoint, frame 14 |
| reduced motion | authored endpoint, frame 20 | authored endpoint, frame 14 |

The selector applies only to the existing `close` intent. It returns no pose
for software switch, completed or absent transitions, and rejects an invalid
controller frame instead of silently clamping unsupported state. It adds no
state, timer, completion rule or second clock. Reduced motion changes only the
presented source pose; the controller's logical close lifetime remains intact.

The clip identities, bounds and endpoint values are source-backed. Binding
their frame zero to the browser's existing AppQuit epoch is a fitted host
composition: this slice did not trace a native caller proving that software
close starts either lower clip on that exact tick. The mapping therefore
remains an explicitly labelled adaptation pending matched native capture or a
native call-site trace. Folder close and software switch are intentionally not
routed through this selector.

## Deferred integration boundary

There is no authorized runtime integration hunk for this departure selector at
the current evidence checkpoint. Do not bind it to AppQuit frame zero, reduced
motion, software-switch SceneOut or folder-close SceneOut. Preserve the helper
and its source-contract tests while the coordinator resolves whether a later
native close phase invokes either clip. Any future integration needs a named
native boundary capture or call-site trace and must retain software switch and
folder close as separate owners.

## Native source and provenance

| Visible element | Manifest / pack key | Decrypted dump source | SHA-256 |
| --- | --- | --- | --- |
| Suspended lower highlight layout | `manifest.home.launcher` -> `packs/home/launcher.json` -> `layouts.LncIconSleep_00` | `romfs/launcher_LZ.bin/blyt/LncIconSleep_00.bclyt` | `7f8b8f7da609e138c0c0c153de0d58aca2c123c8072be6aa847c40fe86153a39` |
| Highlight departure | `animations.LncIconSleep_00_DisAppear`, 21 non-looping frames, source range 220..240, group `G_Scale_00` | `romfs/launcher_LZ.bin/anim/LncIconSleep_00_DisAppear.bclan` | `fdd5ba31f67ae7acdbf8d73f3d1c4501413c21d9006cd0d9008e727c9ba40a39` |
| Footer layout | `layouts.LncBtmBtn_02` | `romfs/launcher_LZ.bin/blyt/LncBtmBtn_02.bclyt` | `1be988eda6f3d2374d8445d0773688fa1c6dd118590cb986d526c0dc4f326a44` |
| Footer departure | `animations.LncBtmBtn_02_SceneOut`, 15 non-looping frames, source range 200..214, group `G_Scene_00` | `romfs/launcher_LZ.bin/anim/LncBtmBtn_02_SceneOut.bclan` | `df95bfcc74135a116fe14b39604cdd1300197e48b2c864989d3b40d35f13cf1d` |

The highlight clip authors `P_Sleep_00` alpha from 255 at frame 0 to 0 at
frame 20. The footer clip authors `N_Scene_00` alpha from 255 to 0 and Y
translation from 0 to -32 between frames 0 and 14.

Transitive identity: pinned EUR 10.7.0-32E HOME Menu title
`0004003000009802` v24576, content index 0 / ID `00000082`; selected decrypted
content SHA-256
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`;
`romfs/launcher_LZ.bin` SHA-256
`826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`;
delivered `launcher.json` SHA-256
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`;
`ctr-native-web` 1.2.0 / CTRTool 1.3.0.

## Verification boundary and remaining gaps

Focused tests read the delivered pack and verify exact clip ranges, groups,
endpoints and resource-source hashes. They also cover normal mapping, endpoint
hold, reduced-motion sampling, close-only ownership, immutability and explicit
failure on invalid controller frames. Type checking and `git diff --check` are
required before handoff.

This worker operated no GUI, browser, Azahar, audio session or production
build. The shared integration is intentionally absent from this commit, so the
captured runtime defect remains until the coordinator applies the hunks and
recaptures. The following remain open:

- the native software-close caller and exact start epoch for both lower clips;
- exact native advancement, terminal-pose publication and paired-LCD timing;
- the upper `LncBase_U_00` departure, owned by the separate upper-panel slice;
- matched native/browser input, motion and audio acceptance for the close
  scenarios.

No matrix entry or strict 1:1 result is claimed by this source-only worker
handoff.
