# Camera property setter linked to two-pass presentation

This continuation runs original `0x25a618` **inside** the existing
[request/rebind and two-pass fixture](camera-rebind-order-source-audit.md),
rather than only in the isolated [setter fixture](camera-property-publication-source-audit.md).
It narrows one publication boundary. **Live horizontal paging remains
disconnected**: this replay does not replace SceneBrowse, execute the final
cell writer, upload a photo material, or produce LCD pixels.

The executable is EUR Camera `0004001000022400`, content `0000-0000001a`,
SHA-256 `3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`.
The script reads hash-pinned private bytes; no executable or media is committed.

## Linked source result

[`replay_camera_rebind_order.py`](../scripts/replay_camera_rebind_order.py)
keeps its original selected logical-69 collision, current completion, root
input traversal, two complete `0x2d425c` presentations, 64 ring routes per
pass, and post-draw consumer rewrite in one Unicorn instance. Its three
`0x25a618` calls now execute through return during pass 1. Original
`0x256ca8` copies the retained property before original `0x2567cc` receives
it. At those call boundaries the retained null-terminated bytes are `PicL`,
`PicL`, and `PicL_Op`, with lengths 4, 4, and 7. All three have a zero material
resource argument in this synthetic graph.

The three calls to `0x2567cc` execute its own branch and material field write.
Its `0x247ed4` lookup returns one synthetic material; `0x131254` and
`0x247ce4` are recorded leaves. They do not prove a native resource lookup,
texture selection, GPU upload or lower-LCD raster. The selected logical-69
ring argument still has `ready=0` in pass 1 and `ready=1` in pass 2. The
final cell writer `0x2d804c` remains intercepted in this connected graph;
its independent [complete writer replay](camera-cell-publication-source-audit.md)
cannot be treated as a joined pixel result.

An exploratory attempt to let the selected final cell writer run on this
synthetic graph reached its return, but the expected post-draw consumer rewrite
no longer ran. That altered result is not accepted evidence: the fixture's
control, owner and pose object graph is incomplete for the original writer.
This is a concrete integration constraint for the next replay.

## Remaining gate

The original SceneBrowse retirement/replacement caller, complete new control
setup, request and two-pass presentation need one linked owner graph. The
final cell writer must run in that graph without changing the source consumer
rewrite unexpectedly. Then resolve real material lookup/photo upload and
composed lower-LCD pixels. The coordinator must compare a matched native and
browser re-entry/scroll sequence before enabling the strip.

## Reproduction

```sh
python scripts/replay_camera_rebind_order.py \
  --code /absolute/private/camera/exefs/code.bin \
  --output /absolute/private/linked-rebind-property.json
FIRMWARE_CAMERA_CODE=/absolute/private/camera/exefs/code.bin \
  python -m unittest discover -s tests -p test_camera_linked_property_publication.py
```

Use `unicorn==2.1.4`. The private report is
`/Users/paramveer/CodexArtifacts/firmware-10.7.0-32E/camera-live-gate/linked-rebind-property.json`.
No browser, Azahar, GPU or LCD comparison was performed in this worker.
