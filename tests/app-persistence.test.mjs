import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { openFirmwareStorage, validateSaveRecord, FirmwareStorageError } from '../src/os/app-persistence.ts';
import { createPortfolioState, saveSettings } from '../src/os/system.ts';
const req = request => new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
const txDone = tx => new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});
const media = (id='photo',kind='photo') => ({id,name:'Private capture',kind,createdAt:123});
const image = text => new Blob([text],{type:'image/png'});
const rejectsCode = (promise,code) => assert.rejects(promise,error=>error instanceof FirmwareStorageError && error.code===code);
async function seed(factory, version, seedFn) {
 const opening=factory.open('test',version);opening.onupgradeneeded=()=>{for(const name of ['saves','meta'])opening.result.createObjectStore(name);};
 const db=await req(opening);const tx=db.transaction(['saves','meta'],'readwrite'),done=txDone(tx);seedFn(tx);await done;return db;
}
test('fresh storage migrates legacy preferences once, preserving custom positions and eight portfolio entries',async()=>{
 const indexedDB=new IDBFactory(),s=createPortfolioState();s.theme='blue';s.system.layout[60]=s.system.layout[0];delete s.system.layout[0];s.folders[70]='Work';
 let storage=await openFirmwareStorage({indexedDB,databaseName:'test',legacyPreferences:saveSettings(s)});
 let data=await storage.load(),prefs=JSON.parse(data.preferences);assert.equal(prefs.theme,'blue');assert.equal(prefs.layout[60],'work');assert.equal(prefs.folders[70],'Work');assert.deepEqual(data.issues,[]);
 await storage.saveRecord('friends',{version:1,data:{message:'Hi'}});await storage.saveRecord('@shared',{version:1,data:{settings:{nickname:'Sam'}}});storage.dispose();
 s.theme='red';storage=await openFirmwareStorage({indexedDB,databaseName:'test',legacyPreferences:saveSettings(s)});data=await storage.load();
 assert.equal(JSON.parse(data.preferences).theme,'blue');assert.equal(data.saves.friends.data.message,'Hi');assert.equal(data.shared.settings.nickname,'Sam');assert.equal(data.shared.settings.language,'English');storage.dispose();
});
test('v1 database upgrade preserves saved records and preferences and adds media',async()=>{
 const indexedDB=new IDBFactory(),raw=saveSettings(createPortfolioState());
 const db=await seed(indexedDB,1,tx=>{tx.objectStore('saves').put({version:1,data:{message:'Preserved'}},'friends');tx.objectStore('meta').put({version:1,data:raw},'preferences');});db.close();
 const storage=await openFirmwareStorage({indexedDB,databaseName:'test'}),data=await storage.load();assert.equal(data.saves.friends.data.message,'Preserved');assert.equal(data.preferences,raw);
 await storage.putMedia(media(),image('pixels'));assert.equal(await (await storage.getMedia('photo')).blob.text(),'pixels');storage.dispose();
});
test('unknown, corrupt and future save records are reported and cannot poison valid records',async()=>{
 const indexedDB=new IDBFactory(),db=await seed(indexedDB,1,tx=>{
  const saves=tx.objectStore('saves');saves.put({version:1,data:{message:'valid'}},'friends');saves.put({version:99,data:{}},'camera');saves.put({version:1,data:{}},'unknown-title');saves.put({version:1,data:{value:NaN}},'sound');saves.put({version:3,data:{}},'@shared');tx.objectStore('meta').put({version:1,data:'null'},'preferences');
 });db.close();
 const storage=await openFirmwareStorage({indexedDB,databaseName:'test'}),data=await storage.load();assert.equal(data.saves.friends.data.message,'valid');assert.equal(data.saves.camera,undefined);assert.deepEqual(new Set(data.issues),new Set(['version:camera','unknown:unknown-title','corrupt:sound','version:@shared','corrupt:preferences']));storage.dispose();
});
test('record validation rejects cyclic, nonfinite, prototype and oversized values',async()=>{
 const cycle={};cycle.self=cycle;
 for(const data of [cycle,{x:Infinity},{x:new Date()},JSON.parse('{"__proto__":{}}'),{text:'x'.repeat(3*1024*1024)}])assert.equal(validateSaveRecord({version:1,data}),false);
 const storage=await openFirmwareStorage({indexedDB:new IDBFactory(),databaseName:'test'});
 await rejectsCode(storage.saveRecord('missing',{version:1,data:{}}),'corrupt');await rejectsCode(storage.savePreferences('{"layout":{}}'),'corrupt');storage.dispose();
});
test('media byte budgets are transactional and quota abort preserves existing blobs',async()=>{
 const storage=await openFirmwareStorage({indexedDB:new IDBFactory(),databaseName:'test',maxMediaBytes:10,maxItemBytes:8});
 await storage.putMedia(media('a'),image('123456'));await storage.putMedia(media('b'),image('7890'));
 await rejectsCode(storage.putMedia(media('a'),image('12345678')),'quota');assert.equal(await (await storage.getMedia('a')).blob.text(),'123456');
 await rejectsCode(storage.putMedia(media('c'),image('123456789')),'quota');assert.equal(await storage.getMedia('c'),null);
 await storage.deleteMedia('b');await storage.putMedia(media('a'),image('12345678'));assert.equal((await storage.getMedia('a')).metadata.bytes,8);
 await rejectsCode(storage.putMedia(media('wrong','audio'),image('x')),'corrupt');storage.dispose();await rejectsCode(storage.load(),'closed');
});
test('concurrent media writes cannot overrun aggregate budget',async()=>{
 const storage=await openFirmwareStorage({indexedDB:new IDBFactory(),databaseName:'test',maxMediaBytes:10});
 const outcomes=await Promise.allSettled([storage.putMedia(media('a'),image('123456')),storage.putMedia(media('b'),image('123456'))]);assert.equal(outcomes.filter(x=>x.status==='fulfilled').length,1);assert.equal(outcomes.find(x=>x.status==='rejected').reason.code,'quota');storage.dispose();
});
test('blocked upgrade rejects cleanly and closes the eventual connection',async()=>{
 const indexedDB=new IDBFactory(),db=await seed(indexedDB,1,()=>{});
 await rejectsCode(openFirmwareStorage({indexedDB,databaseName:'test'}),'blocked');db.close();
 // A subsequent version upgrade would stay blocked if the rejected opener leaked its connection.
 const next=indexedDB.open('test',3);const upgraded=await req(next);upgraded.close();
});
test('version changes close active storage handles',async()=>{
 const indexedDB=new IDBFactory(),storage=await openFirmwareStorage({indexedDB,databaseName:'test'});
 const next=await req(indexedDB.open('test',3));await rejectsCode(storage.load(),'closed');next.close();storage.dispose();
});
test('synchronous API security errors map to unavailable storage',async()=>{
 await rejectsCode(openFirmwareStorage({indexedDB:{open(){throw new DOMException('Blocked','SecurityError');}}}),'unavailable');
});

