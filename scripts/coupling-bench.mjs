#!/usr/bin/env node
/**
 * coupling-bench: how close is the hero figure's coupling to the optimal
 * transport assignment?
 *
 * Builds the same scene the page does (Gaussian noise to the Block M, read
 * from public/msail-wordmark-m.png), then compares
 *
 *   - the Canvas 2D engine's pairing: rank matching along one random
 *     direction, with and without its random-pair 2-opt run to its own stop
 *     rule (the page gives that 2-opt 3 ms a frame for the first half of the
 *     transport, so the converged figure is its best case), and
 *   - the GPU engine's coupling, imported from src/components/flow-coupling.ts
 *     (the very module the worker runs),
 *
 * on mean squared path length, mean path length, the number of path
 * crossings (segment intersections, counted exactly over all pairs) and the
 * share of grain pairs a 2-opt swap would still shorten.
 *
 * Usage:
 *   node scripts/coupling-bench.mjs [--n 21600] [--w 1440] [--h 828] [--seeds 3]
 *   node scripts/coupling-bench.mjs --n 6000 --exact   # adds the true optimum
 *
 * --exact needs python3 with scipy (linear_sum_assignment); keep n under
 * about 8000, the cost matrix is n x n. Needs Node 22.18 or newer, which runs
 * the TypeScript module as is.
 */
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { registerHooks } from "node:module";

// The app's modules import each other without file extensions, which the
// bundler resolves and Node does not: retry a bare relative import as .ts.
registerHooks({
  resolve(specifier, context, next) {
    try {
      return next(specifier, context);
    } catch (err) {
      if (specifier.startsWith(".") && !/\.[cm]?[jt]s$/.test(specifier)) return next(`${specifier}.ts`, context);
      throw err;
    }
  },
});
const { couple, makeRng, sampleMark, sampleNoise, sortIdxByKey } = await import(
  "../src/components/flow-coupling.ts"
);

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith("--")) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith("--") ? all[i + 1] : "1"]);
    return acc;
  }, []),
);
const N = Number(args.n ?? 21600);
const W = Number(args.w ?? 1440);
const H = Number(args.h ?? 828);
const SEEDS = Number(args.seeds ?? 3);

/* --------------------------------------------------- the mark, as the page
   reads it: alpha > 100 on a 300px-wide bilinear resample of the PNG. */
function readPngAlpha(path) {
  const d = readFileSync(path);
  const w = d.readUInt32BE(16);
  const h = d.readUInt32BE(20);
  if (d[24] !== 8 || d[25] !== 6) throw new Error("expected an 8-bit RGBA PNG");
  const idat = [];
  for (let i = 8; i < d.length; ) {
    const len = d.readUInt32BE(i);
    if (d.toString("latin1", i + 4, i + 8) === "IDAT") idat.push(d.subarray(i + 8, i + 8 + len));
    i += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * 4;
  const px = new Uint8Array(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const v = raw[y * (stride + 1) + 1 + x];
      const a = x >= 4 ? px[y * stride + x - 4] : 0;
      const b = y > 0 ? px[(y - 1) * stride + x] : 0;
      const c = x >= 4 && y > 0 ? px[(y - 1) * stride + x - 4] : 0;
      let p = 0;
      if (f === 1) p = a;
      else if (f === 2) p = b;
      else if (f === 3) p = (a + b) >> 1;
      else if (f === 4) {
        const q = a + b - c;
        const pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c);
        p = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      px[y * stride + x] = (v + p) & 255;
    }
  }
  const alpha = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) alpha[i] = px[i * 4 + 3];
  return { w, h, alpha };
}
function markCloud() {
  const img = readPngAlpha(new URL("../public/msail-wordmark-m.png", import.meta.url));
  const w = 300;
  const h = Math.max(1, Math.round((300 * img.h) / img.w));
  const pts = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sx = Math.min(img.w - 1, Math.max(0, ((x + 0.5) * img.w) / w - 0.5));
      const sy = Math.min(img.h - 1, Math.max(0, ((y + 0.5) * img.h) / h - 0.5));
      const x0 = Math.floor(sx), y0 = Math.floor(sy);
      const x1 = Math.min(img.w - 1, x0 + 1), y1 = Math.min(img.h - 1, y0 + 1);
      const fx = sx - x0, fy = sy - y0;
      const a =
        img.alpha[y0 * img.w + x0] * (1 - fx) * (1 - fy) + img.alpha[y0 * img.w + x1] * fx * (1 - fy) +
        img.alpha[y1 * img.w + x0] * (1 - fx) * fy + img.alpha[y1 * img.w + x1] * fx * fy;
      if (a > 100) pts.push(x / w, y / h);
    }
  }
  return { pts: new Float32Array(pts), aspect: h / w };
}

