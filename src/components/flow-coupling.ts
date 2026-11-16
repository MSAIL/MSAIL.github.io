/**
 * Sampling and coupling for the hero figure's GPU engine. Pure functions on
 * typed arrays with no DOM access: this module runs inside a worker
 * (flow-coupling.worker.ts), and scripts/coupling-bench.mjs imports it
 * directly to measure it, so it stays free of anything a worker or Node
 * lacks.
 *
 * The coupling decides which noise sample travels to which point of the
 * Block M. The transport itself is fixed (straight lines, x_t = (1 - t) x0 +
 * t x1); only the pairing is free, and a good pairing is one that
 * approximates the optimal-transport assignment: short paths that do not
 * cross.
 *
 *   1. Iterated sliced OT. A copy of the sources is advected so that, along
 *      one direction after another, its 1D marginal moves toward the
 *      target's (a rank matching per direction, O(N) with a counting sort).
 *      64 projections carry the copy onto the target cloud.
 *   2. The advected copy is matched to the real targets: each takes its
 *      nearest free one, found on a grid.
 *   3. 2-opt polish: swap two grains' targets whenever that shortens the
 *      summed squared length, first among grid neighbours (where nearly all
 *      remaining violations live), then over random pairs.
 *
 * Measured against the exact assignment (scripts/coupling-bench.mjs --exact):
 * mean squared path length lands within about 0.2% of optimal, where the
 * single-projection pairing it replaces sits 40% above it.
 */

import {
  GRAIN_FLOATS,
  STAGGER,
  type Box,
  type MarkCloud,
  type Plan,
  type PlanRequest,
} from "./flow-shared";

/* ----------------------------------------------------------------- random */

export type Rng = { rand: () => number; randn: () => number };

export function makeRng(seed: number): Rng {
  let s = seed >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const randn = () => {
    let u = 0;
    let v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  return { rand, randn };
}

/* --------------------------------------------------------------- samplers */

/** Scale and centre a cloud into `box` with a fractional margin, in place. */
export function fit(p: Float32Array, margin: number, w: number, h: number, box: Box): Float32Array {
  const n = p.length / 2;
  let nx = 1e9, xx = -1e9, ny = 1e9, xy = -1e9;
  for (let i = 0; i < n; i++) {
    const x = p[2 * i];
    const y = p[2 * i + 1];
    if (x < nx) nx = x;
    if (x > xx) xx = x;
    if (y < ny) ny = y;
    if (y > xy) xy = y;
  }
  const sw = xx - nx || 1;
  const sh = xy - ny || 1;
  const bx = box.x0 * w;
  const by = box.y0 * h;
  const bw = (box.x1 - box.x0) * w;
  const bh = (box.y1 - box.y0) * h;
  const k = Math.min((bw * (1 - 2 * margin)) / sw, (bh * (1 - 2 * margin)) / sh);
  const ox = bx + (bw - sw * k) / 2 - nx * k;
  const oy = by + (bh - sh * k) / 2 - ny * k;
  for (let i = 0; i < n; i++) {
    p[2 * i] = p[2 * i] * k + ox;
    p[2 * i + 1] = p[2 * i + 1] * k + oy;
  }
  return p;
}

export function sampleNoise(n: number, w: number, h: number, box: Box, rng: Rng): Float32Array {
  const p = new Float32Array(2 * n);
  for (let i = 0; i < 2 * n; i++) p[i] = rng.randn();
  return fit(p, 0.22, w, h, box);
}

export function sampleMark(
  n: number, w: number, h: number, box: Box, cloud: MarkCloud, rng: Rng,
): Float32Array {
  const p = new Float32Array(2 * n);
  const m = cloud.pts.length / 2;
  for (let i = 0; i < n; i++) {
    const j = (rng.rand() * m) | 0;
    p[2 * i] = cloud.pts[2 * j] + rng.randn() * 0.003;
    p[2 * i + 1] = cloud.pts[2 * j + 1] * cloud.aspect + rng.randn() * 0.003;
  }
  return fit(p, 0.08, w, h, box);
}

/* ---------------------------------------------------------------- sorting */

const SORT_COUNTS = new Uint32Array(65537);

/** O(N) stable counting sort of indices by a float key, 16-bit quantized.
    Ties share a bucket, which is harmless for rank matching. */
export function sortIdxByKey(keys: Float32Array, n: number, out?: Uint32Array): Uint32Array {
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < n; i++) {
    if (keys[i] < lo) lo = keys[i];
    if (keys[i] > hi) hi = keys[i];
  }
  const scale = hi > lo ? 65535 / (hi - lo) : 0;
  const counts = SORT_COUNTS;
  counts.fill(0);
  for (let i = 0; i < n; i++) counts[(((keys[i] - lo) * scale) | 0) + 1]++;
  for (let k = 0; k < 65536; k++) counts[k + 1] += counts[k];
  const order = out ?? new Uint32Array(n);
  for (let i = 0; i < n; i++) order[counts[((keys[i] - lo) * scale) | 0]++] = i;
  return order;
}

