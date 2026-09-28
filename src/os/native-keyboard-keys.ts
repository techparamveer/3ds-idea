import {boundAnimationTracks, poseNativeLayout, type NativeAnimation, type NativeLayout, type NativeMessageStyle, type NativePack, type NativePane, type PaneOverrides} from './native-layout';

export type NativeQwertyPaneSubmission = {pane:string;clip:string;frame:number};
export type NativeQwertyStyleResources = {styles:readonly NativeMessageStyle[];font:{width:number;height:number}};
export type NativeNicknameQwertyPresentation = {
  /** Property writes followed by the eight immediate, retained submissions. */
  layout:NativeLayout;
  /** Complete property state, including native text metric writes. */
  initializationLayout:NativeLayout;
  initializationOverrides:PaneOverrides;
  immediateSubmissions:NativeQwertyPaneSubmission[];
  /** Explicit local-pass evidence, not an automatically advanced scene clock. */
  firstLocalControllerSubmissions:NativeQwertyPaneSubmission[];
  messageStyleApplications:{pane:string;label:string;styleIndex:number}[];
};

function paneMap(layout:NativeLayout){
  const map=new Map<string,NativePane>();
  const visit=(panes:NativePane[])=>panes.forEach(p=>{if(map.has(p.name))throw new Error(`Ambiguous QWERTY pane ${p.name}`);map.set(p.name,p);visit(p.children);});
  visit(layout.roots);return map;
}

/** Apply only the named pane's own bound channels/materials, in submission order.
 * A native per-pane controller does not resample the clip onto its whole group.
 * Sharing is resolved by the existing binder before this final pane restriction.
 */
export function applyNativeQwertyPaneSubmissions(layout:NativeLayout,animations:Record<string,NativeAnimation>,submissions:readonly NativeQwertyPaneSubmission[]):NativeLayout{
  const panes=paneMap(layout),scoped:Record<string,NativeAnimation>={};
  const bindings=submissions.map((submission,index)=>{
    if(!Number.isFinite(submission.frame))throw new Error('Invalid QWERTY submission frame');
    const pane=panes.get(submission.pane),clip=animations[submission.clip];
    if(!pane)throw new Error(`Missing QWERTY submission pane ${submission.pane}`);
    if(!clip)throw new Error(`Missing QWERTY clip ${submission.clip}`);
    if(!['pan1','bnd1','pic1','txt1'].includes(pane.kind))throw new Error(`Unverified QWERTY material enumeration ${pane.kind}`);
    const ids=pane.picture?[pane.picture.material]:pane.text?[pane.text.material]:[];
    const materials=new Set(ids.map(id=>{const material=layout.materials[id];if(!material)throw new Error(`Missing QWERTY material ${id}`);return material.name;}));
    const tracks=boundAnimationTracks(layout,clip).filter(track=>track.binding==='pane'?track.target===pane.name:track.binding==='material'&&materials.has(track.target));
    if(!tracks.length)throw new Error(`No bound QWERTY channels ${submission.clip}/${submission.pane}`);
    const name=String(index);scoped[name]={...clip,groups:[],shares:[],tracks};return {name,frame:submission.frame};
  });
  return poseNativeLayout(layout,scoped,bindings);
}

/** Corrected English page0 initialization for the existing-profile name request.
 * Only the named qwerty_conv path applies message metrics (0x116bdc).
 * Dictionary and per-unit character paths copy text and retain authored styles.
 */
