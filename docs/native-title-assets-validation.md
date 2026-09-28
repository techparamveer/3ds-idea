# Lazy native title asset loader

2026-09-23. Implements the isolated loader from
[the title-loader contract](native-title-loader-contract.md). No HOME loader,
scene, screens, catalog, application state or public delivery assets changed.

```ts
loadNativeTitleAssets(
  manifestUrl: string,
  titleId: string,
  requests: readonly NativeTitlePackRequest[],
  sharedFonts: ReadonlyMap<string, BitmapFont>,
  signal?: AbortSignal,
): Promise<NativeTitleAssets>

// Each request: { url, alias, layouts: string[], animations: string[] }
// Result: { renderer: NativeLayoutRenderer, diagnostics: string[], dispose() }
```

The types read the existing schema1 emitted by `scripts/firmware/build.py`:
`titles[titleId].packs`, `titles[titleId].fonts`, and each pack's `titleId`,
layouts, animations, textures and unsupported records. This adds no public
manifest schema. All resource URLs resolve relative to the manifest, including
textures whose records occur inside pack JSON.

Each request URL must resolve to an entry in the selected title's pack list.
Aliases must be unique. The loader rejects a missing/excluded title, invalid
schema/title identity, absent requested layout or animation, missing texture or
font, invalid texture metadata and mismatched PNG dimensions. It snapshots
requests and the borrowed font map before awaiting the manifest.

Only explicit pack JSON is fetched. The renderer receives only the requested
layout/animation dictionaries and their texture metadata. Layout texture lists
and requested animation texture lists determine the dependency union; animation
names are not inferred from prefixes. Two aliases may select different views
from the same pack without fetching it twice. PNG fetch/decode is shared by
resolved URL, with matching dimensions required; PICA sampling variants are
shared by URL/format. Decoding uses the existing unpremultiplied RGBA PNG path
and original PICA A8/A4 handling.

Requested layout/material/animation `unsupported` markers reject the load.
Unrequested converter omissions are reported in diagnostics and do not certify
those omitted resources as supported. This is bounded resource validation,
not proof of complete native layout, material, animation or raster fidelity.

## Font and lifetime ownership

Text pane font indices identify required source names, including currently
hidden text panes. Unused font-list entries and unused title font metadata cause
no font load. An exact source-name entry in title metadata selects an owned font;
otherwise the exact name must exist in the borrowed map. Fonts sharing a title
URL are loaded once. No alias guessing or alternate glyphs are introduced.

The additive multi-content metadata from converter commit `2b20792` is supported:
when a pack declares both `contentIndex` and `contentId`, lookup uses
`contents/<four-digit-hex-index>-<eight-digit-content-id>/<raw-font-name>`.
The index and ID are validated before use. Single-content packs retain the
original unprefixed lookup. A namespaced pack does not fall back to another
content's or an unprefixed title-owned font; borrowed shared fonts still resolve
by their exact raw names. Layout font strings are never rewritten.

The renderer currently has one font map across its pack aliases. If two selected
contents use the same raw font name with different resolved URLs, loading fails
before font/texture allocation. An owned-versus-borrowed conflict also fails.
The same resolved owned URL or the same borrowed object can be shared safely.
Different fonts under one raw name require separate loader/renderer instances
until a verified per-pack font API exists.

For example, the current public HOME layout names `Hud.bcfnt`, while its title
metadata names `Hud_JP.bcfnt`. Existing HOME supplies its own mapping. This loader
does not invent that rename; tests use borrowed HOME names or an explicit
binding fixture with the exact owned metadata name. Keyboard must supply its
verified resource/view contract before integration.

The linked AbortSignal reaches JSON, PNG and font work. A failed concurrent job
aborts its siblings immediately. The loader drains the started jobs before
rejecting, so even a noncooperative font acquisition that completes after another
job failed is collected and disposed. A load cannot return a partial renderer.
Cancellation may therefore wait for an already-started image decode to settle.

The result's idempotent `dispose` releases renderer caches, loaded texture maps,
owned fonts and the loader's font/pack references. Borrowed font objects and the
caller's map remain intact. A successful load detaches its request abort listener;
the future scene owner must dispose resolved resources and reject stale
generations explicitly. There is no global selection, cache or scene ownership.

## Verification

`node --test tests/native-title-assets.test.mjs`:35 passed,0 failed,0 skipped.
`npm run typecheck`:passed. Focused cases cover:

- Real public HOME Pickup/PickUpBlank dependencies, their14 distinct textures,
  a separate banner pack and borrowed shared font.
- Explicit differently named animation requests, pack/texture deduplication,
  PICA variants and raw independent RGB/alpha channels.
- Missing title/pack/layout/animation/texture/font, pack ownership/schema,
  selected unsupported fields, HTTP failures and dimension disagreement.
- Owned-font precedence and URL sharing, unused font metadata, shared-font
  preservation, real bitmap-font manifest/atlas fetching and object-URL cleanup.
- Converter-derived content namespaces, invalid content identity and conflicting
  same-name bindings across contents, including owned-versus-borrowed conflicts.
- Pre-abort, delayed JSON, pending PNG transfer, early owned-font success,
  late owned-font completion after sibling failure, and caller request mutation.
- Allocated real native renderer raster caches and idempotent disposal.

PNG decoding, resource data, material raster generation and renderer ownership
are real. Race cases inject a controlled font acquisition; the real font-loader
case substitutes only the browser image decode endpoint. Renderer cache checks
use a minimal Canvas transport. These are Node checks, not browser or native
pixel comparisons.

Private SSD reports are under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/presentation/title-loader/`:
`focused.tap`, `typecheck.log` and `resource-provenance.json`. No broad conversion,
hydration, full suite, build, browser, Azahar or hardware work was performed.
The six excluded applications remain outside scope. Strict1:1 acceptance is
unchanged; this infrastructure does not finish a stock application or Keyboard.
