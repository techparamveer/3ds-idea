/** Last native tile binding that actually wrote P_IconBtnDmy_00.
 * Disabled controllers do not overwrite this retained pose. */
export type HomeTilePose = Readonly<{ clip: 'select' | 'decide'; frame: number }>;
