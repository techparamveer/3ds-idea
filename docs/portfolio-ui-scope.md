# Portfolio UI scope — 23 September 2026

The user's latest instruction supersedes the earlier complete-firmware behaviour
brief: **remove the software keyboard; remaining stock apps need their UI only**.
Also recreate **power-on, power-off and opening an app**. Preserve the existing
console model, physical opening, background-only page and eight portfolio apps.

Activity Log, Download Play, Mii Maker, StreetPass Mii Plaza, AR Games and Face
Raiders remain excluded. Software Keyboard is now excluded too. Keep the other
existing title identities; internal helpers need no invented HOME entrypoints.

## Deliverable

- Faithful HOME and stock app screens using supplied native graphics, fonts,
  messages and available animations. Keep the user's visual fidelity standard.
- Basic screen navigation, app open/close and HOME return so visitors can explore
  the UI. Portfolio apps retain their content and working navigation.
- Power-on, power confirmation/shutdown and app-opening screen transitions.
- No software keyboard or text-entry flows. No camera/microphone permissions,
  media recording/import, network emulation, account operations, editable stock
  profiles or extra stock app functionality are required.

Do not spend further time reconstructing keyboard logic, ARM execution,
hardware audio backends or unused app internals. Previously committed research
is historical; it is not an acceptance dependency. Verify delivered screens
visually in the browser and compare source/reference views. Do not infer visual
accuracy from converter or unit-test success.

## Shared interface and ownership

Reuse `AppDescriptor`, `AppView`, `AppModule`, `NativePack`,
`loadNativeTitleAssets` and `createNativeTitleSession`. Do not create another
app state system. App views continue to expose app ID, screen, heading, text,
rows, selection and footer. UI navigation may change screen/selection; stock
modules must not emit device, storage or network operations.

- **Runtime task:** `app-registry.ts`, `stock-apps.ts`, related app-host changes
  if necessary and their tests. Remove registered keyboard and all keyboard
  invocation paths, simplify stock apps to UI navigation, preserve portfolio
  modules and shared saved-data compatibility. Do not edit `system.ts`,
  `state.ts`, `screens.ts`, `portfolio-screens.ts` or scene files.
- **Assets task:** select/convert native stock initial-screen resources and
  messages, publish narrowly required packs with existing manifest/provenance
  rules, and send exact pack/layout/animation identities to presentation.
  Prioritize Settings, Camera, Sound, Health and Safety, then toolbar apps and
  remaining service/helper screens. Preserve verified HOME delivery. No further
  keyboard/audio behavioural reconstruction.
- **Presentation task:** new stock-screen presentation modules plus
  `portfolio-screens.ts` application rendering only. Replace generic four-row
  placeholders with per-app native UI, consuming asset task's explicit packs.
  Own async stock-view asset/session handling behind this boundary, using the
  existing lifecycle helper. Preserve portfolio content. Do not edit the
  `overlay` function's launch/power/boot branches; coordinator owns those.
- **Coordinator:** `system.ts`, `state.ts`, `screens.ts`, scene integration and
  `portfolio-screens.ts` launch/power/boot overlay branches, with associated
  transition modules/tests. Remove legacy HOME folder-name keyboard entrypoints.
  Own browser/Azahar and combined verification.

Workers remain separate visible tasks/worktrees, GPT-6 Astra High. Report
concrete rendered output and remaining visual differences. Use SSD artifacts.
Commit coherent slices; coordinator integrates sequentially. In-progress
keyboard work remains safely preserved in worker worktrees and is not merged.