test('gallery removal saves metadata and deletes only the selected Blob atomically',async()=>{
 const storage=await openFirmwareStorage({indexedDB:new IDBFactory(),databaseName:'test'});
 const a=await storage.putMedia(media('a'),image('a')),b=await storage.putMedia(media('b'),image('b'));
 await storage.saveRecord('@shared',{version:1,data:{photos:[a,b],sounds:[],settings:{nickname:'Ada'}}});
 const removed={version:1,data:{photos:[b],sounds:[],settings:{nickname:'Ada'}}};
 await storage.saveSharedAndDeleteMedia(removed,['a','a']);
 assert.equal(await storage.getMedia('a'),null);assert.equal(await (await storage.getMedia('b')).blob.text(),'b');
 const restored=await storage.load();assert.deepEqual(restored.shared.photos,[b]);assert.equal(restored.shared.settings.nickname,'Ada');
 await rejectsCode(storage.saveSharedAndDeleteMedia(removed,['b']),'corrupt');
 assert.ok(await storage.getMedia('b'));storage.dispose();
});

test('transaction abort after a media delete retains the old gallery and Blob',async()=>{
 const storage=await openFirmwareStorage({indexedDB:new IDBFactory(),databaseName:'test'});
 const a=await storage.putMedia(media('a'),image('private pixels'));
 await storage.saveRecord('@shared',{version:1,data:{photos:[a],sounds:[]}});
 const original=IDBObjectStore.prototype.delete;
 IDBObjectStore.prototype.delete=function(key){
  const result=original.call(this,key);
  if(this.name==='media')result.addEventListener('success',()=>result.transaction.abort(),{once:true});
  return result;
 };
 try{await assert.rejects(storage.saveSharedAndDeleteMedia({version:1,data:{photos:[],sounds:[]}},['a']),FirmwareStorageError);}
 finally{IDBObjectStore.prototype.delete=original;}
 assert.equal(await (await storage.getMedia('a')).blob.text(),'private pixels');
 assert.deepEqual((await storage.load()).shared.photos,[a]);storage.dispose();
});
