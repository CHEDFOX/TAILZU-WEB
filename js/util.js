// Small shared helpers, and the window as main.js last measured it.
export const TAU = Math.PI * 2;
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, k) => a + (b - a) * k;
export const easeOut = (k) => 1 - Math.pow(1 - clamp(k), 3);
export const easeIO = (k) => { k = clamp(k); return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
export const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
/** The window in CSS pixels, and the device pixel ratio the canvases draw at (at most 2). Set by main.js on every resize. */
export const view = { w: 0, h: 0, dpr: 1 };
