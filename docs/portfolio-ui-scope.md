# Portfolio UI scope — 23 September 2026; clarified 25 September

The user's latest instruction supersedes the earlier complete-firmware behaviour
brief: **remove the software keyboard; remaining stock apps need their UI only**.
Also recreate **power-on, power-off and opening an app**. Preserve the existing
console model, physical opening, background-only page and eight portfolio apps.

Activity Log, Download Play, Mii Maker, StreetPass Mii Plaza, AR Games and Face
Raiders remain excluded. Software Keyboard is now excluded too. Keep the other
existing title identities; internal helpers need no invented HOME entrypoints.

The complete in-scope set is HOME; Settings and internal helpers; Health and
Safety; read-only Camera; Sound UI and supplied-song playback; eShop; Nintendo
Zone; Game Notes; Friends; Notifications; local Internet Browser and Miiverse;
the amiibo helper; power and app transitions; and the eight portfolio apps.
Remote browsing, account/network/PIN operations and capture stay excluded.

The pinned firmware dump is the sole source for **native** visuals and audio.
Every visible native element and native cue requires manifest/dump provenance.
No hand or CSS graphics, community font substitution, or guessed native sound
may be promoted as native. Portfolio content and declared read-only/local
adaptations have their own provenance and must be labelled separately.

**Declared HUD profile adaptation (4 October 2026).** The upper HUD shows
wireless Disabled, 0 Play Coins and the blue battery, because network and
account state are out of scope. The Azahar reference profile shows Internet,
42 coins and an orange battery. Captures diff that HUD band as this labelled
adaptation, not as a renderer defect; native HUD graphics are unchanged.

## Deliverable

- Faithful HOME and stock app screens using supplied native graphics, fonts,
  messages and available animations. Keep the user's visual fidelity standard.
- Basic screen navigation, app open/close and HOME return so visitors can explore
  the UI. Portfolio apps retain their content and working navigation.
- Power-on, power confirmation/shutdown and app-opening screen transitions.
- Camera displays the existing portfolio photo folders/gallery read-only. It
  does not capture or edit photos. Sound plays user-supplied favourite songs
  with the 3DS music UI and working playback controls; this is an explicit
  exception to the other stock apps' UI-only scope.
- No software keyboard or text-entry flows. No camera/microphone permissions,
  media recording/import, network emulation, account operations, editable stock
  profiles or extra stock app functionality are required.

Do not spend further time reconstructing keyboard logic, ARM execution,
hardware audio backends or unused app internals. Previously committed research
is historical; it is not an acceptance dependency. Verify delivered screens
visually in the browser and compare source/reference views. Do not infer visual
accuracy from converter or unit-test success.

## Shared interface

Reuse `AppDescriptor`, `AppView`, `AppModule`, `NativePack`,
`loadNativeTitleAssets` and `createNativeTitleSession`. Do not create another
app state system. App views continue to expose app ID, screen, heading, text,
rows, selection and footer. UI navigation may change screen/selection; stock
modules must not emit device, storage or network operations. The Sound module
may emit owner-scoped music playback effects. Existing portfolio photographs
seed the gallery; the song manifest stays empty until songs are supplied.

The current eight workstreams, separate chats and assigned worktrees are in the
[workstream registry](feature-map/workstreams.md), with the inherited safety
rules in [AGENTS.md](../AGENTS.md) and scope in the [feature map](feature-map.md). This section's
former runtime/assets/presentation task split and model assignment described
the 23 September handoff; it is superseded. Workers report concrete evidence
and remaining visual differences, commit coherent slices, and let the
coordinator integrate sequentially. Preserved keyboard work is not merged.
