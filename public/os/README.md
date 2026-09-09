# OS asset boundary

No Nintendo firmware graphics or fonts have been extracted or shipped here.
The current icons remain authored placeholders.

For an owner-provided **standalone decrypted** BCFNT font:

```sh
python3 scripts/convert_bcfnt.py /absolute/path/to/font.bcfnt public/os/font
```

The converter creates PNG sheets and `font.json`, records the source SHA-256,
and refuses to overwrite an existing directory. A4/A8 UTF-16 CFNT only.
See `docs/firmware-assets.md` before interpreting the output as verified assets.