/* -------------------------------------- the Canvas 2D engine's pairing, as
   FlowEngine.pair and runOptSlice do it. */
function pairProjection(from, tg, n, rng) {
  const th = rng.rand() * Math.PI;
  const c = Math.cos(th), s = Math.sin(th);
  const pa = new Float32Array(n), pb = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    pa[i] = from[2 * i] * c + from[2 * i + 1] * s;
    pb[i] = tg[2 * i] * c + tg[2 * i + 1] * s;
  }
  const ia = sortIdxByKey(pa, n), ib = sortIdxByKey(pb, n);
  const perm = new Uint32Array(n);
  for (let r = 0; r < n; r++) perm[ia[r]] = ib[r];
  return perm;
}
function twoOptToStopRule(from, tg, perm, n, rng) {
  for (;;) {
    let accepted = 0;
    for (let k = 0; k < 4096; k++) {
      const i = (rng.rand() * n) | 0, j = (rng.rand() * n) | 0;
      if (i === j) continue;
      const a = perm[i], b = perm[j];
      const delta =
        (from[2 * i] - from[2 * j]) * (tg[2 * a] - tg[2 * b]) +
        (from[2 * i + 1] - from[2 * j + 1]) * (tg[2 * a + 1] - tg[2 * b + 1]);
      if (delta < 0) { perm[i] = b; perm[j] = a; accepted++; }
    }
    if (accepted < 4096 * 0.03) return;
  }
}

/* ---------------------------------------------------------------- metrics */
function metrics(from, tg, perm, n, rng) {
  let sq = 0, len = 0;
  const seg = new Float64Array(4 * n);
  for (let i = 0; i < n; i++) {
    const a = perm[i];
    const dx = tg[2 * a] - from[2 * i], dy = tg[2 * a + 1] - from[2 * i + 1];
    sq += dx * dx + dy * dy;
    len += Math.hypot(dx, dy);
    seg.set([from[2 * i], from[2 * i + 1], tg[2 * a], tg[2 * a + 1]], 4 * i);
  }
  let crossings = 0;
  for (let i = 0; i < n; i++) {
    const ax = seg[4 * i], ay = seg[4 * i + 1], bx = seg[4 * i + 2], by = seg[4 * i + 3];
    const lox = Math.min(ax, bx), hix = Math.max(ax, bx), loy = Math.min(ay, by), hiy = Math.max(ay, by);
    for (let j = i + 1; j < n; j++) {
      const cx = seg[4 * j], cy = seg[4 * j + 1], dx = seg[4 * j + 2], dy = seg[4 * j + 3];
      if (hix < Math.min(cx, dx) || Math.max(cx, dx) < lox || hiy < Math.min(cy, dy) || Math.max(cy, dy) < loy) continue;
      const d1 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
      const d2 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
      if (d1 * d2 >= 0) continue;
      const d3 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
      const d4 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
      if (d3 * d4 < 0) crossings++;
    }
  }
  let improvable = 0;
  const tries = 2e6;
  for (let k = 0; k < tries; k++) {
    const i = (rng.rand() * n) | 0, j = (rng.rand() * n) | 0;
    if (i === j) continue;
    const a = perm[i], b = perm[j];
    if ((from[2 * i] - from[2 * j]) * (tg[2 * a] - tg[2 * b]) + (from[2 * i + 1] - from[2 * j + 1]) * (tg[2 * a + 1] - tg[2 * b + 1]) < 0) improvable++;
  }
  return { msq: sq / n, mean: len / n, crossings, improvable: improvable / tries };
}

