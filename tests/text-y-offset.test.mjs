import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import ts from 'typescript';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(new URL('../package.json', import.meta.url));
const source=fs.readFileSync(new URL('../src/os/bitmap-font.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {BitmapFont,nativeCenteredBlockY}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const firmware=new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const flatten=panes=>panes.flatMap(pane=>[pane, ...flatten(pane.children??[])]);
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const scale06=0.6000000238418579;
const size06=[25*scale06, 30*scale06];
const float64CeilY=(height, blockHeight)=>height/2-Math.ceil(blockHeight/2);

test('0x2ffc90 float32 half-block ceil differs from float64 only on the 0.6 ulp case', ()=>{
  assert.equal(nativeCenteredBlockY(36, 36), 0);
  assert.equal(nativeCenteredBlockY(36, 36.000001430511475), 0);
  assert.equal(float64CeilY(36, 36.000001430511475), -1);
  assert.equal(nativeCenteredBlockY(18, 18.000000715255737), 0);
  assert.equal(float64CeilY(18, 18.000000715255737), -1);
  // Even and odd pane heights with an exact integer block keep the same origin.
  assert.equal(nativeCenteredBlockY(36, 36), float64CeilY(36, 36));
  assert.equal(nativeCenteredBlockY(37, 36), float64CeilY(37, 36));
  assert.equal(nativeCenteredBlockY(21, 21), float64CeilY(21, 21));
  // Settings 0.7 two-line block with lineSpacing -2 does not jump.
  assert.equal(nativeCenteredBlockY(42, 39.99999928474426), 1);
  assert.equal(nativeCenteredBlockY(42, 39.99999928474426), float64CeilY(42, 39.99999928474426));
  // Camera TxtDlg 0.84 four-line block does not jump.
  assert.equal(nativeCenteredBlockY(152, 100.79999685287476), float64CeilY(152, 100.79999685287476));
});

test('generic middle writer uses float32 ceil; top/bottom and exact sizes stay put', ()=>{
  const glyph={sheet:0,x:1,y:1,width:7,height:17,left:0,advance:10};
  const font=new BitmapFont({schema:1,sourceSha256:'0'.repeat(64),width:25,height:30,ascent:25,baseline:25,lineFeed:30,
    colorMode:'alpha',sheets:['sheet-0.png'],glyphs:{65:glyph},fallback:glyph},[{naturalWidth:32,naturalHeight:32}]);
  const ys=(value,width,height,size,alignment,lineAlignment)=>{
    const calls=[];
    font.drawNative({drawImage:(...a)=>calls.push(a)},value,width,height,size,alignment,0,0,lineAlignment);
    return [...new Set(calls.map(call=>call[6]))];
  };
  const two='AA\nAA';
  assert.deepEqual(ys(two,130,36,size06,4,2), [0, size06[1]], 'alignment 4 / lineAlignment 2 / even pane');
  assert.deepEqual(ys(two,130,36,size06,3,2), [0, size06[1]], 'alignment 3 / lineAlignment 2 shares vertical origin');
  assert.deepEqual(ys(two,130,36,size06,5,0), [0, size06[1]], 'alignment 5 / automatic line also middle-centred');
  assert.deepEqual(ys('AA',142,18,size06,4,2), [0], 'single-line 0.6 unread pane');
  assert.equal(ys(two,130,36,size06,4,2)[0], nativeCenteredBlockY(36, size06[1]*2));
  assert.notEqual(ys(two,130,36,size06,4,2)[0], float64CeilY(36, size06[1]*2));
  // Exact pane glyph size 18 does not need the ulp fix; origin 7 is pane-local, not this Y.
  assert.deepEqual(ys(two,130,36,[15,18],4,2), [0, 18]);
  assert.deepEqual(ys(two,130,37,[15,18],4,2), [0.5, 18.5], 'odd pane height keeps *.5 when the block is exact');
  assert.deepEqual(ys(two,130,40,size06,1,2), [0, size06[1]], 'top-centre alignment 1 does not take the middle ceil');
  assert.deepEqual(ys(two,130,40,size06,4,2), [2, 2+size06[1]], 'middle on a taller pane is height/2 − 18, not − 19');
  assert.equal(float64CeilY(40, size06[1]*2), 1);
  const bottom=ys(two,130,36,size06,7,2);
  assert.equal(bottom[0], 36-(size06[1]*2), 'bottom-centre alignment 7 uses height-blockHeight');
  assert.notEqual(bottom[0], nativeCenteredBlockY(36, size06[1]*2));
  const scaled=[];
  font.drawNative({drawImage:(...a)=>scaled.push(a)},two,130,36,size06,4,0,0,2,[0,0],false,undefined,undefined,[],false,false,undefined,undefined,[{start:0,end:5,scale:1}]);
  assert.deepEqual([...new Set(scaled.map(call=>call[6]))], [0, size06[1]], 'glyphScaleSpans shares the same middle origin');
});

test('Notifications card panes are the 0.6 / origin-7 / lineAlignment-2 generic case; balloon and Close are not', ()=>{
  const news=JSON.parse(readFileSync(new URL('packs/notifications/news.json', firmware), 'utf8'));
  const messages=JSON.parse(readFileSync(new URL('packs/notifications/messages-and-loose.json', firmware), 'utf8'));
  const fontJson=JSON.parse(readFileSync(new URL('fonts/shared/font.json', firmware), 'utf8'));
  const unread=Object.fromEntries(flatten(news.layouts.NewsUnread_U_00.roots).map(pane=>[pane.name, pane]));
  const btn=Object.fromEntries(flatten(news.layouts.NewsTopBtn_D_00.roots).map(pane=>[pane.name, pane]));
  const row=Object.fromEntries(flatten(news.layouts.NewsWndwNews_D_00.roots).map(pane=>[pane.name, pane]));
  const bank=messages.messages.newslist_msbt_LZ;
  const styles=messages.styles[bank.styleTable].styles;
  assert.equal(fontJson.ascent, 25);
  assert.equal(fontJson.baseline, 25);
  assert.equal(fontJson.lineFeed, 30);
  assert.equal(fontJson.colorMode, 'alpha');
  for(const name of ['T_News_00', 'T_Cnt_00', 'T_NewsUnread_00', 'T_CntUnread_00']){
    assert.equal(unread[name].origin, 7, name);
    assert.equal(unread[name].text.alignment, 4, name);
    assert.equal(unread[name].text.lineAlignment, 2, name);
  }
  assert.deepEqual(unread.T_News_00.size, [130, 36]);
  assert.deepEqual(unread.T_NewsUnread_00.size, [142, 18]);
  for(const index of [104, 105, 106, 107]){
    assert.deepEqual(styles[index].fontScale, [scale06, scale06], index);
  }
  const size=[fontJson.width*scale06, fontJson.height*scale06];
  assert.equal(size[1], 18.000000715255737);
  const twoLine=size[1]+(2-1)*(fontJson.lineFeed*size[1]/fontJson.height);
  assert.equal(nativeCenteredBlockY(36, twoLine), 0);
  assert.equal(float64CeilY(36, twoLine), -1);
  assert.equal(nativeCenteredBlockY(18, size[1]), 0);
  assert.equal(float64CeilY(18, size[1]), -1);

  const font=new BitmapFont(fontJson, fontJson.sheets.map(()=>({naturalWidth:4096,naturalHeight:4096})));
  const ys=(value,width,height)=> {
    const calls=[];
    font.drawNative({drawImage:(...a)=>calls.push(a)},value,width,height,size,4,0,0,2);
    return [...new Set(calls.map(call=>call[6]))];
  };
  assert.deepEqual(ys(bank.messages[bank.labels.new_news_u1].text, 130, 36), [0, size[1]]);
  assert.deepEqual(ys('Unread: 8', 142, 18), [0]);

  assert.equal(unread.T_Unread_00.origin, 1);
  assert.equal(unread.T_Unread_00.text.alignment, 4);
  assert.equal(unread.T_Unread_00.text.lineAlignment, 1);
  const balloon=unread.T_Unread_00;
  const balloonSize=[fontJson.width*0.75, fontJson.height*0.75];
  assert.deepEqual(balloonSize, [18.75, 22.5]);
  assert.equal(nativeCenteredBlockY(balloon.size[1], balloonSize[1]), float64CeilY(balloon.size[1], balloonSize[1]));

  assert.equal(btn.T_EndF_00.origin, 1);
  assert.equal(btn.T_EndF_00.text.alignment, 4);
  assert.equal(btn.T_EndF_00.text.lineAlignment, 1);
  const closeScale=styles[103].fontScale[1];
  const closeSize=fontJson.height*closeScale;
  assert.equal(nativeCenteredBlockY(21, closeSize), float64CeilY(21, closeSize));

  assert.equal(row.T_NewsTitleF_00.origin, 0);
  assert.equal(row.T_NewsTitleF_00.text.alignment, 3);
  assert.equal(row.T_NewsTitleF_00.text.lineAlignment, 2);
  assert.equal(row.T_NewsTitleF_00.text.size[1], 18);
  assert.equal(nativeCenteredBlockY(18, 18), float64CeilY(18, 18));
});

test('hashed pair: official card boxes still go to 0 at browser dy -1; Close and list do not', async t=>{
  const root='/Users/paramveer/.codex/3ds-artifact-overflow';
  const files={
    native:`${root}/home-fidelity-20261001/native-reference/screenshots/_27.09.26_13.16.53.105.png`,
    upper:`${root}/home-fidelity-20261001/notifications-hud-recapture-matched-clock-20261004/browser/upper.png`,
    lower:`${root}/captures-20260927-postfix/reference/scenario-matrix/v1/captures/notifications-unread-dot-f073581/browser/lower.png`,
    report:`${root}/captures-20260927-postfix/reference/scenario-matrix/v1/comparisons/notifications-unread-dot-f073581/report.json`,
  };
  if(![files.native, files.upper, files.lower, files.report].every(existsSync)){
    return t.skip('private Notifications unread-dot pair is absent');
  }
  assert.equal(sha(files.native), '58fff71424e1301e6ead6d7ef9281689faa368bf0e6403dc6dccaef1f9afa389');
  assert.equal(sha(files.upper), 'e08ad93a64d49d2acf783dd8a89c816452c4abc996206a85398a691e357812bc');
  const sharp=require('sharp');
  const nativeFull=await sharp(files.native).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const browserU=await sharp(files.upper).ensureAlpha().raw().toBuffer();
  const browserL=await sharp(files.lower).ensureAlpha().raw().toBuffer();
  const nativeU=Buffer.alloc(400*240*4);
  const nativeL=Buffer.alloc(320*240*4);
  for(let y=0;y<240;y++){
    nativeU.set(nativeFull.data.subarray(y*nativeFull.info.width*4, (y*nativeFull.info.width+400)*4), y*400*4);
    nativeL.set(nativeFull.data.subarray(((240+y)*nativeFull.info.width+40)*4, ((240+y)*nativeFull.info.width+360)*4), y*320*4);
  }
  const rgb=(buf,w,h,x,y)=>{
    if(x<0||y<0||x>=w||y>=h)return [0,0,0];
    const i=(y*w+x)*4;
    return [buf[i], buf[i+1], buf[i+2]];
  };
  const over=(native,nw,nh,browser,bw,bh,x0,y0,x1,y1,dx=0,dy=0)=>{
    let n=0;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
      const a=rgb(native,nw,nh,x,y), b=rgb(browser,bw,bh,x+dx,y+dy);
      if(Math.max(Math.abs(a[0]-b[0]), Math.abs(a[1]-b[1]), Math.abs(a[2]-b[2]))>2)n++;
    }
    return n;
  };
  assert.equal(over(nativeU,400,240,browserU,400,240,0,28,400,240), 2892);
  const report=JSON.parse(readFileSync(files.report, 'utf8'));
  const body=report.screens.upper.regions.filter(region=>region.y>=28);
  assert.equal(body.length, 97);
  let shifted=0;
  for(const region of body){
    shifted+=over(nativeU,400,240,browserU,400,240,region.x,region.y,region.x+region.width,region.y+region.height,0,-1);
  }
  assert.equal(shifted, 0);
  assert.equal(over(nativeL,320,240,browserL,320,240,125,216,195,234), 521);
  assert.ok(over(nativeL,320,240,browserL,320,240,125,216,195,234,0,-1)>521);
  assert.equal(over(nativeL,320,240,browserL,320,240,0,0,291,210), 820);
  assert.ok(over(nativeL,320,240,browserL,320,240,0,0,291,210,0,-1)>820);
});
