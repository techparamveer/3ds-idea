import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const url=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const compile=path=>ts.transpileModule(readFileSync(new URL('../src/'+path+'.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const summary=JSON.parse(readFileSync(new URL('../docs/evidence/sound-visualiser-models.json',import.meta.url),'utf8'));
const modelSource=readFileSync(new URL('../src/scene/firmware-model.ts',import.meta.url),'utf8');
const lightingSource=readFileSync(new URL('../src/scene/cgfx-lighting.ts',import.meta.url),'utf8');
const three=JSON.stringify(import.meta.resolve('three'));
const {picaFragmentShader}=await import(url(compile('scene/firmware-model').replace("'three'",three).replace("'../os/cgfx-animation'",JSON.stringify(url(compile('os/cgfx-animation')))).replace("'./cgfx-lighting'",JSON.stringify(url(compile('scene/cgfx-lighting')))).replace("'../os/native-png'",JSON.stringify(url(compile('os/native-png')))).replace("'./cgfx-billboard'",JSON.stringify(url(compile('scene/cgfx-billboard').replace("'three'",three))))));
const soundSource=compile('os/stock-native-sound');
const layout=url(compile('os/stock-screen-layout').replace("'./camera-browse.ts'",JSON.stringify(new URL('../src/os/camera-browse.ts',import.meta.url).href)));
const {soundScreenPacks}=await import(url(soundSource.replace("'./stock-screen-layout'",JSON.stringify(layout)).replace("'./native-layout'",JSON.stringify(url(compile('os/native-layout')))).replace("'./stock-sound-record'",JSON.stringify(url(compile('os/stock-sound-record'))))));
const {portfolioMedia}=await import(url(compile('os/portfolio-media').replace("'./apps.ts'",JSON.stringify(url(compile('os/apps'))))));

const order=['S_Back_U','S_Vis_Clock_U','S_Vis_Clock_U_Cogwheel','S_Vis_ExBike_U','S_Vis_Lifting_U','S_Vis_PlayYan_U','S_Vis_PlayYan_U_Star1','S_Vis_PlayYan_U_Star2','S_Vis_PlayYan_U_Star3','S_Vis_PlayYan_U_Star4','S_Vis_Span_U','S_Vis_Wave_U'];
const color={R:0,G:0,B:0,A:0};
/** One material exercising every recorded stage source, operand and combiner. */
function material(vocabulary){
  const sources=vocabulary.sources,operands=vocabulary.operands,combiners=vocabulary.combiners.filter(c=>!c.startsWith('Dot3'));
  const stages=[];
  for(const [i,source] of sources.entries())stages.push({Source:{Color:[source,source,source],Alpha:[source,source,source]},Operand:{Color:['Color','Color','Color'],Alpha:['Alpha','Alpha','Alpha']},Combiner:{Color:combiners[i%combiners.length],Alpha:combiners[i%combiners.length]},Scale:{Color:'One',Alpha:'One'},UpdateColorBuffer:false,UpdateAlphaBuffer:false});
  for(const operand of operands)stages.push({Source:{Color:['Texture0','Texture0','Texture0'],Alpha:['Texture0','Texture0','Texture0']},Operand:{Color:[operand,operand,operand],Alpha:[operand,operand,operand]},Combiner:{Color:'Replace',Alpha:'Replace'},Scale:{Color:'One',Alpha:'One'},UpdateColorBuffer:false,UpdateAlphaBuffer:false});
  for(const combiner of vocabulary.combiners)stages.push({Source:{Color:['Texture0','Texture0','Texture0'],Alpha:['Texture0','Texture0','Texture0']},Operand:{Color:['Color','Color','Color'],Alpha:['Alpha','Alpha','Alpha']},Combiner:{Color:combiner,Alpha:combiner.startsWith('Dot3')?'Replace':combiner},Scale:{Color:'One',Alpha:'One'},UpdateColorBuffer:false,UpdateAlphaBuffer:false});
  return {Name:'probe',ConstantAssignments:stages.map(()=>0),Texture0Name:'',Texture1Name:'',Texture2Name:'',TextureMappers:[],MaterialParams:{TexEnvStages:stages,TexEnvBufferColor:color,AmbientColor:color,DiffuseColor:color,Specular0Color:color,AlphaTest:{Enabled:false,Function:'Always',Reference:0}}};
}

test('the S.pack audit summary keeps all twelve models, their hashes and zero embedded clips',()=>{
  assert.equal(summary.title,'0004001000022500');
  assert.equal(summary.sources.packSha256,'05550cfa807aa19cd27347e1b309a60aed7f20cf208be13ea2bab1bc942f161d');
  assert.equal(summary.sources.codeSha256,'3c57f2c4091c1bec6b3834609f1e2a6488712e21775d7548b441c69c60b3e5a9');
  assert.equal(summary.sources.spicaRevision,'bd29a7828595d7839cda2ac61c76bb63f9071250');
  assert.deepEqual(summary.models.map(m=>m.model),order.map(name=>name+'.bcmdl'));
  assert.equal(summary.embeddedAnimations,0);
  for(const model of summary.models){
    assert.match(model.compressedSha256,/^[0-9a-f]{64}$/);assert.match(model.decompressedSha256,/^[0-9a-f]{64}$/);
    assert.deepEqual(model.animations,{skeletalAnimations:0,materialAnimations:0,visibilityAnimations:0,cameraAnimations:0});
    assert.ok(model.executableReferences.pcRelative.length||model.executableReferences.literalPool.length,model.model);
    for(const texture of model.textures)assert.match(texture.sha256,/^[0-9a-f]{64}$/);
  }
  // Stars 1-3 are byte-identical resources published under three names.
  const star=summary.models.filter(m=>/Star[123]/.test(m.model));
  assert.equal(new Set(star.map(m=>m.decompressedSha256)).size,1);
  assert.ok(!JSON.stringify(summary).includes('/Volumes/'),'summary must not carry private paths');
});

test('renderer support classification matches the PICA combiner vocabulary firmware-model.ts accepts',()=>{
  for(const record of summary.models)for(const model of record.models){
    const shader=()=>picaFragmentShader(material(model.vocabulary),null);
    assert.doesNotThrow(shader,`${record.model}/${model.name} stage vocabulary`);
    assert.deepEqual(model.primitives,['Triangles']);
    assert.deepEqual(model.billboards,[]);
    if(model.rendererSupport==='supported')assert.deepEqual(model.issues,[]);
    else for(const issue of model.issues)assert.match(issue,/^(ProjectionMap texture coordinates|AsBump bump mapping)/,issue);
  }
  // The recorded divergences are silent in the renderer: it has no mapping-type branch and
  // bump materials drop to the approximate lighting path.
  assert.ok(modelSource.includes('MappingType:string')&&!/\.MappingType|MappingType\s*[!=]=/.test(modelSource));
  assert.ok(lightingSource.includes("params.BumpMode!=='NotUsed'"));
  assert.deepEqual(summary.models.filter(r=>r.models.some(m=>m.rendererSupport!=='supported')).map(r=>r.model),['S_Vis_Clock_U.bcmdl','S_Vis_Clock_U_Cogwheel.bcmdl','S_Vis_ExBike_U.bcmdl','S_Vis_Lifting_U.bcmdl']);
});

test('selection facts name Span as the default and leave the resting pose unproven',()=>{
  const factory=summary.visualiserFactory;
  assert.equal(factory.cycle.modulo,9);
  assert.deepEqual(factory.cases.map(c=>[c.index,c.kind,c.model??null]),[[0,'none',null],[1,'cgfx-class','res/S--S_Vis_Span_U.bcmdl'],[2,'cgfx-class','res/S--S_Vis_Wave_U.bcmdl'],[3,'cgfx-class','res/S--S_Vis_ExBike_U.bcmdl'],[4,'cgfx-class',null],[5,'cgfx-class','res/S--S_Vis_PlayYan_U.bcmdl'],[6,'cgfx-class','res/S--S_Vis_Lifting_U.bcmdl'],[7,'cgfx-class','res/S--S_Vis_Clock_U.bcmdl'],[8,'layout',null]]);
  assert.equal(factory.indexStorage.defaultValue,1);
  assert.equal(factory.indexStorage.defaultCase,'S_Vis_Span_U.bcmdl');
  const span=summary.models.find(m=>m.model==='S_Vis_Span_U.bcmdl').models[0];
  assert.equal(span.rendererSupport,'supported');
  assert.deepEqual(span.sharedBindPlacements,[{bones:Array.from({length:32},(_,i)=>`LightLine${String(i).padStart(2,'0')}`),translation:[0,-45,0]}]);
  assert.equal(summary.restingPose.status,'unproven');
  assert.equal(summary.upperBackground.activeWriter,'0x235e00..0x235e80');
  assert.equal(summary.upperBackground.evidence,'sound-room-replay.json');
  assert.equal(summary.upperBackground.unrelatedSameOffsetMatches.typeOwners.length,8);
  assert.ok(summary.upperBackground.unrelatedSameOffsetMatches.typeOwners.every(o=>o.layouts.every(l=>l.startsWith('S_Cec'))));
  assert.ok(summary.upperBackground.unrelatedSameOffsetMatches.toggleSites.some(s=>s.operation==='enable'));
});

test('production Sound composition requests no visualiser model and the song manifest stays empty',()=>{
  for(const pack of soundScreenPacks){assert.ok(!/S_Vis|S_Back_U|models\//.test(pack.url+pack.layouts.join()),pack.url);}
  assert.ok(!/S_Vis|S_Back_U|loadFirmwareModel/.test(soundSource));
  assert.deepEqual([...portfolioMedia.tracks],[]);
});
