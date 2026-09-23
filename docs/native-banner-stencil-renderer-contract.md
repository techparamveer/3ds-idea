# Agreed bounded stencil renderer contract

Base all later renderer work on integration commit a0d64a7 (authored depth
comparison mapping). The source contract is a94a8e4 plus the displacement
clarification follow-up. Public Frame/default resource promotion stays with root.

## 1. Reusable material state

Extend the existing third argument to createFirmwareModel; no separate banner
knowledge in firmware-model.ts:

```ts
type FirmwareStencilState = Readonly<{
  enabled: boolean;
  function: NativeComparison;
  reference: number;
  compareMask: number;
  writeMask: number;
  fail: NativeStencilOperation;
  depthFail: NativeStencilOperation;
  depthPass: NativeStencilOperation;
}>;
type FirmwareModelOptions = Readonly<{
  overlayCoverage?: boolean;
  drawGroup?: number;
  runtimeStencil?: Partial<FirmwareStencilState>;
}>;
```

NativeComparison is the explicit eight-value decoded source comparison enum;
NativeStencilOperation is the explicit eight-value decoded source operation enum.
Map source StencilTest/StencilOperation first, then merge the runtime override
on each material instance without mutating the asset. Unknown enums throw as
depth comparisons now do. No mutable setter is required for this fixed load-time
override. Older assets without stencil fields can retain disabled stencil.

Frame uses its source Never/Replace state plus runtimeStencil.writeMask=0xff.
Primary uses enabled=true, Equal/ref1/compareMask1/writeMask0xff and all Keep.
This same primary override supports folder, default and later generic banners.
BG keeps source-disabled stencil. Explicit writeMask is necessary because the
current JSON has no register-header byte mask; source BufferMask=0 is not the
native runtime mask for these resources. Do not make 0xff a universal CGFX rule.

Three's material.stencilWrite enables stencil testing as well as writing: set
it from enabled, even for a read-only test. Map writeMask separately. Preserve
the a0d64a7 depthFunc, depthTest, depthWrite, culling, shader/combiners, texture
sampling and overlayCoverage behavior. Do not special-case Frame with a new
visible shader, ellipse or scissor.

drawGroup represents the outer native ordering (BG0, Frame1, primary2), while
the existing mesh layer/priority ordering stays inside that group. Apply the
group order to every generated model Group as well as the outer Group: Three's
projectObject replaces inherited groupOrder when visiting each nested Group.
Setting only the returned outer group would silently lose this ordering.

## 2. A mask-capable render transaction

The offscreen target must explicitly request stencilBuffer=true and clear to
stencil 0 once before the ordered passes. Keep autoClear=false through Frame
and primary, using the same external BannerCamera for drawing and model.update.
There must be no clear, target switch or readback between the producer and its
consumer. The frame is a sibling of the primary, never a child of its yaw/scale.

For the first bounded integration, retain the current Canvas background path
and the existing transparent folder transfer. Inside the primary transaction,
draw authored Frame group1 then primary group2 to the same target, then run
copyNativeOverlay once. The existing BG draw already precedes this transaction
on Canvas; it must not become subject to the primary stencil test. This keeps
the established folder-label coverage bridge intact. A later unified BG/frame/
primary transaction can use groups0/1/2, but should be reviewed separately with
native chrome ordering rather than changing that UI composition in this patch.

Retain the label texture/material visibility calls, explicit clip selection,
source bind matrices, camera-based Y-axial billboard update and alpha coverage
transfer. The frame writes no color or depth because its stencil test is Never.
Renderer target/viewport/scissor/clear color/tone mapping/auto-clear restoration
remains in finally; include any stencil clear state changed by the transaction.
Missing Frame/camera fails the masked draw explicitly, without silently drawing
an unmasked primary. Track Frame readiness/failure separately from BG readiness.

## 3. Explicit translation samples

Before this implementation, HomeFolderBannerMotion and FolderBannerRenderFrame contain no
native +0x90/+0x94/+0x98 equivalents. +0x90 cannot be reconstructed from their
yaw/scale/clocks or from the animated resource skeleton.

Add explicit render-frame fields:

```ts
nativeDisplacementY: number; // manager +0x90; also the Frame's Y
offsetX: number;             // manager +0x98
offsetY: number;             // manager +0x94
```

Primary outer position=(offsetX, nativeDisplacementY+offsetY, 0).
Frame position=(0, nativeDisplacementY, 0), rotation identity, scale identity.
Only copy Frame Y while the primary sample is actually visible, matching the
native guard; a hidden draw does not reset its retained Y. These fields are
outside resource skeletal animation, so BannerDef's authored root bob must not
move Frame. Reduced motion may freeze the supplied native sample by host policy;
the renderer must not invent a clock or derive a replacement value.

The existing adapter may explicitly provide all three zeros for its current
idle-only motion contract: native constructors/resets set them to zero and
zero-input ARM updates keep +0x90 at zero. That is a declared missing reactive
motion feature, not a claim that native +0x90 is always zero. Supporting native
impulses later requires the pure lifecycle to own +0x78/+0x80/+0x84/+0x8c/+0x90
and an evidenced input sample, then forward these fields. Do not bolt bounce
simulation or retained time into painting. Root decides that separate scope.

## Acceptance for the later implementation

- Source Never/Equal and Replace/Keep mappings; mask0 vs mask255 are distinct.
- Runtime override reaches all primary materials and survives clip updates.
- Nested group ordering remains BG0/Frame1/primary2 independent of insertion.
- Authored Frame indices/positions and source camera are used without fitting.
- Offsets distinguish Frame Y from primary total Y and resource bone bob.
- Frame then primary draw without intervening clear; restoration on failure.
- Existing depth, folder label, billboard, blend coverage and camera tests pass.
- Root owns GPU/browser/native matched comparison and public pack promotion.

Implementation ownership: presentation worktree owns firmware-model.ts, firmware-banner.ts, their focused tests and the narrowly required zero offset fields in console-scene.ts. Root owns public pack promotion and browser/native comparison. Include a0d64a7 and bac8580 as dependencies so the current shared-clock integration is preserved.
