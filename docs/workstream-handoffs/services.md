# Local services handoff — 1 October 2026

Bounded task for O-01–O-07. Base: `f5ed204c7955880d59b097a632d48deaa7d80252`.
Branch: `codex/complete-services-20261001`; worktree:
`/Users/paramveer/.codex/worktrees/3ds-complete-services-20261001`.
Delivery is the commit containing this handoff (exact SHA in the chat report).
Only this file and [services-completion-routes.test.mjs](../../tests/services-completion-routes.test.mjs)
changed. No runtime, asset, shared coordinator document or private matrix change.

## Delivered and tested

Six additional module/input contract tests cover:

- O-04: every exposed Browser start destination through action, command, physical
  button event and shared touch target; all Back forms restore the start row.
- O-05: all eight Settings options reached through input across both pages,
  leaf Back restores option/page, then Back restores Settings on the start menu;
  a continuous start → Bookmarks → second saved entry → Back → Back route.
- O-03: Zone Search and Information retain separate `data.field` values through
  action, command, button and touch, and local Back precedes HOME. No assertion
  says their pictures should be equal or declares either native result correct.
- O-06: Miiverse toolbar input, local return and root close, with no post/account
  effects. No interior content or native offline outcome is invented.
- O-01/O-02/O-07: root HOME/close effect boundaries, including internal helper
  registration without HOME entries. Direct helper construction is a unit-test
  fixture, not evidence of a production caller.
- Pure local navigation emits no effects and does not mutate input/shared data.
  Saved-page submit/edit/text/applet-result events remain inert; no page loads.

Existing [stock-app tests](../../tests/stock-apps.test.mjs) already cover read-only
Browser fields, settings details and constructed History state; existing
[eShop lifecycle tests](../../tests/eshop-welcome-lifecycle.test.mjs) cover the
pass-12 OK gate, welcome/exit timing, owner suspension and paired repainting.
Those cases were reused rather than copied. eShop has no touch Back target;
its immediate return route uses B, and its touch OK follows the existing gate.

Actual focused checks, Node v22.23.2:

```sh
cd /Users/paramveer/.codex/worktrees/3ds-complete-services-20261001
/Users/paramveer/.local/bin/node --test --test-reporter=spec tests/services-completion-routes.test.mjs tests/stock-apps.test.mjs tests/stock-screen-layout.test.mjs
```

Result: **78 passed, 0 failed** (6 new + 46 stock + 26 layout).
The unchanged eShop lifecycle suite separately passed **7/7** using the same
Node executable and the coordinator's TypeScript installation read-only:

```sh
NODE_PATH=/Users/paramveer/.codex/worktrees/3ds-home-fidelity-20261001/node_modules /Users/paramveer/.local/bin/node --experimental-loader='data:text/javascript,export async function resolve(s,c,n){return n(s === "typescript" ? "file:///Users/paramveer/.codex/worktrees/3ds-home-fidelity-20261001/node_modules/typescript/lib/typescript.js" : s,c)}' --test --test-reporter=spec tests/eshop-welcome-lifecycle.test.mjs
```

The inline loader only resolves the existing suite's bare `typescript` import;
it changes no dependency files. Node printed its experimental-loader warning.
No installs, full suite, typecheck, build, GUI, screenshots or audio were run.
Full integrated checks remain coordinator-owned. Relative links and
`git diff --check` pass.

## Repro ticket: zone-offline-search-info-back (O-03)

**Current code observation:** create `nintendo-zone` with `initialSharedData()`
and `{now:0}`; main rows are `scan`, `information`. Reducing `action:scan` yields
`{screen:'detail',selection:0,field:'scan'}`; separately reducing
`action:information` yields the same shape with `field:'information'`.
[drawZone](../../src/os/stock-native-services.ts) branches only on
`view.screen === 'main'`: both details draw `zone-pages/no-content` at `(0,0)`
and `zone-pages/info-top-frame-0` at `(0,20)`. It never reads `data.field`.
This is a source-level rendering collapse, not a verified native equivalence.
Back reaches main; another B emits HOME.

