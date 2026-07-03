/** Breakpoints alineados con `packages/jp-ds/tokens/spacing.css` / `desing.md` §7.2 */
export const BP_SM = 640;
export const BP_MD = 768;
export const BP_LG = 1024;
export const BP_XL = 1280;

export const MEDIA_SM_UP = `(min-width: ${BP_SM}px)` as const;
export const MEDIA_MD_UP = `(min-width: ${BP_MD}px)` as const;
export const MEDIA_DESKTOP = `(min-width: ${BP_LG}px)` as const;
export const MEDIA_XL_UP = `(min-width: ${BP_XL}px)` as const;
