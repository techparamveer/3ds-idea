import type { AppView } from './app-types';

/** Logical lower-LCD rectangles shared by presentation and UI navigation. */
export type StockScreenTarget = {action:string;x:number;y:number;width:number;height:number;row?:number};
const target=(action:string,x:number,y:number,width:number,height:number,row?:number):StockScreenTarget=>({action,x,y,width,height,...(row===undefined?{}:{row})});
export function stockScreenTargets(view:AppView):StockScreenTarget[]{
  const {appId,screen,rows,selection}=view, result:StockScreenTarget[]=[];
  if(appId==='nnid-settings')return [target('back',0,212,64,28)];
  if(appId==='system-updater')return [target('back',0,208,120,32)];
  if(appId==='system-transfer'){
    result.push(target('back',0,208,120,32));
    if(screen==='main')rows.forEach((row,index)=>{const y=row.id==='3ds'?18:row.id==='dsi'?110:null;if(y!==null)result.push(target(row.id,27,y,266,64,index));});
    return result;
  }
  if(appId==='extrapad')return screen==='main'?[target('back',0,212,160,28),target('information',160,212,160,28,0)]:[target('back',0,212,320,28)];
  if(appId==='system-settings'&&screen==='main'){
    const locations:Record<string,number[]>={nnid:[4,0,312,33],internet:[16,38,140,78],parental:[164,38,140,78],data:[16,123,140,78],other:[164,123,140,78]};
    rows.forEach((row,index)=>{const rect=locations[row.id];if(rect)result.push(target(row.id,rect[0],rect[1],rect[2],rect[3],index));});
  }else if(appId==='system-settings'&&(screen==='internet'||screen==='parental')){
    const rects=screen==='internet'?[[28,23,264,66],[28,106,264,26],[28,139,264,26],[28,172,264,26]]:[[28,125,264,26],[28,165,264,26]];
    rows.forEach((row,index)=>{const r=rects[index];if(r)result.push(target(row.id,r[0],r[1],r[2],r[3],index));});
    if(screen==='internet'&&view.footer.left)result.push(target(view.footer.left.action,0,208,120,32));
    return result;
  }else if(appId==='system-settings'&&screen!=='main'){
    const rects=screen==='data'?[[19,17,146,78],[177,17,126,78],[28,109,264,38],[28,171,264,26]]:screen==='profile'||screen==='data-3ds'?[[28,37,264,38],[28,82,264,38],[28,127,264,38],[28,173,264,26]]:screen==='other'?[[35,50,249,41],[35,98,249,41],[35,146,249,41]]:screen==='clock'?[[28,125,264,26],[28,165,264,26]]:[];
    if(screen==='connections'){
      const locations:Record<string,number[]>={'new-connection':[28,19,264,66],'connection-1':[12,117,92,70],'connection-2':[114,117,92,70],'connection-3':[216,117,92,70]};
      rows.forEach((row,index)=>{const r=locations[row.id];if(r)result.push(target(row.id,r[0],r[1],r[2],r[3],index));});
    }else if(screen==='restrictions'){
      const start=Math.floor(selection/4)*4;rows.slice(start,start+4).forEach((row,i)=>result.push(target(row.id,28,24+i*44,264,38,start+i)));
    }else rows.forEach((row,index)=>{const r=rects[index];if(r)result.push(target(row.id,r[0],r[1],r[2],r[3],index));});
    if(screen==='other'){
      const page=typeof view.data?.page==='number'?view.data.page:0;
      if(page>0)result.push(target('settings-previous',0,65,30,100));
      if(page<3)result.push(target('settings-next',290,65,30,100));
    }
    if(view.footer.left)result.push(target(view.footer.left.action,0,208,120,32));
    return result;
  }else if(appId==='eshop'){
    return [target('back',85,193,150,33)];
  }else if(appId==='nintendo-zone'){
    if(screen==='main')result.push(target('scan',29,30,262,86,0),target('information',29,136,262,36,1));
    result.push(target('back',0,212,106,28));return result;
  }else if(appId==='health-safety'&&screen==='main'){
    rows.slice(0,3).forEach((row,index)=>result.push(target(row.id,36,21+index*64,248,48,index)));
  }else if(appId==='browser'&&screen==='main'){
    const locations:Record<string,number[]>={search:[16,38,288,64],bookmarks:[16,111,144,42],'add-bookmark':[160,111,144,42],settings:[9,164,100,34],'page-info':[110,164,100,34],address:[211,164,100,34]};
    rows.forEach((row,index)=>{const r=locations[row.id];if(r)result.push(target(row.id,r[0],r[1],r[2],r[3],index));});
    if(view.footer.left)result.push(target(view.footer.left.action,0,212,106,28));
    return result;
  }else if(appId==='miiverse'){
    if(screen==='main')rows.slice(0,4).forEach((row,index)=>result.push(target(row.id,index*64,212,64,28,index)));
    if(view.footer.left)result.push(target(view.footer.left.action,256,212,64,28));
    return result;
  }else if((appId==='camera'||appId==='camera-applet')&&(screen==='main'||screen==='gallery')){
    const start=Math.floor(selection/6)*6;
    rows.slice(start,start+6).forEach((row,i)=>result.push(target(row.id,12+(i%3)*102,38+Math.floor(i/3)*80,92,72,start+i)));
  }else if((appId==='camera'||appId==='camera-applet')&&screen==='photo'){
    result.push(target('previous',10,85,45,60),target('next',265,85,45,60));
  }else if(appId==='sound'&&screen==='playback'){
    result.push(target('previous',45,130,58,50),target('play',123,122,74,64),target('next',217,130,58,50),target('repeat',25,185,100,24),target('shuffle',195,185,100,24));
  }else if(appId==='friends'&&(screen==='profile'||screen==='main'&&rows.length===1&&rows[0].id==='profile')){
    if(screen==='main')result.push(target('profile',107,114,106,66,0));
    if(view.footer.left)for(const [width,height]of [[110,32],[150,27],[186,22],[214,17],[242,12],[270,6]])result.push(target(view.footer.left.action,(320-width)/2,240-height,width,height));
    return result;
  }else if(appId==='game-notes'&&screen==='drawing'){
    return [target('back',0,212,44,28)];
  }else if(appId==='game-notes'&&screen==='main'){
    const start=Math.floor(selection/16)*16;
    rows.slice(start,start+16).forEach((row,i)=>result.push(target(row.id,7+(i%4)*79,8+Math.floor(i/4)*51,70,44,start+i)));
    if(view.footer.left)result.push(target(view.footer.left.action,0,212,320,28));
    return result;
  }else if(appId==='memo'&&screen==='main'){
    const start=Math.floor(selection/16)*16;
    rows.slice(start,start+16).forEach((row,i)=>result.push(target(row.id,17+(i%4)*73,37+Math.floor(i/4)*41,67,36,start+i)));
  }else if(screen!=='document'&&screen!=='detail'){
    const start=Math.floor(selection/4)*4;
    rows.slice(start,start+4).forEach((row,i)=>result.push(target(row.id,18,40+i*39,284,35,start+i)));
  }
  if(appId==='notifications'&&screen==='main'&&rows.length===0&&view.footer.left)return [...result,target(view.footer.left.action,0,212,320,28)];
  if(appId==='browser'){if(view.footer.left)result.push(target(view.footer.left.action,0,212,106,28));return result;}
  if(view.footer.left)result.push(target(view.footer.left.action,0,214,150,26));
  if(view.footer.right)result.push(target(view.footer.right.action,170,214,150,26));
  return result;
}
export function stockScreenActionAt(view:AppView,x:number,y:number):string|null{
  if(!Number.isFinite(x)||!Number.isFinite(y))return null;
  return stockScreenTargets(view).find(r=>x>=r.x&&x<r.x+r.width&&y>=r.y&&y<r.y+r.height)?.action??null;
}
/** The player owns seek seconds; this function only maps its displayed track. */
export function stockScreenSeekAt(view:AppView,x:number,y:number):number|null{
  if(view.appId!=='sound'||view.screen!=='playback'||!Number.isFinite(x)||!Number.isFinite(y)||x<30||x>290||y<95||y>119)return null;
  return Math.max(0,Math.min(1,(x-30)/260));
}
