// Capture-fit adaptation, not a traced native pane writer. See
// docs/workstream-handoffs/home-close-composition-fit.md for regions and hashes.
const EDGE_FIT = [
 [0,1],
 [.008127,.976865],
 [.027696,.912558],
 [.105664,.727084],
 [.215555,.450634],
 [.282371,.288948],
 // Beyond this sample the panel edge is no longer distinguishable from noise.
 [.423517,0],
] as const;

export function fittedHomeCloseWindowOpacity(progress:number):number {
 if(!Number.isFinite(progress)||progress<0||progress>1)throw new RangeError('Invalid HOME close fit progress');
 for(let i=1;i<EDGE_FIT.length;i++){
  const [start,a]=EDGE_FIT[i-1],[end,b]=EDGE_FIT[i];
  if(progress<=end)return a+(b-a)*(progress-start)/(end-start);
 }
 return 0;
}

export function homeCloseWindowOpacity(appQuitFrame:number):number {
 if(!Number.isSafeInteger(appQuitFrame)||appQuitFrame<0||appQuitFrame>20)throw new RangeError('Invalid HOME close fit frame');
 // BannerBG_AppQuit Constant4 A: source Hermite 0..20, zero endpoint slopes.
 // Associating the measured edge fit with this scalar remains an adaptation.
 const t=appQuitFrame/20;
 return fittedHomeCloseWindowOpacity(t*t*(3-2*t));
}
