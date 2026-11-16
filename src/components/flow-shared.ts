/**
 * What the hero figure's GPU engine and its worker agree on: the layout of
 * the per-grain buffer, the messages that cross between them, and the one
 * helper both sides need. Kept apart from flow-coupling.ts so the page loads
 * these few lines and the coupling code itself stays in the worker.
 */

export const STAGGER = 0.3; // fraction of the clock spent sweeping the start wavefront
export const GRAIN_FLOATS = 6; // fromX, fromY, dstX, dstY, delay, radius

export type Box = { x0: number; y0: number; x1: number; y1: number };

export type PlanRequest = {
  id: number;
  n: number;
  /** Canvas size in CSS px. */
  w: number;
  h: number;
  /** Sub-box the figure fits inside, as fractions of the canvas. */
  box: Box;
  /** Base grain radius; each grain gets 0.75x to 1.35x of it. */
  dotR: number;
  target: "noise" | "blockm";
  /** Start positions (2n floats). Null draws fresh Gaussian noise. */
  from: Float32Array | null;
  /** Reuse these target points (2n floats) instead of sampling new ones. */
  targets: Float32Array | null;
  /** False returns the start cloud standing still (from = dst): the frame
      shown while the Block M mark is still loading. */
  couple: boolean;
  seed: number;
};

export type Plan = {
  id: number;
  n: number;
  /** n rows of GRAIN_FLOATS, ready to upload as one vertex buffer. */
  grains: Float32Array;
  /** Mean and std of a noise target, for the sigma rings. */
  stats: { cx: number; cy: number; sigma: number } | null;
  /** Time spent computing, in ms. */
  ms: number;
};

export type MarkCloud = { pts: Float32Array; aspect: number };

/** The Block M as a point cloud: every pixel of the rasterized mark whose
    alpha clears 100, in unit coordinates. `data` is RGBA. */
export function cloudFromPixels(data: Uint8ClampedArray, w: number, h: number): MarkCloud | null {
  const pts: number[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 100) pts.push(x / w, y / h);
    }
  }
  return pts.length > 16 ? { pts: new Float32Array(pts), aspect: h / w } : null;
}
/** The mark is rasterized this wide before it is read back. */
export const MARK_WIDTH = 300;
