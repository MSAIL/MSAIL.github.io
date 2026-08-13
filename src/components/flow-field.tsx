"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * FlowField — the homepage centerpiece: a rectified-flow transport of samples
 * from Gaussian noise to a chosen target distribution (two moons, two spirals,
 * or the Block M sampled from the MSAIL mark).
 *
 * Everything is closed-form — no training, and the caption says exactly what
 * runs: x_t = (1 − t)·x₀ + t·x₁ with the coupling built by sliced-OT rank
 * pairing plus 2-opt uncrossing sweeps (each accepted swap provably removes a
 * path crossing in 2D). Once transport completes, gentle Langevin dynamics
 * holds the samples at equilibrium so the figure stays alive without ever
 * becoming decoration.
 *
 * Perf contract: the rAF loop runs only while something moves (transition,
 * trail fade, pointer lens, equilibrium shimmer) AND the canvas is on-screen
 * in a visible tab. prefers-reduced-motion: transitions jump to t=1, no
 * trails, no shimmer.
 */

export type FlowDataset = "noise" | "moons" | "spirals" | "blockm";

/** Fractional sub-box of the canvas the figure should form inside (desktop
    only — below 900px containers the full canvas is used). Lets the hero
    keep the figure clear of the headline block. */
export type FitBox = { x0: number; y0: number; x1: number; y1: number };

/* ---------------------------------------------------------------- palette */
/* Duplicated from the CSS tokens (canvas can't read custom props cheaply
   per-particle); keep in sync with globals.css. */
type RGB = [number, number, number];

const NAVY: RGB = [0, 39, 76];
const BLUE: RGB = [31, 91, 158];
const GOLD: RGB = [217, 147, 0];
const DEEP_GOLD: RGB = [233, 168, 0];
const SLATE: RGB = [84, 98, 118];
/* The Block M ramp: navy → blue → a vivid violet/rose/coral bridge → amber →
   maize. Every stop is saturated, so the blue-to-gold crossover never passes
   through gray or olive — the seam reads as a sunset, not a mixture. */
const M_RAMP: RGB[] = [
  [0, 39, 76],
  [21, 74, 134],
  [43, 108, 176],
  [123, 95, 214],
  [199, 93, 138],
  [232, 115, 78],
  [240, 160, 0],
  [255, 203, 5],
];
/* On the ink ground the walk must stay LIGHTER than the navy behind it, or
   the M's left leg vanishes into the page. Same walk, frosted: the stops
   match .wordmark-glass-dark so the mark and wordmark stay one identity. */
const M_RAMP_INK: RGB[] = [
  [157, 184, 214],
  [127, 167, 212],
  [169, 198, 232],
  [195, 174, 242],
  [235, 169, 200],
  [246, 178, 145],
  [255, 208, 34],
  [255, 203, 5],
];
function ramp(stops: RGB[], u: number): RGB {
  const v = Math.min(0.9999, Math.max(0, u)) * (stops.length - 1);
  const i = v | 0;
  return mix(stops[i], stops[i + 1], v - i);
}

function mix(a: RGB, b: RGB, f: number): RGB {
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}
function css([r, g, b]: RGB, alpha = 1): string {
  return `rgba(${r | 0},${g | 0},${b | 0},${alpha})`;
}

/* ------------------------------------------------------------- the engine */

const TRAIL = 32; // ring-buffer length per particle
const STAGGER = 0.3; // fraction of the clock spent sweeping the start wavefront

export class FlowEngine {
  private ptx: CanvasRenderingContext2D;
  private W = 0;
  private H = 0;
  N = 0;

  private from!: Float32Array;
  private dst!: Float32Array;
  private delay!: Float32Array;
  private frameNo = 0;

  private trail!: Float32Array;
  private trailLen!: Int16Array;
  private trailHead = 0;

  /* Equilibrium shimmer (Ornstein–Uhlenbeck offsets around each anchor). */
  private oux!: Float32Array;
  private ouy!: Float32Array;
  private ouvx!: Float32Array;
  private ouvy!: Float32Array;

  /* Angle-addition tables for the drift field: sin(a+ct) expands to
     sinA·cos(ct)+cosA·sin(ct), so the per-frame per-grain cost drops from
     4 transcendentals to 4 multiply-adds (8 transcendentals per FRAME total,
     instead of ~230k). Precomputed per pairing since they depend on dst. */
  private drfSinA!: Float32Array;
  private drfCosA!: Float32Array;
  private drfSinB!: Float32Array;
  private drfCosB!: Float32Array;
  private drfSinC!: Float32Array;
  private drfCosC!: Float32Array;
  private drfSinD!: Float32Array;
  private drfCosD!: Float32Array;

  /* Shared Gaussian table: visual noise does not need fresh Box-Muller
     (log+sqrt+cos) per grain per frame; a large precomputed table with a
     rotating offset is statistically indistinguishable on screen. */
  private static GAUSS: Float32Array | null = null;
  private gaussIdx = 0;

  private T = 0;
  private lastSettleRender = 0;
  private lastWaterDraw = 0;
  private lastOuStep = 0;
  private playing = false;
  private t0 = 0;
  private raf = 0;

  private pointer = { x: -1e5, y: -1e5, over: false };
  private lastCls: Uint8Array | null = null;
  private seed = 0x2545f4;
  private mCloud: { pts: Float32Array; aspect: number } | null = null;
  private destroyed = false;

  visible = true; // maintained by the component's IntersectionObserver
  reduced = false;
  /** Set before the first setDataset when the figure sits on an ink ground:
      swaps the sunset ramp for its frosted cut and lightens the σ rings. */
  darkGround = false;
  duration = 2800;
  fitBox: FitBox | null = null;
  onTick: ((t: number, playing: boolean) => void) | null = null;

  private wtx: CanvasRenderingContext2D;
  /** 0 hidden · 1 forming (dim sheen riding the streams) · 2 landed (flare
      to full, then relax into the steady halo). */
  private waterState = 0;
  private flareTimer = 0;
  private wScale = 0.3;

  constructor(
    private ptsCanvas: HTMLCanvasElement,
    private waterCanvas: HTMLCanvasElement,
  ) {
    this.ptx = ptsCanvas.getContext("2d")!;
    this.wtx = waterCanvas.getContext("2d")!;
    if (!FlowEngine.GAUSS) {
      const g = new Float32Array(8192);
      for (let i = 0; i < g.length; i += 2) {
        const u = Math.max(1e-12, Math.random());
        const r = Math.sqrt(-2 * Math.log(u));
        const th = 2 * Math.PI * Math.random();
        g[i] = r * Math.cos(th);
        if (i + 1 < g.length) g[i + 1] = r * Math.sin(th);
      }
      FlowEngine.GAUSS = g;
    }
    this.resize();
  }