/* --------------------------------------------------------------- coupling */

/** Sweeps of the sliced flow; each sweep projects on an orthogonal pair of
    directions, so 32 sweeps are 64 projections. Tuned against the exact
    assignment: a full step along one direction at a time left the result 1
    to 3% above optimal however many directions it took, while half steps
    along both axes of a rotating frame land at 0.2% and stop improving past
    about 32 sweeps. */
export const SWEEPS = 32;
const SWEEP_STEP = 0.5;

/**
 * Iterated sliced OT: returns a copy of `from` advected onto the target
 * cloud. The frame turns by the golden angle each sweep, so any prefix of
 * the sequence covers the directions evenly.
 */
export function slicedFlow(
  from: Float32Array, targets: Float32Array, n: number, sweeps: number, rng: Rng,
): Float32Array {
  const y = new Float32Array(from);
  const pa = new Float32Array(n);
  const pb = new Float32Array(n);
  const ia = new Uint32Array(n);
  const ib = new Uint32Array(n);
  const move = new Float32Array(2 * n);
  const golden = (Math.PI * (Math.sqrt(5) - 1)) / 2;
  const th0 = rng.rand() * Math.PI;
  for (let k = 0; k < sweeps; k++) {
    move.fill(0);
    for (let axis = 0; axis < 2; axis++) {
      const th = th0 + k * golden + (axis * Math.PI) / 2;
      const c = Math.cos(th);
      const s = Math.sin(th);
      for (let i = 0; i < n; i++) {
        pa[i] = y[2 * i] * c + y[2 * i + 1] * s;
        pb[i] = targets[2 * i] * c + targets[2 * i + 1] * s;
      }
      sortIdxByKey(pa, n, ia);
      sortIdxByKey(pb, n, ib);
      // Rank r of the copy moves toward rank r of the target, along this axis.
      for (let r = 0; r < n; r++) {
        const a = ia[r];
        const d = (pb[ib[r]] - pa[a]) * SWEEP_STEP;
        move[2 * a] += d * c;
        move[2 * a + 1] += d * s;
      }
    }
    for (let i = 0; i < 2 * n; i++) y[i] += move[i];
  }
  return y;
}

function bounds(p: Float32Array, n: number): [number, number, number, number] {
  let nx = 1e9, xx = -1e9, ny = 1e9, xy = -1e9;
  for (let i = 0; i < n; i++) {
    const x = p[2 * i];
    const y = p[2 * i + 1];
    if (x < nx) nx = x;
    if (x > xx) xx = x;
    if (y < ny) ny = y;
    if (y > xy) xy = y;
  }
  return [nx, ny, xx, xy];
}

/** Each point of `y` takes its nearest unclaimed target, searched in rings
    of grid cells. perm[i] is the target index given to source i. */
