# Firmware asset inspection

Input: `/Users/paramveer/Downloads/11.17.0-50E-NEW.zip`.

The read-only inspector found 137 CIA packages. It parses archive headers and TMD content flags; it does not execute firmware, follow embedded instructions, or copy firmware into the public website.

The European HOME Menu package is `0004003000009802.cia`, 3,873,024 bytes. Its first TMD content type is `0x0001`: the CIA content is encrypted. No clear NCCH header occurs in the package. Its SHA-256 is `011d0276fb947315ef06f385cdb444f5e194d23573caf0e3efbeb2c82673654e`.

The original firmware graphics are not yet available to this application. A decrypted HOME Menu RomFS/assets folder from the owner is required to replace the current authored placeholders with the real asset set. The user has been asked for its local path. No substitute asset set is described as extracted firmware.

Run `python3 scripts/inspect_firmware.py /path/to/archive.zip` to regenerate `docs/firmware-inventory.json`.

Format references: [CIA](https://www.3dbrew.org/wiki/CIA), [NCCH](https://www.3dbrew.org/wiki/NCCH), [PyCTR library](https://github.com/ihaveamac/pyctr).

`src/os/state.ts` contains the menu input state machine. `src/os/screens.ts` draws a plain placeholder at native screen resolutions. There is no portfolio content yet. This implementation is not an emulator and has not achieved pixel-identical HOME Menu fidelity.
