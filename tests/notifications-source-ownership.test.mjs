import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = new URL('../public/os/firmware/10.7.0-32E/packs/notifications/', import.meta.url);
const news = JSON.parse(readFileSync(new URL('news.json', root), 'utf8'));
const slidebar = JSON.parse(readFileSync(new URL('slidebar.json', root), 'utf8'));
const panes = layout => {
  const visit = pane => [pane, ...pane.children.flatMap(visit)];
  return layout.roots.flatMap(visit);
};

test('notification row icon has delivered CIC content; unread marker still needs runtime content', () => {
  const row = news.layouts.NewsWndwNews_D_00;
  const byName = Object.fromEntries(panes(row).map(pane => [pane.name, pane]));
  assert.deepEqual(row.textures, [
    'IconMask.bclim', 'NewsBlln.bclim', 'NewsBllnDir.bclim',
    'NewsBllnTri.bclim', 'NewsIconShdw.bclim',
  ]);
  assert.equal(byName.P_Icon_00.kind, 'pic1');
  assert.equal(byName.N_IconNew_00.kind, 'pan1');
  assert.deepEqual(byName.N_IconNew_00.children, []);
  assert.deepEqual(byName.N_IconNew_00.size, [16, 16]);
  const image = readFileSync(new URL('../public/os/firmware/10.7.0-32E/textures/notifications-special-cic.png', import.meta.url));
  assert.equal(createHash('sha256').update(image).digest('hex'), news.textures['special.cic'].sha256);
  assert.equal(news.resourceSources.textures['special.cic'].sha256,
    '5e9170611dc93467c2e6b35fb71ed4f77ec387635eadea104ca5779fc4c3120f');
  assert.equal(news.textures['special.cic'].picaFormat, 3);
  const manifest = JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/manifest.json', import.meta.url), 'utf8'));
  const delivered = manifest.resources['textures/notifications-special-cic.png'];
  assert.equal(delivered.sha256, news.textures['special.cic'].sha256);
  assert.deepEqual(delivered.sources[0], {
    contentId: '00000012', contentIndex: 0, path: 'special.cic',
    sha256: news.resourceSources.textures['special.cic'].sha256,
    titleId: '000400300000a002', titleVersion: 4097,
  });
});

test('notification list and slider source geometry stays explicit', () => {
  const list = Object.fromEntries(panes(news.layouts.NewsTopUI_D_00).map(pane => [pane.name, pane]));
  const row = Object.fromEntries(panes(news.layouts.NewsWndwNews_D_00).map(pane => [pane.name, pane]));
  const bar = Object.fromEntries(panes(slidebar.layouts.SlideBar).map(pane => [pane.name, pane]));
  assert.deepEqual(list.N_ElemPos_00.translation, [-160, 100, 0]);
  assert.deepEqual(list.N_ElemPos_00.size, [264, 53]);
  assert.deepEqual(row.N_News_00.translation, [10, -15, -10]);
  assert.deepEqual(list.N_SlideBar_00.translation, [141, 14, 0]);
  assert.deepEqual(bar.SBBaseWndw.size, [16, 132]);
});
