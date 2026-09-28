import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import ts from 'typescript';

const source = readFileSync(new URL('../src/os/native-keyboard-text.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { nativeNicknameInitialTextPose: pose, nativeNicknameTextPose: selectionPose } = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
const occupied = Array.from({length:4}, () => [252,255,243,255]);
const empty = Array.from({length:4}, () => [203,197,179,255]);
function fixture() {
  const roots = [];
  for (let i=1;i<=32;i++) {
    const suffix = String(i).padStart(2,'0');
    roots.push({name:`P_textAreaMSC${suffix}`,children:[],picture:{colors:structuredClone(i===1?occupied:empty)}});
    roots.push({name:`T_textAreaMSC${suffix}`,children:[],text:{value:'authored'}});
  }
  return {roots};
}

test('native empty, Ada and full-buffer captures retain all ten cell positions and distinct cursor endpoints', () => {
  // Independent captured float32 values, not recomputed with the implementation.
  const positions = [-85.00001525878906,-68.00001525878906,-51.00001525878906,-34.00001525878906,
    -17.000015258789062,-0.0000152587890625,16.999984741210938,33.99998474121094,50.99998474121094,67.99998474121094];
  for (const [input,cursorX] of [['',0],['Ada',51],['ABCDEFGHIJ',168.11111450195312]]) {
    const out=pose(input,fixture());
    assert.equal(out.cursor,input.length);assert.equal(out.selectionAnchor,input.length);assert.equal(out.selectionActive,false);
    assert.deepEqual(out.textArea.N_textAreaMSC.scale,[1.5882350206375122,1.5882350206375122]);
    assert.deepEqual(out.cursorLayout.N_decorCursor.translation,[cursorX,3,0]);
    assert.deepEqual(out.cursorLayout.P_decorCursorMS,{visible:true,size:[1.2592594623565674,23]});
    assert.equal(out.cursorLayout.P_decorCursor.visible,false);
    for (let i=0;i<10;i++) {
      const suffix=String(i+1).padStart(2,'0'),picture=out.textArea[`P_textAreaMSC${suffix}`],text=out.textArea[`T_textAreaMSC${suffix}`];
      assert.deepEqual(picture.translation,[positions[i],11.96296501159668,0]);
      assert.deepEqual(text.translation,[positions[i],8.96296501159668,0]);
      assert.equal(text.text,input[i]??' ');assert.equal(text.visible,true);assert.equal(picture.visible,true);
      assert.deepEqual(picture.vertexColors,i<input.length?occupied:empty);
    }
    assert.equal(out.textArea.T_textAreaMSC01.lineSpacing,-5.03703498840332);
    assert.equal(out.textArea.T_textAreaMSC02.lineSpacing,undefined);
    assert.deepEqual(out.textArea.N_decor.translation,[-85.00001525878906,8.96296501159668,0]);
    assert.deepEqual(out.textArea.N_transDecor.translation,out.textArea.N_decor.translation);
    assert.deepEqual(out.textArea.T_trans,{text:' '});
    for (let i=11;i<=32;i++) for (const prefix of ['P','T']) {
      assert.deepEqual(out.textArea[`${prefix}_textAreaMSC${i}`],{visible:false});
    }
  }
});

test('source colors remain isolated between assets, cells and successive poses', () => {
  const layout=fixture(),before=structuredClone(layout);
  const out=pose('Ada',layout);
  out.textArea.P_textAreaMSC01.vertexColors[0][0]=0;
  assert.deepEqual(out.textArea.P_textAreaMSC02.vertexColors,occupied);
  assert.deepEqual(pose('Ada',layout).textArea.P_textAreaMSC01.vertexColors,occupied);
  assert.deepEqual(layout,before);
  layout.roots[0].picture.colors[0][0]=12;
  assert.equal(pose('Ada',layout).textArea.P_textAreaMSC01.vertexColors[0][0],12);
});

test('pose requires normalized text and complete cell assets instead of inventing filtering or partial rows', () => {
  for (const input of ['ABCDEFGHIJK','A\0B','A\nB','A\tB']) assert.throws(()=>pose(input,fixture()),/normalized text/);
  const layout=fixture();layout.roots.pop();assert.throws(()=>pose('Ada',layout),/T_textAreaMSC32/);
  const colors=fixture();delete colors.roots[0].picture;assert.throws(()=>pose('Ada',colors),/cell colors/);
});

test('UTF-16 indexing is retained without claiming Unicode filter or glyph verification', () => {
  const out=pose('A\ud83d\ude00B',fixture());
  assert.equal(out.cursor,4);assert.equal(out.textArea.T_textAreaMSC02.text,'\ud83d');
  assert.equal(out.textArea.T_textAreaMSC03.text,'\ude00');assert.equal(out.textArea.T_textAreaMSC04.text,'B');
});

const evidenceRoot=process.env.NATIVE_KEYBOARD_REFERENCE_ROOT;
test('frozen original ARM pane writes agree with real decoded layouts for all three native captures', {skip:!evidenceRoot}, () => {
  const root=join(evidenceRoot,'settings-nickname/lower-first-paint');
  const contract=JSON.parse(readFileSync(join(root,'text-pane-contract-frozen.json'),'utf8'));
  for (const [file,hash] of [['text-pane-fixture-frozen.py',contract.fixtureSha256],['text-pane-result-frozen.json',contract.resultSha256]]) {
    assert.equal(createHash('sha256').update(readFileSync(join(root,file))).digest('hex'),hash,file);
  }
  assert.equal(contract.sourceSha256,'a0b78005b0a99116ca703bc9b7625ce1b0f2d4cc45f66fc6fb9ab8a34244d4f0');
  const load=name=>JSON.parse(readFileSync(join(evidenceRoot,'decoded/members/swkbd_common_LZ.bin/blyt',name+'.json'),'utf8'));
  const text=load('TextArea_02'),cursor=load('DecorCursor');
  const walk=panes=>panes.flatMap(p=>[p,...walk(p.children)]);
  const maps={textArea:new Map(walk(text.roots).map(p=>[p.name,p])),cursorLayout:new Map(walk(cursor.roots).map(p=>[p.name,p]))};
  for (const capture of contract.cases) {
    const out=pose(capture.input,text);
    for (const [key,layout] of [['textArea','TextArea_02.bclyt'],['cursorLayout','DecorCursor.bclyt']]) {
      for (const [name,override] of Object.entries(out[key])) {
        const native=capture.panes.find(p=>p.id===`${layout}:${name}`),authored=maps[key].get(name);
        assert.ok(native,`${capture.input}/${layout}/${name}`);
        for (const [field,expected] of Object.entries(override)) {
          const nativeField={translation:'position',vertexColors:'colors',text:'paintText'}[field]??field;
          assert.deepEqual(expected,native[nativeField],`${capture.input}/${name}/${field}`);
        }
        // Unwritten geometry, text styling and hidden cell strings remain authored.
        assert.deepEqual(override.size??authored.size,native.size);
        assert.deepEqual(override.scale??authored.scale,native.scale);
        if (authored.text) assert.equal(override.lineSpacing??authored.text.lineSpacing,native.lineSpacing);
      }
    }
    for (const name of out.hiddenDecorations) {
      const instances=capture.panes.filter(p=>p.id===`${name}.bclyt:RootPane`);
      assert.ok(instances.length>0,name);assert.ok(instances.every(p=>!p.visible),name);
    }
  }
});

// Numeric original-ARM outputs; no firmware bytes or authored approximations.
test('all 154 original cursor/selection updates match the model and visible child geometry', () => {
  const captures=JSON.parse(readFileSync(new URL('./fixtures/native-keyboard-selection.json',import.meta.url),'utf8'));
  assert.equal(captures.cases.length,154);
  for(const row of captures.cases){
    const state={value:row.input.text,cursor:row.model.cursor,anchor:row.model.anchor,selectionActive:row.model.selection};
    const out=selectionPose(state,fixture());
    assert.equal(out.cursor,row.model.cursor);assert.equal(out.selectionAnchor,row.model.anchor);assert.equal(out.selectionActive,row.model.selection);
    for(const [name,override] of Object.entries(out.cursorLayout))for(const [field,value] of Object.entries(override)){
      assert.deepEqual(value,row.cursor[name][field==='translation'?'position':field],`${JSON.stringify(row.input)}/${name}/${field}`);
    }
    for(const [i,override] of out.selectionLayouts.entries()){
      assert.equal(override.RootPane.visible,row.selections[i].root.visible,`${JSON.stringify(row.input)}/selection${i}`);
      if(override.RootPane.visible){
        assert.deepEqual(override.P_decorArea.translation,row.selections[i].picture.position);
        assert.deepEqual(override.P_decorArea.size,row.selections[i].picture.size);
      }
    }
    assert.equal(out.hiddenDecorations.includes('DecorArea_select'),!row.selections.some(s=>s.root.visible));
    assert.deepEqual(state,{value:row.input.text,cursor:row.model.cursor,anchor:row.model.anchor,selectionActive:row.model.selection});
  }
});

test('selection state validates UTF-16 offsets and creates independent decoration instances',()=>{
  const state={value:'Ada',cursor:1,anchor:3,selectionActive:true};
  for(const field of ['cursor','anchor'])for(const value of [-1,4,0.5,NaN])assert.throws(()=>selectionPose({...state,[field]:value},fixture()),/cursor or selection anchor/);
  const out=selectionPose(state,fixture());out.selectionLayouts[1].RootPane.visible=true;
  assert.equal(out.selectionLayouts[2].RootPane.visible,false);assert.equal(out.selectionLayouts[3].RootPane.visible,false);
  assert.deepEqual(selectionPose({...state,selectionActive:false},fixture()).selectionLayouts,Array.from({length:4},()=>({RootPane:{visible:false}})));
});
