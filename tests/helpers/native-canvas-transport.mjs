export function createNativeTransportCanvas(){
 const c={width:1,height:1},stack=[];let pixels,transform={a:1,b:0,c:0,d:1,e:0,f:0};
 const buffer=()=>{if(pixels?.length!==c.width*c.height*4)pixels=new Uint8ClampedArray(c.width*c.height*4);return pixels;};
 const ctx={canvas:c,globalAlpha:1,globalCompositeOperation:'source-over',fillStyle:'#fff',
  save(){stack.push({...transform});},restore(){transform=stack.pop();},resetTransform(){transform={a:1,b:0,c:0,d:1,e:0,f:0};},
  getTransform:()=>({...transform}),translate(x,y){transform.e+=transform.a*x+transform.c*y;transform.f+=transform.b*x+transform.d*y;},
  scale(x,y){transform.a*=x;transform.b*=x;transform.c*=y;transform.d*=y;},
  rotate(angle){const {a,b,c,d}=transform,cos=Math.cos(angle),sin=Math.sin(angle);Object.assign(transform,{a:a*cos+c*sin,b:b*cos+d*sin,c:c*cos-a*sin,d:d*cos-b*sin});},
  beginPath(){},rect(){},clip(){},
  createImageData:(width,height)=>({width,height,data:new Uint8ClampedArray(width*height*4)}),
  getImageData(x,y,width,height){const image=this.createImageData(width,height),source=buffer();for(let row=0;row<height;row++)for(let col=0;col<width;col++){const sx=x+col,sy=y+row;if(sx>=0&&sy>=0&&sx<c.width&&sy<c.height)image.data.set(source.subarray((sy*c.width+sx)*4,(sy*c.width+sx)*4+4),(row*width+col)*4);}return image;},
  putImageData(image,x,y){const target=buffer();for(let row=0;row<image.height;row++)for(let col=0;col<image.width;col++){const dx=x+col,dy=y+row;if(dx>=0&&dy>=0&&dx<c.width&&dy<c.height)target.set(image.data.subarray((row*image.width+col)*4,(row*image.width+col)*4+4),(dy*c.width+dx)*4);}},
  clearRect(){buffer().fill(0);},fillRect(){const rgb=this.fillStyle==='#fff'?[255,255,255,255]:[0,0,0,255];const target=buffer();for(let at=0;at<target.length;at+=4)target.set(rgb,at);},
  drawImage(source,...args){const sourcePixels=source.data??source.getContext('2d').getImageData(0,0,source.width,source.height).data,sw=source.naturalWidth??source.width,sh=source.naturalHeight??source.height;
   const [sx,sy,w,h,dx,dy,dw,dh]=args.length===8?args:args.length===4?[0,0,sw,sh,...args]:[0,0,sw,sh,args[0],args[1],sw,sh],image=this.createImageData(Math.ceil(dw),Math.ceil(dh));
   for(let row=0;row<image.height;row++)for(let col=0;col<image.width;col++){const x=Math.floor(sx+col*w/dw),y=Math.floor(sy+row*h/dh);if(x>=0&&y>=0&&x<sw&&y<sh)image.data.set(sourcePixels.subarray((y*sw+x)*4,(y*sw+x)*4+4),(row*image.width+col)*4);}this.putImageData(image,Math.floor(dx),Math.floor(dy));
  },
 };
 c.getContext=()=>ctx;return c;
}
