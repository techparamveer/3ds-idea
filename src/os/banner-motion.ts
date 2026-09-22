/** HOME common banner update 0x24e0c0: one negative revolution per 600 calls.
 * The call-to-frame cadence is provisionally 60 Hz; selection does not reset it.
 * Touch/impulse angle fields remain unbound until their inputs are recovered.
 */
export function homeBannerYaw(elapsedMs:number):number {
 if(!Number.isFinite(elapsedMs)||elapsedMs<0)throw new Error('Invalid banner time');
 const counter=(Math.floor(elapsedMs*60/1000)+1)%600;
 return Math.fround(Math.fround(Math.fround(-counter*Math.fround(Math.PI))*2)*Math.fround(1/600));
}
