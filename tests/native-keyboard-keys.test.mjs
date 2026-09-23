import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const compile=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const layoutUrl=compile(readFileSync(new URL('../src/os/native-layout.ts',import.meta.url),'utf8'));
const {nativeNicknameQwertyPresentation:initializeWithStyles,applyNativeQwertyPaneSubmissions:submit}=await import(compile(readFileSync(new URL('../src/os/native-keyboard-keys.ts',import.meta.url),'utf8').replace("'./native-layout'",JSON.stringify(layoutUrl))));
const styleResources={styles:Array.from({length:221},()=>({fontScale:[13/25,18/30],lineSpacing:0,characterSpacing:0})),font:{width:25,height:30}};
const initialize=(layout,animations,messages,resources=styleResources)=>initializeWithStyles(layout,animations,messages,resources);
const flat=ps=>ps.flatMap(p=>[p,...flat(p.children)]),byName=l=>new Map(flat(l.roots).map(p=>[p.name,p]));
const pictureNames=['P_key_Cps','P_key_CpsIcon','P_key_Sft','P_key_SftIcon','P_romanKey_00','P_romanKey_01','P_romanKey_02','P_key_Ent','P_Key_EntIcon','P_dictionary','P_dictionaryIcon','P_Key_BspIconJP','P_key_01','P_key_02'];
const textNames=[...Array.from({length:45},(_,i)=>`T_key_${String(i).padStart(2,'0')}`),'T_key_Tra','T_dictionary','T_key_Spc','T_key_BspJP','T_Key_Cps','T_Key_Sft',...Array.from({length:3},(_,i)=>`T_romanKey_0${i}`)];
const names=[...pictureNames,...textNames,'B_dictionary',...Array.from({length:3},(_,i)=>`B_romanKey_0${i}`)];
const pane=name=>({kind:'pan1',name,flags:1,origin:4,alpha:255,translation:[0,0,0],rotation:[0,0,0],scale:[1,1],size:[20,20],children:[]});
function fixture(){
 const roots=[pane('RootPane')],materials=[];
 for(const name of names){const p=pane(name);roots[0].children.push(p);
  if(name.startsWith('P_')||name.startsWith('T_')){
   const id=materials.length;materials.push({name:name+'Ink',bufferColor:[0,0,0,255],constantColors:[],textureMaps:[],textureMatrices:[],coordinateGenerators:[],tevStages:[],unsupported:[]});
   if(name.startsWith('P_')){p.kind='pic1';p.picture={material:id,colors:Array.from({length:4},()=>[252,255,243,255]),uvSets:[]};}
   else {p.kind='txt1';p.text={material:id,font:0,value:'authored',size:[13,18],alignment:4,lineAlignment:0,characterSpacing:0,lineSpacing:0,topColor:[255,255,255,255],bottomColor:[255,255,255,255]};}
  }
 }
 const layout={canvas:{width:320,height:240,origin:1},roots,materials,textures:[],fonts:['source-font'],groups:[],unsupported:[]};
 const clips=['Keytop_qwerty_n0s1','Keytop_qwerty_s1t0','Keytop_qwerty_i0'];
 const animations=Object.fromEntries(clips.map((name,index)=>[name,{frames:2,loop:false,groups:[],textures:[],tracks:names.flatMap(target=>[
  {target,binding:'pane',property:'alpha',index:0,component:0,interpolation:'step',keys:[{frame:0,value:200-index},{frame:1,value:100-index}]},
  ...materials.filter(m=>m.name===target+'Ink').map(m=>({target:m.name,binding:'material',property:'materialColor.0.0',index:0,component:0,interpolation:'step',keys:[{frame:0,value:50+index},{frame:1,value:80+index}]})),
 ])}]));
 const labels=['qwerty_conv','qwerty_dic_en','qwerty_keytop'];
 const messages={labels:Object.fromEntries(labels.map((n,i)=>[n,i])),messages:labels.map(n=>({text:n==='qwerty_keytop'?"1234567890-qwertyuiopasdfghjkl'=/zxcvbnm,.?!@":n==='qwerty_dic_en'?'English':'',tokens:[],styleIndex:n==='qwerty_keytop'?null:n==='qwerty_conv'?220:171}))};
 return {layout,animations,messages};
}

