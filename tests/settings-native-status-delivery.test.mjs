import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';

const root=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
const read=path=>readFileSync(new URL(path,root));
const P='packs/settings/contents/0000-0000003d/';

test('Settings title-owned HUD and selected clips retain source provenance',()=>{
 const manifest=JSON.parse(read('manifest.json')),bytes=read(P+'hud.json'),pack=JSON.parse(bytes);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),manifest.resources[P+'hud.json'].sha256);
 assert.deepEqual(pack.layouts.HudMset_00.canvas,{height:240,origin:1,width:400});
 assert.deepEqual(pack.layouts.HudMset_00.fonts,['cbf_std.bcfnt','Hud.bcfnt']);
 const expected={
  HudMset_00:'834c8f31e06d5c43bc2e651d59a2754a0c69346997df8e543f6a833200981114',
  HudMset_00_Bat:'e8c70db4c5f366e5251aba8c93e2a32a7622e595e511d000ac063f567de83729',
  HudMset_00_NetAtn:'8e1a28d1c8647356acfd92e18c5aa7a778d0a5dc6446d3b723f515044f86d319',
  HudMset_00_NetMode:'d4bec198755ca3220dc355a46201d109bc3ddf32ddb16023ba4bef4fdac64a70',
  HudMset_00_WhiteBlack:'cf5b0590bc2a6374a2eec476c7c49372fd70afeddd4e808da650b30942ba77b6',
 };
 for(const [name,sha256] of Object.entries(expected)){
  const source=name==='HudMset_00'?pack.resourceSources.layouts[name]:pack.resourceSources.animations[name];
  assert.equal(source.sha256,sha256,name);assert.equal(source.titleId,'0004001000022000',name);
 }
 for(const texture of Object.values(pack.textures))assert.ok(manifest.resources[texture.url],texture.url);
});

test('Settings HUD uses the source English status/date labels',()=>{
 const bank=JSON.parse(read(P+'message_EU.json')).messages.hud;
 const text=label=>bank.messages[bank.labels[label]].text;
 assert.equal(text('lau_connect0'),'Internet');assert.equal(text('lau_date'),'%d/%M (%w)');
 assert.equal(text('day_24'),'24');assert.equal(text('month_9'),'09');assert.equal(text('week_thu'),'Thu');
 assert.equal(typeof bank.messages[bank.labels.lau_connect0].styleIndex,'number');
 assert.equal(typeof bank.messages[bank.labels.lau_date].styleIndex,'number');
});

test('Settings captured orange battery uses its exact native HUD texture',async()=>{
 const source=readFileSync(new URL('../src/os/stock-native-settings.ts',import.meta.url),'utf8');
 const status=/SETTINGS_PORTFOLIO_STATUS=\{batteryFrame:(\d+)/.exec(source);
 assert.ok(status,'declared Settings status');
 const pack=JSON.parse(read(P+'hud.json'));
 const track=pack.animations.HudMset_00_Bat.tracks.find(track=>track.target==='P_Bat_00'&&track.property==='texture.pattern');
 assert.ok(track,'firmware battery pattern track');
 const sourceIndex=track.keys.find(key=>key.frame===Number(status[1]))?.value;
 assert.equal(pack.animations.HudMset_00_Bat.textures[sourceIndex],'HudBat_04.bclim');
 assert.equal(pack.textures['HudBat_04.bclim'].sourceSha256,pack.resourceSources.textures['HudBat_04.bclim'].sha256);
 const texture=await sharp(read(pack.textures['HudBat_04.bclim'].url)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const pixel=(x,y)=>[...texture.data.subarray((y*texture.info.width+x)*4,(y*texture.info.width+x+1)*4)];
 // Raw native LCD samples at x=380 (pane-local x=12), y=8..10 in the
 // settings-main-native-recovery-20260926 capture; the source frame matches.
 assert.deepEqual([pixel(12,8),pixel(12,9),pixel(12,10)],[
  [221,136,68,255],[204,102,51,255],[221,102,51,255],
 ]);
});
