import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import ts from 'typescript';
const module=path=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const {fitNativeLabelWidth,nativeBannerLabelOverride}=await import(module('../src/os/native-banner-label.ts'));
const {copyNativeOverlay}=await import(module('../src/scene/native-overlay.ts'));
test('native banner fit truncates integral percentages, preserves height and keeps an 80 percent floor',()=>{
 const widths=[240,256,280,300,320,400],percentages=[100,99,90,84,80,80];
 widths.forEach((width,i)=>assert.ok(Math.abs(fitNativeLabelWidth(width,256,15.5)-15.5*percentages[i]/100)<.000002));
 assert.equal(fitNativeLabelWidth(0,256,15.5),15.5);
 assert.notEqual(fitNativeLabelWidth(255.999999,256,15.5),15.5,'native float32 comparison rounds this width to 256');
});
test('native overlay transfer flips rows and removes premultiplication once while preserving opaque pixels',()=>{
 const output=new Uint8ClampedArray(16),source=new Uint8Array([212,212,212,212,255,0,0,0,117,215,242,255,0,0,0,0]);
 copyNativeOverlay(source,output,2,2);
 assert.deepEqual([...output],[117,215,242,255,0,0,0,0,255,255,255,212,0,0,0,0]);
 const background=[223,219,215],coverage=212/255;
 background.forEach((channel,i)=>assert.ok(Math.abs(output[8+i]*coverage+channel*(1-coverage)-(212+channel*(1-coverage)))<1e-10));
 assert.throws(()=>copyNativeOverlay(source,output,1,2),/dimensions differ/);
});
const root=process.env.FIRMWARE_PRESENTATION_ASSETS??resolve('public/os/firmware/10.7.0-32E'),path=resolve(root,'packs/home/banner.json');
test('real banner label retains authored geometry, native metrics and original width after a long-name fit',{skip:!existsSync(path)},()=>{
 const pack=JSON.parse(readFileSync(path)),layout=pack.layouts.BnrDsTitle_00,font=JSON.parse(readFileSync(resolve(root,'fonts/shared/font.json'))),before=JSON.stringify(layout);
 assert.deepEqual(layout.canvas,{width:256,height:64,origin:1});
 const normal=nativeBannerLabelOverride(layout,font,'1 (New Folder)').T_Title_00;
 assert.deepEqual(normal.fontSize,[15.5,18.600000381469727]);
 const wide=nativeBannerLabelOverride(layout,font,'Ｗ'.repeat(40)).T_Title_00;
 assert.ok(Math.abs(wide.fontSize[0]-12.4)<.000002);assert.equal(wide.fontSize[1],normal.fontSize[1]);assert.equal(wide.text.length,40,'no invented ellipsis');
 assert.deepEqual(nativeBannerLabelOverride(layout,font,'A').T_Title_00.fontSize,normal.fontSize);
 assert.equal(JSON.stringify(layout),before);
});
