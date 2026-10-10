import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHomeResumePresentation } from '../src/os/home-resume-presentation.ts';
import { suspendedBackgroundAsset } from '../src/scene/home-suspended-background.ts';
import { validateHomeResumeLowerAssets } from '../src/os/home-pause-lower.ts';

const identity = { owner: 'health-safety:1', captureGeneration: 2, resourceGeneration: 3 };

test('a destination change between sample and receipt rebases the unpresented source frame', () => {
  const presentation = createHomeResumePresentation(), destination = {};
  const first = presentation.sample(identity, 100, true, null);
  assert.equal(presentation.present(first, identity, true, null), true);
  const unpresented = presentation.sample(identity, 101, true, null);
  assert.equal(unpresented.frame, 1);
  assert.equal(presentation.present(unpresented, identity, true, destination), false);
  const rebound = presentation.sample(identity, 9000, true, destination);
  assert.notEqual(rebound, unpresented);
  assert.equal(rebound.frame, 1, 'readiness changes cannot spend an unpresented source frame');
  assert.equal(rebound.destination, destination);
  assert.equal(presentation.present(unpresented, identity, true, null), false);
  assert.equal(presentation.present(rebound, identity, true, destination), true);
});

test('a late native pair releases reduced terminal only through its own sampled receipt', () => {
  const presentation = createHomeResumePresentation(), destination = {}, replacement = {};
  const pending = presentation.sample(identity, 100, true, null, true);
  assert.equal(pending.frame, 40);
  assert.equal(presentation.present(pending, identity, true, destination), false);
  assert.equal(presentation.ready(identity), false);
  const ready = presentation.sample(identity, 101, true, destination, true);
  assert.equal(presentation.present(ready, identity, true, replacement), false);
  assert.equal(presentation.ready(identity), false);
  const current = presentation.sample(identity, 102, true, replacement, true);
  assert.equal(current.frame, 40);
  assert.equal(presentation.present(current, identity, true, replacement), true);
  assert.equal(presentation.ready(identity), true);
});

const background = JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/models/home-background/model.json', import.meta.url)));
const launcher = JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/home/launcher.json', import.meta.url)));
const asset = () => ({ data: structuredClone(background), images: new Map(background.textures.map(texture => [texture.name,
  { width: texture.width, height: texture.height, data: new Uint8ClampedArray(texture.width * texture.height * 4) }])) });

test('every selected SceneOut geometry and AppRestart tint/UV channel rejects source mutation', () => {
  const selected = [
    ['skeletalAnimations', 'BannerBG_SceneOut'],
    ['materialAnimations', 'BannerBG_AppRestart'],
  ];
  for (const [collection, name] of selected) {
    const clip = background[collection].find(clip => clip.Name === name);
    for (const [elementIndex, element] of clip.Elements.entries()) {
      for (const [channel, curve] of Object.entries(element.Content).filter(([, curve]) => curve?.Exists)) {
        for (const mutate of [curve => { curve.KeyFrames.at(-1).Value += .01; }, curve => { curve.StartFrame += 1; },
          curve => { curve.Exists = false; }, curve => { curve.PostRepeat = 'Repeat'; }]) {
          const input = asset();
          mutate(input.data[collection].find(clip => clip.Name === name).Elements[elementIndex].Content[channel]);
          assert.throws(() => suspendedBackgroundAsset(input), /Unsupported native suspended background/, `${name}/${element.TargetType}/${channel}`);
        }
      }
    }
  }
  const original = asset(), before = JSON.stringify(original.data);
  suspendedBackgroundAsset(original);
  assert.equal(JSON.stringify(original.data), before, 'source selection never changes decoded tracks');
});

test('all ten original lower SceneOut channels remain required and unchanged', () => {
  validateHomeResumeLowerAssets(launcher);
  for (let index = 0; index < 10; index++) {
    const changed = structuredClone(launcher);
    changed.animations.LncPauseFade_D_00_SceneOut.tracks[index].keys.at(-1).value += .01;
    assert.throws(() => validateHomeResumeLowerAssets(changed), /lower resume source/);
  }
});
