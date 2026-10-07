import test from 'node:test';
import assert from 'node:assert/strict';
import { createHomeBannerHost, crossHomeBannerBoundary, getHomeBannerHostView } from '../src/os/home-banner-host.ts';
import { advanceHomeBannerClips, advanceHomeBannerManager } from '../src/os/home-banner-lifecycle.ts';
import { createHomeFolderEntryBanner, homeFolderEntryBannerSource } from '../src/os/home-folder-entry-banner.ts';

const rootOwner={folder:'home-folder:1',firmwareGeneration:1,systemGeneration:1,application:null,navigationRevision:4,closeSequence:1};
const owner={...rootOwner,navigationRevision:5};
const motion=elapsedUpdates=>({identity:{kind:'folder',folder:owner.folder},observedUpdate:100+elapsedUpdates,elapsedUpdates});
function source(){
 const inputs={managerInhibited:false,sceneInhibited:false,loadInhibited:false,nativeWorkerReady:true,resourceReady:null};
 let host=createHomeBannerHost({generation:'session:1',updateCount:0},inputs);
 host=crossHomeBannerBoundary(host,host.clock,{selection:{kind:'folder',key:owner.folder,label:'Old label',nativeType:9}});
 host=crossHomeBannerBoundary(host,host.clock,{inputs:{...inputs,resourceReady:getHomeBannerHostView(host).resourceTicket}});
 host=crossHomeBannerBoundary(host,{...host.clock,updateCount:20});
 return {view:getHomeBannerHostView(host),source:homeFolderEntryBannerSource(rootOwner,getHomeBannerHostView(host),100)};
}

test('source preparation cannot substitute for a matching presented root-folder receipt',()=>{
 const session=createHomeFolderEntryBanner(),candidate=source().source;assert.ok(candidate);
 assert.throws(()=>session.sample(owner,motion(0)),/matching presented root banner/);
 assert.equal(session.presentRoot(candidate,{...rootOwner,firmwareGeneration:2}),false);
 assert.throws(()=>session.sample(owner,motion(0)),/matching presented root banner/);
 assert.equal(session.presentRoot(candidate,rootOwner),true);assert.equal(session.sample(owner,motion(0)).primary.selection.label,'Old label');
});

test('folder banner stays selected through every pending lower pose and terminal receipt, then releases',()=>{
 const session=createHomeFolderEntryBanner(),candidate=source().source;session.presentRoot(candidate,rootOwner);
 let lifecycle=candidate.lifecycle;
 for(let frame=0;frame<=16;frame++){
  const pending=session.sample(owner,motion(frame));
  if(frame)lifecycle=advanceHomeBannerClips(advanceHomeBannerManager(lifecycle,1),1);
  assert.deepEqual(pending.primary.motion,lifecycle.active.motion);
  assert.equal(session.sample(owner,motion(frame+1)),pending,'an offscreen paint cannot spend the next pose');
  assert.equal(session.present(pending,owner,motion(frame+1)),false,'wrong lower receipt cannot release this source');
  assert.equal(session.present(pending,owner,motion(frame)),true);
 }
 assert.equal(session.sample(owner,motion(17)),null);
});

test('hidden, diagnostic, failed and context revocation discard pending motion and require terminal rebasing',()=>{
 const session=createHomeFolderEntryBanner();session.presentRoot(source().source,rootOwner);
 let pending=session.sample(owner,motion(0));session.present(pending,owner,motion(0));
 pending=session.sample(owner,motion(1));const before=pending.primary.motion;
 session.revoke();assert.equal(session.present(pending,owner,motion(1)),false);
 const resumed=session.sample(owner,motion(0));assert.notDeepEqual(resumed.primary.motion,before);
 session.present(resumed,owner,motion(0));
 const terminal=session.sample(owner,motion(16));assert.equal(session.present(terminal,owner,motion(16)),true);
 session.revoke();const rebased=session.sample(owner,motion(16));assert.ok(rebased);
 assert.deepEqual(rebased.primary.motion,terminal.primary.motion);session.present(rebased,owner,motion(16));
 assert.equal(session.sample(owner,motion(17)),null);
});