export function nativeNicknameQwertyPresentation(layout:NativeLayout,animations:Record<string,NativeAnimation>,messages:NativePack['messages'][string],styleResources:NativeQwertyStyleResources):NativeNicknameQwertyPresentation{
  const panes=paneMap(layout),overrides:PaneOverrides={},messageStyleApplications:NativeNicknameQwertyPresentation['messageStyleApplications']=[];
  const requirePane=(name:string)=>{const pane=panes.get(name);if(!pane)throw new Error(`Missing QWERTY pane ${name}`);return pane;};
  const write=(pane:string,value:PaneOverrides[string])=>{requirePane(pane);overrides[pane]={...overrides[pane],...value};};
  const message=(label:string)=>{const index=messages.labels[label],row=messages.messages[index];if(!Number.isInteger(index)||!row||typeof row.text!=='string')throw new Error(`Missing QWERTY message ${label}`);return row;};
  const text=(pane:string,label:string,value?:string)=>{
    if(!requirePane(pane).text)throw new Error(`QWERTY text target is not text ${pane}`);
    const row=message(label);write(pane,{text:value??row.text});
  };
  // Original named-message call precedes dictionary/character assignment.
  text('T_key_Tra','qwerty_conv');text('T_dictionary','qwerty_dic_en');
  const characters=message('qwerty_keytop').text;
  if(characters.length!==45)throw new Error('QWERTY page0 requires 45 resource UTF-16 labels');
  for(let i=0;i<45;i++)text(`T_key_${String(i).padStart(2,'0')}`,'qwerty_keytop',characters[i]);
  // Native initializer clears these seven panes directly (capacity/length 0).
  // There is no message lookup for these writes in the corrected English path.
  for(const pane of ['T_key_Spc','T_key_BspJP','T_Key_Cps','T_Key_Sft','T_romanKey_00','T_romanKey_01','T_romanKey_02']){
    if(!requirePane(pane).text)throw new Error(`QWERTY text target is not text ${pane}`);
    write(pane,{text:''});
  }
  write('RootPane',{translation:[0,8,0]}); // No-prediction branch 0x17e6d0..0x17e704.
  write('T_key_Spc',{visible:true});write('T_key_Tra',{visible:false});write('P_Key_BspIconJP',{alpha:0});
  for(let i=0;i<3;i++)for(const prefix of ['P','T','B'])write(`${prefix}_romanKey_${String(i).padStart(2,'0')}`,{visible:false});
  for(const name of ['P_dictionary','P_dictionaryIcon','T_dictionary','B_dictionary'])write(name,{visible:true});
  // Exact sink order in corrected qwerty-first-paint.json; these channels remain
  // applied after their bindings are disabled. They are not active blink clocks.
  const immediateSubmissions:NativeQwertyPaneSubmission[]=[
    ...['P_key_Cps','P_key_CpsIcon','T_Key_Cps','P_key_Sft','P_key_SftIcon','T_Key_Sft'].map(pane=>({pane,clip:'Keytop_qwerty_n0s1',frame:0})),
    ...['P_romanKey_00','T_romanKey_00'].map(pane=>({pane,clip:'Keytop_qwerty_s1t0',frame:1})),
  ];
  const firstLocalControllerSubmissions=['P_key_Ent','P_Key_EntIcon','P_dictionary','P_dictionaryIcon','T_dictionary'].map(pane=>({pane,clip:'Keytop_qwerty_i0',frame:0}));
  const initialized=poseNativeLayout(layout,{},[],overrides);
  const styleIndex=message('qwerty_conv').styleIndex;
  if(styleIndex!==undefined&&styleIndex!==null){
    const style=styleResources?.styles[styleIndex],font=styleResources?.font;
    if(!Number.isInteger(styleIndex)||!style||style.fontScale.length!==2||!font||![...style.fontScale,style.lineSpacing,style.characterSpacing,font.width,font.height].every(Number.isFinite)||font.width<=0||font.height<=0)throw new Error('Missing or invalid QWERTY conversion style resources');
    // Original 0x116c68..0x116d1c writes only these four metrics, using f32.
    // poseNativeLayout cloned the pane; never modify the shared source style.
    const target=paneMap(initialized).get('T_key_Tra')!.text!;
    target.size=[Math.fround(Math.fround(style.fontScale[0])*font.width),Math.fround(Math.fround(style.fontScale[1])*font.height)];
    target.lineSpacing=Math.fround(style.lineSpacing);target.characterSpacing=Math.fround(style.characterSpacing);
    delete target.messageStyle; // Metrics above are already resolved for this font.
    messageStyleApplications.push({pane:'T_key_Tra',label:'qwerty_conv',styleIndex});
  }
  return {layout:applyNativeQwertyPaneSubmissions(initialized,animations,immediateSubmissions),initializationLayout:initialized,initializationOverrides:overrides,immediateSubmissions,firstLocalControllerSubmissions,messageStyleApplications};
}
