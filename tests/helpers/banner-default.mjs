import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

// Tests read the extracted pack in place until integration promotes the public
// model and six PNGs. There is no synthetic replacement for this primary.
const model=process.env.FIRMWARE_BANNER_DEFAULT_MODEL?pathToFileURL(resolve(process.env.FIRMWARE_BANNER_DEFAULT_MODEL)):new URL('../../public/os/firmware/10.7.0-32E/models/banner-default/model.json',import.meta.url);
export const hasAuthoredDefault=existsSync(model);
if(process.env.FIRMWARE_BANNER_DEFAULT_MODEL&&!hasAuthoredDefault)throw new Error('FIRMWARE_BANNER_DEFAULT_MODEL does not exist');
export const defaultBannerResource=name=>readFileSync(new URL(name,model));
export const defaultBannerData=()=>JSON.parse(defaultBannerResource('model.json'));
