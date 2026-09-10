import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';

const folder=new URL('../model/candidates/joshua-xl/',import.meta.url);
const hash=b=>createHash('sha256').update(b).digest('hex');
function load(name){const bytes=fs.readFileSync(new URL(name,folder)),n=bytes.readUInt32LE(12);return {doc:JSON.parse(bytes.subarray(20,20+n)),bin:bytes.subarray(28+n)};}
function attribute(asset,index){
  const a=asset.doc.accessors[index],v=asset.doc.bufferViews[a.bufferView];
  const width={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type]*{5123:2,5125:4,5126:4}[a.componentType];
  const bytes=Buffer.alloc(a.count*width);
  for(let i=0;i<a.count;i++){const p=(v.byteOffset??0)+(a.byteOffset??0)+i*(v.byteStride??width);asset.bin.copy(bytes,i*width,p,p+width);}
  return bytes;
}
function textureHash(asset,index){const v=asset.doc.bufferViews[asset.doc.images[asset.doc.textures[index].source].bufferView];return hash(asset.bin.subarray(v.byteOffset,v.byteOffset+v.byteLength));}
const before=load('silver-legends.glb'),after=load('silver-etched.glb');

test('etched words retain every mesh attribute, control, transform and earlier metadata',()=>{
  assert.equal(after.doc.nodes.length,before.doc.nodes.length);
  for(const node of before.doc.nodes){
    const next=after.doc.nodes.find(n=>n.name===node.name);assert.ok(next);
    for(const key of ['matrix','translation','rotation','scale'])assert.deepEqual(next[key],node[key]);
    assert.deepEqual(next.children?.map(i=>after.doc.nodes[i].name),node.children?.map(i=>before.doc.nodes[i].name));
    if(node.mesh===undefined)continue;
    const a=before.doc.meshes[node.mesh].primitives,b=after.doc.meshes[next.mesh].primitives;
    assert.equal(a.length,b.length);
    for(let i=0;i<a.length;i++){
      assert.deepEqual(Object.keys(b[i].attributes),Object.keys(a[i].attributes));
      for(const key in a[i].attributes)assert.ok(attribute(before,a[i].attributes[key]).equals(attribute(after,b[i].attributes[key])),node.name+' '+key);
      assert.ok(attribute(before,a[i].indices).equals(attribute(after,b[i].indices)));
    }
  }
  const a=before.doc.nodes.find(n=>n.name==='3DS_XL').extras,b=after.doc.nodes.find(n=>n.name==='3DS_XL').extras;
  for(const key of Object.keys(a))if(key!=='source_changes')assert.deepEqual(b[key],a[key]);
  assert.deepEqual(JSON.parse(b.etched_legends).words,['MIC','POWER']);
});

test('etched export changes only audited body colour/normal images and retains other material settings',()=>{
  const audit=JSON.parse(fs.readFileSync(new URL('etched-pixel-audit.json',folder)));
  for(const [name,binding] of [['basecolor',after.doc.materials[0].pbrMetallicRoughness.baseColorTexture],['normal',after.doc.materials[0].normalTexture]]){
    const expected=hash(fs.readFileSync(new URL('derived-textures/body-etched-'+name+'.png',folder)));
    assert.equal(expected,audit.maps[name].sha256);assert.equal(audit.maps[name].outside_edit_changed,0);
    assert.equal(textureHash(after,binding.index),expected);
  }
  function normalize(asset,material,body){
    const copy=structuredClone(material);if(body)delete copy.name;
    function visit(obj,path=''){
      for(const [key,value] of Object.entries(obj)){
        const next=path?path+'.'+key:key;
        if(key.endsWith('Texture')&&value?.index!==undefined){
          const texture=asset.doc.textures[value.index];
          value.index=body&&['pbrMetallicRoughness.baseColorTexture','normalTexture'].includes(next)?'audited edit':textureHash(asset,value.index);
          value.sampler=asset.doc.samplers?.[texture.sampler]??null;
        }else if(value&&typeof value==='object')visit(value,next);
      }
    }
    visit(copy);return copy;
  }
  assert.equal(after.doc.materials.length,before.doc.materials.length);
  for(let i=0;i<before.doc.materials.length;i++)assert.deepEqual(normalize(after,after.doc.materials[i],i===0),normalize(before,before.doc.materials[i],i===0));
});
