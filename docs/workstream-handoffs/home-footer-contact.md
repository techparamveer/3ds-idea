# HOME footer contact-ownership handoff

Base: `9c72c168aaf8af4b86ec1cd0624f89e61ecf4008`

Branch: `codex/home-footer-contact-20261002`

Feature IDs: H-10

## Proven defect

HOME currently gives `LncBtmBtn_02_Select` to the footer button under the
gesture's current coordinates, while release invokes `touchSystem` at the final
coordinates. Neither path verifies that the same button owned touch-down.
Movements greater than the existing 8 px gesture slop become scrolls and are
already cancelled, but two smaller transfers are live:

| Initial Settings footer contact | Release | Current result before integration |
| --- | --- | --- |
| `(98,226)`, Manual side | `(102,226)`, Open side | Settings launches; the unpressed Open action wins |
| `(160,210)`, outside the footer | `(160,214)`, inside centered Open | Settings launches; the gap contact acquires Open |
| `(98,226)`, Manual side | `(90,226)`, same side | Manual opens, the valid positive control |

All three remained `gesture.mode === 'press'` in a direct reducer replay at this
base. The first two are semantic ownership defects, independent of native
timing or artwork. Normal physical navigation while a footer contact is held
cancels the gesture, so no separate live state-change defect was found. The
helper still reconstructs the immutable navigation origin so an in-flight
contact cannot transfer if another accepted state path changes selection or
toolbar focus without cancelling it.

## Delivered pure contract

`home-footer-touch.ts` provides:

- `homeFooterHit`, which combines `getHomeFooter`'s semantic action projection
  with caller-supplied shared lower-LCD geometry;
- `ownedHomeFooterContact`, which returns a hit only when the contact remains a
  press and both its immutable start and current/end point resolve to the same
  semantic action and the same left/right source group; and
- structural geometry/contact types so the renderer and reducer consume one
  predicate without adding a second gesture recognizer.

The origin projection restores `HomeGesture.origin.navigation`, its starting
panel and panel choice before resolving the down action. The helper does not
mutate state, change gesture slop, invent a hold time, or infer native drag
behavior.

## Coordinator integration hunks

The shared files remain coordinator-owned. After cherry-picking this commit,
apply these bounded changes.

In `stock-screen-layout.ts`, next to the other exported logical lower-LCD
rectangles:

```ts
/** LncBtmBtn_02 live HOME hit bounds and its asymmetric two-button split. */
export const HOME_FOOTER_TOUCH_GEOMETRY={x:0,y:212,width:320,height:28,leftWidth:100} as const;
```

In `firmware-presentation.ts`, import
`ownedHomeFooterContact` from `./home-footer-touch` and
`HOME_FOOTER_TOUCH_GEOMETRY` from `./stock-screen-layout`, then replace the
coordinate-only Select block in `footer`:

```ts
const bindings=[/* existing SceneOut/SceneIn selection */];
const pressed=ownedHomeFooterContact(
 state,HOME_FOOTER_TOUCH_GEOMETRY,state.system?.homeNavigation.gesture,
);
if(pressed){
 const group=two&&pressed.side==='left'?`G_Btn${leftTone}_L_03`:two?'G_BtnW_R_02':'G_BtnW_C_01';
 bindings.push(binding('LncBtmBtn_02_Select',1,[group]));
}
```

Do not use `getHomeGestureView` for this footer decision. It intentionally omits
the immutable gesture origin needed for ownership, though its other renderer
callers remain unchanged.

In `system.ts`, import `homeFooterHit` and `ownedHomeFooterContact`, plus the
shared geometry. Inside the ordinary HOME touch branch, compute ownership before
`touchHomeGesture` clears the gesture:

```ts
const native=queueHomeControlTouch(state,event);
const contact=native.state.system?.homeNavigation.gesture;
const footerRelease=event.phase==='up'
 ?homeFooterHit(native.state,HOME_FOOTER_TOUCH_GEOMETRY,event.x,event.y)
 :null;
const footerOwner=event.phase==='up'
 ?ownedHomeFooterContact(native.state,HOME_FOOTER_TOUCH_GEOMETRY,contact,event.x,event.y)
 :null;
const result=touchHomeGesture(native.state,event,now);
const next=result.nonTapGesture?cancelHomeControlTouch(result.state):reconcileHomeControlGesture(result.state);
if(!result.tap||native.handled)return next;
return footerRelease&&!footerOwner?next:touchSystem(next,event.x,event.y,now);
```

This preserves non-footer taps and compatibility one-shot `touchSystem` calls,
while release on a visible footer button requires ownership from the matching
down action. Add live integration regressions for the three table rows, both
cross-directions at x100, outside/cancel, a same-button small move, and the
single full-width Open footer. The native painter test should assert that the
same cross/gap contacts do not append `LncBtmBtn_02_Select`, while same-button
movement does.

After integration, change the dedicated helper test to import
`HOME_FOOTER_TOUCH_GEOMETRY` rather than its identical local fixture. That makes
future geometry changes fail both presentation and action ownership coverage.

## Native source and provenance

The visible button remains the already delivered HOME footer; this slice adds
no graphic, font, message or audio asset.

| Element | Manifest / pack key | Decrypted dump source | SHA-256 |
| --- | --- | --- | --- |
| Footer layout and groups | `manifest.home.launcher` -> `packs/home/launcher.json` -> `layouts.LncBtmBtn_02` | `romfs/launcher_LZ.bin/blyt/LncBtmBtn_02.bclyt` | `1be988eda6f3d2374d8445d0773688fa1c6dd118590cb986d526c0dc4f326a44` |
| Press feedback | `animations.LncBtmBtn_02_Select` | `romfs/launcher_LZ.bin/anim/LncBtmBtn_02_Select.bclan` | `b039ae54719725321c32b904f142d684d3980122e11a164191b2740d86542b20` |

Transitive identity: EUR 10.7.0-32E HOME Menu
`0004003000009802` v24576, content index 0 / ID `00000082`;
`romfs/launcher_LZ.bin` SHA-256
`826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`;
delivered launcher pack SHA-256
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`;
`ctr-native-web` 1.2.0 / CTRTool 1.3.0. Existing Manual, Open, Close and Resume
message/font provenance is unchanged.

## Verification boundary and remaining gaps

Five dedicated pure-contract tests cover exact edges, the asymmetric x100
split, both transfer directions, gap entry, leaving the footer, scroll
cancellation, navigation-origin changes, same-button positive controls and the
single-button full width. Typecheck and `git diff --check` are required before
handoff.

This worker operated no GUI, browser, Azahar, audio session or build. The shared
integration is intentionally not present in this commit, so current runtime
behavior remains defective until the coordinator applies the hunks and reruns
the live routes. Exact native contact slop, Select timing, Decide behavior,
input cadence and audio remain unverified; no scenario or strict 1:1 claim is
made.
