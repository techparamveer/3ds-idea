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

test('decoded receive-lamp loop samples time since its origin and snapshot endpoints',()=>{
  assert.equal(tools.notificationReceiveLampFrame(0),0);
  assert.equal(tools.notificationReceiveLampFrame(1003),60);
  assert.equal(tools.notificationReceiveLampFrame(2007),0);
  assert.equal(tools.notificationReceiveLampFrame(Number.NaN),0);
  assert.equal(tools.notificationReceiveLampFrame(-100),0);
  assert.equal(tools.notificationReceiveLampFrame(0,true),60);
  // Measured native epoch: 120 frames span 2.0059 s and frame 0 is the origin.
  assert.equal(tools.notificationReceiveLampFrame(2005),119);
  assert.equal(tools.notificationReceiveLampFrame(2006),0);
  assert.equal(tools.notificationReceiveLampFrame(1003,true),60);
});

test('paired paint key advances only for one of the five rendered unread rows',()=>{
  assert.equal(tools.notificationReceiveLampPaintKey(view(),0),0);
  assert.equal(tools.notificationReceiveLampPaintKey(view(),1003),60);
  assert.equal(tools.notificationReceiveLampPaintKey(view(),2007),0);
  assert.equal(tools.notificationReceiveLampPaintKey(view([]),1003),null);
  assert.equal(tools.notificationReceiveLampPaintKey(view([{id:'n1',label:'Read',value:''}]),1003),null);
  assert.equal(tools.notificationReceiveLampPaintKey({...view(),appId:'friends'},1003),null);
  assert.equal(tools.notificationReceiveLampPaintKey(view(),0,true),60);
  const rows=Array.from({length:9},(_,index)=>({id:`n${index}`,label:`Row ${index}`,value:index===8?'New':''}));
  assert.equal(tools.notificationReceiveLampPaintKey({...view(rows),selection:0},500),null);
  assert.equal(tools.notificationReceiveLampPaintKey({...view(rows),selection:8},500),29);
});

test('painter keeps the same non-settled loop pose through footer feedback',()=>{
  const calls=[];
  const renderer={packs:{notifications:{messages:{}},'notification-hud':{messages:{}},'notification-messages':lamp},draw(_ctx,alias,layout,options){
    calls.push({alias,layout,options});
    for(const attachment of Object.values(options?.attachments??{}))attachment();
    return true;
  }};
  const messages={messages:{newslist_msbt_LZ:{labels:{new_news_u:0,new_news_u0:1,new_news_u1:2,new_ce_u0:3,new_ce_u1:4,new_back:5},messages:Array.from({length:6},()=>({text:'%d'}))},hud_msbt_LZ:{labels:{lau_date:0},messages:[{text:'%d/%M (%w)'}]}}};
  renderer.packs['notification-messages']=messages;
  renderer.packs.notifications.messages=messages.messages;
  const paint=options=>{
    calls.length=0;
    assert.equal(tools.drawNativePersonalToolFrame(renderer,{}, {},view(),{elapsedMs:900000,notificationsLampElapsedMs:500,date:new Date(0),...options}),true);
    return calls.find(call=>call.alias==='notification-receivelamp').options.bindings;
  };
  const expected=[{name:'RcvLamp_00_ReceiveBlue',frame:29},{name:'RcvLamp_00_SceneIn',frame:20}];
  assert.deepEqual(paint({}),expected);
  assert.deepEqual(paint({notificationsFooterClose:{frame:5}}),expected);
  assert.deepEqual(paint({reducedMotion:true}),[{name:'RcvLamp_00_ReceiveBlue',frame:60},{name:'RcvLamp_00_SceneIn',frame:20}]);
  // The global page clock no longer selects the loop pose; only origin-relative time does.
  assert.deepEqual(paint({notificationsLampElapsedMs:undefined}),[{name:'RcvLamp_00_ReceiveBlue',frame:0},{name:'RcvLamp_00_SceneIn',frame:20}]);
  assert.deepEqual(paint({elapsedMs:1003}),expected);
});

test('screens anchor the loop only from the Notifications title incoming frame-0 destination paint',()=>{
  const screens=readFileSync(new URL('../src/os/screens.ts',import.meta.url),'utf8');
  assert.match(screens,/const notificationsIncomingStart=appletPose\?\.kind==='incoming'&&appletPose\.frame===0&&appletPose\.identity\.appId==='notifications';\n\s*graphics\.overlay\([^;]*,notificationsIncomingStart\);/);
  const graphics=readFileSync(new URL('../src/os/portfolio-screens.ts',import.meta.url),'utf8');
  assert.match(graphics,/stockScreens\.draw\([^;]*,notificationsIncomingStart\);/);
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