  private gauss(): number {
    return FlowEngine.GAUSS![this.gaussIdx++ & 8191];
  }

  /* ------------------------------------------------- deterministic random */
  private rand(): number {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }
  private randn(): number {
    let u = 0;
    let v = 0;
    while (u === 0) u = this.rand();
    while (v === 0) v = this.rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  resize(): void {
    const rect = this.ptsCanvas.parentElement!.getBoundingClientRect();
    this.W = Math.max(1, rect.width);
    this.H = Math.max(1, rect.height);
    // Particle budget scales with area; phones get fewer, desktops cap out.
    // The cap sits at 21.6k with grains widened to match (r ∝ 1/√N keeps ink
    // coverage constant), which buys back FULL 2x supersampling — crisp round
    // grains instead of many blurry ones.
    const phone = this.W < 640;
    const density = phone ? 40 : 19; // phones get a much gentler budget
    this.N = Math.max(4000, Math.min(21600, Math.round((this.W * this.H) / density)));
    // Ribbons ride on a subset of grains; the stride keeps stroke geometry
    // roughly constant as the grain count scales. Phones pin the widest
    // stride outright: the N-tiered rule handed a 10k-grain phone stride 4
    // (2.5k ribbons), a third of the DESKTOP stroke load on a phone GPU.
    this.ribbonStride = phone ? 8 : this.N > 20000 ? 8 : this.N > 10000 ? 4 : 2;
    // At very high grain counts (and on phones, whose DPR-3 panels would
    // otherwise quadruple the fill), trade supersampling for fill rate.
    const dprCap = phone ? 1.6 : 2;
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    this.ptsCanvas.width = Math.round(this.W * dpr);
    this.ptsCanvas.height = Math.round(this.H * dpr);
    this.ptx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // The water pane renders tiny: the goo filter + CSS upscale smooth it.
    this.waterCanvas.width = Math.max(1, Math.round(this.W * this.wScale));
    this.waterCanvas.height = Math.max(1, Math.round(this.H * this.wScale));
    this.wtx.setTransform(this.wScale, 0, 0, this.wScale, 0, 0);
    // Grain size compensates the sparser budgets (r ∝ 1/√density keeps ink
    // coverage constant), so the M reads just as solid.
    this.dotR = phone ? 1.5 : 2.35;
  }

  private dotR = 1.7;
  private ribbonStride = 4;

  setPointer(x: number, y: number, over: boolean): void {
    this.pointer.x = x;
    this.pointer.y = y;
    this.pointer.over = over;
    this.wake();
  }

  /* ------------------------------------------------------------- samplers */
  private fit(p: Float32Array, margin: number): Float32Array {
    const n = p.length / 2;
    let nx = 1e9, xx = -1e9, ny = 1e9, xy = -1e9;
    for (let i = 0; i < n; i++) {
      nx = Math.min(nx, p[2 * i]); xx = Math.max(xx, p[2 * i]);
      ny = Math.min(ny, p[2 * i + 1]); xy = Math.max(xy, p[2 * i + 1]);
    }
    const sw = xx - nx || 1;
    const sh = xy - ny || 1;
    // The fit box only applies on desktop-wide canvases; below that the hero
    // positions the canvas itself and the full box is correct.
    const box = this.fitBox && this.W >= 1024 ? this.fitBox : { x0: 0, y0: 0, x1: 1, y1: 1 };
    const bx = box.x0 * this.W;
    const by = box.y0 * this.H;
    const bw = (box.x1 - box.x0) * this.W;
    const bh = (box.y1 - box.y0) * this.H;
    const k = Math.min((bw * (1 - 2 * margin)) / sw, (bh * (1 - 2 * margin)) / sh);
    const ox = bx + (bw - sw * k) / 2 - nx * k;
    const oy = by + (bh - sh * k) / 2 - ny * k;
    for (let i = 0; i < n; i++) {
      p[2 * i] = p[2 * i] * k + ox;
      p[2 * i + 1] = p[2 * i + 1] * k + oy;
    }
    return p;
  }

  private sample(key: FlowDataset): { pts: Float32Array; cls: Uint8Array | null } {
    const N = this.N;
    const p = new Float32Array(2 * N);
    if (key === "noise") {
      for (let i = 0; i < N; i++) {
        p[2 * i] = this.randn();
        p[2 * i + 1] = this.randn();
      }
      return { pts: this.fit(p, 0.22), cls: null };
    }
    if (key === "moons") {
      const cls = new Uint8Array(N);
      for (let i = 0; i < N; i++) {
        const a = this.rand() * Math.PI;
        const m = i % 2;
        cls[i] = m;
        const x = m === 0 ? Math.cos(a) : 1 - Math.cos(a);
        const y = m === 0 ? -Math.sin(a) + 0.32 : Math.sin(a) - 0.32;
        p[2 * i] = x + this.randn() * 0.05;
        p[2 * i + 1] = y * 1.25 + this.randn() * 0.05;
      }
      return { pts: this.fit(p, 0.16), cls };
    }
    if (key === "spirals") {
      const cls = new Uint8Array(N);
      for (let i = 0; i < N; i++) {
        const m = i % 2;
        cls[i] = m;
        const a = 0.35 + this.rand() * 3.0 * Math.PI * 0.85;
        const r = a / (3 * Math.PI);
        const th = a + m * Math.PI;
        p[2 * i] = Math.cos(th) * r + this.randn() * 0.016;
        p[2 * i + 1] = Math.sin(th) * r + this.randn() * 0.016;
      }
      return { pts: this.fit(p, 0.14), cls };
    }
    if (!this.mCloud) {
      return this.sample("noise");
    }
    const { pts: cloud, aspect } = this.mCloud;
    const m = cloud.length / 2;
    for (let i = 0; i < N; i++) {
      const j = (this.rand() * m) | 0;
      p[2 * i] = cloud[2 * j] + this.randn() * 0.003;
      p[2 * i + 1] = cloud[2 * j + 1] * aspect + this.randn() * 0.003;
    }
    return { pts: this.fit(p, 0.08), cls: null };
  }

  /** Rasterize the Block-M mark once and keep its point cloud. */
  loadMark(src: string, onReady?: () => void): void {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      if (this.destroyed) return;
      const w = 300;
      const h = Math.max(1, Math.round((300 * img.height) / img.width));
      const oc = document.createElement("canvas");
      oc.width = w;
      oc.height = h;
      const o = oc.getContext("2d", { willReadFrequently: true })!;
      o.drawImage(img, 0, 0, w, h);
      const d = o.getImageData(0, 0, w, h).data;
      const pts: number[] = [];
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (d[(y * w + x) * 4 + 3] > 100) pts.push(x / w, y / h);
        }
      }
      if (pts.length > 16) {
        this.mCloud = { pts: new Float32Array(pts), aspect: h / w };
        onReady?.();
      }
    };
  }

  /* -------------------------------------------------------------- pairing */
  /**
   * Couple current positions to the target cloud: sliced-OT rank pairing on a
   * random direction, then 2-opt swap sweeps (a swap is accepted only when it
   * lowers summed squared length, which in 2D always uncrosses two paths).
   */
  /** O(N) stable counting sort of indices by a Float32 key (16-bit quantized).
      Comparator index sorts measured 20-25ms at 57.6k; this runs ~1ms. Ties
      collapse to the same bucket, which is harmless for rank pairing. */
  private static sortIdxByKey(keys: Float32Array, n: number): Uint32Array {
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 0; i < n; i++) {
      if (keys[i] < lo) lo = keys[i];
      if (keys[i] > hi) hi = keys[i];
    }
    const scale = hi > lo ? 65535 / (hi - lo) : 0;
    const q = new Uint16Array(n);
    const counts = new Uint32Array(65537);
    for (let i = 0; i < n; i++) {
      const k = ((keys[i] - lo) * scale) | 0;
      q[i] = k;
      counts[k + 1]++;
    }
    for (let k = 0; k < 65536; k++) counts[k + 1] += counts[k];
    const order = new Uint32Array(n);
    for (let i = 0; i < n; i++) order[counts[q[i]]++] = i;
    return order;
  }

  /**
   * Couple current positions to the target cloud: sliced-OT rank pairing on a
   * random direction (O(N) counting sort), then adaptive 2-opt sweeps in the
   * delta form (a swap is accepted only when it lowers summed squared length,
   * which in 2D always uncrosses two paths). Sweeps stop once a chunk's
   * acceptance rate falls under 3% — the fixed 60N budget measured ~2x past
   * the convergence knee.
   */
  private pair(from: Float32Array, targets: Float32Array, cls: Uint8Array | null) {
    const N = this.N;
    const th = this.rand() * Math.PI;
    const c = Math.cos(th);
    const s = Math.sin(th);
    const projA = new Float32Array(N);
    const projB = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      projA[i] = from[2 * i] * c + from[2 * i + 1] * s;
      projB[i] = targets[2 * i] * c + targets[2 * i + 1] * s;
    }
    const idxA = FlowEngine.sortIdxByKey(projA, N);
    const idxB = FlowEngine.sortIdxByKey(projB, N);

    const dst = new Float32Array(2 * N);
    const dstCls = cls ? new Uint8Array(N) : null;
    for (let r = 0; r < N; r++) {
      const a = idxA[r];
      const b = idxB[r];
      dst[2 * a] = targets[2 * b];
      dst[2 * a + 1] = targets[2 * b + 1];
      if (dstCls && cls) dstCls[a] = cls[b];
    }
    // The 2-opt uncross sweeps do NOT run here: a synchronous convergence
    // loop blocked the main thread ~50ms per (re)pairing — the click hitch.
    // They run frame-sliced in the loop instead (runOptSlice), which is
    // sound because the final image is invariant to WHICH grain lands on
    // which target; only the transport paths differ.
    return { dst, dstCls };
  }

  /** Frame-sliced 2-opt: a few milliseconds of uncross sweeps per frame
      during early transport. Each accepted swap exchanges two grains'
      TARGETS, so every target-derived attribute (color bucket, drift-field
      phases) swaps along with it — at small t the visible correction is a
      few pixels, and past mid-transport the sweep is retired outright. */
  private optActive = false;
  private runOptSlice(budgetMs: number): void {
    const N = this.N;
    const from = this.from;
    const dst = this.dst;
    const t0 = performance.now();
    do {
      let accepted = 0;
      for (let k = 0; k < 4096; k++) {
        const i = (this.rand() * N) | 0;
        const j = (this.rand() * N) | 0;
        if (i === j) continue;
        // Delta form: sign of the change needs only the cross terms.
        const delta =
          (from[2 * i] - from[2 * j]) * (dst[2 * i] - dst[2 * j]) +
          (from[2 * i + 1] - from[2 * j + 1]) * (dst[2 * i + 1] - dst[2 * j + 1]);
        if (delta < 0) {
          let tf = dst[2 * i]; dst[2 * i] = dst[2 * j]; dst[2 * j] = tf;
          tf = dst[2 * i + 1]; dst[2 * i + 1] = dst[2 * j + 1]; dst[2 * j + 1] = tf;
          const tb = this.bucketOf[i]; this.bucketOf[i] = this.bucketOf[j]; this.bucketOf[j] = tb;
          tf = this.drfSinA[i]; this.drfSinA[i] = this.drfSinA[j]; this.drfSinA[j] = tf;
          tf = this.drfCosA[i]; this.drfCosA[i] = this.drfCosA[j]; this.drfCosA[j] = tf;
          tf = this.drfSinB[i]; this.drfSinB[i] = this.drfSinB[j]; this.drfSinB[j] = tf;
          tf = this.drfCosB[i]; this.drfCosB[i] = this.drfCosB[j]; this.drfCosB[j] = tf;
          tf = this.drfSinC[i]; this.drfSinC[i] = this.drfSinC[j]; this.drfSinC[j] = tf;
          tf = this.drfCosC[i]; this.drfCosC[i] = this.drfCosC[j]; this.drfCosC[j] = tf;
          tf = this.drfSinD[i]; this.drfSinD[i] = this.drfSinD[j]; this.drfSinD[j] = tf;
          tf = this.drfCosD[i]; this.drfCosD[i] = this.drfCosD[j]; this.drfCosD[j] = tf;
          if (this.lastCls) {
            const tc = this.lastCls[i]; this.lastCls[i] = this.lastCls[j]; this.lastCls[j] = tc;
          }
          accepted++;
        }
      }
      if (accepted < 4096 * 0.03) {
        this.optActive = false;
        return;
      }
    } while (performance.now() - t0 < budgetMs);
  }

  /** Recompute per-particle colors + stagger delays for the CURRENT pairing. */
  private radii!: Float32Array;
  private palette!: string[];
  private trailPalette!: string[][];
  private bucketOf!: Uint8Array;

  /**
   * Colors are quantized into a small bucket palette so the renderer can batch
   * all grains of one color into a single Path2D fill/stroke — the difference
   * between ~60 draw calls per frame and ~20,000.
   */
  private recolor(cls: Uint8Array | null): void {
    const N = this.N;
    // Varied grain sizes give the cloud body and depth.
    this.radii = new Float32Array(N);
    for (let i = 0; i < N; i++) this.radii[i] = this.dotR * (0.75 + this.rand() * 0.6);
    this.bucketOf = new Uint8Array(N);
    const buckets: RGB[] = [];
    if (cls) {
      // Two-beam coloring: four shades per class.
      for (let s = 0; s < 4; s++) buckets.push(mix(NAVY, BLUE, s / 3));
      for (let s = 0; s < 4; s++) buckets.push(mix(GOLD, DEEP_GOLD, s / 3));
      for (let i = 0; i < N; i++) this.bucketOf[i] = cls[i] * 4 + ((this.rand() * 4) | 0);
    } else if (this.dstIsNoise) {
      if (this.darkGround) {
        for (let s = 0; s < 4; s++) buckets.push(mix([150, 170, 198], [198, 210, 228], s / 3));
      } else {
        for (let s = 0; s < 4; s++) buckets.push(mix(SLATE, [110, 124, 144], s / 3));
      }
      for (let i = 0; i < N; i++) this.bucketOf[i] = (this.rand() * 4) | 0;
    } else {
      // The Block M: 48 dithered steps of the sunset ramp — smooth navy→gold
      // by target x, with the vivid violet/rose/coral bridge at the seam.
      const NB = 48;
      const stops = this.darkGround ? M_RAMP_INK : M_RAMP;
      for (let b = 0; b < NB; b++) buckets.push(ramp(stops, (b + 0.5) / NB));
      let minx = 1e9, maxx = -1e9;
      for (let i = 0; i < N; i++) {
        minx = Math.min(minx, this.dst[2 * i]);
        maxx = Math.max(maxx, this.dst[2 * i]);
      }
      for (let i = 0; i < N; i++) {
        const u = (this.dst[2 * i] - minx) / (maxx - minx + 1e-6);
        const dithered = u + (this.rand() - 0.5) * (1.5 / NB);
        this.bucketOf[i] = Math.max(0, Math.min(NB - 1, (dithered * NB) | 0));
      }
    }
    this.palette = buckets.map((b) => css(b));
    // Comet taper: three alpha tiers from head to tail. Dense enough that the
    // ribbons add visual mass to the settled M.
    this.trailPalette = buckets.map((b) => [css(b, 0.42), css(b, 0.22), css(b, 0.1)]);
    // Drift-field phase tables (see field docs above).
    this.drfSinA = new Float32Array(N);
    this.drfCosA = new Float32Array(N);
    this.drfSinB = new Float32Array(N);
    this.drfCosB = new Float32Array(N);
    this.drfSinC = new Float32Array(N);
    this.drfCosC = new Float32Array(N);
    this.drfSinD = new Float32Array(N);
    this.drfCosD = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const hx = this.dst[2 * i];
      const hy = this.dst[2 * i + 1];
      const A = hy * 0.012;
      const B = hx * 0.007;
      const C = hx * 0.01;
      const D = hy * 0.008;
      this.drfSinA[i] = Math.sin(A);
      this.drfCosA[i] = Math.cos(A);
      this.drfSinB[i] = Math.sin(B);
      this.drfCosB[i] = Math.cos(B);
      this.drfSinC[i] = Math.sin(C);
      this.drfCosC[i] = Math.cos(C);
      this.drfSinD[i] = Math.sin(D);
      this.drfCosD[i] = Math.cos(D);
    }

    // Stagger wavefront: starts sweep across the bundle left-to-right.
    // O(N) counting sort replaces the comparator sort (~10ms -> ~1ms here).
    this.delay = new Float32Array(N);
    const fromX = new Float32Array(N);
    for (let i = 0; i < N; i++) fromX[i] = this.from[2 * i];
    const order = FlowEngine.sortIdxByKey(fromX, N);
    for (let r = 0; r < N; r++) this.delay[order[r]] = (STAGGER * r) / N;
  }

  private dstIsNoise = false;
  private noiseStats: { cx: number; cy: number; sigma: number } | null = null;

  /** Mean + std of the current noise target, for the 1/2/3σ ring garnish. */
  private computeNoiseStats(): void {
    if (!this.dstIsNoise) {
      this.noiseStats = null;
      return;
    }
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < this.N; i++) {
      cx += this.dst[2 * i];
      cy += this.dst[2 * i + 1];
    }
    cx /= this.N;
    cy /= this.N;
    let v = 0;
    for (let i = 0; i < this.N; i++) {
      v += (this.dst[2 * i] - cx) ** 2 + (this.dst[2 * i + 1] - cy) ** 2;
    }
    this.noiseStats = { cx, cy, sigma: Math.sqrt(v / (2 * this.N)) };
  }

  /* ----------------------------------------------------------- transitions */
  /** Start a transport from the CURRENT display positions to a new target. */
  setDataset(key: FlowDataset): void {
    const cur = new Float32Array(2 * this.N);
    if (this.from && this.dst && this.from.length === 2 * this.N) {
      const e = this.T;
      for (let i = 0; i < this.N; i++) {
        const u = this.particleU(i, e);
        cur[2 * i] = this.from[2 * i] + (this.dst[2 * i] - this.from[2 * i]) * u + this.oux[i];
        cur[2 * i + 1] =
          this.from[2 * i + 1] + (this.dst[2 * i + 1] - this.from[2 * i + 1]) * u + this.ouy[i];
      }
    } else {
      cur.set(this.sample("noise").pts);
    }
    const { pts, cls } = this.sample(key);
    this.dstIsNoise = key === "noise";
    this.from = cur;
    const { dst, dstCls } = this.pair(cur, pts, cls);
    this.dst = dst;
    this.lastCls = dstCls;
    this.recolor(dstCls);
    this.computeNoiseStats();
    this.resetDynamics();
    this.T = this.reduced ? 1 : 0;
    this.playing = !this.reduced;
    this.optActive = !this.reduced; // uncrossing happens across the first frames
    this.t0 = performance.now();
    this.wake();
  }

  /** Rewind to fresh noise and transport to the current target again. */
  replay(): void {
    if (!this.dst) return;
    const targets = new Float32Array(this.dst);
    this.from = this.sample("noise").pts;
    const { dst, dstCls } = this.pair(this.from, targets, this.lastCls);
    this.dst = dst;
    this.lastCls = dstCls;
    this.recolor(dstCls);
    this.computeNoiseStats();
    this.resetDynamics();
    this.T = this.reduced ? 1 : 0;
    this.playing = !this.reduced;
    this.optActive = !this.reduced;
    this.t0 = performance.now();
    this.wake();
  }

  scrub(t: number): void {
    this.playing = false;
    this.T = Math.min(1, Math.max(0, t));
    this.resetDynamics();
    this.wake();
  }

  private resetDynamics(): void {
    // Trails are only recorded for every ribbonStride-th grain, so only those
    // grains get ring-buffer slots: N/stride rows instead of N (8x memory cut
    // at ultra counts). Buffers are REUSED across scrubs (a slider drag fires
    // dozens of input events; reallocating ~16MB per event was GC murder).
    const ribbonRows = Math.ceil(this.N / this.ribbonStride);
    if (!this.trail || this.trailLen.length !== ribbonRows) {
      this.trail = new Float32Array(ribbonRows * TRAIL * 2);
      this.trailLen = new Int16Array(ribbonRows);
    } else {
      this.trailLen.fill(0);
    }
    this.trailHead = 0;
    if (!this.oux || this.oux.length !== this.N) {
      this.oux = new Float32Array(this.N);
      this.ouy = new Float32Array(this.N);
      this.ouvx = new Float32Array(this.N);
      this.ouvy = new Float32Array(this.N);
    } else {
      this.oux.fill(0);
      this.ouy.fill(0);
    }
    // Seed orbital velocities so the equilibrium ribbons appear immediately
    // instead of spinning up from rest.
    for (let i = 0; i < this.N; i++) {
      this.ouvx[i] = this.randn() * 0.55;
      this.ouvy[i] = this.randn() * 0.55;
    }
  }

  private particleU(i: number, e: number): number {
    const u = e * (1 + STAGGER) - (this.delay ? this.delay[i] : 0);
    const v = Math.min(1, Math.max(0, u));
    return v * v * (3 - 2 * v);
  }

  /* ------------------------------------------------------------ main loop */
  wake(): void {
    if (!this.raf && !this.destroyed && this.visible) {
      this.raf = requestAnimationFrame(this.loop);
    }
  }

  private loop = (now: number): void => {
    this.raf = 0;
    if (this.destroyed || !this.from || !this.visible) return;
    if (this.playing) {
      this.T = Math.min(1, (now - this.t0) / this.duration);
      if (this.T >= 1) this.playing = false;
      this.onTick?.(this.T, this.playing);
    }

    const e = this.T;
    const settled = !this.playing && e >= 1 && !this.reduced;
    // Frame-sliced uncrossing: 3ms a frame while the transport is young;
    // past halfway a swap would visibly bend a nearly-arrived path, and the
    // destination image doesn't depend on it, so the sweep retires.
    if (this.optActive) {
      if (!this.playing || e >= 0.5) this.optActive = false;
      else this.runOptSlice(3);
    }
    // The liquid lives through the whole transport: a dim sheen wets the
    // grains while they stream (they read dry without it, phones especially),
    // then the landing is the forge moment — a fast surge to full brightness
    // that relaxes into the steady halo, like a blade coming off the anvil.
    const formed = !this.playing && e >= 1;
    const waterTarget = formed ? 2 : this.playing ? 1 : 0;
    if (waterTarget !== this.waterState) {
      this.waterState = waterTarget;
      const ws = this.waterCanvas.style;
      window.clearTimeout(this.flareTimer);
      if (waterTarget === 2) {
        // Landing: the goo+halo filter comes back on (warmed at boot) for
        // the surge to full, then the glow steps DOWN to a clearly dimmer
        // steady state.
        ws.filter = this.waterCanvas.dataset.goo ?? "";
        ws.transitionDuration = "260ms";
        ws.opacity = "1";
        this.flareTimer = window.setTimeout(() => {
          ws.transitionDuration = "1600ms";
          ws.opacity = "0.6";
        }, 750);
      } else if (waterTarget === 1) {
        // Forming: NO filter. The pane is drawn at 0.3 scale and upscaled by
        // CSS, which alone reads as soft wet blobs; running the filter chain
        // per transport frame was the whole mobile framerate collapse.
        // Brightness matches the post-flare steady glow.
        ws.filter = "none";
        ws.transitionDuration = "450ms";
        ws.opacity = "0.6";
      } else {
        ws.transitionDuration = "220ms";
        ws.opacity = "0";
      }
    }
    // Equilibrium renders at a true 30Hz regardless of display refresh rate
    // (a naive every-other-frame skip would still run 60Hz on a 120Hz panel)
    // — EXCEPT while the cursor is over the figure: the repel must answer at
    // full refresh or the interaction itself reads as lag.
    if (settled) {
      if (!this.pointer.over && now - this.lastSettleRender < 33) {
        this.raf = requestAnimationFrame(this.loop);
        return;
      }
      this.lastSettleRender = now;
    }
    const drift = now * 0.00045; // slow clock for the equilibrium drift field
    const cos14 = Math.cos(drift * 1.4), sin14 = Math.sin(drift * 1.4);
    const cos09 = Math.cos(drift * 0.9), sin09 = Math.sin(drift * 0.9);
    const cos12 = Math.cos(drift * 1.2), sin12 = Math.sin(drift * 1.2);
    const cos11 = Math.cos(drift * 1.1), sin11 = Math.sin(drift * 1.1);
    // Rotate the Gaussian table's phase each frame so noise never visibly loops.
    this.gaussIdx = (this.gaussIdx + 4093) & 8191;
    const p = this.ptx;
    p.clearRect(0, 0, this.W, this.H);

    // Noise target: 1/2/3σ rings, so the Gaussian reads as a distribution.
    if (this.noiseStats) {
      const { cx, cy, sigma } = this.noiseStats;
      p.lineWidth = 1;
      p.strokeStyle = this.darkGround
        ? `rgba(234,240,246,${(0.12 * e).toFixed(3)})`
        : `rgba(0,39,76,${(0.07 * e).toFixed(3)})`;
      for (let k = 1; k <= 3; k++) {
        p.beginPath();
        p.arc(cx, cy, sigma * k, 0, 6.2832);
        p.stroke();
      }
    }

    this.frameNo++;
    const head = this.trailHead;
    const nextHead = (head + 1) % TRAIL;
    // Record every frame during transport; every third frame at equilibrium
    // (same visual ribbon length in time, a third of the stroke geometry).
    const record = this.playing || (settled && this.frameNo % 3 === 0);
    const headSlot = record ? nextHead : head;
    let anyTrail = false;

    const NB = this.palette.length;
    const dotPaths: (Path2D | null)[] = new Array(NB).fill(null);
    const trailPaths: (Path2D | null)[] = new Array(NB * 3).fill(null);
    // The pool redraws on its own clock: ~20Hz during transport so the sheen
    // tracks the streams, ~15Hz at rest — never at the render rate, so the
    // filter chain doesn't ride along with full-refresh hovering. Phones run
    // both clocks slower and sample a sparser pool; the sheen forgives it.
    const phoneW = this.W < 640;
    const waterEvery = this.playing ? (phoneW ? 110 : 50) : phoneW ? 100 : 66;
    const poolMask = phoneW ? 3 : 1; // every 4th grain on phones, every 2nd else
    const drawWater = (formed || this.playing) && now - this.lastWaterDraw > waterEvery;
    if (drawWater) this.lastWaterDraw = now;
    // The shimmer likewise steps on a 30Hz clock, whatever the render rate:
    // its damping/noise coefficients are tuned for that timestep, and a
    // faster render must only smooth the cursor repel, not quadruple the
    // diffusion.
    const stepOu = settled && now - this.lastOuStep > 30;
    if (stepOu) this.lastOuStep = now;
    const waterPath = new Path2D();
    // Pool radius per buoy: tight to the edge grains. Phones sample every
    // 4th grain, so each buoy carries a wider blob to keep the pool sealed.
    const waterR = this.W < 640 ? 7.5 : 5;

    for (let i = 0; i < this.N; i++) {
      let x: number;
      let y: number;
      if (settled) {
        // u ≡ 1 at equilibrium: read the anchor directly, skip the lerp and
        // the from/delay streams entirely (~700k flops + 690KB reads/frame).
        x = this.dst[2 * i];
        y = this.dst[2 * i + 1];
      } else {
        const u = this.particleU(i, e);
        x = this.from[2 * i] + (this.dst[2 * i] - this.from[2 * i]) * u;
        y = this.from[2 * i + 1] + (this.dst[2 * i + 1] - this.from[2 * i + 1]) * u;
      }

      if (settled) {
        // Non-reversible Langevin: a smooth, slowly-evolving solenoidal drift
        // field + noise + a weak spring leash. Adding a divergence-free drift
        // to Langevin dynamics still preserves the target distribution — and
        // because neighboring grains sample the SAME field, the M flows like
        // liquid instead of vibrating like heated molecules.
        // Angle-addition form: all transcendentals hoisted out of the loop.
        if (stepOu) {
          const fx =
            this.drfSinA[i] * cos14 + this.drfCosA[i] * sin14 +
            0.6 * (this.drfSinB[i] * cos09 - this.drfCosB[i] * sin09);
          const fy =
            this.drfCosC[i] * cos12 + this.drfSinC[i] * sin12 +
            0.6 * (this.drfCosD[i] * cos11 - this.drfSinD[i] * sin11);
          this.ouvx[i] =
            this.ouvx[i] * 0.92 + fx * 0.14 - this.oux[i] * 0.03 + this.gauss() * 0.04;
          this.ouvy[i] =
            this.ouvy[i] * 0.92 + fy * 0.14 - this.ouy[i] * 0.03 + this.gauss() * 0.04;
          const sp2 = this.ouvx[i] * this.ouvx[i] + this.ouvy[i] * this.ouvy[i];
          if (sp2 > 1.5625) {
            const f = 1.25 / Math.sqrt(sp2);
            this.ouvx[i] *= f;
            this.ouvy[i] *= f;
          }
          this.oux[i] += this.ouvx[i];
          this.ouy[i] += this.ouvy[i];
        }
        x += this.oux[i];
        y += this.ouy[i];
      }

      // Minimal cursor nudge: settled only (never competing with transport),
      // tight radius, a light touch.
      if (this.pointer.over && settled) {
        const mdx = x - this.pointer.x;
        const mdy = y - this.pointer.y;
        const md2 = mdx * mdx + mdy * mdy;
        if (md2 < 6400) {
          const f = Math.exp(-md2 / 2600) * 8;
          const d = Math.sqrt(md2) + 1e-3;
          x += (mdx / d) * f;
          y += (mdy / d) * f;
        }
      }

      // Ribbons ride on a strided subset of grains: full trail richness at a
      // fraction of the stroke geometry. The dot bed itself stays fully dense.
      const hasRibbon = i % this.ribbonStride === 0;
      const rRow = (i / this.ribbonStride) | 0;
      const base = rRow * TRAIL * 2;
      if (record && hasRibbon) {
        this.trail[base + nextHead * 2] = x;
        this.trail[base + nextHead * 2 + 1] = y;
        // Comets during transport (shorter than the full ring: the last
        // third of a 32-frame tail was the most expensive stroke geometry
        // of the heaviest frames); long-lived ribbons at equilibrium so
        // the drift visibly draws its streamlines.
        const cap = this.playing ? (this.W < 640 ? 14 : 24) : this.N > 40000 ? 6 : 8;
        if (this.trailLen[rRow] < cap) this.trailLen[rRow]++;
        else if (this.trailLen[rRow] > cap) this.trailLen[rRow]--;
      } else if (!this.playing && !settled && hasRibbon && this.trailLen[rRow] > 0) {
        this.trailLen[rRow] -= 2;
        if (this.trailLen[rRow] < 0) this.trailLen[rRow] = 0;
      }
      const b = this.bucketOf[i];
      // Comet trail: three tapering tiers (width + alpha fall off toward the
      // tail), appended into the bucket's shared Path2D.
      const len = hasRibbon ? this.trailLen[rRow] : 0;
      if (len > 2) {
        anyTrail = true;
        const seg = Math.max(2, Math.ceil(len / 3));
        let kCursor = 0;
        for (let g = 0; g < 3 && kCursor < len; g++) {
          const key = b * 3 + g;
          const path = (trailPaths[key] ??= new Path2D());
          if (g === 0) {
            path.moveTo(x, y);
          } else {
            const slot0 = (headSlot - (kCursor - 1) + TRAIL * 2) % TRAIL;
            path.moveTo(this.trail[base + slot0 * 2], this.trail[base + slot0 * 2 + 1]);
          }
          const kMax = Math.min(len, kCursor + seg);
          for (let k = kCursor; k < kMax; k++) {
            const slot = (headSlot - k + TRAIL * 2) % TRAIL;
            path.lineTo(this.trail[base + slot * 2], this.trail[base + slot * 2 + 1]);
          }
          kCursor = kMax;
        }
      }

      if (drawWater && (i & poolMask) === 0) waterPath.rect(x - waterR, y - waterR, waterR * 2, waterR * 2);
      const dots = (dotPaths[b] ??= new Path2D());
      if (this.N > 24000 || this.playing) {
        // Squares rasterize far cheaper than arcs: always at ultra counts,
        // and during transport, where motion hides the dot shape entirely
        // (crisp circles return the frame the M lands).
        const r = this.radii[i];
        dots.rect(x - r, y - r, r * 2, r * 2);
      } else {
        dots.moveTo(x + this.radii[i], y);
        dots.arc(x, y, this.radii[i], 0, 6.2832);
      }
    }
    if (record) this.trailHead = nextHead;

    // The water pane: darker stroke first (survives the alpha threshold as a
    // baked meniscus rim), then the pool tint. One CSS filter pass total.
    if (drawWater) {
      this.wtx.clearRect(0, 0, this.W, this.H);
      this.wtx.fillStyle = "#ffffff";
      this.wtx.fill(waterPath);
    }

    // Batched draw: one stroke per (bucket, tier), one fill per bucket.
    p.lineCap = "round";
    const widths = [2.5, 1.3, 0.6];
    for (let g = 0; g < 3; g++) {
      p.lineWidth = widths[g];
      for (let b = 0; b < NB; b++) {
        const path = trailPaths[b * 3 + g];
        if (path) {
          p.strokeStyle = this.trailPalette[b][g];
          p.stroke(path);
        }
      }
    }
    for (let b = 0; b < NB; b++) {
      const path = dotPaths[b];
      if (path) {
        p.fillStyle = this.palette[b];
        p.fill(path);
      }
    }

    if (this.playing || anyTrail || this.pointer.over || settled) {
      this.raf = requestAnimationFrame(this.loop);
    }
  };

  destroy(): void {
    this.destroyed = true;
    window.clearTimeout(this.flareTimer);
    if (this.raf) cancelAnimationFrame(this.raf);
  }
}

