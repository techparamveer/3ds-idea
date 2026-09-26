import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import ts from 'typescript';

const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const transpile=(name,overrides={})=>{
  const url=new URL(`../src/os/${name}.ts`,import.meta.url);
  const {outputText}=ts.transpileModule(readFileSync(url,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
  return moduleUrl(outputText.replace(/(from\s*['"])(\.[^'"]+)(['"])/g,(_all,prefix,path,suffix)=>prefix+(overrides[path]??new URL(path.endsWith('.ts')?path:`${path}.ts`,url).href)+suffix));
};
const {cameraScreenPacks,drawNativeCameraLower,drawNativeCameraFrame,cameraBrowseOrange,cameraDateGroupOrange,cameraBrowseUserColor,nativeLowerPaneRect,cameraPhotoMountRect,cameraThumbPicSize,cameraThumbPicRect,cameraFolderPicSize,cameraFolderPicRect,cameraBrowseBirdCenter,cameraBrowseSliderCenter,cameraBrowseSliderFrame}=await import(transpile('stock-native-camera',{
  './stock-screen-layout':transpile('stock-screen-layout'),
  './native-layout':transpile('native-layout'),
}));
const pack=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/camera/contents/0000-0000001a/lyt-P_Brws_D-arc-LZ.json',import.meta.url),'utf8'));
const finder=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/camera/contents/0000-0000001a/lyt-P_Finder_U-arc-LZ.json',import.meta.url),'utf8'));
const parakeet=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/camera/contents/0000-0000001a/lyt-Parakeet-arc-LZ.json',import.meta.url),'utf8'));
const messages=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/camera/contents/0000-0000001a/msg-EU_English.json',import.meta.url),'utf8'));
const find=(panes,name)=>{for(const pane of panes){if(pane.name===name)return pane;const child=find(pane.children??[],name);if(child)return child;}};
const view=(screen,rows=[],data={},selection=0)=>({appId:'camera',screen,heading:'Nintendo 3DS Camera',rows,selection,footer:{left:{action:'back',label:'Back'}},data});
const ctx=()=>{
  const log=[];
  return {log,bottom:{
    fillStyle:'',strokeStyle:'',font:'',textAlign:'',textBaseline:'',
    fillText:(...args)=>log.push(['fillText',...args]),
    fillRect:()=>{},beginPath:()=>{},rect:()=>{},clip:()=>{},save:()=>{},restore:()=>{},roundRect:(...args)=>log.push(['roundRect',...args]),
    fill:()=>{},stroke:()=>{},
  }};
};
function paint(screenView,imageResult=true){
  const {log,bottom}=ctx(),draws=[];
  const renderer={
    packs:{'camera-gallery':pack,'camera-finder':finder,'camera-bird':parakeet,'camera-messages':messages},
    draw(_ctx,_pack,layout,opts){draws.push({layout,opts,pack:_pack});return true;},
    drawLayout(_ctx,_pack,layout,source,opts){draws.push({layout,opts,pack:_pack,source});return true;},
  };
  const images=[];
  const okay=drawNativeCameraLower(renderer,bottom,screenView,{image:(_c,url,x,y,w,h)=>{images.push([url,x,y,w,h]);return imageResult;}});
  return {okay,draws,images,log};
}
function paintFrame(screenView,imageResult=true){
  const {log,bottom}=ctx(),draws=[],fills=[];
  const top={fillStyle:'',fillRect:(...args)=>fills.push(args)};
  const renderer={
    packs:{'camera-gallery':pack,'camera-finder':finder,'camera-bird':parakeet,'camera-messages':messages},
    draw(_ctx,_pack,layout,opts){draws.push({layout,opts,pack:_pack});return true;},
    drawLayout(_ctx,_pack,layout,source,opts){draws.push({layout,opts,pack:_pack,source});return true;},
  };
  const images=[];
  const okay=drawNativeCameraFrame(renderer,top,bottom,screenView,{image:(_c,url,x,y,w,h,fit)=>{images.push([url,x,y,w,h,...(fit?[fit]:[])]);return imageResult;}});
  return {okay,draws,images,log,fills};
}

test('published browse pack contains the large thumbnail clips the gallery now requests',()=>{
  const request=cameraScreenPacks[0];
  for(const name of request.layouts)assert.ok(pack.layouts[name],name);
  for(const name of request.animations)assert.ok(pack.animations[name],name);
  assert.deepEqual(pack.animations.P_BrwsFld_PicL.textures,['P_Thmb_Date5x7.bclim','P_Thmb_DatePho2x3.bclim']);
  assert.deepEqual(pack.animations.P_BrwsPic_PicL.textures,['P_Thmb_Pho2x3_SD.bclim','P_Thmb_Pho5x7.bclim']);
  assert.equal(pack.layouts.P_BrwsFld.textures[0],'P_Thmb_DatePho5x7.bclim');
  assert.equal(pack.layouts.P_BrwsPic.textures[1],'P_Thmb_Pho5x7_SD.bclim');
  const bank=messages.messages.P;
  assert.equal(bank.messages[bank.labels.Shoot_05].text,'View Photos/Videos');
});

test('settled browse draws source menu with its three native labels after the gallery',()=>{
  const menu=pack.layouts.P_BrwsMenu_D;
  for(const [pane,size] of [['BB-SShow',[320,30]],['BB-Shoot',[226,30]],['BB-Set',[90,30]]])assert.deepEqual(find(menu.roots,pane).size,size);
  const bank=messages.messages.P;
  assert.deepEqual(['Brws_02','Brws_03','setting'].map(label=>bank.messages[bank.labels[label]].text),['Slideshow','Shoot','Settings']);
  const {draws}=paint(view('gallery',[{id:'photo:a',label:'A'}],{photos:[{id:'a',src:'/portfolio/a.jpg'}]}));
  const chrome=draws.find(draw=>draw.layout==='P_BrwsMenu_D');
  assert.equal(draws.at(-2),chrome,'source menu overlays the gallery before its parakeet');
  assert.deepEqual(chrome.opts.bindings,[{name:'P_BrwsMenu_D_Brws',frame:0}]);
  assert.deepEqual([chrome.opts.overrides.TxtSShow.text,chrome.opts.overrides.TxtShoot.text,chrome.opts.overrides.TxtSet.text],['Slideshow','Shoot','Settings']);
});

test('browse parakeet uses the published Camera Wait artwork at its source menu anchor',()=>{
  const request=cameraScreenPacks.find(item=>item.alias==='camera-bird');
  assert.deepEqual(request?.layouts,['ParakeetA_D']);
  assert.deepEqual(request?.animations,['ParakeetA_D_Wait']);
  assert.equal(parakeet.titleId,'0004001000022400');
  assert.equal(parakeet.contentId,'0000001a');
  assert.equal(parakeet.sourceSha256,'fcc6138d6a297ef819f449371e055f820e4f9b072b4bd9264eec87c92a4dbd67');
  assert.deepEqual(parakeet.layouts.ParakeetA_D.textures,['CharaA_Wait_00.bclim']);
  const mount=find(pack.layouts.P_BrwsMenu_D.roots,'-Navi');
  assert.deepEqual([...cameraBrowseBirdCenter],[160+mount.translation[0],120-mount.translation[1]]);
  const gallery=paint(view('gallery',[{id:'photo:a',label:'A'}],{photos:[{id:'a',src:'/portfolio/a.jpg'}]}));
  assert.deepEqual(gallery.draws.at(-1),{layout:'ParakeetA_D',pack:'camera-bird',opts:{
    center:[48,158],bindings:[{name:'ParakeetA_D_Wait',frame:0}],
  }});
  const main=paint(view('main',[{id:'folder:a',label:'A'}],{folders:[{id:'a',photos:[]}]}));
  assert.equal(main.draws.some(draw=>draw.pack==='camera-bird'),false);
});

test('populated browse mounts the Camera horizontal slider at its source anchor with strip progress',()=>{
  const request=cameraScreenPacks.find(item=>item.alias==='camera-slider');
  assert.equal(request?.url,'packs/camera/contents/0000-0000001a/lyt-C-Sld.json');
  assert.deepEqual(request?.layouts,['C_SldH_S']);
  assert.deepEqual(request?.animations,['C_SldH_S_Default','C_SldH_S_Rate']);
  const mount=find(pack.layouts.P_BrwsBase_D.roots,'-L-Sld');
  assert.deepEqual([...cameraBrowseSliderCenter],[160+mount.translation[0],120-mount.translation[1]]);
  assert.equal(cameraBrowseSliderFrame(0,6),0);
  assert.equal(cameraBrowseSliderFrame(124,12),50);
  assert.equal(cameraBrowseSliderFrame(248,12),100);
  const rows=Array.from({length:12},(_,index)=>({id:`photo:${index}`,label:String(index)}));
  const photos=rows.map((row,index)=>({id:String(index),src:'/portfolio/a.jpg'}));
  const gallery=paint(view('gallery',rows,{photos,cameraBrowse:{output:124}}));
  const slider=gallery.draws.find(draw=>draw.pack==='camera-slider');
  assert.deepEqual(slider,{layout:'C_SldH_S',pack:'camera-slider',opts:{center:[160,196],bindings:[
    {name:'C_SldH_S_Default',frame:20},{name:'C_SldH_S_Rate',frame:50},
  ]}});
  const main=paint(view('main',[{id:'folder:a',label:'A'}],{folders:[{id:'a',photos:[]}]}));
  assert.equal(main.draws.some(draw=>draw.pack==='camera-slider'),false);
});

test('settled browse exposes the native UserBG slot and preserves source materials',()=>{
  const original=pack.layouts.P_BrwsBase_D;
  const source=original.materials.find(material=>material.name==='UserBG');
  assert.deepEqual(source.constantColors[5],[0,128,255,255]);
  assert.deepEqual([...cameraBrowseUserColor],[255,161,0,255]);
  const posed=cameraBrowseOrange(original);
  assert.deepEqual(posed.materials.find(material=>material.name==='UserBG').constantColors[5],[255,161,0,255]);
  assert.deepEqual(source.constantColors[5],[0,128,255,255],'published pack stays immutable');
  const hidden=pack.animations.P_BrwsBase_D_Brws.tracks.find(track=>track.target==='BG'&&track.property==='visible');
  assert.equal(hidden.keys[0].value,0);
  const frame=paint(view('gallery',[{id:'photo:a',label:'A'}],{photos:[{id:'a',src:'/portfolio/a.jpg'}]}));
  const browse=frame.draws.find(draw=>draw.layout==='P_BrwsBase_D');
  for(const name of ['-B-ZoomUp','-B-ZoomBack']){
    const pane=find(original.roots,name);
    assert.equal(pane.flags&1,1,`${name} is source-visible`);
    assert.equal(browse.opts.overrides[name],undefined,`${name} remains visible but inert`);
  }
  assert.ok(frame.draws.some(draw=>draw.layout==='P_BrwsPhoMntBase'&&draw.opts.overrides?.['-PhoMntPos']===undefined),'source page mount remains visible in browse');
  const dateSource=pack.layouts.P_BrwsFld.materials.find(material=>material.name==='ThmbBase');
  assert.deepEqual(dateSource.constantColors[5],[120,193,31,255]);
  assert.deepEqual(cameraDateGroupOrange(pack.layouts.P_BrwsFld).materials.find(material=>material.name==='ThmbBase').constantColors[5],[255,161,0,255]);
  assert.deepEqual(dateSource.constantColors[5],[120,193,31,255]);
});

test('photo mount and thumbnail slots match the published centered panes',()=>{
  const mount=find(pack.layouts.P_BrwsPhoMntBase.roots,'-PhoMntPos');
  const thumb=find(pack.layouts.P_BrwsPic.roots,'ThmbPic');
  const mask=find(pack.layouts.P_BrwsPic.roots,'ThmbMask');
  assert.deepEqual(mount.translation.slice(0,2),[0,13]);
  assert.deepEqual(mount.size,[256,128]);
  assert.equal(mount.origin,4);
  assert.deepEqual(thumb.size,[56,42]);
  assert.deepEqual(mask.size,[66,52]);
  for(const name of ['P_BrwsPic','P_BrwsFld']){
    const hit=find(pack.layouts[name].roots,'BB-Thmb');
    assert.deepEqual(hit.translation.slice(0,2).map(v=>v+0),[0,0]);
    assert.deepEqual(hit.size,[62,48]);
  }
  assert.deepEqual(cameraPhotoMountRect,nativeLowerPaneRect(mount.translation,mount.size));
  assert.deepEqual(cameraPhotoMountRect,[32,43,256,128]);
  assert.deepEqual([...cameraThumbPicSize],[56,42]);
  assert.deepEqual(cameraThumbPicRect(58,65),[30,44,56,42]);
});

test('folder cells bind the large PicL frame and keep the count on TxtThmb',()=>{
  const {okay,draws,images,log}=paint(view('main',[{id:'folder:building',label:'Building Collection'}],{folders:[{id:'building',photos:[{id:'a'},{id:'b'},{id:'c'}]}]}));
  assert.equal(okay,true);
  assert.deepEqual(images,[]);
  const folder=draws.find(d=>d.layout==='P_BrwsFld');
  assert.deepEqual(folder.opts.bindings.map(b=>b.name),['P_BrwsFld_Default','P_BrwsFld_PicL']);
  assert.equal(folder.opts.overrides.TxtThmb.text,'3');
  assert.ok(!log.some(entry=>entry[0]==='fillText'));
  assert.ok(!draws.some(d=>d.layout==='P_BrwsPic'));
});

test('gallery photos draw under ThmbMask and use the large PicL clip',()=>{
  const {okay,draws,images,log}=paint(view('gallery',[{id:'photo:a',label:'Building 1'}],{photos:[{id:'a',src:'/portfolio/building1.jpg'}]}));
  assert.equal(okay,true);
  assert.deepEqual(images,[['/portfolio/building1.jpg',56,53,56,42]]);
  const pic=draws.find(d=>d.layout==='P_BrwsPic');
  assert.ok(draws.findIndex(d=>d.layout==='P_BrwsPic')>=0);
  assert.deepEqual(pic.opts.bindings.map(b=>b.name),['P_BrwsPic_Default','P_BrwsPic_PicL']);
  assert.equal(pic.opts.overrides.ThmbPic.alpha,0);
  assert.equal(pic.opts.overrides.ThmbPic.visible,undefined);
  assert.ok(!log.some(entry=>entry[0]==='fillText'));
  const {images:unloaded,draws:pending}=paint(view('gallery',[{id:'photo:a',label:'Building 1'}],{photos:[{id:'a',src:'/portfolio/building1.jpg'}]}),false);
  assert.deepEqual(unloaded,[['/portfolio/building1.jpg',56,53,56,42]]);
  assert.deepEqual(pending.find(d=>d.layout==='P_BrwsPic').opts.overrides,{});
});

test('undated portfolio group and five photos occupy the six source browse cells',()=>{
  const photos=Array.from({length:5},(_,index)=>({id:String(index),src:`/portfolio/${index}.jpg`}));
  const rows=[{id:'camera-date-group',label:''},...photos.map(photo=>({id:'photo:'+photo.id,label:photo.id}))];
  const {draws,images}=paint(view('gallery',rows,{photos},1));
  assert.deepEqual(draws.filter(draw=>draw.layout==='P_BrwsFld').map(draw=>draw.opts.center),[[84,74]]);
  assert.equal(draws.find(draw=>draw.layout==='P_BrwsFld').opts.overrides.TxtThmb.text,'');
  assert.deepEqual(draws.filter(draw=>draw.layout==='P_BrwsPic').map(draw=>draw.opts.center),[[160,74],[236,74],[84,140],[160,140],[236,140]]);
  assert.deepEqual(images.map(image=>image[0]),photos.map(photo=>photo.src));
  assert.deepEqual(draws.find(draw=>draw.layout==='P_BrwsCursor_D').opts.center,[160,74]);
});

test('photo view uses the source mount rectangle and drops invented arrows',()=>{
  const panes=[];const collect=items=>{for(const pane of items){panes.push(pane);collect(pane.children??[]);}};
  collect(pack.layouts.P_BrwsPhoMntBase.roots);
  assert.ok(panes.length>0);assert.ok(panes.every(pane=>pane.kind==='pan1'||pane.kind==='pic1'),'source mount has no button/bounding panes');
  const {okay,draws,images,log}=paint(view('photo',[],{photo:{id:'a',title:'Building 2',src:'/portfolio/building2.jpg'}}));
  assert.equal(okay,true);
  assert.deepEqual(images,[['/portfolio/building2.jpg',32,43,256,128]]);
  const mount=draws.find(d=>d.layout==='P_BrwsPhoMntBase');
  assert.equal(mount.opts.overrides['-PhoMntPos'].visible,false);
  assert.ok(!log.some(entry=>entry[0]==='roundRect'||entry[0]==='fillText'));
  assert.ok(!draws.some(d=>d.layout==='P_BrwsPic'||d.layout==='P_BrwsFld'));
});

test('empty gallery uses the source English no-data message and ignores other titles',()=>{
  const {okay,draws}=paint(view('main',[],{folders:[]}));
  assert.equal(okay,true);
  const empty=draws.find(d=>d.layout==='P_BrwsTxt_D');
  assert.equal(empty.opts.overrides.TxtNoData.text,'There are no saved\nphotos or videos.');
  const {log,bottom}=ctx();
  assert.equal(drawNativeCameraLower({packs:{},draw:()=>true},bottom,{...view('main'),appId:'sound'},{}),false);
  assert.deepEqual(log,[]);
});

test('published finder pack is the browse upper layout, not C_Titl_U',()=>{
  const request=cameraScreenPacks.find(p=>p.alias==='camera-finder');
  assert.deepEqual([...request.layouts],['P_FinderVS_U']);
  assert.deepEqual([...request.animations],[]);
  assert.ok(finder.layouts.P_FinderVS_U);
  assert.equal(finder.layouts.C_Titl_U,undefined);
  assert.ok(!cameraScreenPacks.some(p=>p.url.includes('C-Titl')));
  const noData=find(finder.layouts.P_FinderVS_U.roots,'Txt_NoData');
  const photos=find(finder.layouts.P_FinderVS_U.roots,'Txt_data2');
  const count=find(finder.layouts.P_FinderVS_U.roots,'Txt_data3');
  const fold=find(finder.layouts.P_FinderVS_U.roots,'Brws_U_fold');
  assert.deepEqual(noData.metadata,[{name:'MSG',type:0,value:'P/Brws_U_04'}]);
  assert.deepEqual(photos.metadata,[{name:'MSG',type:0,value:'P/Brws_U_01_01'}]);
  assert.deepEqual(count.metadata,[{name:'MSG',type:0,value:'P/Brws_U_02_01'}]);
  assert.deepEqual(fold.translation.slice(0,2).map(v=>v+0),[-108,0]);
  assert.deepEqual(fold.size,[128,96]);
  assert.deepEqual(cameraFolderPicRect,nativeLowerPaneRect(fold.translation,fold.size,[400,240]));
  assert.deepEqual(cameraFolderPicRect,[28,72,128,96]);
  assert.deepEqual([...cameraFolderPicSize],[128,96]);
  assert.equal(messages.messages.P.messages[messages.messages.P.labels.Brws_U_02_01].text,' ');
});

test('folder upper shows P_FinderVS_U browse panes and hides capture overlays',()=>{
  const {okay,draws,images,fills}=paintFrame(view('main',[{id:'folder:building',label:'Building Collection'}],{folders:[{id:'building',photos:[{id:'a'},{id:'b'}]}]}));
  assert.equal(okay,true);
  assert.deepEqual(fills,[[0,0,400,240]]);
  assert.deepEqual(images,[]);
  const upper=draws.find(d=>d.layout==='P_FinderVS_U');
  assert.equal(upper.pack,'camera-finder');
  assert.equal(upper.opts.overrides.BrwsFolder.visible,true);
  assert.equal(upper.opts.overrides.BrwsNoData.visible,false);
  assert.equal(upper.opts.overrides.Preview.visible,false);
  assert.equal(upper.opts.overrides.FocusAdj.visible,false);
  assert.equal(upper.opts.overrides.ImageInfo.visible,false);
  assert.equal(upper.opts.overrides.Fit.visible,false);
  assert.equal(upper.opts.overrides.BrwsError.visible,false);
  assert.equal(upper.opts.overrides.Txt_data2.text,'Photos:');
  assert.equal(upper.opts.overrides.Txt_data3.text,'2');
  assert.equal(upper.opts.overrides.Txt_Date.visible,false);
  assert.equal(upper.opts.overrides.Txt_total.visible,false);
  assert.equal(upper.opts.overrides['Brws_U_fold_Bir'].visible,false);
  assert.equal(upper.opts.overrides.FndEdge,undefined);
  assert.ok(draws.some(d=>d.layout==='P_BrwsFld'));
});

test('gallery and photo uppers draw portfolio pixels as the 400×240 view',()=>{
  const gallery=paintFrame(view('gallery',[{id:'photo:a',label:'Building 1'}],{photos:[{id:'a',src:'/portfolio/building1.jpg'}]}));
  assert.equal(gallery.okay,true);
  assert.deepEqual(gallery.images[0],['/portfolio/building1.jpg',0,0,400,240,'cover']);
  assert.equal(gallery.draws.find(d=>d.layout==='P_FinderVS_U').opts.overrides.BrwsFolder.visible,false);
  assert.equal(gallery.draws.find(d=>d.layout==='P_FinderVS_U').opts.overrides.BrwsNoData.visible,false);
  const photo=paintFrame(view('photo',[],{photo:{id:'a',title:'Building 2',src:'/portfolio/building2.jpg'}}));
  assert.deepEqual(photo.images[0],['/portfolio/building2.jpg',0,0,400,240,'cover']);
  assert.equal(photo.draws.find(d=>d.layout==='P_BrwsPhoMntBase').opts.overrides['-PhoMntPos'].visible,false);
});

test('empty upper uses Brws_U_04 and does not invent a title bar',()=>{
  const {okay,draws,images}=paintFrame(view('main',[],{folders:[]}));
  assert.equal(okay,true);
  assert.deepEqual(images,[]);
  const upper=draws.find(d=>d.layout==='P_FinderVS_U');
  assert.equal(upper.opts.overrides.BrwsNoData.visible,true);
  assert.equal(upper.opts.overrides.BrwsFolder.visible,false);
  assert.equal(upper.opts.overrides.Txt_NoData.text,'There are no photos or\nvideos to display.');
  const {log,bottom}=ctx();
  assert.equal(drawNativeCameraFrame({packs:{},draw:()=>true},{fillRect(){}},bottom,{...view('main'),appId:'sound'},{}),false);
  assert.deepEqual(log,[]);
});


test('all six cells and the selection cursor share native settled centres',()=>{
  const photos=Array.from({length:8},(_,i)=>({id:String(i),src:'/portfolio/'+i+'.jpg'}));
  const rows=photos.map(p=>({id:'photo:'+p.id,label:p.id}));
  const first=paint(view('gallery',rows,{photos},5));
  assert.deepEqual(first.draws.filter(d=>d.layout==='P_BrwsPic').map(d=>d.opts.center),[[84,74],[160,74],[236,74],[84,140],[160,140],[236,140]]);
  assert.deepEqual(first.draws.find(d=>d.layout==='P_BrwsCursor_D').opts.center,[236,140]);
  const moving=paint(view('gallery',rows,{photos,cameraBrowse:{output:65}},6));
  assert.ok(moving.draws.some(d=>d.layout==='P_BrwsPic'&&d.opts.center[0]===267),'next page enters before the strip settles');
  assert.deepEqual(moving.draws.find(d=>d.layout==='P_BrwsCursor_D').opts.center,[267,74]);
  const second=paint(view('gallery',rows,{photos,cameraBrowse:{output:248}},6));
  assert.deepEqual(second.draws.filter(d=>d.layout==='P_BrwsPic').map(d=>d.opts.center),[[84,74],[160,74]]);
  assert.deepEqual(second.images.map(i=>i[0]),['/portfolio/6.jpg','/portfolio/7.jpg']);
});
