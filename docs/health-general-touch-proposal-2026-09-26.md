# Isolated native Health General touch proposal

Read-only inspection of the isolated `reference/user/config/qt-config.ini`
found C at (160,80), E at (160,230), U at (240,170), R at (160,205), and Y at
(220,205). Proposed General target is (160,105), inside the coordinator-observed
button bounds, but not yet verified by native input. Reuse C temporarily by
changing only this existing entry:

```ini
touch_from_button_maps\1\entries\2\bind="code:67,engine:keyboard,x:160,y:105"
```

Preserve the five-entry count, other mappings, selected profile/map, and
`profiles\1\use_touch_from_button=true` with its `\default=false`. C has no
physical-button binding in this config. Ctrl+C is a separate save shortcut;
send an unmodified C. E retains the observed article Back route.

The pinned [touch device source](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/input_common/touch_from_button.cpp#L11-L32)
caches entries at construction, normalizes coordinates by lower-screen size,
and reports the first held mapped button. Release other keys before C. The
[Qt config source](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/citra_qt/configuration/config.cpp#L17-L25)
saves global settings on destruction. File edits while running can be overwritten
and do not update the cached device. For this file-based method, fully quit and
restart isolated Azahar.

Coordinator procedure:

1. Quit isolated Azahar. Back up the **post-quit** config byte-for-byte and record
   its SHA-256. Preserve the default macOS profile completely.
2. Patch only that one binding. Check the diff and the isolation launch gates in
   [profile isolation](native-reference-profile-isolation.md) and
   [verification](architecture/verification.md).
3. Launch only the copied isolated executable, navigate HOME → Health, focus its
   window, send/release C using the established sustained-key route, and inspect
   the resulting General article before capturing. Record input repetition;
   this is not frame-counted native timing. Confirm E returns.
4. Quit before restoring the exact backup. Compare its hash after restoration.
   A later launch may update runtime config fields again.

The live-read config hash was
`142ce545a34d46967e2d136a4861bd19ba886f4a593bfce8dd3e10429fdc943d`;
this is not a substitute for the post-quit backup. No config or emulator state
was changed during this inspection.
