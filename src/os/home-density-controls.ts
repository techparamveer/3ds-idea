import { getHomeNavigationView } from './home-navigation.ts';
import type { MenuState } from './state.ts';

/** Native toolbar availability uses target density; restored folder0 is valid. */
export function getHomeDensityControls(state:MenuState){
 const {context,targetDensity}=getHomeNavigationView(state);
 return {decreaseEnabled:targetDensity>(context===null?0:1),increaseEnabled:targetDensity<5};
}
