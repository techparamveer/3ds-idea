import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import ts from 'typescript';

const firmware=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
const compile=name=>ts.transpileModule(readFileSync(new URL(`../src/os/${name}.ts`,import.meta.url),'utf8'),{
  compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022},
}).outputText;
const data=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const layoutUrl=data(compile('native-layout'));
const tools=await import(data(compile('stock-native-personal-tools')
  .replace("'./friends-footer-close-assets.ts'",JSON.stringify(new URL('../src/os/friends-footer-close-assets.ts',import.meta.url).href))
  .replace("'./device-status-profile'",JSON.stringify(data(compile('device-status-profile'))))
  .replace("'./native-layout'",JSON.stringify(layoutUrl))
  .replace("'./stock-screen-layout'",JSON.stringify(data('export const notesCaptureView=()=>null;export const NOTES_SWITCH_LAST_FRAME=0;')))));
const {poseNativeLayout,rasterNativePicture}=await import(layoutUrl);
const lamp=JSON.parse(readFileSync(new URL('packs/notifications/contents/0000-00000012/receivelamp.json',firmware),'utf8'));
const view=(rows=[{id:'n1',label:'Unread',value:'New'}])=>({appId:'notifications',screen:'main',heading:'',rows,selection:0,footer:{}});

test('decoded receive-lamp loop uses the existing elapsed clock and snapshot endpoints',()=>{
  assert.equal(tools.notificationReceiveLampFrame(0),0);
  assert.equal(tools.notificationReceiveLampFrame(1003),60);
  assert.equal(tools.notificationReceiveLampFrame(2007),0);
  assert.equal(tools.notificationReceiveLampFrame(Number.NaN),0);
  assert.equal(tools.notificationReceiveLampFrame(-100),0);
  assert.equal(tools.notificationReceiveLampFrame(0,true),60);
  assert.equal(tools.notificationReceiveLampFrame(0,false,true),60);
});

test('paired paint key advances only for visible unread lamps and freezes snapshots',()=>{
  assert.equal(tools.notificationReceiveLampPaintKey(view(),0),0);
  assert.equal(tools.notificationReceiveLampPaintKey(view(),1003),60);
  assert.equal(tools.notificationReceiveLampPaintKey(view(),2007),0);
  assert.equal(tools.notificationReceiveLampPaintKey(view([]),1003),null);
  assert.equal(tools.notificationReceiveLampPaintKey(view([{id:'n1',label:'Read',value:''}]),1003),null);
  assert.equal(tools.notificationReceiveLampPaintKey({...view(),appId:'friends'},1003),null);
  assert.equal(tools.notificationReceiveLampPaintKey(view(),0,true),60);
  assert.equal(tools.notificationReceiveLampPaintKey(view(),0,false,true),60);
});

test('painter binds the decoded loop pose while SceneIn remains settled',()=>{
  const calls=[];
  const renderer={packs:{notifications:{messages:{}},'notification-hud':{messages:{}},'notification-messages':lamp},draw(_ctx,alias,layout,options){
    calls.push({alias,layout,options});
    for(const attachment of Object.values(options?.attachments??{}))attachment();
    return true;
  }};
  const messages={messages:{newslist_msbt_LZ:{labels:{new_news_u:0,new_news_u0:1,new_news_u1:2,new_ce_u0:3,new_ce_u1:4,new_back:5},messages:Array.from({length:6},()=>({text:'%d'}))},hud_msbt_LZ:{labels:{lau_date:0},messages:[{text:'%d/%M (%w)'}]}}};
  renderer.packs['notification-messages']=messages;
  renderer.packs.notifications.messages=messages.messages;
  assert.equal(tools.drawNativePersonalToolFrame(renderer,{}, {},view(),{elapsedMs:1003,date:new Date(0)}),true);
  const draw=calls.find(call=>call.alias==='notification-receivelamp');
  assert.deepEqual(draw.options.bindings,[{name:'RcvLamp_00_ReceiveBlue',frame:60},{name:'RcvLamp_00_SceneIn',frame:20}]);
});

test('real native raster changes marker pixels across decoded ReceiveBlue poses',async()=>{
  const textures=new Map();
  for(const name of lamp.layouts.RcvLamp_00.textures){
    const resource=lamp.textures[name];
    const decoded=await sharp(fileURLToPath(new URL(resource.url,firmware))).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    textures.set(name,{width:decoded.info.width,height:decoded.info.height,data:new Uint8ClampedArray(decoded.data),picaFormat:resource.picaFormat});
  }
  const raster=frame=>{
    const posed=poseNativeLayout(lamp.layouts.RcvLamp_00,lamp.animations,[
      {name:'RcvLamp_00_ReceiveBlue',frame},{name:'RcvLamp_00_SceneIn',frame:20},
    ]);
    const pane=posed.roots[0].children.find(child=>child.name==='P_Rcv_00');
    return rasterNativePicture(posed,pane.picture,32,32,textures,pane.alpha/255).data;
  };
  const hash=data=>createHash('sha256').update(data).digest('hex');
  const low=raster(0),high=raster(60);
  assert.notEqual(hash(low),hash(high));
  assert.ok(low.some((value,index)=>value!==high[index]));
  assert.equal(hash(raster(120)),hash(low));
});