/* ------------------------------------------------------------- component */

const LITE_FX_QUERY = "(max-width: 40rem)";
function subscribeLiteFx(cb: () => void): () => void {
  const mq = window.matchMedia(LITE_FX_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function getLiteFx(): boolean {
  return window.matchMedia(LITE_FX_QUERY).matches;
}
function getLiteFxServer(): boolean {
  return false;
}

export function FlowField({
  className = "",
  fitBox,
  dark = false,
}: {
  className?: string;
  fitBox?: FitBox;
  /** Render for an ink ground: frosted M ramp + dark-glass HUD. */
  dark?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const ptsRef = useRef<HTMLCanvasElement>(null);
  const waterRef = useRef<HTMLCanvasElement>(null);
  const rangeRef = useRef<HTMLInputElement>(null);
  const tReadRef = useRef<HTMLSpanElement>(null);
  const stateRef = useRef<HTMLSpanElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<FlowEngine | null>(null);
  const [sampleCount, setSampleCount] = useState<number | null>(null);
  // Phones get the halo's lite filter: the full chain's 13px aura blur runs
  // at display resolution per water frame, too heavy for phone GPUs.
  const liteFx = useSyncExternalStore(subscribeLiteFx, getLiteFx, getLiteFxServer);
  const fitBoxRef = useRef(fitBox);
  const darkRef = useRef(dark);

  // Keep the engine's fit box in sync with the prop (post-render, per the
  // refs rule; in practice the hero passes a constant).
  useEffect(() => {
    fitBoxRef.current = fitBox;
    if (engineRef.current) engineRef.current.fitBox = fitBox ?? null;
  });

  useEffect(() => {
    const wrap = wrapRef.current;
    const pts = ptsRef.current;
    const water = waterRef.current;
    if (!wrap || !pts || !water) return;

    const engine = new FlowEngine(pts, water);
    engineRef.current = engine;
    engine.darkGround = darkRef.current;
    engine.fitBox = fitBoxRef.current ?? null;
    engine.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let hudTimer = 0;
    engine.onTick = (t, playing) => {
      if (rangeRef.current) rangeRef.current.value = String(Math.round(t * 1000));
      if (tReadRef.current) tReadRef.current.textContent = t.toFixed(2);
      if (stateRef.current)
        stateRef.current.textContent = playing
          ? "transporting"
          : "equilibrium (langevin + solenoidal drift)";
      // While the canvas animates under them, every backdrop-filtered glass
      // surface over the hero (HUD, nav, the MSAIL island) re-rasterizes its
      // blur on every frame — on phones that is two full blur passes per
      // frame at DPR 3. CSS swaps them all to near-opaque fills for those
      // seconds via a root attribute. The glass returns a beat AFTER landing
      // so its one-time re-raster misses the landing frame, which already
      // pays for the halo's first paint.
      const hud = hudRef.current;
      const root = document.documentElement;
      if (playing) {
        window.clearTimeout(hudTimer);
        if (hud && hud.dataset.playing !== "true") hud.dataset.playing = "true";
        if (root.dataset.mForming !== "true") root.dataset.mForming = "true";
      } else if (root.dataset.mForming !== "false" || (hud && hud.dataset.playing !== "false")) {
        window.clearTimeout(hudTimer);
        hudTimer = window.setTimeout(() => {
          if (hud) hud.dataset.playing = "false";
          root.dataset.mForming = "false";
        }, 700);
      }
    };
    setSampleCount(engine.N);

    // Warm the goo filter's GPU pipeline while the page is still loading:
    // its first rasterization measured ~150ms, which otherwise lands on the
    // exact frame the M settles and the halo begins its fade-in.
    const wctx = water.getContext("2d");
    if (wctx) {
      // Full-coverage warm draw: blur cost is per covered tile, so a token
      // corner rect would leave most of the surface cold.
      wctx.save();
      wctx.setTransform(1, 0, 0, 1, 0, 0);
      wctx.fillStyle = "#fff";
      wctx.fillRect(0, 0, water.width, water.height);
      wctx.restore();
    }
    water.style.opacity = "0.004";
    const warmTimer = window.setTimeout(() => {
      // Only stand down if the engine hasn't already taken the reins
      // (reduced-motion shows the halo immediately).
      if (water.style.opacity === "0.004") water.style.opacity = "0";
    }, 450);

    // Boot once the browser is idle: the initial sample + pair + recolor is
    // a chunky task, and running it inside the load window was a large slice
    // of Total Blocking Time. The canvas is blank either way until it runs.
    const boot = () => {
      engine.setDataset("noise");
      engine.loadMark("/msail-wordmark-m.png", () => {
        engine.setDataset("blockm");
      });
    };
    let idleId = 0;
    let bootTimer = 0;
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(boot, { timeout: 600 });
    } else {
      bootTimer = window.setTimeout(boot, 150); // Safari has no rIC
    }

    const ro = new ResizeObserver(() => {
      engine.resize();
      setSampleCount(engine.N);
      engine.scrub(1);
    });
    ro.observe(wrap);

    const io = new IntersectionObserver(
      ([entry]) => {
        engine.visible = entry.isIntersecting && !document.hidden;
        engine.wake();
      },
      { threshold: 0.02 },
    );
    io.observe(wrap);
    const onVis = () => {
      engine.visible = !document.hidden;
      engine.wake();
    };
    document.addEventListener("visibilitychange", onVis);

    // The wrap rect is cached: querying it per pointermove forces a layout
    // pass dozens of times a frame while the cursor crosses the hero.
    let wrapRect: DOMRect = wrap.getBoundingClientRect();
    const refreshRect = () => {
      wrapRect = wrap.getBoundingClientRect();
    };
    window.addEventListener("scroll", refreshRect, { passive: true });
    window.addEventListener("resize", refreshRect);
    const onMove = (ev: PointerEvent) => {
      if (ev.pointerType !== "mouse") return;
      engine.setPointer(ev.clientX - wrapRect.left, ev.clientY - wrapRect.top, true);
    };
    const onLeave = () => engine.setPointer(-1e5, -1e5, false);
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);

    return () => {
      delete document.documentElement.dataset.mForming;
      if (idleId) window.cancelIdleCallback(idleId);
      window.clearTimeout(bootTimer);
      window.clearTimeout(warmTimer);
      window.clearTimeout(hudTimer);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("scroll", refreshRect);
      window.removeEventListener("resize", refreshRect);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className={`relative ${className}`}
      role="img"
      aria-label="Live figure: samples flow from Gaussian noise into the Block M along straight rectified-flow paths, then shimmer at equilibrium."
    >
      {/* The water pane: grain positions rendered to a low-res underlay and
          fused by a goo filter into one translucent pool whose boundary is
          set by the outermost grains. The crisp grains float on top like
          buoys; the pool edge ripples as edge grains drift. */}
      <svg width="0" height="0" aria-hidden className="absolute">
        <defs>
          <filter id="water-goo" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.2" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10"
              result="pool"
            />
            {/* Halo: the fused pool, re-blurred and layered beneath itself,
                becomes a soft luminous aura hugging the M's outline. */}
            <feGaussianBlur in="pool" stdDeviation="13" result="aura" />
            <feComponentTransfer in="aura" result="auraSoft">
              <feFuncA type="linear" slope="1" intercept="0" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="auraSoft" />
              <feMergeNode in="pool" />
            </feMerge>
          </filter>
          <filter id="water-goo-lite" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.2" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10"
              result="pool"
            />
            <feGaussianBlur in="pool" stdDeviation="6" result="aura" />
            <feMerge>
              <feMergeNode in="aura" />
              <feMergeNode in="pool" />
            </feMerge>
          </filter>
        </defs>
      </svg>
      <canvas
        ref={waterRef}
        aria-hidden
        data-goo={liteFx ? "url(#water-goo-lite)" : "url(#water-goo)"}
        className="absolute inset-0 h-full w-full"
        style={{
          // The filter is ON initially so the boot warm-draw compiles the
          // pipeline; the engine strips it during transport and restores it
          // at the landing flare (reading data-goo above).
          filter: liteFx ? "url(#water-goo-lite)" : "url(#water-goo)",
          opacity: 0,
          transition: "opacity 1600ms ease",
        }}
      />
      <canvas ref={ptsRef} aria-hidden className="absolute inset-0 h-full w-full" />

      {/* The one glass caption card. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-end p-4 sm:p-6">
        <div
          ref={hudRef}
          className={`glass-card pointer-events-auto hidden w-[23rem] flex-col px-5 py-4 text-[11px] leading-relaxed md:flex ${
            dark ? "glass-card-ink text-on-navy-muted" : "text-ink-2"
          }`}
        >
          <p>rectified flow · {sampleCount ?? "…"} samples</p>
          <p>
            x_t = (1 − t)·x₀ + t·x₁ ·{" "}
            <span className="whitespace-nowrap">
              t = <span ref={tReadRef}>0.00</span>
            </span>
          </p>
          <p>
            state: <span ref={stateRef}>transporting</span>
          </p>
          <p className={dark ? "text-on-navy-muted/80" : "text-ink-3"}>
            coupling: sliced OT + 2-opt (
            <a
              href="https://arxiv.org/abs/2209.03003"
              target="_blank"
              rel="noopener noreferrer"
              className={`underline decoration-dotted underline-offset-2 transition-colors duration-150 ${
                dark ? "hover:text-maize" : "hover:text-navy"
              }`}
            >
              Liu et al. 2022
            </a>
            )
          </p>
          {/* Replay lives here, not on the canvas: stray clicks on the figure
              should never restart the transport. */}
          <div className="mt-1.5 flex items-center gap-2.5">
            <button
              type="button"
              aria-label="Replay the transport"
              title="Replay"
              onClick={() => engineRef.current?.replay()}
              className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors duration-150 ${
                dark
                  ? "border-white/30 bg-white/15 text-on-navy hover:bg-white/25"
                  : "border-white/60 bg-white/40 text-navy hover:bg-white/70"
              }`}
            >
              <svg viewBox="0 0 12 12" className="ml-px h-3 w-3" aria-hidden fill="currentColor">
                <path d="M2.5 1.4a.6.6 0 0 1 .9-.52l7 4.6a.6.6 0 0 1 0 1.04l-7 4.6a.6.6 0 0 1-.9-.52Z" />
              </svg>
            </button>
            <input
              ref={rangeRef}
              type="range"
              min={0}
              max={1000}
              defaultValue={0}
              aria-label="Interpolation time"
              className={`flow-scrub w-full ${dark ? "flow-scrub-ink" : ""}`}
              onInput={(ev) => engineRef.current?.scrub(Number(ev.currentTarget.value) / 1000)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
