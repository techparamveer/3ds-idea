import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';

// List 820 / seam 56: shared 0x18fe2c, renderer coverage gap. Tests never pass the scenario.
const firmware=new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const painter=readFileSync(new URL('../src/os/stock-native-personal-tools.ts', import.meta.url), 'utf8');
const renderer=readFileSync(new URL('../src/os/native-renderer.ts', import.meta.url), 'utf8');
const news=JSON.parse(readFileSync(new URL('packs/notifications/news.json', firmware), 'utf8'));
const flatten=panes=>panes.flatMap(pane=>[pane, ...flatten(pane.children??[])]);
const layout=news.layouts.NewsWndwNews_D_00;
const pane=name=>flatten(layout.roots).find(item=>item.name===name);
const titleB=pane('T_NewsTitleB_00'), titleF=pane('T_NewsTitleF_00');

test('title panes are alignment 3 / line alignment 2; B is the white back at y -9.5', ()=>{
  assert.equal(news.titleId, '000400300000a002');
  assert.equal(news.sourceSha256, '4b4e5bd8b63d0c8859ba10e3daa4ac819b53e0f16ca3e9d4a401c0cdeb819366');
  assert.equal(news.resourceSources.layouts.NewsWndwNews_D_00.sha256, 'dfa42ef3e245a0abd77afba4653352aaf685fbdda65a91550b163421cf91ce80');
  for(const title of [titleB, titleF]){
    assert.equal(title.origin, 0);
    assert.deepEqual(title.size, [216, 18]);
    assert.deepEqual([title.text.alignment, title.text.lineAlignment], [3, 2]);
    assert.deepEqual(title.text.size, [15.000000953674316, 18]);
  }
  assert.deepEqual(titleB.translation, [52, -9.5, 0]);
  assert.deepEqual(layout.materials[titleB.text.material].constantColors[0], [255, 255, 255, 255]);
  assert.equal(titleF.translation[1], -8.000740051269531);
  assert.deepEqual(layout.materials[titleF.text.material].constantColors[0], [50, 50, 50, 255]);
  assert.deepEqual(layout.materials[pane('P_Blln_00').picture.material].constantColors[0].slice(0, 3), [216, 251, 255]);
  for(const name of ['NewsWndwNews_D_00_SceneIn', 'NewsWndwNews_D_00_Select']){
    assert.equal(news.animations[name].tracks.some(track=>track.target.startsWith('T_NewsTitle')), false, name);
  }
});

// Ungated 3/2 still misses the old lineAlignment===0 term; the host predicate now includes allowlisted writer0101.
test('0x101 is the shared flag constructor; ungated 3/2 misses direct, titles bind writer-0x101 by allowlist', ()=>{
  assert.match(renderer, /text\.lineAlignment===0\|\|sourceSize&&text\.alignment===4&&text\.lineAlignment===2\|\|writer0101/);
  assert.match(renderer, /writer0101=explicitPane&&!sourceSize/);
  const font=readFileSync(new URL('../src/os/bitmap-font.ts', import.meta.url), 'utf8');
  assert.match(font, /\(alignment===4\|\|alignment===3&&this\.manifest\.colorMode==='alpha'\)&&lineAlignment===0/);
  const sourceSize=false;
  const ungatedDirect=titleB.text.lineAlignment===0||sourceSize&&titleB.text.alignment===4&&titleB.text.lineAlignment===2;
  assert.equal(ungatedDirect, false, 'ungated 3/2 still misses the old lineAlignment===0 term');
  assert.match(painter, /T_NewsTitleB_00:\{text:row\.label\},T_NewsTitleF_00:\{text:row\.label\}/);
  const section=painter.slice(painter.indexOf("renderer.packs['notification-messages']"), painter.indexOf("options.font?.draw(bottom,view.text"));
  assert.deepEqual(section.match(/textSampling[^,]*/g), ["textSampling:'lcd'", "textSamplingPanes:['T_NewsTitleB_00'", "textSampling:'lcd'", "textSamplingPanes:['T_EndB_00']"]);
  assert.match(painter, /textSamplingPanes:\['T_NewsTitleB_00','T_NewsTitleF_00'\]/);
  assert.equal(/azahar-12p4-fit|textCoverageAdaptation/.test(section), false);
});

test('news code.bin has one flag constructor and one origin writer; line alignment 2 is low bit 1', t=>{
  const path='/Users/paramveer/.codex/3ds-artifact-overflow/assets/stock-ui/extracted/notifications/exefs/code.bin';
  if(!existsSync(path))return t.skip('private Notifications code.bin is absent');
  const code=readFileSync(path);
  assert.equal(createHash('sha256').update(code).digest('hex'), 'b3993f1e4fe5ed7e5760f0f4c3926c95b42ea8de53c25bb95864499342e5b228');
  const word=address=>code.readUInt32LE(address-0x100000);
  // Line alignment 2 → mov r0,#1, then alignment 3 ors 0x100 and not 0x10 → flags 0x101.
  assert.deepEqual([0x16b0ec, 0x16b0f0, 0x16b128, 0x16b14c, 0x16b150, 0x16b16c, 0x16b170].map(word),
    [0xe3510002, 0x0a00000c, 0xe3a00001, 0xe3520001, 0x03800010, 0xe3510001, 0x03800c01]);
  const callers=dest=>{
    const hits=[];
    for(let off=0; off+4<=code.length; off+=4){
      const instruction=code.readUInt32LE(off);
      if((instruction>>>24)!==0xeb)continue;
      let imm=instruction&0xffffff;
      if(imm&0x800000)imm-=0x1000000;
      const at=0x100000+off;
      if(((at+8+(imm<<2))>>>0)===dest)hits.push(at);
    }
    return hits;
  };
  assert.deepEqual(callers(0x16b080), [0x16b264]);
  assert.deepEqual(callers(0x18fe2c), [0x190138]);
  assert.equal(word(0x190138), 0xebffff3b);
});