export function matchNearest(y: Float32Array, targets: Float32Array, n: number): Uint32Array {
  const b = bounds(targets, n);
  const cell = Math.sqrt(((b[2] - b[0]) * (b[3] - b[1])) / n) * 1.5 || 1;
  const gw = Math.max(1, Math.ceil((b[2] - b[0]) / cell) + 1);
  const gh = Math.max(1, Math.ceil((b[3] - b[1]) / cell) + 1);
  const head = new Int32Array(gw * gh).fill(-1);
  const next = new Int32Array(n);
  for (let j = 0; j < n; j++) {
    const cx = Math.min(gw - 1, Math.max(0, ((targets[2 * j] - b[0]) / cell) | 0));
    const cy = Math.min(gh - 1, Math.max(0, ((targets[2 * j + 1] - b[1]) / cell) | 0));
    next[j] = head[cy * gw + cx];
    head[cy * gw + cx] = j;
  }
  const used = new Uint8Array(n);
  const perm = new Uint32Array(n);
  const maxRing = Math.max(gw, gh);
  for (let i = 0; i < n; i++) {
    const x = y[2 * i];
    const yy = y[2 * i + 1];
    const cx = Math.min(gw - 1, Math.max(0, ((x - b[0]) / cell) | 0));
    const cy = Math.min(gh - 1, Math.max(0, ((yy - b[1]) / cell) | 0));
    let best = -1;
    let bd = Infinity;
    for (let ring = 0; ring <= maxRing; ring++) {
      for (let gy = cy - ring; gy <= cy + ring; gy++) {
        if (gy < 0 || gy >= gh) continue;
        const edge = gy === cy - ring || gy === cy + ring;
        const stepX = edge ? 1 : 2 * ring || 1;
        for (let gx = cx - ring; gx <= cx + ring; gx += stepX) {
          if (gx < 0 || gx >= gw) continue;
          for (let j = head[gy * gw + gx]; j >= 0; j = next[j]) {
            if (used[j]) continue;
            const dx = targets[2 * j] - x;
            const dy = targets[2 * j + 1] - yy;
            const d = dx * dx + dy * dy;
            if (d < bd) {
              bd = d;
              best = j;
            }
          }
        }
      }
      // Anything in a farther ring is at least ring * cell away.
      if (best >= 0 && bd <= ring * cell * (ring * cell)) break;
    }
    used[best] = 1;
    perm[i] = best;
  }
  return perm;
}

/** 2-opt among grid neighbours. Each sweep bins the grains by source, by
    target or by path midpoint in turn, with a random grid offset, and tries
    every pair that shares a cell. Returns the number of swaps. */
export function polishLocal(
  from: Float32Array, targets: Float32Array, perm: Uint32Array, n: number, rng: Rng, sweeps: number,
): number {
  const key = new Float32Array(2 * n);
  const cid = new Uint32Array(n);
  const order = new Uint32Array(n);
  let total = 0;
  for (let s = 0; s < sweeps; s++) {
    const mode = s % 3;
    for (let i = 0; i < n; i++) {
      const a = perm[i];
      if (mode === 0) {
        key[2 * i] = from[2 * i];
        key[2 * i + 1] = from[2 * i + 1];
      } else if (mode === 1) {
        key[2 * i] = targets[2 * a];
        key[2 * i + 1] = targets[2 * a + 1];
      } else {
        key[2 * i] = (from[2 * i] + targets[2 * a]) / 2;
        key[2 * i + 1] = (from[2 * i + 1] + targets[2 * a + 1]) / 2;
      }
    }
    const b = bounds(key, n);
    const cell = Math.sqrt(((b[2] - b[0]) * (b[3] - b[1]) * 12) / n) || 1; // ~12 grains a cell
    const ox = b[0] - rng.rand() * cell;
    const oy = b[1] - rng.rand() * cell;
    const gw = Math.ceil((b[2] - ox) / cell) + 1;
    const gh = Math.ceil((b[3] - oy) / cell) + 1;
    const starts = new Uint32Array(gw * gh + 1);
    for (let i = 0; i < n; i++) {
      const c = (((key[2 * i + 1] - oy) / cell) | 0) * gw + (((key[2 * i] - ox) / cell) | 0);
      cid[i] = c;
      starts[c + 1]++;
    }
    for (let c = 0; c < gw * gh; c++) starts[c + 1] += starts[c];
    const cursor = starts.slice(0, gw * gh);
    for (let i = 0; i < n; i++) order[cursor[cid[i]]++] = i;
    for (let c = 0; c < gw * gh; c++) {
      const s1 = starts[c + 1];
      for (let p = starts[c]; p < s1; p++) {
        const i = order[p];
        for (let q = p + 1; q < s1; q++) {
          const j = order[q];
          const a = perm[i];
          const bb = perm[j];
          // The change in summed squared length has the sign of this cross term.
          const delta =
            (from[2 * i] - from[2 * j]) * (targets[2 * a] - targets[2 * bb]) +
            (from[2 * i + 1] - from[2 * j + 1]) * (targets[2 * a + 1] - targets[2 * bb + 1]);
          if (delta < 0) {
            perm[i] = bb;
            perm[j] = a;
            total++;
          }
        }
      }
    }
  }
  return total;
}

