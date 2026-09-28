# Sound Welcome: launch, save-backed state and composition follow-up

This narrows the [descriptor/controller audit](sound-welcome-owner-audit.md).
No runtime UI is added: the original host's launch conditions, disk commit
boundary and page-transition scheduling are still incomplete. No emulator,
browser, device operation or shared-checkout edit was performed.

## Resolved presentation ownership

The original initialized table at `0x33d080` supplies real names, rather than
unresolved runtime strings. Controller construction `0x181b8c` loads
`C_DlgGuid1BtnW`, `C_DlgGuid2Btn` and `C_DlgGuid_U` from **C--Dlg**.
The lower body is bound to **TxtDlg**, selected through table `+0x1c` at
`0x181fbc` and later populated by `0x181294`. Therefore `S_Inf_U-Txt` is
not the body for this shared guide dialog. The prior audit's unproven upper
body assumption should not be carried into implementation.

| Resource | Proven local composition |
| --- | --- |
| C_DlgGuid1BtnW | 320×240; TxtDlg at (0,25), 280×152; one centered button at (0,−84) |
| C_DlgGuid2Btn | 320×240; same body; buttons at (−48,−84) and (48,−84) |
| Both lower layouts | TxtNumber0/1 at (116,−92), with opposing source text alignment |
| C_DlgGuid_U | 400×240; source window panes and a **Pict** mount at (0,0,0) |

Coordinates are source-local, centered and Y-up; they are not independently
verified final LCD coordinates. Upper illustration lookup checks families
**C_Guid_U**, then **S_Guid_U**, and attaches the selected layout to **Pict**.
For Welcome page three, the existing `S_Guid03_U` resource is in S_Guid_U.
The active guide's body and page count are thus lower-LCD content, with a
separate upper volume-control illustration. `T_001` is also used by the
Usage Tips list through the descriptor's `+0x20` title getter `0x28f2ec`;
its existence alone does not prove an extra upper Welcome title.

## Source opening/closing clips, without a guessed duration

`0x205a98` constructs the shared **C_NullDlg** transition object. Its class
is `0x322f80`; virtual slots `+0x6c/+0x70` call `0x279a18/0x279cc4`.
Initialization `0x297780–0x2978e0` populates the clip-pair table `0x39f810`.
The default mode is 1; the guide's upper owner sets it to 0 at `0x1807e8`.
Those modes select these original clips:

| Owner | Enter | Leave | Converted source length |
| --- | --- | --- | --- |
| Upper mode 0 | Dlg_InU | Dlg_OutU | 15 frames each |
| Lower mode 1 | Dlg_In | Dlg_Out | 15 frames each |

These are exact resource lengths, **not** a measured 250 ms duration. Page
changes also queue named pane operations **DIO**, **TxtDlg**, and button text
targets in `0x180ea8`; the page-update callback is `0x181294` and the upper
replacement callback is `0x181748`. Their scheduler, completion ordering,
frame advancement and full parent transforms remain open. Applying only the
four entry/exit clips would not reproduce all three page transitions.

## Launch and persistence facts now established

The tip manager stores settings singleton `[0x3771ec] + 0x8c` as its state
pointer (`0x2c1dfc–0x2c1e1c`, `0x2c910c`). That is save block `+0x68`,
because the singleton's block getter returns `this + 0x24`. Its defaults
initializer `0x1908e0` clears both the two-bit seen-state array and the
separate prerequisite bit array through `0x17fa94/0x17faf4`.
The singleton's filename getter `0x28f6ac` resolves UTF-16 **SNOTE.BIN**.
This associates the state with the save owner; it does not establish when
the loader restores it or when a completed guide reaches disk.

The Welcome descriptor has priority class 0 and prerequisite list
`[1,0,0,0,0,0,0,0]`. `0x28f328` subtracts one from each nonzero prerequisite
ID and checks the corresponding prerequisite bit: Welcome requires **bit 0**.
Queue builder `0x2d8e10` puts unseen guides into their descriptor class queue;
`0x17fb98` scans class 0 before lower-priority queues and selects an eligible
descriptor. A completed guide updates its two-bit seen entry as described in
the prior audit.

The host helper `0x1e8290` sets prerequisite bit 0 when saved block `+0x14`
(singleton `+0x38`) is at least 1. That field defaults to zero at `0x1909dc`.
Its writer and meaning are **not** resolved: calling it a launch counter would
be an inference. The host also requires the multiple readiness/modal gates in
`0x1e8828`, application flags around `0x1c2e9c`, and its wrapper state before
automatic activation at `0x1c2f0c`. Consequently “show once when localStorage
is empty” is still not a source-backed trigger.

## Exact remaining gate and checks

Remaining work is bounded to the writer/load of singleton `+0x38`, save
read/write/commit for SNOTE.BIN, the host eligibility predicates and source
transition scheduler, plus final parent transforms/underlay and matched native
page/exit captures. No new first-run flag, timeout, persistence or UI flow is
introduced from incomplete evidence.

The extended [static audit](../scripts/firmware/sound_welcome_audit.py) passes
**111 instruction assertions**, all **91 GBIN records**, source-name table
checks, prerequisite/class values, lower body geometry, upper Pict geometry
and the four 15-frame clips. Pass the original three arguments from the prior
audit plus `--dialogs /absolute/path/to/lyt-C-Dlg.json`; dialog source hash is
`96771724c5f571dc6045ba3dd4ffa8a769428f9c4cf9784f3ea49e7cf52e0e26`.
The private result is
`/Users/paramveer/.codex/artifacts/sound-welcome-owner-2026-09-24/lifecycle-audit.json`.
Changed source hashes and malformed dialog geometry are rejected. Relative
links and `git diff --check` pass. This offline audit changes no runtime or
public resource; application tests/build and source renders are not claimed.
