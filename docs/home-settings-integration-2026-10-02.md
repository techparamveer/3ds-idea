# HOME Settings Integration

Runtime `e923487da9f84feb3ad32738a256c3aa2206bb31` continues the
[captured missing Save/Load defect](home-design-native-comparison-2026-10-02.md).
This is implemented UI, not whole-scenario native acceptance.

## Delivery

Decoded Petit supplies lower Settings, source text, Theme, Save/Load,
original-hardware brightness, power-saving, close, cursor and scrollbar.
Keyboard/touch share geometry; rail drags retain ownership and no longer hit
browser preferences. Eight local layout slots preserve arrangement/folders,
theme/views without storing runtime/audio/renderer ownership. Load allocates
fresh folder identities. Existing version4 saves remain compatible.

MyMenu source grid/footer/cursor/upper captions render. Empty save is immediate;
overwrite/load/delete reuse source dialog graphics/messages. Confirmation
requires matching pressed/released actions. Selected source failures publish
paired authored website recovery through the existing input gate, with Retry
and HOME escape. Review found and fixed destructive pointer crossing and
unseen-panel input. No native assets were regenerated.

## Evidence

Private root: `/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-design-lower/`.
`summary.json` SHA-256 `f674a984d83ab677f1453520a93ee9c665146fcb52a49ce03555a417ff574334`
records11 named capture JSON/upper/lower hashes, reports, sheets and source
resources. Initial `*-first` captures are dirty intermediate diagnostics;
`*-integrated` captures identify the runtime above. `browser-checks.json`
records inputs, outcomes and captures.

Source-identified/delivered: HOME `0004003000009802` v24576, content0/`00000082`,
converter `ctr-native-web`1.2.0. Manifest keys `home.petit`, `home.MyMenu`,
`home.dialog`, `home.dialogmask`, `home.messages` map through each pack's
`resourceSources` to decrypted CIA-internal paths and SHA-256s. The summary
retains those full mappings, pack hashes, TMD/content identity, English
message/style and shared-font provenance from the pinned dump.

Tested: full1643 pass/0 fail/23 skip/1 TODO; typecheck/build pass; shaders unchanged.
Browser-inspected on Sidecar1800,367,1357,935, Chrome1810,397,1150,780, muted by
launch flag and app state: Settings initial/brightness/power, MyMenu empty/saved,
overwrite/load dialogs and HOME return. System Settings Other page1 is exactly
RGB-identical to the retained browser baseline; both sheets inspected.
Automation's coordinate click on the accessibility shortcut failed to launch
Settings and timed out; a subsequent existing DOM button click launched,
followed by projected Touch230,170. No successful first launch is inferred.
Browser errors were empty.

Native-compared against retained own400x480 PNG
`native-home-design-20261002/screenshots/_02.10.26_02.08.07.154.png`, SHA-256
`e9a87578a05c08e428f4c83669501c5744541c37245df1dcd9b135cbde53d839`:
empty-mask36195 upper/9630 lower pixels >2/255, versus first lower24805 and
prior authored lower61485. Both sheets inspected. Population, selected title,
wallpaper/HUD/cursor phase and inputs differ. No fresh native replay or matched
motion/audio was produced. Whole-scenario status remains **fail**.

## Remaining Work

Adaptations: source backing-mask assembly fitted to captured dimming;88px thumb
and0..140 four-row scroll range; settled cursor/button poses; keyboard auto-scroll;
local storage; generic native-resource confirmation assembly. Original MyMenu
dialog ownership remains unverified. Current/saved LCD thumbnails are hidden
because unavailable; preview zoom is disabled. Later Settings rows are missing.
Theme picker/close-switch remain authored. Portfolio content/population and
offline flows remain intentional adaptations. Native pixels, input, transition
timing and audio remain open. Next: fresh identical Settings inputs in native
and browser, followed by native MyMenu capture and actual thumbnail composition.