/** 2-opt over random pairs, in chunks of 4096, until a chunk accepts fewer
    than `stop` of its tries or `maxChunks` have run. */
export function polishRandom(
  from: Float32Array, targets: Float32Array, perm: Uint32Array, n: number, rng: Rng,
  stop: number, maxChunks: number,
): number {
  let total = 0;
  for (let chunk = 0; chunk < maxChunks; chunk++) {
    let accepted = 0;
    for (let k = 0; k < 4096; k++) {
      const i = (rng.rand() * n) | 0;
      const j = (rng.rand() * n) | 0;
      if (i === j) continue;
      const a = perm[i];
      const b = perm[j];
      const delta =
        (from[2 * i] - from[2 * j]) * (targets[2 * a] - targets[2 * b]) +
        (from[2 * i + 1] - from[2 * j + 1]) * (targets[2 * a + 1] - targets[2 * b + 1]);
      if (delta < 0) {
        perm[i] = b;
        perm[j] = a;
        accepted++;
      }
    }
    total += accepted;
    if (accepted < 4096 * stop) break;
  }
  return total;
}

/** The coupling the engine ships: perm[i] is the target of source i. */
export function couple(from: Float32Array, targets: Float32Array, n: number, rng: Rng): Uint32Array {
  const advected = slicedFlow(from, targets, n, SWEEPS, rng);
  const perm = matchNearest(advected, targets, n);
  polishLocal(from, targets, perm, n, rng, 12);
  polishRandom(from, targets, perm, n, rng, 0.002, 256);
  return perm;
}

/* ------------------------------------------------------------------- plan */

const now = (): number => (typeof performance !== "undefined" ? performance.now() : Date.now());

/** Everything one transport needs, packed for the GPU. */
export function makePlan(req: PlanRequest, cloud: MarkCloud | null): Plan {
  const t0 = now();
  const { n, w, h, box } = req;
  const rng = makeRng(req.seed);
  const from =
    req.from && req.from.length === 2 * n ? req.from : sampleNoise(n, w, h, box, rng);
  const grains = new Float32Array(n * GRAIN_FLOATS);
  let stats: Plan["stats"] = null;

  let targets: Float32Array;
  let perm: Uint32Array | null = null;
  if (!req.couple) {
    targets = from;
  } else {
    targets =
      req.targets && req.targets.length === 2 * n
        ? req.targets
        : req.target === "blockm" && cloud
          ? sampleMark(n, w, h, box, cloud, rng)
          : sampleNoise(n, w, h, box, rng);
    perm = couple(from, targets, n, rng);
    if (req.target === "noise" || !cloud) {
      let cx = 0;
      let cy = 0;
      for (let i = 0; i < n; i++) {
        cx += targets[2 * i];
        cy += targets[2 * i + 1];
      }
      cx /= n;
      cy /= n;
      let v = 0;
      for (let i = 0; i < n; i++) v += (targets[2 * i] - cx) ** 2 + (targets[2 * i + 1] - cy) ** 2;
      stats = { cx, cy, sigma: Math.sqrt(v / (2 * n)) };
    }
  }

  // Stagger wavefront: starts sweep across the cloud left to right.
  const fromX = new Float32Array(n);
  for (let i = 0; i < n; i++) fromX[i] = from[2 * i];
  const order = sortIdxByKey(fromX, n);
  for (let r = 0; r < n; r++) grains[order[r] * GRAIN_FLOATS + 4] = (STAGGER * r) / n;

  for (let i = 0; i < n; i++) {
    const a = perm ? perm[i] : i;
    const o = i * GRAIN_FLOATS;
    grains[o] = from[2 * i];
    grains[o + 1] = from[2 * i + 1];
    grains[o + 2] = targets[2 * a];
    grains[o + 3] = targets[2 * a + 1];
    // Varied grain sizes give the cloud body and depth.
    grains[o + 5] = req.dotR * (0.75 + rng.rand() * 0.6);
  }
  return { id: req.id, n, grains, stats, ms: now() - t0 };
}
