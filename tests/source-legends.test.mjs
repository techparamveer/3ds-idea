import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';

const folder=new URL('../model/candidates/joshua-xl/',import.meta.url);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function load(name){
  const bytes=fs.readFileSync(new URL(name,folder)),size=bytes.readUInt32LE(12);
  assert.equal(bytes.readUInt32LE(8),bytes.length);
  return {doc:JSON.parse(bytes.subarray(20,20+size)),bin:bytes.subarray(28+size)};
}
const before=load('silver-front.glb'),after=load('silver-legends.glb');
function attribute(asset,index){
  const a=asset.doc.accessors[index],view=asset.doc.bufferViews[a.bufferView];
  const width={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type]*{5123:2,5125:4,5126:4}[a.componentType];
  const bytes=Buffer.alloc(a.count*width);
  for(let i=0;i<a.count;i++){
    const offset=(view.byteOffset??0)+(a.byteOffset??0)+i*(view.byteStride??width);
    asset.bin.copy(bytes,i*width,offset,offset+width);
  }
  return bytes;
}
function textureHash(asset,index){
  const image=asset.doc.images[asset.doc.textures[index].source],view=asset.doc.bufferViews[image.bufferView];
  return hash(asset.bin.subarray(view.byteOffset,view.byteOffset+view.byteLength));
}

test('lower-key texture pass preserves the complete refined geometry, UVs, shading frames and rig',()=>{
  assert.equal(after.doc.nodes.length,before.doc.nodes.length);
  for(const node of before.doc.nodes){
    const next=after.doc.nodes.find(n=>n.name===node.name);assert.ok(next);
    for(const key of ['translation','rotation','scale','matrix'])assert.deepEqual(next[key],node[key]);
    assert.deepEqual(next.children?.map(i=>after.doc.nodes[i].name),node.children?.map(i=>before.doc.nodes[i].name));
    if(node.mesh===undefined)continue;
    const a=before.doc.meshes[node.mesh].primitives[0],b=after.doc.meshes[next.mesh].primitives[0];
    assert.deepEqual(Object.keys(a.attributes),Object.keys(b.attributes));
    for(const key of Object.keys(a.attributes))assert.ok(attribute(before,a.attributes[key]).equals(attribute(after,b.attributes[key])),node.name+' '+key);
    assert.ok(attribute(before,a.indices).equals(attribute(after,b.indices)));
  }
  const a=before.doc.nodes.find(n=>n.name==='3DS_XL').extras,b=after.doc.nodes.find(n=>n.name==='3DS_XL').extras;
  for(const key of ['console_layout','shell_curvature','closed_envelope_fit','front_aperture_fit'])assert.deepEqual(b[key],a[key]);
  assert.equal(b.source_markings_region,'EUR');
  assert.match(b.lower_key_legend_method,/Photographed glyphs/);
});

test('lower-key export embeds the audited maps and retains every unrelated texture and material setting',()=>{
  const audit=JSON.parse(fs.readFileSync(new URL('legends-pixel-audit.json',folder))),material=after.doc.materials[0];
  assert.equal(audit.outside_top_faces,0);
  assert.deepEqual(audit.other_face_overlap,{});
  for(const name of ['Button_SELECT','Button_HOME','Button_START'])assert.ok(audit[name].core_ink_pixels>10);
  for(const [kind,index] of [
    ['basecolor',material.pbrMetallicRoughness.baseColorTexture.index],
    ['normal',material.normalTexture.index],
    ['metallic-roughness',material.pbrMetallicRoughness.metallicRoughnessTexture.index],
  ]){
    const expected=audit.maps[kind].sha256;
    assert.equal(hash(fs.readFileSync(new URL('derived-textures/body-legends-'+kind+'.png',folder))),expected);
    assert.equal(textureHash(after,index),expected);
    assert.equal(audit.maps[kind].outside_edit_changed,0);
  }
  const exported=JSON.parse(fs.readFileSync(new URL('legends-export-audit.json',folder)));
  assert.equal(hash(fs.readFileSync(new URL('silver-legends.glb',folder))),exported.glb_sha256);
  assert.equal(exported.maximum_alpha_error,0);
  assert.equal(exported.outside_edit_specular_factor,1);
  const specular=material.extensions.KHR_materials_specular;
  assert.equal(specular.specularFactor??1,1);
  assert.equal(specular.specularTexture.texCoord??0,0);
  const specularIndex=specular.specularTexture.index;
  assert.equal(textureHash(after,specularIndex),exported.specular_texture_sha256);
  assert.equal(hash(fs.readFileSync(new URL('derived-textures/body-legends-specular.png',folder))),audit.maps.specular.sha256);
  // Compare semantic bindings: adding specular may reorder the texture table.
  const clean=(asset,material,body)=>{
    const copy=structuredClone(material);
    if(body){delete copy.name;delete copy.extensions?.KHR_materials_specular;}
    function visit(value,path=''){
      if(!value||typeof value!=='object')return;
      for(const [key,child] of Object.entries(value)){
        const next=path?path+'.'+key:key;
        if(key.endsWith('Texture')&&child?.index!==undefined){
          const index=child.index,texture=asset.doc.textures[index];
          child.index=body&&['pbrMetallicRoughness.baseColorTexture','pbrMetallicRoughness.metallicRoughnessTexture','normalTexture'].includes(next)
            ? 'audited lower-key map':textureHash(asset,index);
          child.samplerSettings=asset.doc.samplers?.[texture.sampler]??null;
        }else visit(child,next);
      }
    }
    visit(copy);return copy;
  };
  assert.deepEqual(clean(after,material,true),clean(before,before.doc.materials[0],true));
  assert.equal(material.extras.console_paint_mask,'/models/candidates/joshua-xl-eur-paint-mask.png');
  assert.deepEqual(after.doc.samplers,before.doc.samplers);
  assert.equal(after.doc.textures.length,before.doc.textures.length+1);
  for(let i=1;i<before.doc.materials.length;i++)assert.deepEqual(clean(after,after.doc.materials[i],false),clean(before,before.doc.materials[i],false));
});
