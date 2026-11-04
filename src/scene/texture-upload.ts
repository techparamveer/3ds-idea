import * as THREE from 'three';

/** Uploads every texture the visible model samples, one texture per task, and
 * resolves once all are resident. The first render then has nothing left to
 * upload, and network and decode callbacks run between the uploads instead of
 * waiting behind one long task. Uploading early changes no pixels: it is the
 * same `initTexture` path the first render would take. */
export async function uploadModelTextures(renderer: THREE.WebGLRenderer, root: THREE.Object3D) {
  const textures = new Set<THREE.Texture>();
  root.traverseVisible(object => {
    if (!(object instanceof THREE.Mesh)) return;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (material.visible) for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  for (const texture of textures) {
    renderer.initTexture(texture);
    await yieldToMain();
  }
}

// setTimeout(0) is clamped to 4 ms once nested, which adds up over ~30 textures.
function yieldToMain(): Promise<void> {
  const scheduler = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  if (scheduler?.yield) return scheduler.yield();
  return new Promise(resolve => { const channel = new MessageChannel(); channel.port1.onmessage = () => { channel.port1.close(); resolve(); }; channel.port2.postMessage(null); });
}
