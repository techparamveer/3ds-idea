/** Scene owns GPU resources. Stock presentation owns paired-screen readiness. */
export type StockModelBackground = {
  prepare(owner:string|null,onChange:()=>void):{status:'inactive'|'loading'|'ready'|'error';error?:unknown};
  draw(context:CanvasRenderingContext2D):boolean;
};
