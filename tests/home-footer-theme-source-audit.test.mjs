import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const evidence = read('../docs/evidence/home-footer-theme-runtime.json');
const launcher = read('../public/os/firmware/10.7.0-32E/packs/home/launcher.json');

function findPane(node, name) {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findPane(child, name);
      if (found) return found;
    }
  } else if (node && typeof node === 'object') {
    if (node.kind && node.name === name) return node;
    for (const child of Object.values(node)) {
      const found = findPane(child, name);
      if (found) return found;
    }
  }
  return null;
}

test('decoded LncBtmBtn_02 button and edge retain identical authored material inputs', () => {
  assert.equal(launcher.titleId, evidence.sources.titleId);
  assert.equal(launcher.sourceSha256, evidence.sources.layoutSourceSha256);
  const layout = launcher.layouts[evidence.sources.layout];
  const paneMaterialIndexes = {};
  for (const name of ['P_BtnW_C_01', 'P_EdgeW_C_01']) {
    const pane = findPane(layout.roots, name);
    assert.ok(pane, name);
    paneMaterialIndexes[name] = pane.picture.material;
  }
  assert.deepEqual(paneMaterialIndexes, evidence.decodedLayout.paneMaterialIndexes);
  const materials = Object.values(paneMaterialIndexes).map(index => layout.materials[index]);
  assert.deepEqual(
    Object.fromEntries(Object.entries(materials[0]).filter(([key]) => key !== 'name')),
    Object.fromEntries(Object.entries(materials[1]).filter(([key]) => key !== 'name')),
  );
  assert.deepEqual(materials[0].constantColors, evidence.decodedLayout.constantColors);
  assert.deepEqual([0, 2, 1].map(index => materials[0].constantColors[index].slice(0, 3)),
    evidence.decodedLayout.defaultProducerRgb);
});

test('source audit keeps the runtime route explicit and refuses an inferred color correction', () => {
  assert.equal(evidence.status, 'source-gap');
  assert.deepEqual(evidence.executable.producer.directCallSites, ['0x1d3514', '0x1d35b4']);
  assert.deepEqual(evidence.executable.producer.materialSlots, [0, 2, 1]);
  assert.deepEqual(evidence.executable.paneNames.slice(0, 2), ['P_BtnW_C_01', 'P_EdgeW_C_01']);
  assert.deepEqual(evidence.executable.route.activeGate, {offset: '+0x10', requiredValue: 1});
  assert.equal(evidence.executable.route.managerObjectBase, '0x35f9d8');
  assert.equal(evidence.executable.route.activeRecordOffset, '+0x74');
  assert.equal(evidence.executable.route.defaultRecordOffset, '+0x5c');
  assert.match(evidence.sourceGap.missing, /nine runtime RGB bytes/);
  assert.equal(evidence.sourceGap.activeGateAddress, '[*0x35f9ec]+0x10');
  assert.match(evidence.sourceGap.conclusion, /^No footer color correction is source-supported/);
});
