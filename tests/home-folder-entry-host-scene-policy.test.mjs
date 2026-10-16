import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source=readFileSync(new URL('../src/scene/console-scene.ts',import.meta.url),'utf8');
const observer=source.slice(source.indexOf('function observeFolderBanner'),source.indexOf('function advanceBeforeMutation'));
const stepper=source.slice(source.indexOf('function advanceBeforeMutation'),source.indexOf('let closePublicationEffectNow'));

test('both live host boundaries defer folder child requests and preserve the shared activation gate',()=>{
 assert.match(observer,/const folderRequestReady=screens\.homeFolderBannerRequestReady\(state\);/);
 assert.match(observer,/selection:folderRequestReady\?\(selection\?\?/);
 assert.match(observer,/system\.homeControls&&!state\.opened\?undefined:resolveHomeBannerHostSelection\(state\)/);
 assert.match(observer,/activationReady:screens\.homeEntryActivationReady\(state\)&&screens\.homeFolderBannerActivationReady\(state\)/);
 assert.match(stepper,/const folderRequestReady=screens\.homeFolderBannerRequestReady\(pass\.state\);/);
 assert.match(stepper,/beforeManager&&folderRequestReady\?\{selection:beforeManager\}/);
 assert.match(stepper,/afterManager:afterManager&&folderRequestReady\?\{selection:afterManager\}/);
 assert.match(stepper,/activationReady:screens\.homeEntryActivationReady\(pass\.state\)&&screens\.homeFolderBannerActivationReady\(pass\.state\)/);
});