function exactAssignment(from, tg) {
  const dir = mkdtempSync(join(tmpdir(), "coupling-"));
  writeFileSync(join(dir, "scene.json"), JSON.stringify({ from: Array.from(from), tg: Array.from(tg) }));
  const out = execFileSync("python3", ["-c", `
import json, sys, numpy as np
from scipy.optimize import linear_sum_assignment
d = json.load(open(sys.argv[1]))
a = np.array(d["from"]).reshape(-1, 2); b = np.array(d["tg"]).reshape(-1, 2)
C = ((a[:, None, :] - b[None, :, :]) ** 2).sum(-1)
print(json.dumps(linear_sum_assignment(C)[1].tolist()))
`, join(dir, "scene.json")], { maxBuffer: 1 << 28 });
  return Uint32Array.from(JSON.parse(out));
}

/* ------------------------------------------------------------------- main */
const cloud = markCloud();
const box = W >= 1024 ? { x0: 0.08, y0: 0.09, x1: 0.92, y1: 0.78 } : { x0: 0, y0: 0, x1: 1, y1: 1 };
const rows = new Map();
const add = (name, m, ms) => {
  if (!rows.has(name)) rows.set(name, []);
  rows.get(name).push({ ...m, ms });
};
for (let s = 0; s < SEEDS; s++) {
  const rng = makeRng(0x2545f4 + s * 7919);
  const from = sampleNoise(N, W, H, box, rng);
  const tg = sampleMark(N, W, H, box, cloud, rng);
  const timed = (name, fn) => {
    const t = performance.now();
    const perm = fn();
    const ms = performance.now() - t;
    add(name, metrics(from, tg, perm, N, rng), ms);
  };
  if (args.exact) add("exact optimum (scipy)", metrics(from, tg, exactAssignment(from, tg), N, rng), NaN);
  timed("2D engine: one projection", () => pairProjection(from, tg, N, rng));
  timed("2D engine: + 2-opt to its stop rule", () => {
    const p = pairProjection(from, tg, N, rng);
    twoOptToStopRule(from, tg, p, N, rng);
    return p;
  });
  timed("GPU engine: iterated sliced OT + 2-opt", () => couple(from, tg, N, rng));
}
const avg = (a, k) => a.reduce((sum, r) => sum + r[k], 0) / a.length;
const opt = rows.has("exact optimum (scipy)") ? avg(rows.get("exact optimum (scipy)"), "msq") : null;
console.log(`n = ${N}, canvas ${W} x ${H} px, ${SEEDS} scene(s), mark cloud ${cloud.pts.length / 2} points`);
console.log(
  "coupling".padEnd(40), "mean sq len".padStart(12), opt ? "vs optimum".padStart(11) : "",
  "mean len".padStart(9), "crossings".padStart(11), "improvable".padStart(11), "ms".padStart(7),
);
for (const [name, a] of rows) {
  console.log(
    name.padEnd(40),
    (avg(a, "msq").toFixed(0) + " px2").padStart(12),
    opt ? ("+" + ((avg(a, "msq") / opt - 1) * 100).toFixed(2) + "%").padStart(11) : "",
    (avg(a, "mean").toFixed(1) + " px").padStart(9),
    avg(a, "crossings").toFixed(0).padStart(11),
    ((avg(a, "improvable") * 100).toFixed(3) + "%").padStart(11),
    (Number.isNaN(avg(a, "ms")) ? "" : avg(a, "ms").toFixed(1)).padStart(7),
  );
}
