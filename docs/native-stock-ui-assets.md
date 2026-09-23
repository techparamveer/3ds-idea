# Native stock UI delivery

The current scope is stock screen presentation and basic navigation. Camera is
a read-only portfolio gallery and Sound plays supplied favourite songs. Software
Keyboard and the six previously excluded stock titles are not delivered.

`scripts/firmware/stock_ui.py` adds explicitly selected resources from a private
converter output to the existing public delivery. It verifies source hashes,
resolves layout/animation texture dependencies, retains original source identity
and style indexes, and validates HOME/shared records and actual bytes before
writing. Message labels are compacted; `uiSelection.sourceMessageIndices` maps
delivery indexes back to the original bank. No raw firmware is copied publicly.
Original full locale-selection provenance remains attached to narrow packs.

## Settings initial screen

Title `0004001000022000`; all URLs below are relative to
`public/os/firmware/10.7.0-32E/packs/settings/contents/0000-0000003d/`.

| Pack | Selected native resources |
| --- | --- |
| `base.json` | `Bg_U_00`, `Bg_D_00`, `TopBase_D_00`, `Base_D_00`; background SceneIn_Legacy clips |
| `up.json` | `TopText_U_00`, `CommonBG_U_00`; matching scene, icon-loop and background clips |
| `layout.json` | `Top_D_02`; matching SceneIn and Special clips |
| `button.json` | `I_TopLTs`, `I_TopRTs`, `I_TopLBs`, `I_TopRBs`, `I_TopTs`, `B_L`; each Select/Decide plus B_L_Invalid |
| `message_EU.json` | English mset labels `top_sysset_title`, `top_nnid`, `top_internet`, `top_parental`, `top_software`, `top_settings`, `top_btm_text`, `base_2b_back`, `dat_dlg_1b_close` |

The plan is `scripts/firmware/stock-ui-settings.json`. The button animations were
decoded with the integration converter's `pah1` hierarchy support; their `shares`
are retained. The title's `uiSelection.sourceConverter` records that converter's
script hashes independently of the unchanged HOME converter provenance.

Native lower-screen attachment panes are `N_I_TopLTs_00`, `N_I_TopRTs_00`,
`N_I_TopLBs_00`, `N_I_TopRBs_00`, and `N_I_TopTs_00`. Use the source English
messages to replace Japanese layout placeholders. `top_btm_text` contains the
native HOME glyph followed by “Close”. Shared `cbf_std.bcfnt` is borrowed from
the existing verified font delivery.

## Verification and remaining work

The selected Settings set contains 28 resources totalling 429,102 bytes including
shared dependencies. All 483 pre-existing resource records and corresponding
file hashes remain unchanged. Three publisher tests cover dependency closure,
message-index preservation, fail-before-write behavior and repeatability. Six
locale tests pass; the private-source test is skipped without its opt-in input.
The delivery audit passes; existing unsupported-field warnings remain reported.

Private artifacts are under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/assets/stock-ui/`:
`settings-converted/`, `delivery-audit.json`, and
`settings-button-textures.png`. The contact sheet was inspected; it demonstrates
decoded textures only. Combined screen composition and browser comparison belong
to the presentation/coordinator tasks and remain required for visual acceptance.

Sound and Health & Safety RomFS extraction succeeded. Camera CTRTool extraction
stops after several files; its complete UI resource set is not published yet.
Other stock/app/helper screens remain pending. No keyboard or audio-behaviour
reconstruction is part of this delivery.
