# Coordinator Acceptance Queue

This is a work queue, not a replacement for the private evidence matrix and not
a claim that these scenarios pass. Use the [completion map](../feature-map.md)
and detailed lane feature IDs. The coordinator alone operates the native and
production-browser sessions. All sessions remain muted on verified Sidecar.

## First Cross-App Pass

| Order | Named scenario | Required observation | Owner of correction |
| --- | --- | --- | --- |
| 1 | `baseline-home-idle` | Reproducible HOME entry, both LCDs, selection/density/theme/clock/population explicitly recorded | HOME |
| 2 | `baseline-settings-other-page1` | HOME selected Settings -> Open -> Other page1; both LCDs and prior static-match regression | Settings + Lifecycle |
| 3 | `life-portfolio-open-back-home-resume` | Work list -> detail -> Back -> HOME -> Resume, same content/selection retained | Lifecycle + Portfolio |
| 4 | `life-close-cancel-confirm` | Suspended Work -> Close -> Cancel; then Close -> Confirm; correct HOME and no stale frame | Lifecycle |
| 5 | `life-switch-cancel-confirm` | Work suspended -> different app -> cancel switch; repeat and confirm; outgoing owner cleaned up | Lifecycle + destination app |
| 6 | `life-helper-return` | Settings page3 -> Transfer -> Back; page4 -> Update -> Cancel; exact calling page/focus restored | Settings + Lifecycle |
| 7 | `life-loading-failure-retry-return` | Controlled missing selected resource -> explicit failure -> Retry or HOME; paired LCD publication, no substitute screen | Lifecycle |
| 8 | `life-sleep-power-cycle` | Lid sleep/wake; power menu Cancel; Off -> On; startup selection/focus and no stale app owners | Lifecycle + Portfolio |
| 9 | `home-background-live-phase` | Newly integrated host clock, selection-independent phase, repeat capture without advancing; raw native comparison pending | HOME |

These routes cover global correctness before repeatedly polishing one isolated
banner. Native and browser must receive matching applicable inputs for native
acceptance. The portfolio content itself is an adaptation, not a native app.
Failure injection is a browser resilience test and has no native visual claim.

2 October browser smoke progress is [recorded separately](../completion-routes-2026-10-02.md):
Work launch/HOME/close/cancel/confirm and Health HOME/resume have named raw LCDs;
Camera photo Back now has captured physical and touch defects plus scoped fixes.
This does not mark any queue row native-complete. H-12 native Health suspension
is the next window-composition reference, alongside the two baseline regressions.

## App Coverage Ledger

For every row, track entry/main, every mapped submenu and dialog, Back/Cancel,
HOME/resume where supported, close and switch. First-run and populated/empty
states are separate scenarios, not alternate labels for one screenshot.

| App group | Minimum scenario families beyond shared lifecycle |
| --- | --- |
| Settings | Main; Internet/Connection read-only screens; Data/3DS/DSi/empty-list/blocked-user/StreetPass UI; Other pages1-4; Profile/DS profile; Date/Time; Language scroll/drag; Sound; Parental notice; NNID; Transfer; Update |
| Manual | No-manual fallback policy; source Contents; article start/middle/end; scrollbar/touch/back; return to caller |
| Health | Entry; each of3 topics; first/middle/end scroll; key and touch; article Back; HOME return |
| amiibo/helpers | amiibo main and mapped notices; source-backed selector/error/helper frames actually reachable; explicit N/A for uncalled internal helpers |
| Camera | All5 guide pages; folder list; empty/populated six-cell browse; previous/next/drag strip; photo; read-only chrome; applet route; caller return |
| Sound | All3 guide pages; entry/Record & Edit UI; empty library; supplied-song library; transport/seek/mode/track-end/error; suspend/close cleanup |
| Notes | Initial guide/grid; each occupied/empty note state; editor tools/erase/colors/size where supported; suspended-screen capture/view switch; save/Back; return |
| Friends | Own-card/empty/populated local list; source no-network/error counterpart; return; no account/registration actions |
| Notifications | Empty and9-item source list; unread/read indicators; first/middle/last scroll; supported detail policy; return; no invented source body |
| eShop | First welcome/question; enabled/default choices; wait/service-offline; exit/cancel; helper distinction |
| Zone | Entry/no-location-information; read-only information route; exit |
| Browser | Local start/page/back/forward; bookmarks/history/menu/settings routes actually supported; empty states; safe return; no remote web or keyboard |
| Miiverse | Source entry/header/toolbars; each supported local route; source-gap body/notice explicitly recorded; post helper/return; no login/account/network |
| Portfolio | Work, Projects, Hobbies, Life, HackUK, NVIDIA, About, Contact: every entry/detail/page/photo, cross-app route, outbound action policy, back/resume/close |
| Console | Original XL/spin/opening; all physical buttons and touchscreen; desktop/mobile fit; resize/reduced motion; input focus/accessibility; teardown/retry |

The detailed maps distinguish implemented from missing or intentionally inert
items. This ledger does not mandate invented actions for a UI-only stock app.

## Evidence Ticket

For each capture ticket record: feature/scenario ID; runtime commit; native
profile/config/title/resource identity; exact starting state; key/touch holds and
frame boundaries; upper400x240/lower320x240 PNG paths and hashes; Azahar own
400x480 PNG/hash; any mask with reason; diff/report/contact-sheet hashes; visual
inspection; input/motion/audio status; remaining defect and assigned chat.

Existing static pixel matches must be rerun when shared drawing changes affect
them. Missing user songs and the requested mute policy remain explicit inputs
to the queue. They do not stop unrelated work, and they do not lower acceptance.
