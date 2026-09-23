# Stock UI runtime and portfolio media

The 23 September 2026 scope removes software keyboard and stock device/account
operations. Camera is a read-only portfolio gallery. Sound is the explicit
exception: favourite-song playback through a host-owned audio transport. The
remaining stock modules expose screens and navigation only.

`app-registry.ts` preserves remaining title IDs and the eight portfolio modules.
Keyboard is unregistered. `stock-apps.ts` does not invoke applets, request browser
devices/network/imports, edit profile data, write notes, mark notifications read,
or emit shared/save operations. Unknown, legacy text, capability and applet-result
events cannot revive those flows. App-host skips firmware save/activity writes;
existing shared records and version-one saves remain readable and untouched.
Portfolio launch/activity/save behavior is retained.

## View and input boundary

`AppView` is unchanged. Presentation and runtime share the current UI adapter's
`stock-screen-layout.ts` hit targets; these are not a native input oracle. Touch
release selects its semantic action. Physical directions follow Camera's three
columns, Notes' four columns and Settings' top bar/four tiles. Other lists use
up/down. A activates, B returns, and left/right browses photos or tracks. Notes accept navigation but
never draw new strokes. Power, HOME and app-open transitions belong to System.

| Title | Screen | Rows/actions and view data |
| --- | --- | --- |
| Settings | main | internet, parental, data, other, nnid |
| Settings | other | profile, clock, sound, language, transfer, update |
| Settings | profile | nickname, birthday; open read-only detail with data.field |
| Settings | data | photos, sounds, miis, notes; counts from preserved shared data |
| Camera / Camera applet | main | folder:&lt;id&gt;; data.folders |
| Camera / Camera applet | gallery | photo:&lt;id&gt;; data.folderId, data.photos |
| Camera / Camera applet | photo | previous, next, back; data.photo |
| Sound | main | track:&lt;id&gt;; data.tracks |
| Sound | playback | play, previous, next, seek, repeat, shuffle; data.track plus state below |
| Health | main → document | 3d/general/usage; data.topic, data.page and data.pageCount; next/previous bounded to shared article counts |
| Manual | main → document | topic chosen from rows; data.topic, data.page=0 |
| Notes / Memo | main → drawing | 16 note slots; data.slot, data.strokes from existing saved notes |
| Friends | main → profile/friend | existing cards and read-only details |
| Notifications | main → notification | existing title/message; no read-state mutation |
| Browser | main → bookmarks/history/settings | existing lists; no URL entry or network request |
| Services/helpers | main → detail | selected existing menu row; no simulated operation |

Health uses the native article labels 3D Display Precautions, General
Precautions and Usage Precautions. Shared `stock-health-layout.ts` defines
12/44/27 pages at eight source lines each; this is the explicit portfolio
pagination adapter, not native continuous scrolling. Left/right moves a page;
B always returns to the article menu. Footer Previous/Next becomes Back on the
first page and Done on the final page.

Settings transfer/update/NNID rows request navigation to their existing titles.
Library helpers can close/return; error OK completes its existing caller. Other
stock rows do not synthesize result values or saved changes.

## Media manifest

`portfolio-media.ts` exports `portfolioMedia: PortfolioMedia`, with:

- folders: `{id,title,photos:[{id,title,src,thumbnail?}]}`
- tracks: `{id,title,src,artist?,album?,artwork?,duration?}`

Gallery entries derive from `apps.ts`: five unique existing portfolio image URLs
in three folders, retaining entry titles and deduplicating shared Renu/HackUK
images. The production track array is empty pending user-supplied songs. Test
tracks are fixtures only. The module accepts an injected manifest for tests;
media never enters the shared save store.

## Music transport contract

State/view data: `trackId`, `track`, `playing`, `position`/`duration` in seconds,
`repeat: 'off'|'all'|'one'`, `shuffle`, `revision`, and optional `mediaError`.
All music effects include `{type:'music',command,trackId,revision}`. Load also
contains `src` and `position`; play also includes both so a released audio
element can be recreated at the paused position. Seek contains `position`. Selecting a track emits
ordered load then play with one revision. Paused next/previous emits load only.
Every load/play/pause/seek increments revision, including lifecycle pauses.

Host reports existing action events:

- music-time: value `{trackId,revision,position,duration?}`
- music-ended / music-error: value `{trackId,revision}`

Host must scope delivery to the originating owner and current transport revision.
The reducer also rejects stale track/revision and paused completions. Deliver
music-error for play failures. Do not derive playhead position from tick events.
Seek clamps to known duration. Natural end stops at the last track when repeat
is off, wraps for repeat-all and reloads the same track for repeat-one. Manual
next/previous wraps; shuffle uses a deterministic ID-derived permutation without
skipping/repeating tracks within a traversal. This queue is a browser behavior,
not a claim about native firmware randomization.

HOME, power suspension, sleep and close emit pause with a fresh revision. Resume
stays paused. App-host permits pause through its closing guard and still emits
release-capabilities for each removed/suspended owner; the transport must dispose
on owner removal/release. Old queued load/play must not start a closed owner.

## Validation and remaining integration

Focused tests cover registry exclusions, saved-data preservation, portfolio
suspension, nested applet return, generic host stale capability guards, all stock
menu traversal, read-only notes/gallery, shared hit targets and music routing.
TypeScript checks pass. Root owns audio element wiring and combined browser
verification; presentation owns native art/layout painting. Unit tests establish
runtime behavior, not visual fidelity. No firmware execution, browser or Azahar
was used for this slice.

## Integrated browser transport

`portfolio-music.ts` owns one foreground HTMLAudioElement. The runtime effect
consumer validates owner, track and revision before starting playback or
accepting callbacks. HOME, sleep and close release the element; later explicit
Play reloads the track at the saved position. Console volume/mute apply to music.
Replacing tracks invalidates old event handlers and rejected play promises.
Focused fake-audio tests cover progress, seek, release, resume and stale callbacks.
Production audio still awaits user tracks; no browser playback success is claimed
from the empty library or from the fake-audio tests.

On 23 September, the integrated localhost browser was visually checked with the
actual Camera folders/photos and Sound empty-library screen on the console.
Camera/Sound chrome is currently adapted, pending original gallery/player assets.
Settings and remaining native compositions need further visual verification.
