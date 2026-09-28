# Camera property publication: bounded final setter

The later [linked continuation](camera-linked-property-publication-audit.md)
runs this setter within the existing two-pass rebind fixture. Material lookup
remains synthetic and no pixels are produced.

The connected [rebind ordering replay](camera-rebind-order-source-audit.md)
records the final property setter `0x25a618` as a leaf. This continuation
executes that complete routine against two synthetic property records. It
does **not** establish uploaded photo pixels, native SceneBrowse replacement,
or permission to connect the horizontal strip to the live gallery.

Source: EUR Camera title `0004001000022400`, content `0000-0000001a`, base
`0x100000`, executable SHA-256
`3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`.
The executable is private and hash-checked before Unicorn imports or executes.

## Executed boundary

[`replay_camera_property_publication.py`](../scripts/replay_camera_property_publication.py)
calls original `0x25a618` through return with the caller's nonzero third
argument, which skips its prior-value comparison. The target has no prior
resource or material. The source property's byte count is zero or four;
the four-byte case carries `ABCD` and a terminating zero. Original
`0x256ca8` copies the property into target `+0x1c`; the caller stores the
length at `+0x18`. The zero-length case reaches `0x256ca8`, writes a terminator and
returns without downstream material work. The four-byte case reaches original
copy helper `0x26250c`, then calls `0x2567cc` once. At that call boundary, the
fixture checks that `ABCD` and length four are already retained. `0x2567cc` is
recorded and returned by the fixture; no graphics service, texture binding or
LCD rasterizer runs.

The result is a narrow ordering fact: the setter's retained property changes
before it dispatches the downstream application call. The property fixture
does not identify the bytes as a real photo, supply a decoded resource, or
join this setter to the existing two-pass ring fixture. It therefore cannot
turn `ready=1` at the cell writer into evidence of a visible thumbnail.

## Remaining live gate

The [generation replay](camera-scene-generation-source-audit.md) shows the
embedded constructor leaves readiness bits intact; the later setup reset
clears them in isolation. The original SceneBrowse retirement/replacement
caller and complete control setup still need a linked replay proving the reset
precedes new-owner request and presentation. The property service `0x2567cc`,
photo material/upload route, complete final cell writer joined to the same
object graph, and composed lower-LCD pixels remain separate. A coordinator
native/browser sequence must then compare re-entry placeholders, thumbnail
publication, scroll positions and timing. The live six-item page adapter
remains in place.

## Reproduction

```sh
python scripts/replay_camera_property_publication.py \
  --code /absolute/private/camera/exefs/code.bin \
  --output /absolute/private/property-publication-replay.json
FIRMWARE_CAMERA_CODE=/absolute/private/camera/exefs/code.bin \
  python -m unittest discover -s tests -p test_camera_property_publication.py
```

Use `unicorn==2.1.4` for the pinned-source case. The private report for this
pass is `/Users/paramveer/CodexArtifacts/firmware-10.7.0-32E/camera-live-gate/property-publication-replay.json`.
The property and cell publication Python tests pass 4/4 against the pinned
private executable, including invalid-source rejection. Focused Camera Node
tests pass 28/28; relative links and `git diff --check` pass. No runtime,
public asset or TypeScript changed, so no application rebuild was run. No
browser, Azahar, GPU or native LCD comparison was performed in this worker.
