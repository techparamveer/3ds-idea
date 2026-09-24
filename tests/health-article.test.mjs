import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { healthArticleGlyphs, healthArticleLayout, healthArticleMetrics } from '../src/os/stock-health-article.ts';
import { healthDocumentArticles, healthDocumentRows } from '../src/os/stock-health-layout.ts';

const json=path=>JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/'+path,import.meta.url),'utf8'));
const manifest=json('fonts/shared/font.json');
const bank=json('packs/health-and-safety/messages-and-loose.json').messages.safe_msbt_LZ;
const tokens=label=>bank.messages[bank.labels[label]].tokens;
const pane=[50,50,50,255];

test('parser metrics of the delivered English articles match the native rows and extents',()=>{
  const expected={'3d':[95,1827,[39]],general:[334,6846,[39]],usage:[208,4200,[375,1049.7001953125]]};
  for(const [topic,label] of Object.entries(healthDocumentArticles)){
    const metrics=healthArticleMetrics(tokens(label)),[rows,maxScroll,warnings]=expected[topic];
    assert.deepEqual([metrics.rows,metrics.maxScroll,metrics.warningHeights],[rows,maxScroll,warnings],topic);
    assert.equal(healthDocumentRows[topic],rows,`${topic} reducer rows`);
  }
});

test('warning icons use the native prefix width and parser height',()=>{
  assert.deepEqual(healthArticleLayout(manifest,tokens('article_3'),pane).warnings,[{x:-70.99998474121094,y:-273},{x:-70.99998474121094,y:-947.7001953125}]);
});

test('glyph records reproduce replayed native samples: size runs, baselines and colour restore',()=>{
  const glyphs=healthArticleGlyphs(manifest,tokens('article_1'),pane);
  assert.deepEqual([glyphs.length,healthArticleGlyphs(manifest,tokens('article_2'),pane).length,healthArticleGlyphs(manifest,tokens('article_3'),pane).length],[2326,9292,5195]);
  const pick=(code,y)=>glyphs.find(g=>g.code===code&&(y===undefined||g.y===y));
  const sample=g=>[g.x,g.y,g.width,g.height,[...g.color]];
  assert.deepEqual(sample(glyphs[0]),[5.400000095367432,21,0,18,pane],'first space after the leading newline');
  assert.deepEqual(sample(glyphs[14]),[90.00001525878906,21,0,18,pane],'U+25B3 is drawn as U+3000');
  assert.deepEqual(sample(pick(87)),[95.40001678466797,15.749998092651367,17.82000160217285,24.30000114440918,pane],'135% WARNING shares the base baseline');
  assert.deepEqual(sample(pick(0x25cf)),[0.6899999976158142,86.55000305175781,15.180000305175781,20.700000762939453,[0,160,180,255]],'bullet colour run');
  assert.deepEqual(pick(84,86.55000305175781).color,pane,'opaque black restores the previous colour');
  assert.ok(glyphs.some(g=>g.color.join()==='85,85,85,255'),'grey body run is literal');
  for(const label of Object.values(healthDocumentArticles))assert.ok(Math.max(...healthArticleGlyphs(manifest,tokens(label),pane).map(g=>g.x+g.width))<284,`${label} never reaches the wrap width`);
});
