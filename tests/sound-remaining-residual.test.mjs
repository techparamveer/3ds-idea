import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../package.json',import.meta.url));
const sharp=require('sharp');

const THRESHOLD=2;
const ROOT='/Users/paramveer/.codex/3ds-artifact-overflow';
const RECAP=`${ROOT}/home-fidelity-20261001/sound-clock-recapture-20261004`;
const REF=`${ROOT}/reference/screenshots`;
const files={
  nativeFirst:`${REF}/Nintendo 3DS Sound_25.09.26_22.27.14.541.png`,
  nativeEmpty:`${REF}/Nintendo 3DS Sound_25.09.26_22.31.31.595.png`,
  browserFirstUpper:`${RECAP}/browser-first-run/upper.png`,
  browserFirstLower:`${RECAP}/browser-first-run/lower.png`,
  browserEmptyUpper:`${RECAP}/browser-empty-entry/upper.png`,
  browserEmptyLower:`${RECAP}/browser-empty-entry/lower.png`,
};
const hashes={
  nativeFirst:'9dea0cc2fa7022ccd032c5a94ae59c2dbe37e6b7e800fbf8668b356fc9e5ce69',
  nativeEmpty:'65fc5f8819d31c49622d9e2a8ee7ba79c0675fd7dd3a73f783255eb7efe3b4cd',
  browserFirstUpper:'16565d8e586edce659beadb9e7f7d72bcd8e2b81479a85bca424480d4294ceab',
  browserFirstLower:'b9d1093ab9641460de6e9e0490707ae12d41008085ee8f7c9995d12fd504fbb9',
  browserEmptyUpper:'8d76f568cf79522a1febc689c44ac6b6f8328971e86e4dc4e535c1fe0a7216d0',
  browserEmptyLower:'ee103d93d744f5037fd36f24ad93403bf57298b2e1d74752da09d542023ea38d',
};

const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const load=async (p,w,h)=>{
  const raw=await sharp(p).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(raw.info.width,w);assert.equal(raw.info.height,h);assert.equal(raw.info.channels,4);
  return raw.data;
};
const cropNative=async (p,side)=>{
  const raw=await (side==='upper'
    ?sharp(p).extract({left:0,top:0,width:400,height:240})
    :sharp(p).extract({left:40,top:240,width:320,height:240})).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(raw.info.channels,4);
  return raw.data;
};
const over=(a,b,i)=>Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]))>THRESHOLD;
const count=(native,browser,w,rect)=>{
  const [x0,y0,x1,y1]=rect;let n=0;
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(over(native,browser,(y*w+x)*4))n++;
  return n;
};

test('recapture pairs keep the hashed HudTime-phase stills and isolate remaining clusters',async t=>{
 if(!Object.values(files).every(existsSync))return t.skip('private recapture pair is absent');
 for(const [key,path] of Object.entries(files))assert.equal(sha(path),hashes[key],key);
 const first={
  nativeUpper:await cropNative(files.nativeFirst,'upper'),nativeLower:await cropNative(files.nativeFirst,'lower'),
  browserUpper:await load(files.browserFirstUpper,400,240),browserLower:await load(files.browserFirstLower,320,240),
 };
 const empty={
  nativeUpper:await cropNative(files.nativeEmpty,'upper'),nativeLower:await cropNative(files.nativeEmpty,'lower'),
  browserUpper:await load(files.browserEmptyUpper,400,240),browserLower:await load(files.browserEmptyLower,320,240),
 };
 const upper=(pair,rect)=>count(pair.nativeUpper,pair.browserUpper,400,rect);
 const lower=(pair,rect)=>count(pair.nativeLower,pair.browserLower,320,rect);
 assert.equal(upper(first,[0,0,400,240]),6094);
 assert.equal(upper(empty,[0,0,400,240]),6404);
 assert.equal(lower(first,[0,0,320,240]),6267);
 assert.equal(lower(empty,[0,0,320,240]),16021);
 assert.equal(upper(first,[95,216,194,240]),0,'first-run clock ROI already matched');
 assert.equal(upper(empty,[95,216,194,240]),0,'empty-entry clock ROI already matched');
 assert.equal(upper(first,[230,216,400,240]),0);
 assert.equal(upper(empty,[230,216,400,240]),0);
 assert.deepEqual({
  title:upper(first,[0,3,400,30]),span:upper(first,[0,100,400,114]),birds:upper(first,[15,174,115,216]),
  volume:upper(first,[0,216,30,240]),battery:upper(first,[45,216,85,240]),
 },{title:1774,span:2314,birds:1558,volume:130,battery:1});
 assert.deepEqual({
  title:upper(empty,[0,3,400,30]),span:upper(empty,[0,100,400,114]),birds:upper(empty,[15,174,115,216]),
  volume:upper(empty,[0,216,30,240]),battery:upper(empty,[45,216,85,240]),batteryFill:upper(empty,[59,223,78,233]),
 },{title:1774,span:2442,birds:1558,volume:130,battery:183,batteryFill:182});
 assert.equal(upper(empty,[0,0,400,240])-upper(first,[0,0,400,240]),310);
 assert.equal(upper(empty,[0,100,400,114])-upper(first,[0,100,400,114]),128);
 assert.equal(upper(empty,[45,216,85,240])-upper(first,[45,216,85,240]),182);
 assert.equal(lower(first,[20,20,300,220]),195);
 assert.equal(lower(first,[138,196,182,213]),195);
 assert.deepEqual({
  row:lower(empty,[0,32,320,64]),iconFill:lower(empty,[0,38,7,57]),label:lower(empty,[56,37,280,57]),
  slider:lower(empty,[0,144,320,175]),footer:lower(empty,[0,178,320,240]),
 },{row:1916,iconFill:133,label:0,slider:4271,footer:4707});
});
