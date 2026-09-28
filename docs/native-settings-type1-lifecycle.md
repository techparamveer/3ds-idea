# System Settings ordinary type-1 HOME primary: source boundary

This note traces the **ordinary available** System Settings title
`0004001000022000` through the supplied EUR HOME Menu 10.7.0-32E executable.
It is a source contract for a future host and renderer change, not an enabled
browser banner. HOME `code.bin` SHA-256 is
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`;
addresses below use virtual base `0x100000`. The selected EUR English Settings
`banner.bin` SHA-256 is
`5804ba5a7768d2ae9b7487e4d277923502646d89768668b19d666e3e4d30fbac`.
The private reproducer is
`/Users/paramveer/CodexArtifacts/firmware-10.7.0-32E/banner-type1/verify.py`;
its committed [anchor output](evidence/native-settings-type1-anchors.json) checks
the code hash, title CBMD hash, ARM call sites and literal targets. It is a
**static** fixture: workers, OS services and scene controllers are not executed.

## Request and normal gate

The selected-record path in [native banner targets](native-banner-targets.md)
uses record flag bits 0 and 1, not slot occupancy as a proxy. A present,
available ordinary non-folder entry reaches caller category 0 at
`0x1e1844..1854`. With the documented gift, folder and media exceptions absent,
`0x1d7400..7494` chooses type 1 for Settings' ordinary title words. The request
setter `0x1ed6ec` copies the title key and resets manager wait counter `M+0xc8`
at `0x1ed870`, where `M=0x32ebf4`. The key is the title identity; grid slot and
label are not the resource identity.

When a previous primary exists, manager state 6 consumes the changed request
at `0x24c184..1a4`, requests its hide through `0x1f9068`, and state 2 waits for
actual visibility at primary `+0x3c` to clear (`0x24c128..144`). That state-2
pass only enters state 1; it does not run the gate in the same pass. The normal
type-1 gate in `0x249e84` honors global inhibition byte `0x32f50d`, increments
`M+0xc8` from 0 to 5 on five eligible state-1 calls, then may release/start a
worker on the **sixth** eligible state-1 call. An existing worker at `0x32ecfc`
must have completed. The gate starts `0x249448` through `0x2357ac` and enters
state 3. These facts are also checked by the executed
[gate fixture](home-banner-scheduling.md); they do not imply a millisecond delay.

## Title resource and presentation workers

The manager dispatch table at `0x24c0f8` calls state 3 `0x24a7b8`, state 4
`0x249bf4`, and state 5 `0x24a5f0`. Type 1 has a separate state-3 jump-table
entry at `0x24a840 -> 0x24a88c`. This is **not** the folder/default direct
installation path. The path has these ordered boundaries:

| Boundary | Source observation |
| --- | --- |
| State 3 | `0x24a7d4` checks completion of the first worker; `0x24a7e0..a820` joins/cleans it. The type-1 arm at `0x24a88c..a950` prepares the requested title key, starts worker `0x24c930` through `0x2357ac` at `0x24a924`, and writes state 4 at `0x24a94c` if thread creation succeeds. |
| Title worker | `0x24c930` reads key words from its argument `+8` and medium byte `+0x10` at `0x24c96c..c978`. On successful archive/resource handling it allocates candidate primary and secondary objects into `M+0x50/+0x54` (`0x24ca28..ca64`), loads resource data into `M+0xcc/+0xd0` (`0x24cb24..cb68`), and sets the worker completion byte `arg[0]` at `0x24cba8`. Failure branches clear that byte or release candidates. The fixture does not execute the archive operations. |
| State 4 | `0x249c00` checks the title worker. Once complete, `0x249c7c..c8c` passes the candidate primary, resource pointer `M+0xcc`, and literal `COMMON` at `0x3072e0` to `0x24def0`. `0x24dfd4..e018` looks up and starts skeletal/material controllers where present. State 4 then starts another worker, `0x2492d8`, at `0x249d18`; successful creation writes state 5 at `0x249d44`. The branch is conditional on byte `0x34c008` at `0x249c4c..c60`; its false path is separate and is not a fabricated successful title load. |
| State 5 | `0x24a5f8` checks the presentation worker. `0x1f90cc` then checks current-request identity, type, primary eligibility and manager flag. Its true branch requests visibility 1 at `0x24a664..a67c`; its false branch requests visibility 0 at `0x24a68c..a6a8`. Both reach state 6 at `0x24a6b0`, so state 6 alone does not prove a show request. See [pose and activation](native-settings-banner-pose.md). |
| Common update | After state dispatch, `0x24c23c..c264` invokes loaded primary virtual `+0x14` in that same eligible manager pass. This is the general object update path; it does not prove when pixels are presented. |

The resource worker installs *candidate* objects before the state-5 show call.
Native actual visibility, requested visibility and scene attachment remain
distinct. `0x1f9e64` requests visibility; `0x1fa344` advances actual visibility
and scale, and attachment/detachment (`0x24f30c`, `0x24f48c`) changes membership
in the later global scene/controller pass (`0x103808`, `0x10b3d0`). A browser
host must not mark the title active merely because the first or second worker
completed, nor draw a previously selected folder under Settings' title ticket.

## `COMMON` clip and departure

The decoded Settings CGFX has model `COMMON` (12 meshes, five textures), one
skeletal animation also named `COMMON`, `FramesCount: 600`, and
`AnimationFlags: IsLooping`; it has no material animation. Its selected CGFX
SHA-256 is
`96ea28f70671cf2b62aded3e3ef203cdf365929ae9422798255c628499c0910d`.
State 4's literal `COMMON` reaches the primary loader at `0x249c8c`; the
loader locates a skeletal controller through `0x1f8028` (`0x24dfd4..dff4`),
then calls its virtual `+0x10` at `0x24dfec..dff4`. The model's loop flag is
source data. A full executed sample of the native controller's first frame,
600-to-0 wrap and display cadence has **not** been produced here. Do not apply
folder/default clip values to the title. The source vtable shows that Settings
uses the generic primary yaw/visibility/outer-pose handler; see the bounded
[pose audit](native-settings-banner-pose.md). Raw billboard mode 1 has since
been implemented and verified against the converted Settings model; upper-screen
hosting remains separate.

On departure, a changed title request again passes state 6, requests hide,
waits for actual visibility in state 2, and uses state 1's normal gate before
releasing the old primary. While the old object is loaded, the common manager
update can continue; its attached controllers update only while attached.
The outgoing model must retain its own title identity and resource generation
until release. The available static fixture does not resolve every retarget race
inside states 3, 4 and 5 or a failed title-resource/worker path. Those paths
need executed fixtures before a pure host claims native-equivalent activation.

The current app selection remains an explicit unsupported host handoff. The
separate asset pass has published only converted Settings model JSON and five
textures under `settingsBanner`; this audit itself changes no application code.
In particular,
`home-banner-service.ts`'s direct loading-to-active branch is proven for the
bounded folder/default/clear implementation, not for native type 1.