**Source identity:** EUR Zone `0004001000022b00`, version **1034**, content
index **0**, ID **0000000d**. Manifest key
`packs/nintendo-zone/local-html-images.json`, pack SHA-256
`ef6835a9de8357ce651bd061c542f045ad62014061e824792146e72a124a7788`.
The selection records `ctr-native-web` **1.4.0**; additive bitmap conversion
records Pillow RGBA→PNG without resizing, script SHA-256
`c1c7f54f5b1571d2387b47bc71b183be19eea414b27bb88a26bf91d3ca5ae01e`
(no separate bitmap converter version is recorded).

| Element / texture key | CIA-internal resource beneath RomFS | Source SHA-256 |
| --- | --- | --- |
| Main lower / `offline` | `www/included_html/offline_mode/OFFLINE_EU/en/offline_mode.gif` | `4c02961ac8aa3fb57e483820fec5ca229baf152890864116e8a57d437206205c` |
| Current detail lower / `no-content` | `www/included_html/boss_page/BOSS_EU/en/images/no_content.gif` | `a084cfc0125205ad5cc320b554dbf489a9e9d35a0ea02f40f4027e04d7ba7cf0` |
| Current detail upper / `info-top-frame-0` | `www/included_html/boss_page/BOSS_EU/shared_images/top_screen.mpo`, decoded frame 0 | `055c51b81c13d4605ba65aeda604aebbe94581fbcc5ab12166ce86de2e5a855a` |

[Source HTML and geometry](../native-zone-local-pages.md) distinguish
`zone_beaconscan` at `(29,30,262,86)` from the
`nzv:info_top,nzv:info` link at `(29,136,262,36)`.
The offline upper uses `www-included_html-3dbanner_EU-nwcla.json/U_top`;
`layout-nwcx.json/Hud_00,bottommenu_l` supplies chrome. Their complete source
hashes remain in manifest/resourceSources; no new extraction was performed.
The bitmap mapping alone does not establish the Search outcome.

**Requested capture:** isolated original-hardware EUR English profile, no remote
connection/account activity, muted on verified Sidecar. Begin on settled Zone
main after a recorded HOME launch. Record both LCDs before input, tap Search
at lower `(160,73)`, capture immediate and settled outcome, B, capture returned
main; then tap Information `(160,154)`, capture immediate and settled outcome,
B, capture main, B, capture HOME. Record press/release and elapsed times.
If the native route requests enabling connectivity, stop at that boundary and
record it; do not enable networking or assume its eventual result. Do not
force a detail screen into existence in native state.

**Decision needed:** match native Search versus Info resource ownership and Back
behavior, including whether Search remains on main or opens a local dialog.
Then change only `drawZone`'s detail selection, plus the Zone action branch in
`stock-apps.ts` if source evidence requires a different state. The latter needs
an explicit coordinator reservation; none is requested or edited in this slice.

## Repro ticket: browser-settings-bookmark-roundtrip (O-04/O-05)

**Current code observation:** Browser starts with `search`, `bookmarks`,
`add-bookmark`, `settings`, `page-info`, `address`. `action:history` from main
returns the identical state because the row guard rejects it. The
[Browser helper](../../src/os/stock-browser-navigation.ts) and
[web painter](../../src/os/stock-native-web.ts) support `screen:'history'`, and
existing tests construct that state directly. No main row enters it. Those
constructed tests do not prove reachability. The gap is documented here without
adding a test that requires History to remain unreachable.

