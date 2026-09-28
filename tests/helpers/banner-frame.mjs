import {existsSync,readFileSync} from 'node:fs';

// Before public promotion, opt into the extracted candidate without copying it:
// FIRMWARE_BANNER_FRAME_MODEL=/path/to/BannerFrame/model.json node --test ...
const candidate=process.env.FIRMWARE_BANNER_FRAME_MODEL??new URL('../../public/os/firmware/10.7.0-32E/models/banner-frame/model.json',import.meta.url);
export const hasAuthoredFrame=existsSync(candidate);
if(process.env.FIRMWARE_BANNER_FRAME_MODEL&&!hasAuthoredFrame)throw new Error('FIRMWARE_BANNER_FRAME_MODEL does not exist');
export function bannerFrameData(){
 if(hasAuthoredFrame)return JSON.parse(readFileSync(candidate,'utf8'));
 // Transaction-only fixture until the real pack is promoted. This triangle is
 // never application artwork, and the authored geometry test is skipped for it.
 const data=JSON.parse(readFileSync(new URL('../../public/os/firmware/10.7.0-32E/models/folder/model.json',import.meta.url),'utf8'));
 const source=data.models[0],mesh=source.meshes[0],material=source.materials[mesh.material];
 material.MaterialParams.StencilTest={Enabled:true,Function:'Never',Reference:1,Mask:1,BufferMask:0};
 material.MaterialParams.StencilOperation={FailOp:'Replace',ZFailOp:'Replace',ZPassOp:'Replace'};
 source.name='TransactionFixture';source.skeleton=[];source.materials=[material];source.meshes=[{...mesh,material:0,position:[[0,0,0],[1,0,0],[0,1,0]],normal:Array(3).fill([0,0,1]),color:Array(3).fill([1,1,1,1]),uv0:Array(3).fill([0,0]),uv1:Array(3).fill([0,0]),uv2:Array(3).fill([0,0]),joints:Array(3).fill([0,0,0,0]),weights:Array(3).fill([1,0,0,0]),submeshes:[{indices:[0,1,2],bones:[],skinning:'Rigid',primitive:'Triangles'}]}];
 data.models=[source];data.textures=[];data.skeletalAnimations=[];data.materialAnimations=[];data.visibilityAnimations=[];
 return data;
}
