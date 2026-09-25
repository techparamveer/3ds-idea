# Visible firmware asset audit — 25 September 2026

This is a public-delivery and source-identity audit at `1bf5178`, not a browser
or matched-native visual comparison. The current UI scope is
[portfolio UI scope](portfolio-ui-scope.md). The manifest authority is
`public/os/firmware/10.7.0-32E/manifest.json`; every key below is relative to
that directory. Each selected pack has a resource record with a delivery hash,
title/content source and source hash. The stock selection plans in
`scripts/firmware/stock-ui-*.json` name its layouts, clips and English labels.

## Published resources for visible screens

| Element | Manifest key or title pack | Decrypted dump source | Live boundary |
| --- | --- | --- | --- |
| HOME background, folder/default banners, chrome, tiles, fonts and audio | `models.homeBackground`, `models.folder`, `models.bannerDefault`; `titles.0004003000009802.packs`, `home`, `fonts` | HOME title `0004003000009802`, plus shared-font title | HOME uses source resources; residual fallback paths below remain |
| Settings main and details | `titles.0004001000022000.packs`, notably `base.json`, `up.json`, `layout.json`, `button.json`, `message_EU.json`, `hud.json` under `packs/settings/contents/0000-0000003d/` | Settings title `0004001000022000`, content `0000003d` | Published and used by stock presentation |
| Settings selected HOME banner | `models.settingsBanner` → `models/settings-banner/model.json` and five manifest-listed images | Settings `exefs/banner.bin`, SHA-256 `5804ba5a7768d2ae9b7487e4d277923502646d89768668b19d666e3e4d30fbac` | **Delivered but not live**: HOME rejects stock selections as unsupported |
| Health and Safety | `titles.0004001000022300.packs` | Health title `0004001000022300` | Source UI; article scrolling and motion need native comparison |
| Camera read-only gallery | `titles.0004001000022400.packs` | Camera title `0004001000022400`, content `0000001a` | Portfolio photos replace device capture; footer is an adaptation |
| Sound and music controls | `titles.0004001000022500.packs`, `models.sound-room` | Sound title `0004001000022500`, content `0000000b` | Published chrome/room; songs await user supply |
| eShop welcome and Nintendo Zone local UI | `titles.0004001000022900.packs`, `titles.0004001000022b00.packs` | eShop `0004001000022900`, Zone `0004001000022b00` | Remote content is outside scope |
| Game Notes, Friends, Notifications | `titles.0004003000009c02.packs`, `titles.0004003000009f02.packs`, `titles.000400300000a002.packs` | Respective title RomFS resources | Source chrome; current empty/local content is adapted |
| Browser and Miiverse local UI | `titles.0004003000009d02.packs`, `titles.000400300000be02.packs` | Respective title RomFS resources | Local read-only interiors; no remote site |
| Settings helpers, selectors and amiibo opening | `titles.0004001000022a00.packs`, `titles.0004001000022f00.packs`, `titles.000400100002c100.packs`, `titles.000400300000b902.packs`, plus applet title packs | Respective title RomFS resources | Internal routes only; amiibo has no HOME entry |
| Eight portfolio applications | HOME stock layout and title metadata where available | HOME title and published SMDH resources | Content and some interior graphics are authored portfolio material |

Camera, Sound, Health and eShop additionally have both `models.<title>BannerCommon`
and `models.<title>BannerEur`, each sourced from that title's `exefs/banner.bin`.
The common model and EUR texture substitution are [audited](stock-2d-banner-boundary.md)
and [published](stock-common-banner-delivery.md), but their title HOME previews
remain dormant. The model JSON delivery hashes are:

| Banner | Common SHA-256 | EUR SHA-256 | Source `banner.bin` SHA-256 |
| --- | --- | --- | --- |
| Camera | `4937b837427e400ef9623d4fab93f27ccfa9952b8c20946f17f6d8b540b7e388` | `ceaf5c44c59874ea5f46fd3cbc38f9ad40dfa620495b3352812c45454149ffb9` | `e4808dcf84e490c73200ee5f9cb2ba72d096c93d6ccdf08d88d733988fd66280` |
| Sound | `401071d4b20ea073d9bc07e582408554605fba9fdc832b5b9737130cf60a3cfa` | `be3b7994a1ae5cd0606644d4797f35fc27e039e3a8ddf8e68c80c1bb5401e0fe` | `fb5ee57657e781fadef6d90261f6eebae185996f82428d60ff439a9d568da3f7` |
| Health | `071c053c3b95d7d0cee1086280a9569b236577fc36833cb73a896f549c77c1fb` | `f25f95686202ea90b8f4724754d2542fa4bc52052d035a43eb38cd783fda2184` | `bb810ecddba00bf196d7f480d8c1c13fc569a707416fded522b78ae5679f0755` |
| eShop | `aa9f70447af84e2789d21f7bc0effac6a9d5c6364fa4df9281b1b92f27a1eeaf` | `a7cbd359ecdcc62afc4f7bc23d7f1a276283877b7ebc15fc842f80e85aa84763` | `c810cc2e10769f26a857bc5edd35acc17cee0372c1f775be02ed407b9e4678de` |

`models.settingsBanner` itself has delivery SHA-256
`908b4dbe6ef22bbf3c47d37e9ed512ea6a37654afd0f1db611f3d4f68c5e93e1`.
It has a complete manifest-listed image set. No additional Settings source
asset is needed to address the blank selected-tile preview: the current
[activation gap](settings-home-banner-activation-gap.md) is in title worker,
scene binding, visible pose and composition.

## Visible non-native or unproven remainder

- `public/os/home-menu.woff2` and three legacy PNG crops are community/web
  reference-derived assets, documented in `public/os/README.md`. They remain
  possible fallbacks in `src/os/screens.ts`; they are not dump provenance.
  The stock painter also has a generic-font fallback when a requested native
  font is unavailable. Their actual visibility in a specific browser scenario
  needs coordinator inspection; do not label those paths native.
- `src/os/stock-screen-presentation.ts` still contains authored fallback
  controls/chrome for a missing native selection. Its normal ready path requests
  selected source layouts. Do not promote fallback pixels to native evidence.
- Portfolio application interiors and portfolio photo/song content are authored
  by design. Camera capture/live view, Sound supplied songs, local Browser and
  Miiverse interiors, NNID unsigned-in notice, fixed telemetry and inert remote
  actions are declared adaptations or source gaps in the [feature map](feature-map.md).
- Zone's common banner model is decoded privately, but mixed animation segments
  block published/live promotion. Its existing local stock screen packs are
  unaffected. The Zone HOME preview remains unaccepted.

## Decision and verification

The highest-impact missing visible asset candidate was the Settings selected
HOME banner. It is already delivered with source identity and image closure, so
this pass publishes **no new firmware resource**. The next fix belongs to the
HOME title banner activation/composition path and its matched pixel gate.

`python3 scripts/firmware/audit.py --report /tmp/3ds-lane-visible-audit-2026-09-25-public.json`
passed: 1,707 resources, 601 layouts, 1,871 animations, zero integrity errors.
There are existing unsupported/unreferenced warnings. `--repository` additionally
flags changed current `scripts/firmware/build.py` and `native.py` hashes against
the historical converter recorded in the manifest; that is a tool-reproduction
warning, not a delivered-file hash failure. The audit did not check private
source bytes. The designated SSD artifact directory refused new writes with
`Invalid argument` while the volume reported 100% capacity, so the JSON report
is in `/tmp`. No browser or Azahar comparison was performed in this asset pass.
