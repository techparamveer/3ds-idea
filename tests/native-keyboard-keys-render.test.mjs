import test from 'node:test';
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {verifyNativeKeyboardKeys} from '../scripts/verify-native-keyboard-keys.mjs';

const options={
 styleEvidence:process.env.NATIVE_KEYBOARD_STYLE_EVIDENCE,
 artifactDir:process.env.NATIVE_KEYBOARD_KEYS_ARTIFACT_DIR,
 referenceRoot:process.env.NATIVE_KEYBOARD_REFERENCE_ROOT,
 pack:process.env.NATIVE_KEYBOARD_KEYS_PACK,
 messages:process.env.NATIVE_KEYBOARD_MESSAGES,
 fontManifest:process.env.NATIVE_KEYBOARD_FONT_MANIFEST,
 canvasModule:process.env.NATIVE_CANVAS_MODULE,
};
test('real QWERTY resources preserve frozen property writes, exact retained submissions and isolated render caches',{
 skip:!Object.values(options).every(Boolean),
},async()=>{
 const report=await verifyNativeKeyboardKeys({...options,artifactDir:join(options.artifactDir,'test')});
 assert.equal(report.passed,true);
 assert.equal(report.submissions.immediate.length,8);
 assert.equal(report.submissions.firstLocalController.length,5);
 assert.deepEqual(report.messageStyleApplications,[
  {pane:'T_key_Tra',label:'qwerty_conv',styleIndex:220},
 ]);
 const renders=Object.fromEntries(report.renders.map(r=>[r.name,r.rgbaSha256]));
 assert.notEqual(renders.initialized,renders.submitted);
 assert.notEqual(renders.submitted,renders.changedLabelProbe);
 assert.deepEqual(report.diagnostics,[]);
});