test('reduced terminal still needs a receipt, and returning root replaces the entry owner without stale reuse',()=>{
 const session=createHomeFolderEntryBanner(),candidate=source().source;session.presentRoot(candidate,rootOwner);
 const terminal=session.sample(owner,motion(16));assert.equal(session.sample(owner,motion(16)),terminal);
 assert.equal(session.present(terminal,owner,motion(16)),true);assert.equal(session.sample(owner,motion(16)),null);
 session.presentRoot(candidate,rootOwner);assert.equal(session.sample(owner,motion(0)).elapsedUpdates,0);
 session.leave();assert.throws(()=>session.sample(owner,motion(0)),/matching presented root banner/);
 session.presentRoot(null,null);assert.throws(()=>session.sample(owner,motion(0)),/matching presented root banner/);
 session.presentRoot(candidate,rootOwner);session.reset();assert.throws(()=>session.sample(owner,motion(0)),/matching presented root banner/);
 session.presentRoot(candidate,rootOwner);session.dispose();assert.equal(session.sample(owner,motion(0)),null);assert.equal(session.presentRoot(candidate,rootOwner),false);
});

test('folder, application and generation replacements reject retained entry source and stale receipts',()=>{
 for(const next of [{...owner,folder:'home-folder:2'},{...owner,application:'camera:1'},{...owner,firmwareGeneration:2},{...owner,systemGeneration:2},
  {...owner,navigationRevision:7},{...owner,closeSequence:2}]){
  const session=createHomeFolderEntryBanner();session.presentRoot(source().source,rootOwner);const pending=session.sample(owner,motion(0));
  assert.equal(session.present(pending,next,motion(0)),false);
  assert.throws(()=>session.sample(next,{...motion(0),identity:{kind:'folder',folder:next.folder}}),/matching presented root banner/);
 }
});

test('entry consumes only the immediately preceding root revision; child revisions are free after terminal but close identity is not',()=>{
 const candidate=source().source,session=createHomeFolderEntryBanner();session.presentRoot(candidate,rootOwner);
 assert.throws(()=>session.sample({...owner,navigationRevision:owner.navigationRevision+2},motion(0)),/matching presented root banner/);
 const terminal=session.sample(owner,motion(16));assert.equal(session.complete(owner),false);
 assert.equal(session.present(terminal,{...owner,navigationRevision:owner.navigationRevision+2},motion(16)),false);
 assert.equal(session.present(terminal,owner,motion(16)),true);assert.equal(session.complete(owner),true);
 const child={...owner,navigationRevision:owner.navigationRevision+1};assert.equal(session.sample(child,motion(17)),null);
 session.revoke();const resumed=session.sample(child,motion(16));assert.equal(session.present(resumed,child,motion(16)),true);
 assert.equal(session.complete({...child,closeSequence:2}),false);
 assert.throws(()=>session.sample({...child,closeSequence:2},motion(0)),/matching presented root banner/);
});

test('child release is paired, revocable and one-shot; retired native source can never reappear on rebase',()=>{
 const session=createHomeFolderEntryBanner();session.presentRoot(source().source,rootOwner);
 const terminal=session.sample(owner,motion(16));assert.equal(session.sampleRelease(owner),null);session.present(terminal,owner,motion(16));
 const release=session.sampleRelease(owner);assert.ok(release);assert.equal(session.sampleRelease(owner),release);
 session.revoke();assert.equal(session.presentRelease(release,owner),false);
 const restored=session.sample(owner,motion(16));assert.ok(restored);session.present(restored,owner,motion(16));
 const child=session.sampleRelease(owner);assert.equal(session.presentRelease(child,{...owner,navigationRevision:6}),false);
 assert.equal(session.presentRelease(child,owner),true);assert.equal(session.presentRelease(child,owner),false);
 session.revoke();assert.equal(session.sample(owner,motion(16)),null);assert.equal(session.sampleRelease(owner),null);assert.equal(session.complete(owner),true);
 session.leave();assert.throws(()=>session.sample(owner,motion(0)),/matching presented root banner/);
});

test('only the exact prepared visible native folder instance can supply the retained source',()=>{
 const {view}=source();
 for(const next of [{...view,stage:'hiding'},{...view,resourceTicket:null},{...view,resourceTicket:{...view.resourceTicket,requestEpoch:99}},
  {...view,primary:{...view.primary,generation:'other'}},{...view,primary:{...view.primary,selection:{...view.primary.selection,key:'other'}}},
  {...view,primary:{...view.primary,motion:{...view.primary.motion,requestedVisible:false}}}])assert.equal(homeFolderEntryBannerSource(owner,next,100),null);
 assert.throws(()=>homeFolderEntryBannerSource(owner,{...view,primary:{...view.primary,motion:{...view.primary.motion,skeletal:{...view.primary.motion.skeletal,duration:599}}}},100),/clips unavailable/);
});
