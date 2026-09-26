import type { MenuState } from './state.ts';
import { getHomePresentation, getNativeFolderBalloon, getNativeSettingsTitleBalloon, getNativeHealthTitleBalloon, getNativeSoundTitleBalloon } from './home-presentation.ts';

export type HomeBalloonPresentation = Readonly<{
  visible: boolean;
  desired: boolean;
  clip: 'Appear' | 'DisAppear';
  frame: number;
  label: string;
  baseX: number;
  bodyOffsetX: number;
  titleId: string | null;
}>;

const selectedBalloon=(state:MenuState)=>{
 const view=getHomePresentation(state);
 const folder=getNativeFolderBalloon(state,view);
 if(folder)return {...folder,titleId:null};
 const title=getNativeSettingsTitleBalloon(state,view);
 if(title)return {...title,titleId:'0004001000022000'};
 const health=getNativeHealthTitleBalloon(state,view);
 if(health)return {...health,titleId:'0004001000022300'};
 const sound=getNativeSoundTitleBalloon(state,view);
 return sound?{...sound,titleId:'0004001000022500'}:null;
};

const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const source=(value:unknown,titleId:string):value is Record<string,unknown>=>object(value)&&value.titleId===titleId
  &&value.path==='ExeFS/icon'&&typeof value.sha256==='string'&&/^[a-f0-9]{64}$/.test(value.sha256);
/** Select text only when both English SMDH fields resolve to the manifest's
 * published icon source. No descriptor or guessed publisher fallback. */
export function selectHomeSettingsBalloonText(raw:unknown):string|null{return selectHomeTitleBalloonText(raw,'0004001000022000','icons/settings.png');}
export function selectHomeHealthBalloonText(raw:unknown):string|null{return selectHomeTitleBalloonText(raw,'0004001000022300','icons/health-and-safety.png');}
export function selectHomeSoundBalloonText(raw:unknown):string|null{return selectHomeTitleBalloonText(raw,'0004001000022500','icons/sound.png');}
function selectHomeTitleBalloonText(raw:unknown,titleId:string,iconPath:string):string|null{
 if(!object(raw)||raw.schema!==1||raw.firmware!=='10.7.0-32E'||raw.region!=='EUR'||raw.locale!=='EU_English'
   ||!object(raw.titles)||!object(raw.resources))return null;
 const title=raw.titles[titleId];
 const longSource=object(title)?title.longDescriptionSource:null;
 const publisherSource=object(title)?title.publisherSource:null;
 if(!object(title)||title.titleId!==titleId||typeof title.longDescription!=='string'
   ||typeof title.publisher!=='string'||!title.longDescription.trim()||!title.publisher.trim()
   ||title.longDescription.length>127||title.publisher.length>63||/[\0\r\n]/.test(title.longDescription+title.publisher)
   ||!source(longSource,titleId)||!source(publisherSource,titleId)
   ||longSource.sha256!==publisherSource.sha256
   ||!object(title.longDescriptionConversion)||title.longDescriptionConversion.name!=='smdh-notes-english-description'
   ||title.longDescriptionConversion.languageIndex!==1||title.longDescriptionConversion.fieldOffset!==0x288
   ||!object(title.publisherConversion)||title.publisherConversion.name!=='smdh-english-publisher'
   ||title.publisherConversion.languageIndex!==1||title.publisherConversion.fieldOffset!==0x388)return null;
 const icon=raw.resources[iconPath];
 if(!object(icon)||!Array.isArray(icon.sources)||!icon.sources.some(item=>source(item,titleId)&&item.sha256===publisherSource.sha256))return null;
 return `${title.longDescription}\n${title.publisher}`;
}

/** The source LncBlln_00 clips apply frames 0..5 once per HOME update.
 * Keep the last content and anchor while DisAppear runs. Initial HOME uses
 * the source's static settled pose rather than replaying an entry animation.
 */
export function createHomeBalloonPresentation(state: MenuState): HomeBalloonPresentation {
  const target = selectedBalloon(state);
  return Object.freeze({ visible: !!target, desired: !!target, clip: 'Appear', frame: 5,
    label: target?.label ?? '', baseX: target?.baseX ?? 0, bodyOffsetX: target?.bodyOffsetX ?? 0,
    titleId: target?.titleId ?? null });
}

export function advanceHomeBalloonPresentation(current: HomeBalloonPresentation, state: MenuState): HomeBalloonPresentation {
  const target = selectedBalloon(state);
  if (target) {
    if (!current.desired) return Object.freeze({ visible: true, desired: true, clip: 'Appear', frame: 0,
      label: target.label, baseX: target.baseX, bodyOffsetX: target.bodyOffsetX, titleId:target.titleId });
    return Object.freeze({ ...current, visible: true, clip: 'Appear', frame: Math.min(5, current.frame + 1),
      label: target.label, baseX: target.baseX, bodyOffsetX: target.bodyOffsetX, titleId:target.titleId });
  }
  if (current.desired) return Object.freeze({ ...current, desired: false, clip: 'DisAppear', frame: 0 });
  if (!current.visible) return current;
  if (current.frame === 5) return Object.freeze({ ...current, visible: false });
  const frame = Math.min(5, current.frame + 1);
  return Object.freeze({ ...current, clip: 'DisAppear', frame });
}