test('initial property writes and immediate channels remain separate from the later five controller submissions',()=>{
 const {layout,animations,messages}=fixture(),out=initialize(layout,animations,messages),p=byName(out.layout);
 assert.equal(out.immediateSubmissions.length,8);assert.equal(out.firstLocalControllerSubmissions.length,5);
 assert.deepEqual(out.layout.roots[0].translation,[0,8,0]);
 assert.equal(p.get('P_key_Cps').alpha,200);assert.equal(p.get('P_key_Sft').alpha,200);
 assert.equal(p.get('P_romanKey_00').alpha,99);assert.equal(p.get('P_romanKey_00').flags&1,0);
 assert.equal(p.get('P_key_Ent').alpha,255);assert.equal(p.get('P_dictionary').alpha,255);
 const after=submit(out.layout,animations,out.firstLocalControllerSubmissions),next=byName(after);
 assert.equal(next.get('P_key_Ent').alpha,198);assert.equal(next.get('P_dictionary').alpha,198);
 assert.equal(next.get('P_key_02').alpha,255);assert.equal(next.get('T_key_02').alpha,255);
 assert.equal(p.get('P_key_Ent').alpha,255);assert.equal(next.get('P_key_Cps').alpha,200);
});
test('labels are resource-derived and only the conversion path applies message style',()=>{
 const f=fixture(),before=structuredClone(f);let out=initialize(f.layout,f.animations,f.messages),p=byName(out.layout);
 assert.equal(Array.from({length:45},(_,i)=>p.get('T_key_'+String(i).padStart(2,'0')).text.value).join(''),f.messages.messages[2].text);
 assert.equal(p.get('T_dictionary').text.value,'English');assert.equal(p.get('T_key_Tra').flags&1,0);assert.equal(p.get('P_Key_BspIconJP').alpha,0);
 assert.deepEqual(out.messageStyleApplications.map(s=>s.pane),['T_key_Tra']);
 for(const n of ['T_key_Spc','T_key_BspJP','T_Key_Cps','T_Key_Sft','T_romanKey_00','T_romanKey_01','T_romanKey_02'])assert.equal(p.get(n).text.value,'');
 for(const n of textNames){const {value,...style}=p.get(n).text;const {value:original,...source}=byName(f.layout).get(n).text;assert.deepEqual(style,source);}
 f.messages.messages[2].text='X'.repeat(45);out=initialize(f.layout,f.animations,f.messages);assert.equal(byName(out.layout).get('T_key_44').text.value,'X');
 f.messages.messages[2].text=before.messages.messages[2].text;assert.deepEqual(f,before);
});
test('a per-pane submission expands shares, then excludes source, other targets and descendants',()=>{
 const f=fixture(),source={target:'P_key_01',contentIndex:0,binding:'pane',property:'alpha',index:0,component:0,interpolation:'step',keys:[{frame:0,value:42}]};
 f.layout.groups=[{name:'keys',panes:['P_key_01','P_key_02'],children:[]}];
 const animation={frames:1,loop:false,groups:['keys'],textures:[],shares:[{sourcePane:'P_key_01',targetGroup:'keys'}],tracks:[source]};
 const result=byName(submit(f.layout,{shared:animation},[{pane:'P_key_02',clip:'shared',frame:0}]));
 assert.equal(result.get('P_key_02').alpha,42);assert.equal(result.get('P_key_01').alpha,255);
});
test('submission order is retained and source layout, animations and messages stay immutable',()=>{
 const f=fixture(),before=structuredClone(f),out=initialize(f.layout,f.animations,f.messages);
 const a={pane:'P_key_Cps',clip:'Keytop_qwerty_n0s1',frame:0},b={...a,frame:1};
 assert.equal(byName(submit(out.layout,f.animations,[a,b])).get(a.pane).alpha,100);
 assert.equal(byName(submit(out.layout,f.animations,[b,a])).get(a.pane).alpha,200);
 out.initializationOverrides.RootPane.translation[1]=999;out.layout.materials[0].bufferColor[0]=999;
 assert.deepEqual(f,before);
});
test('missing labels, malformed character maps and unbound target channels fail explicitly',()=>{
 const f=fixture();delete f.messages.labels.qwerty_dic_en;assert.throws(()=>initialize(f.layout,f.animations,f.messages),/message/);
 const g=fixture();g.messages.messages[2].text='short';assert.throws(()=>initialize(g.layout,g.animations,g.messages),/45/);
 assert.throws(()=>submit(g.layout,g.animations,[{pane:'absent',clip:'Keytop_qwerty_i0',frame:0}]),/pane/);
 assert.throws(()=>submit(g.layout,g.animations,[{pane:'RootPane',clip:'Keytop_qwerty_i0',frame:0}]),/No bound/);
});
test('native named-message metrics override only conversion, preserve other style fields and use float32 products',()=>{
 const f=fixture(),resources=structuredClone(styleResources);
 resources.styles[220]={fontScale:[Math.fround(.6),Math.fround(.6)],lineSpacing:-3.25,characterSpacing:2.75};
 resources.font={width:31,height:37};
 // The text-only routes ignore even a non-null style index on each UTF-16 unit.
 f.messages.messages[2].styleIndex=220;
 const before=structuredClone({f,resources}),out=initialize(f.layout,f.animations,f.messages,resources),p=byName(out.initializationLayout);
 assert.deepEqual(p.get('T_key_Tra').text.size,[18.600000381469727,22.200000762939453]);
 assert.equal(p.get('T_key_Tra').text.lineSpacing,-3.25);assert.equal(p.get('T_key_Tra').text.characterSpacing,2.75);
 for(const name of ['T_dictionary','T_key_00','T_key_44'])assert.deepEqual(p.get(name).text.size,[13,18]);
 assert.deepEqual(p.get('T_key_Tra').text.topColor,byName(f.layout).get('T_key_Tra').text.topColor);
 assert.deepEqual(out.messageStyleApplications,[{pane:'T_key_Tra',label:'qwerty_conv',styleIndex:220}]);
 assert.deepEqual({f,resources},before);
 assert.throws(()=>initialize(f.layout,f.animations,f.messages,{styles:[],font:resources.font}),/style resources/);
 f.messages.messages[0].styleIndex=null;
 const noStyle=initialize(f.layout,f.animations,f.messages,{styles:[],font:resources.font});
 assert.deepEqual(byName(noStyle.initializationLayout).get('T_key_Tra').text.size,[13,18]);
 assert.deepEqual(noStyle.messageStyleApplications,[]);
});