**Source identity:** EUR Browser `0004003000009d02`, version **9232**, content
index **0**, ID **0000001f**, `ctr-native-web` **1.3.1**. Pack prefix
`packs/browser/contents/0000-0000001f/`.
`layout-start-dialog-StartDialog.json` SHA-256
`a1d9834fcf7f942e6540ee7ab70d4cdf577ac6dcd0bc992ed1edec68b9430f01`
maps `StartDialog` to `layout/start/dialog/StartDialog.arc/blyt/StartDialog.bclyt`,
SHA-256 `284e78263d4088eb8370407cb81a4ce56fc5a86fafb47fcc0042754030ac8f41`.
`messages-and-loose.json/spider` maps to
`RomFS/message/EU_English/spider.msbt`, SHA-256
`7479893d766ff394a23c73cf2a29e4317bbba263bf6987eba45f9e5e42a41f9f`.
Relevant delivered components include `start-dialog-{FavoriteButton,OptionButton}`,
`favorite-{Container,Item,EmptyMessage}`, `option-item-{1Button,2Button}`,
`browse-pageinfo-{PageInfoDialog,PageInfoItem}` and `toolbar-ExitButton`.
Their mapping and assembly limits are described in
[Browser interiors](../native-browser-miiverse-interiors.md). No inspected
source establishes where a native History control belongs.

**Requested capture:** start Browser from the recorded HOME toolbar/caller,
using the isolated offline profile and its actual saved URL/bookmarks/history.
Record that local seed before replay. Begin at the visible start menu; capture
both LCDs and all menu controls. Production touch sequence: Settings `(59,181)`
→ first read-only Text Wrap detail → B → seven discrete Down inputs (Version/
Network/etc. rows cross the four-row viewport) → Clear All Save Data *information
preview only* → B → B → Bookmarks `(88,132)` → selected saved entry → B → B
→ root B. The test exercises each Settings row independently as well.

Native replay must follow only observed read-only counterparts: capture the
Settings menu and explanation without toggling preferences, confirming deletion,
loading a remote bookmark, invoking a keyboard or creating an account. For
bookmarks, capture the list and a source-established read-only information
route if one exists; never activate a bookmark if that would load a remote page.
If native has no equivalent local preview, record that step as an adaptation
boundary rather than claiming matched inputs. If the isolated list is empty,
record its empty state; the two `*.example.invalid` test fixtures are local
module fixtures, not fabricated native data. A populated native pair requires
an already available read-only seed, not new remote browsing or bookmark writes.
Capture any actual History/menu affordance without assuming one exists.

**Decision needed:** establish the native local entrypoint (or document that the
portfolio's History state remains intentionally unreachable). Only then reserve
a narrow Browser row/target/painter change through the coordinator; do not add
an invented History button to complete the map.

## Capture artifact contract and remaining gaps

For each ticket above, coordinator stores Azahar's own 400×480 PNG and raw
production 400×240 upper / 320×240 lower PNGs under the internal artifact root,
with ticket/step names, input/clock provenance and SHA-256s. Begin with empty
masks, explain any adaptation mask separately, diff named pairs and inspect the
side-by-side sheets. No capture pair, mask or diff report was produced here;
none of the O-01–O-07 whole scenarios gains acceptance. Motion and audio remain
open, and all sessions must remain muted.

Evidence tiers: source-identified **existing code/resources only**; delivered
**six tests and two repro/capture tickets**; runtime implemented **unchanged**;
tested **85 focused passes**; browser-inspected **not performed**;
native-compared **not performed**. The initial test-only eShop touch-Back
assumption failed and was removed after checking its source target list; the
final focused runs above pass.

Remaining non-native/adapted items: Browser read-only search/address assembly,
local explanatory details/saved-address preview; Miiverse empty interior,
manual mounts/selection and suppressed toolbar text; Zone HUD title/clock epoch,
footer mode and unresolved Search/Info dispatch. See the
[Miiverse source gap](../miiverse-empty-interior-source-gap.md) and
[service screen trace](../native-service-screen-trace.md). No new graphics,
sounds, helper caller or Miiverse content were introduced. eShop still needs
HOME-launched welcome comparison; `mint` and `miiverse-post` still lack established
production callers and native presentation. Their capture tickets require a
real caller first (`eshop-mint-information-back`,
`miiverse-post-information-close`), not an invented HOME entry.
