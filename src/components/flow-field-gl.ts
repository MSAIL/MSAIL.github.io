/**
 * FlowEngineGL: the hero figure on WebGL2.
 *
 * Same figure and same maths as the Canvas 2D FlowEngine in flow-field.tsx,
 * with the work moved off the main thread:
 *
 *   transport   x_t = (1 - t) x0 + t x1 is evaluated in the vertex shader
 *               from one static buffer (start, target, stagger delay, radius
 *               per grain). The main thread sets a clock uniform per frame.
 *   rest        the Langevin step (damped velocity, spring leash to the
 *               anchor, Gaussian noise, a divergence-free drift field) runs
 *               on the GPU through transform feedback at a fixed 30 Hz, the
 *               timestep its coefficients are tuned for. Frames in between
 *               interpolate the last two states, so the motion is drawn at
 *               the display's refresh rate without changing the dynamics.
 *   grains      one instanced draw of antialiased discs at device resolution.
 *   trails      comet ribbons. In flight a trail is exactly the stretch of
 *               the grain's straight path it covered in the last frames, so
 *               it is drawn from the closed form; at rest it follows a ring
 *               of recent positions kept on the GPU.
 *   halo        one blur pipeline for every browser: pool discs into a
 *               half-resolution mask, Gaussian blur, alpha threshold (the
 *               fused pool), a second wider blur (the aura).
 *   coupling    computed in a worker (flow-coupling.ts): iterated sliced OT,
 *               nearest matching, 2-opt. The worker also rasterizes the mark.
 *
 * Anything that stops WebGL2 from working (no context, a failed link, a lost
 * context, no worker) is reported through onFail, and the component swaps in
 * the Canvas 2D engine.
 */
import {
  GRAIN_FLOATS,
  MARK_WIDTH,
  STAGGER,
  cloudFromPixels,
  type Box,
  type Plan,
  type PlanRequest,
} from "./flow-shared";
import type { FitBox, FlowDataset, HeroEngine } from "./flow-field";

type RGB = [number, number, number];
const MAIZE: RGB = [255, 203, 5];

const OU_MS = 1000 / 30; // the Langevin timestep
const HISTORY = 8; // ribbon samples kept at rest
const RECORD_EVERY = 3; // Langevin steps between ribbon samples
const MASK_SCALE = 0.5; // halo mask resolution, in CSS px
const POOL_R = 7.5; // pool disc radius, on every 4th grain
const SHEEN_R = 10; // in-flight sheen disc radius, on every 8th grain
const TIER_HALF = [1.25, 0.65, 0.3]; // ribbon half widths, head to tail
const BYTES = GRAIN_FLOATS * 4;

/* ---------------------------------------------------------------- shaders */

const HEAD = "#version 300 es\nprecision highp float;\n";

/* Shared by every pass that places a grain. */
const PLACE = `
uniform vec2 uRes;
uniform float uPx;
uniform float uE;
uniform float uSettled;
uniform float uMix;
uniform vec3 uPointer;
layout(location=0) in vec2 aCorner;
layout(location=1) in vec4 aPath;
layout(location=2) in vec2 aDR;
layout(location=3) in vec4 aPrev;
layout(location=4) in vec4 aCur;
float ease(float e, float delay) {
  float u = clamp(e * ${(1 + STAGGER).toFixed(2)} - delay, 0.0, 1.0);
  return u * u * (3.0 - 2.0 * u);
}
vec2 along(float e) { return mix(aPath.xy, aPath.zw, ease(e, aDR.x)); }
vec2 repel(vec2 p) {
  vec2 d = p - uPointer.xy;
  float d2 = dot(d, d);
  if (uPointer.z > 0.5 && d2 < 6400.0) p += d / (sqrt(d2) + 1e-3) * exp(-d2 / 2600.0) * 8.0;
  return p;
}
vec2 resting() { return repel(aPath.zw + mix(aPrev.xy, aCur.xy, uMix)); }
vec4 clip(vec2 p) { return vec4(p.x / uRes.x * 2.0 - 1.0, 1.0 - p.y / uRes.y * 2.0, 0.0, 1.0); }
`;

/* Box-filtered coverage of a shape of half width r at distance d, in px. */
const COVER = "float cover(float r, float d) { return clamp(r - d + 0.5, 0.0, 1.0) - clamp(-r - d + 0.5, 0.0, 1.0); }\n";

const DISC_VS = `${HEAD}${PLACE}
uniform vec2 uRadius;
out vec2 vLocal;
out float vR;
flat out int vShade;
void main() {
  vec2 p = uSettled > 0.5 ? resting() : along(uE);
  float r = aDR.y * uRadius.x + uRadius.y;
  float ext = r + 1.0 / uPx;
  vLocal = aCorner * ext * uPx;
  vR = r * uPx;
  vShade = gl_InstanceID & 3;
  gl_Position = clip(p + aCorner * ext);
}`;
const DISC_FS = `${HEAD}${COVER}
uniform vec4 uTint[4];
in vec2 vLocal;
in float vR;
flat in int vShade;
out vec4 o;
void main() { o = uTint[vShade] * cover(vR, length(vLocal)); }`;

const RIBBON_VS = `${HEAD}${PLACE}
layout(location=5) in vec2 aA;
layout(location=6) in vec2 aB;
uniform int uMode;
uniform vec2 uSpan;
uniform float uHalf;
out vec2 vP;
flat out vec2 vA;
flat out vec2 vB;
void main() {
  vec2 a;
  vec2 b;
  if (uMode == 0) {
    a = along(uSpan.x);
    b = along(uSpan.y);
  } else {
    a = uMode == 1 ? resting() : repel(aA);
    b = repel(aB);
  }
  vec2 t = b - a;
  float len = length(t);
  t = len > 1e-4 ? t / len : vec2(1.0, 0.0);
  float ext = uHalf + 1.0 / uPx;
  vec2 p = (aCorner.x < 0.0 ? a - t * ext : b + t * ext) + vec2(-t.y, t.x) * aCorner.y * ext;
  vP = p * uPx;
  vA = a * uPx;
  vB = b * uPx;
  gl_Position = clip(p);
}`;
const RIBBON_FS = `${HEAD}${COVER}
uniform vec4 uTier;
uniform float uHalfPx;
in vec2 vP;
flat in vec2 vA;
flat in vec2 vB;
out vec4 o;
void main() {
  vec2 pa = vP - vA;
  vec2 ba = vB - vA;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  o = uTier * cover(uHalfPx, length(pa - ba * h));
}`;

/* One Langevin step per grain. The drift is (g(y, t), h(x, t)): each
   component depends only on the other coordinate, so its divergence is
   exactly zero. Noise is a hash of (grain, step) through Box-Muller. */
const SIM_VS = `${HEAD}
layout(location=0) in vec4 aState;
layout(location=1) in vec2 aDst;
uniform vec4 uPhase;
uniform uint uEpoch;
uniform float uReset;
out vec4 vState;
uint pcg(uint v) {
  uint s = v * 747796405u + 2891336453u;
  uint w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u;
  return (w >> 22u) ^ w;
}
void main() {
  uint h1 = pcg(uint(gl_VertexID) ^ pcg(uEpoch));
  uint h2 = pcg(h1);
  float u1 = (float(h1 >> 8u) + 0.5) / 16777216.0;
  float u2 = float(h2 >> 8u) / 16777216.0;
  vec2 g = sqrt(-2.0 * log(u1)) * vec2(cos(6.2831853 * u2), sin(6.2831853 * u2));
  if (uReset > 0.5) {
    vState = vec4(0.0, 0.0, g * 0.55);
    return;
  }
  vec2 o = aState.xy;
  vec2 v = aState.zw;
  vec2 p = aDst + o;
  vec2 f = vec2(
    sin(p.y * 0.012 + uPhase.x) + 0.6 * sin(p.y * 0.007 + uPhase.y),
    cos(p.x * 0.010 + uPhase.z) + 0.6 * cos(p.x * 0.008 + uPhase.w));
  v = v * 0.92 + f * 0.14 - o * 0.03 + g * 0.04;
  float sp = length(v);
  if (sp > 1.25) v *= 1.25 / sp;
  vState = vec4(o + v, v);
}`;
const HIST_VS = `${HEAD}
layout(location=0) in vec4 aState;
layout(location=1) in vec2 aDst;
out vec2 vPos;
void main() { vPos = aDst + aState.xy; }`;
const NO_FS = `${HEAD}void main() {}`;

const SCREEN_VS = `${HEAD}
out vec2 vUv;
void main() {
  vUv = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(vUv * 2.0 - 1.0, 0.0, 1.0);
}`;
/* Separable Gaussian. With uCut the source is thresholded on the way in:
   alpha * 24 - 10 turns the blurred discs into one hard-edged pool. */
const BLUR_FS = `${HEAD}
uniform sampler2D uTex;
uniform vec2 uDir;
uniform float uSigma;
uniform float uCut;
in vec2 vUv;
out vec4 o;
void main() {
  float sum = 0.0;
  float wsum = 0.0;
  for (int i = -22; i <= 22; i++) {
    float x = float(i);
    if (abs(x) > 3.0 * uSigma + 1.0) continue;
    float w = exp(-x * x / (2.0 * uSigma * uSigma));
    float v = texture(uTex, vUv + uDir * x).r;
    if (uCut > 0.5) v = clamp(v * 24.0 - 10.0, 0.0, 1.0);
    sum += v * w;
    wsum += w;
  }
  o = vec4(sum / wsum);
}`;
/* Halo (pool over aura), sigma rings, then the three ribbon tiers. */
const COMPOSE_FS = `${HEAD}
uniform sampler2D uPool;
uniform sampler2D uAura;
uniform sampler2D uTrail;
uniform float uHalo;
uniform float uTrailOn;
uniform vec3 uTrailColor;
uniform vec4 uRing;
uniform vec4 uRingColor;
uniform float uPx;
in vec2 vUv;
out vec4 o;
void main() {
  vec4 c = vec4(0.0);
  if (uHalo > 0.0) {
    float p = clamp(texture(uPool, vUv).r * 24.0 - 10.0, 0.0, 1.0);
    float a = texture(uAura, vUv).r;
    c = vec4((p + a - p * a) * uHalo);
  }
  if (uRingColor.a > 0.0) {
    float d = length(gl_FragCoord.xy - uRing.xy);
    float k = clamp(floor(d / uRing.z + 0.5), 1.0, 3.0);
    float r = clamp(0.5 * uPx - abs(d - k * uRing.z) + 0.5, 0.0, 1.0) * uRingColor.a;
    c = c * (1.0 - r) + vec4(uRingColor.rgb * r, r);
  }
  if (uTrailOn > 0.5) {
    vec3 m = texture(uTrail, vUv).rgb;
    float a = 1.0 - (1.0 - 0.42 * m.r) * (1.0 - 0.22 * m.g) * (1.0 - 0.10 * m.b);
    c = c * (1.0 - a) + vec4(uTrailColor * a, a);
  }
  o = c;
}`;

/* ----------------------------------------------------------------- helpers */

type Program = { prog: WebGLProgram; u: Record<string, WebGLUniformLocation | null> };

/** CSS "ease", cubic-bezier(0.25, 0.1, 0.25, 1): the halo used to fade on a
    CSS opacity transition, and keeps that curve. */
function cssEase(x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  let t = x;
  for (let i = 0; i < 5; i++) {
    const fx = 0.75 * t * (1 - t) + t * t * t - x;
    t -= fx / (0.75 * (1 - 2 * t) + 3 * t * t);
  }
  return 0.3 * t * (1 - t) * (1 - t) + 3 * t * t * (1 - t) + t * t * t;
}

const mixRgb = (a: RGB, b: RGB, f: number): RGB => [
  a[0] + (b[0] - a[0]) * f,
  a[1] + (b[1] - a[1]) * f,
  a[2] + (b[2] - a[2]) * f,
];

type Mode = "preview" | "play" | "landed" | "spare";
type FromWorker = { type: "plan"; plan: Plan } | { type: "mark"; ok: boolean };
type Shown = { n: number; grains: Float32Array; stats: Plan["stats"]; target: "noise" | "blockm"; w: number; h: number };

/* ------------------------------------------------------------------ engine */

export class FlowEngineGL implements HeroEngine {
  N = 0;
  visible = true;
  reduced = false;
  darkGround = false;
  duration = 2800;
  fitBox: FitBox | null = null;
  onTick: ((t: number, playing: boolean) => void) | null = null;
  /** Called once if WebGL2 cannot be used or stops working. */
  onFail: ((reason: string) => void) | null = null;

  private gl: WebGL2RenderingContext | null = null;
  private worker: Worker | null = null;
  private failed = false;
  private destroyed = false;
  private raf = 0;

  private W = 1;
  private H = 1;
  private dpr = 1;
  private dotR = 2.35;
  private ribbonStride = 8;
  private phone = false;

  private T = 0;
  private playing = false;
  private preview = false;
  private t0 = 0;
  private landedAt = 0;
  private lastFrame = 0;
  private frameMs = 1000 / 60;
  private pointer = { x: -1e5, y: -1e5, over: false };

  private target: "noise" | "blockm" = "noise";
  private shown: Shown | null = null;
  private rows = 0;
  private reqId = 0;
  private latest = 0;
  private pending = new Map<number, { mode: Mode; target: "noise" | "blockm"; w: number; h: number }>();
  private seed = 0x2545f4;
  private previewSeed = 0;
  private spare: Plan | null = null;
  private spareId = 0;
  private noiseTimer = 0;
  private replanTimer = 0;
  private markSrc = "";
  private markReady: (() => void) | null = null;

  /* Langevin state: two buffers of (offset.xy, velocity.xy), ping-ponged. */
  private cur = 1;
  private ouReset = true;
  private lastStep = 0;
  private epoch = 1;
  private steps = 0;
  private histHead = 0;

  private haloFrom = 0;
  private haloGoal = 0;
  private haloT0 = 0;
  private haloDur = 1;
  private haloLit = false;

  private disc!: Program;
  private ribbon!: Program;
  private sim!: Program;
  private hist!: Program;
  private blur!: Program;
  private compose!: Program;
  private linked = false;

  private quad!: WebGLBuffer;
  private planBuf!: WebGLBuffer;
  private state: WebGLBuffer[] = [];
  private history: WebGLBuffer[] = [];
  private bufN = 0;
  private bufStride = 0;
  private vaoGrain: WebGLVertexArrayObject[] = [];
  private vaoPool: WebGLVertexArrayObject[] = [];
  private vaoSim: WebGLVertexArrayObject[] = [];
  private vaoHist: WebGLVertexArrayObject[] = [];
  private vaoRest: WebGLVertexArrayObject[] = [];
  private vaoSheen!: WebGLVertexArrayObject;
  private vaoFlight!: WebGLVertexArrayObject;
  private vaoScreen!: WebGLVertexArrayObject;
  private mask: { tex: WebGLTexture; fbo: WebGLFramebuffer }[] = [];
  private trail: { tex: WebGLTexture; fbo: WebGLFramebuffer } | null = null;
  private maskW = 1;
  private maskH = 1;
  private readonly tint = new Float32Array(16);

  constructor(private canvas: HTMLCanvasElement) {
    this.measure();
    // Started now, used at boot: the worker's script loads and compiles on
    // its own thread while the page is still hydrating.
    try {
      this.worker = new Worker(new URL("./flow-coupling.worker.ts", import.meta.url), {
        type: "module",
      });
      this.worker.onmessage = (ev: MessageEvent<FromWorker>) => {
        if (ev.data.type === "plan") this.receivePlan(ev.data.plan);
        else this.markDone(ev.data.ok);
      };
      this.worker.onerror = () => this.fail("worker error");
    } catch {
      this.worker = null; // reported at boot, once onFail is attached
    }
  }

  /* ------------------------------------------------------------- sizing */

  /** Same budget rules as the Canvas 2D engine, so both draw the same
      number of grains at the same sizes. Returns true if anything changed. */
  private measure(): boolean {
    const rect = this.canvas.parentElement!.getBoundingClientRect();
    const W = Math.max(1, rect.width);
    const H = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const changed = W !== this.W || H !== this.H || dpr !== this.dpr;
    this.W = W;
    this.H = H;
    this.dpr = dpr;
    this.phone = W < 640;
    const density = this.phone ? 40 : 19;
    this.N = Math.max(4000, Math.min(21600, Math.round((W * H) / density)));
    this.ribbonStride = this.phone ? 8 : this.N > 20000 ? 8 : this.N > 10000 ? 4 : 2;
    this.dotR = this.phone ? 1.5 : 2.35;
    return changed;
  }

  resize(): void {
    const changed = this.measure();
    const pw = Math.round(this.W * this.dpr);
    const ph = Math.round(this.H * this.dpr);
    if (this.canvas.width !== pw || this.canvas.height !== ph) {
      this.canvas.width = pw;
      this.canvas.height = ph;
    }
    if (!this.gl || !changed) return;
    this.allocTargets();
    // Sizing the canvas cleared it: redraw now instead of a frame later.
    if (this.shown) this.render(performance.now());
    // The figure was fitted to the old box; refit it, landed, once the
    // resize settles.
    window.clearTimeout(this.replanTimer);
    this.replanTimer = window.setTimeout(() => this.replan(), 120);
  }

  private box(): Box {
    return this.fitBox && this.W >= 1024 ? this.fitBox : { x0: 0, y0: 0, x1: 1, y1: 1 };
  }

  /* --------------------------------------------------------------- setup */

  private initGL(): boolean {
    if (this.gl) return true;
    if (this.failed || this.destroyed) return false;
    if (!this.worker) {
      this.fail("no worker");
      return false;
    }
    const gl = this.canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      // A software rasterizer would be slower than the Canvas 2D engine.
      failIfMajorPerformanceCaveat: true,
    });
    if (!gl || gl.isContextLost()) {
      this.fail("no webgl2 context");
      return false;
    }
    this.canvas.addEventListener("webglcontextlost", this.onLost);
    this.gl = gl;

    // Compiles are issued here and checked on first use: asking for the
    // link status now would block this task until the GPU process is done.
    this.disc = this.startProgram(DISC_VS, DISC_FS);
    this.ribbon = this.startProgram(RIBBON_VS, RIBBON_FS);
    this.sim = this.startProgram(SIM_VS, NO_FS, ["vState"]);
    this.hist = this.startProgram(HIST_VS, NO_FS, ["vPos"]);
    this.blur = this.startProgram(SCREEN_VS, BLUR_FS);
    this.compose = this.startProgram(SCREEN_VS, COMPOSE_FS);

    this.quad = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    this.planBuf = gl.createBuffer()!;
    for (let i = 0; i < 2; i++) this.state.push(gl.createBuffer()!);
    for (let i = 0; i < HISTORY; i++) this.history.push(gl.createBuffer()!);
    this.vaoScreen = gl.createVertexArray()!;
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.clearColor(0, 0, 0, 0);
    this.resize();
    this.allocTargets();
    return true;
  }

  private startProgram(vs: string, fs: string, varyings?: string[]): Program {
    const gl = this.gl!;
    const prog = gl.createProgram()!;
    for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]] as const) {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      gl.attachShader(prog, sh);
      gl.deleteShader(sh); // freed with the program
    }
    if (varyings) gl.transformFeedbackVaryings(prog, varyings, gl.INTERLEAVED_ATTRIBS);
    gl.linkProgram(prog);
    return { prog, u: {} };
  }

  /** True once the GPU process has finished compiling, where the browser
      can say so without blocking (KHR_parallel_shader_compile). */
  private programsReady(): boolean {
    const gl = this.gl!;
    if (this.linked) return true;
    const ext = gl.getExtension("KHR_parallel_shader_compile");
    if (!ext) return true;
    return [this.disc, this.ribbon, this.sim, this.hist, this.blur, this.compose].every(
      (p) => gl.getProgramParameter(p.prog, ext.COMPLETION_STATUS_KHR) as boolean,
    );
  }

  /** First use: confirm every program linked and look up its uniforms. */
  private finishPrograms(): boolean {
    if (this.linked) return true;
    const gl = this.gl!;
    for (const p of [this.disc, this.ribbon, this.sim, this.hist, this.blur, this.compose]) {
      if (!gl.getProgramParameter(p.prog, gl.LINK_STATUS)) {
        this.fail(`shader link: ${gl.getProgramInfoLog(p.prog) ?? ""}`);
        return false;
      }
      const count = gl.getProgramParameter(p.prog, gl.ACTIVE_UNIFORMS) as number;
      for (let i = 0; i < count; i++) {
        const name = gl.getActiveUniform(p.prog, i)!.name.replace("[0]", "");
        p.u[name] = gl.getUniformLocation(p.prog, name);
      }
    }
    gl.useProgram(this.compose.prog);
    gl.uniform1i(this.compose.u.uPool, 0);
    gl.uniform1i(this.compose.u.uAura, 1);
    gl.uniform1i(this.compose.u.uTrail, 2);
    this.linked = true;
    return true;
  }

  private target2d(old: { tex: WebGLTexture; fbo: WebGLFramebuffer } | null, format: number, w: number, h: number) {
    const gl = this.gl!;
    if (old) {
      gl.deleteTexture(old.tex);
      gl.deleteFramebuffer(old.fbo);
    }
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texStorage2D(gl.TEXTURE_2D, 1, format, w, h);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { tex, fbo };
  }

  private allocTargets(): void {
    const gl = this.gl!;
    const w = Math.max(1, this.canvas.width);
    const h = Math.max(1, this.canvas.height);
    this.trail = this.target2d(this.trail, gl.RGBA8, w, h);
    this.maskW = Math.max(1, Math.ceil(this.W * MASK_SCALE));
    this.maskH = Math.max(1, Math.ceil(this.H * MASK_SCALE));
    for (let i = 0; i < 3; i++) {
      this.mask[i] = this.target2d(this.mask[i] ?? null, gl.R8, this.maskW, this.maskH);
    }
    this.haloLit = false; // the mask is empty until the next pool pass
  }

  private attr(loc: number, buf: WebGLBuffer, size: number, stride: number, offset: number, divisor: number): void {
    const gl = this.gl!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, offset);
    gl.vertexAttribDivisor(loc, divisor);
  }

  /** A grain-placing vertex array that reads every `step`-th grain. `prev`
      picks which state buffer is the older one; -1 leaves the state out
      (in flight the shader never reads it). */
  private placeVao(step: number, prev: number): WebGLVertexArrayObject {
    const gl = this.gl!;
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    this.attr(0, this.quad, 2, 0, 0, 0);
    this.attr(1, this.planBuf, 4, BYTES * step, 0, 1);
    this.attr(2, this.planBuf, 2, BYTES * step, 16, 1);
    if (prev >= 0) {
      this.attr(3, this.state[prev], 4, 16 * step, 0, 1);
      this.attr(4, this.state[1 - prev], 4, 16 * step, 0, 1);
    }
    return vao;
  }

  /** (Re)allocate per-grain storage for n grains and rebuild the vertex
      arrays, whose strides depend on the ribbon stride. */
  private allocGrains(n: number): void {
    const gl = this.gl!;
    const stride = this.ribbonStride;
    if (n === this.bufN && stride === this.bufStride) return;
    this.bufN = n;
    this.bufStride = stride;
    this.rows = Math.ceil(n / stride);
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.planBuf);
    gl.bufferData(gl.ARRAY_BUFFER, n * BYTES, gl.STATIC_DRAW);
    for (const b of this.state) {
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, n * 16, gl.DYNAMIC_COPY);
    }
    for (const b of this.history) {
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, this.rows * 8, gl.DYNAMIC_COPY);
    }
    for (const list of [this.vaoGrain, this.vaoPool, this.vaoSim, this.vaoHist, this.vaoRest]) {
      for (const v of list) gl.deleteVertexArray(v);
      list.length = 0;
    }
    if (this.vaoSheen) gl.deleteVertexArray(this.vaoSheen);
    if (this.vaoFlight) gl.deleteVertexArray(this.vaoFlight);
    for (let prev = 0; prev < 2; prev++) {
      this.vaoGrain.push(this.placeVao(1, prev));
      this.vaoPool.push(this.placeVao(4, prev));
      this.vaoRest.push(this.placeVao(stride, prev));
      // Transform feedback reads state[prev] and the anchors, as points.
      const simVao = gl.createVertexArray()!;
      gl.bindVertexArray(simVao);
      this.attr(0, this.state[prev], 4, 16, 0, 0);
      this.attr(1, this.planBuf, 2, BYTES, 8, 0);
      this.vaoSim.push(simVao);
      const histVao = gl.createVertexArray()!;
      gl.bindVertexArray(histVao);
      this.attr(0, this.state[prev], 4, 16 * stride, 0, 0);
      this.attr(1, this.planBuf, 2, BYTES * stride, 8, 0);
      this.vaoHist.push(histVao);
    }
    this.vaoSheen = this.placeVao(8, -1);
    this.vaoFlight = this.placeVao(stride, -1);
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  /* ---------------------------------------------------------------- plans */

  private requestPlan(mode: Mode, target: "noise" | "blockm", from: Float32Array | null, targets: Float32Array | null, seed: number): void {
    if (!this.worker) return;
    const id = ++this.reqId;
    this.pending.set(id, { mode, target, w: this.W, h: this.H });
    if (mode === "spare") this.spareId = id;
    else this.latest = id;
    const req: PlanRequest = {
      id, n: this.N, w: this.W, h: this.H, box: this.box(), dotR: this.dotR,
      target, from, targets, couple: mode !== "preview", seed,
    };
    const transfer: Transferable[] = [];
    if (from) transfer.push(from.buffer);
    if (targets) transfer.push(targets.buffer);
    this.worker.postMessage({ type: "plan", req }, transfer);
  }

  private receivePlan(plan: Plan): void {
    const info = this.pending.get(plan.id);
    this.pending.delete(plan.id);
    if (!info || this.destroyed || this.failed) return;
    if (info.mode === "spare") {
      if (plan.id === this.spareId && info.w === this.W && info.h === this.H) this.spare = plan;
      return;
    }
    if (plan.id !== this.latest) return; // superseded by a newer request
    this.whenCompiled(() => this.applyPlan(plan, info.mode, info.target, info.w, info.h), plan.id);
  }

  /** Hold a plan until the shaders are compiled instead of blocking on them. */
  private whenCompiled(run: () => void, id: number): void {
    if (this.destroyed || this.failed || id !== this.latest) return;
    if (this.programsReady()) run();
    else window.setTimeout(() => this.whenCompiled(run, id), 4);
  }

  private applyPlan(plan: Plan, mode: Mode, target: "noise" | "blockm", w: number, h: number): void {
    const gl = this.gl;
    if (!gl || !this.finishPrograms()) return;
    const first = !this.shown;
    this.allocGrains(plan.n);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.planBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, plan.grains);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    this.shown = { n: plan.n, grains: plan.grains, stats: plan.stats, target, w, h };
    this.setPalette(target);
    this.preview = mode === "preview";
    const land = mode === "landed" || this.reduced;
    this.T = land && !this.preview ? 1 : 0;
    this.playing = mode === "play" && !this.reduced;
    this.t0 = performance.now();
    this.landedAt = 0;
    this.ouReset = true;
    if (first) this.warmPipelines();
    // A plan that arrives already landed has no transport to report it.
    if (land && !this.preview) this.onTick?.(1, false);
    this.wake();
  }

  private setPalette(target: "noise" | "blockm"): void {
    for (let s = 0; s < 4; s++) {
      const c: RGB =
        target === "blockm"
          ? MAIZE
          : this.darkGround
            ? mixRgb([150, 170, 198], [198, 210, 228], s / 3)
            : mixRgb([84, 98, 118], [110, 124, 144], s / 3);
      // Rounded down to whole 8-bit steps, as the 2D engine's CSS colours are.
      this.tint.set([(c[0] | 0) / 255, (c[1] | 0) / 255, (c[2] | 0) / 255, 1], s * 4);
    }
  }

  /** Where every grain is drawn right now, as 2n floats. */
  private currentPositions(): Float32Array {
    const s = this.shown!;
    const out = new Float32Array(2 * s.n);
    const g = s.grains;
    const e = this.T;
    for (let i = 0; i < s.n; i++) {
      const o = i * GRAIN_FLOATS;
      const u = Math.min(1, Math.max(0, e * (1 + STAGGER) - g[o + 4]));
      const k = u * u * (3 - 2 * u);
      out[2 * i] = g[o] + (g[o + 2] - g[o]) * k;
      out[2 * i + 1] = g[o + 1] + (g[o + 3] - g[o + 1]) * k;
    }
    // At rest the grains sit off their anchors by the Langevin offset.
    const gl = this.gl;
    if (gl && this.settled() && !this.ouReset) {
      const st = new Float32Array(s.n * 4);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.state[this.cur]);
      gl.getBufferSubData(gl.ARRAY_BUFFER, 0, st);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      for (let i = 0; i < s.n; i++) {
        out[2 * i] += st[4 * i];
        out[2 * i + 1] += st[4 * i + 1];
      }
    }
    return out;
  }

  private targetPoints(): Float32Array {
    const s = this.shown!;
    const out = new Float32Array(2 * s.n);
    for (let i = 0; i < s.n; i++) {
      out[2 * i] = s.grains[i * GRAIN_FLOATS + 2];
      out[2 * i + 1] = s.grains[i * GRAIN_FLOATS + 3];
    }
    return out;
  }

  private nextSeed(): number {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed;
  }

  setDataset(key: FlowDataset): void {
    if (!this.initGL()) return;
    // The page shows the Gaussian and the Block M; anything else is noise.
    const target = key === "blockm" ? "blockm" : "noise";
    this.target = target;
    this.spare = null;
    this.spareId = 0;
    window.clearTimeout(this.noiseTimer);
    if (target === "noise" && !this.shown) {
      // First call at boot: show the start cloud standing still while the
      // mark loads. If no mark ever arrives, transport to a second Gaussian
      // so the figure still runs.
      this.previewSeed = this.nextSeed();
      this.requestPlan("preview", "noise", null, null, this.previewSeed);
      this.noiseTimer = window.setTimeout(() => {
        if (this.target === "noise" && this.shown) {
          this.requestPlan(this.reduced ? "landed" : "play", "noise", this.currentPositions(), null, this.nextSeed());
        }
      }, 1500);
      return;
    }
    // Start from what is on screen. If the preview has not come back yet,
    // reuse its seed: the worker then draws the very same start cloud.
    const from = this.shown ? this.currentPositions() : null;
    const seed = this.shown || !this.previewSeed ? this.nextSeed() : this.previewSeed;
    this.requestPlan(this.reduced ? "landed" : "play", target, from, null, seed);
  }

  /** Rewind to fresh noise and transport to the current target again. */
  replay(): void {
    if (!this.shown || this.preview) return;
    const mode: Mode = this.reduced ? "landed" : "play";
    const s = this.shown;
    if (this.spare && this.spare.n === s.n && s.w === this.W && s.h === this.H) {
      const plan = this.spare;
      this.spare = null;
      this.latest = ++this.reqId; // anything still in flight is now stale
      this.applyPlan(plan, mode, s.target, s.w, s.h);
      return;
    }
    const keep = s.n === this.N && s.w === this.W && s.h === this.H;
    this.requestPlan(mode, s.target, null, keep ? this.targetPoints() : null, this.nextSeed());
  }

  /** After a resize: fit the figure to the new box, without a transport. */
  private replan(): void {
    const s = this.shown;
    if (!s || this.destroyed || (s.w === this.W && s.h === this.H && s.n === this.N)) return;
    this.spare = null;
    this.spareId = 0;
    if (this.preview) this.requestPlan("preview", "noise", null, null, this.previewSeed);
    else this.requestPlan("landed", s.target, null, null, this.nextSeed());
  }

  /** Have the next replay ready before it is asked for. */
  private requestSpare(): void {
    const s = this.shown;
    if (!s || this.reduced || s.n !== this.N || s.w !== this.W || s.h !== this.H) return;
    this.spare = null;
    this.requestPlan("spare", s.target, null, this.targetPoints(), this.nextSeed());
  }

  /** The worker fetches and rasterizes the mark; `onReady` fires once its
      point cloud is in place. */
  loadMark(src: string, onReady?: () => void): void {
    if (!this.worker) return;
    this.markSrc = src;
    this.markReady = onReady ?? null;
    this.worker.postMessage({ type: "mark", src: new URL(src, window.location.href).href });
  }

  private markDone(ok: boolean): void {
    if (this.destroyed || this.failed) return;
    if (ok) this.markReady?.();
    else this.rasterizeMark();
  }

  /** Fallback for browsers whose workers have no OffscreenCanvas: the same
      rasterization on the page, as the Canvas 2D engine does it. */
  private rasterizeMark(): void {
    const img = new Image();
    img.src = this.markSrc;
    img.onload = () => {
      if (this.destroyed || this.failed || !this.worker) return;
      const w = MARK_WIDTH;
      const h = Math.max(1, Math.round((MARK_WIDTH * img.height) / img.width));
      const oc = document.createElement("canvas");
      oc.width = w;
      oc.height = h;
      const o = oc.getContext("2d", { willReadFrequently: true })!;
      o.drawImage(img, 0, 0, w, h);
      const cloud = cloudFromPixels(o.getImageData(0, 0, w, h).data, w, h);
      if (!cloud) return;
      this.worker.postMessage({ type: "cloud", cloud }, [cloud.pts.buffer]);
      this.markReady?.();
    };
  }

  scrub(t: number): void {
    this.playing = false;
    this.landedAt = 0;
    this.T = Math.min(1, Math.max(0, t));
    this.ouReset = true;
    // Mirrors the 2D engine: a scrub reports itself, but not before there is
    // a figure to report on (the resize observer's first call lands at boot).
    if (this.shown && !this.preview) this.onTick?.(this.T, false);
    this.wake();
  }

  setPointer(x: number, y: number, over: boolean): void {
    this.pointer.x = x;
    this.pointer.y = y;
    this.pointer.over = over;
    this.wake();
  }

  /* ------------------------------------------------------------ main loop */

  wake(): void {
    if (!this.raf && !this.destroyed && this.visible && this.shown) {
      this.raf = requestAnimationFrame(this.frame);
    }
  }

  private settled(): boolean {
    return !this.playing && this.T >= 1 && !this.preview && !this.reduced;
  }

  private frame = (now: number): void => {
    this.raf = 0;
    if (this.destroyed || !this.shown || !this.visible) {
      this.lastFrame = 0;
      return;
    }
    const dt = now - this.lastFrame;
    if (this.lastFrame && dt > 2 && dt < 100) this.frameMs += (dt - this.frameMs) * 0.1;
    this.lastFrame = now;
    if (this.playing) {
      // A frame's timestamp can precede the performance.now() the clock
      // started from, hence the floor.
      this.T = Math.min(1, Math.max(0, (now - this.t0) / this.duration));
      if (this.T >= 1) {
        this.playing = false;
        this.landedAt = now;
        this.requestSpare();
      }
      this.onTick?.(this.T, this.playing);
    }
    if (this.render(now)) this.raf = requestAnimationFrame(this.frame);
    else this.lastFrame = 0;
  };

  private haloAt(now: number): number {
    const k = cssEase((now - this.haloT0) / this.haloDur);
    return this.haloFrom + (this.haloGoal - this.haloFrom) * k;
  }

  /** Draw one frame. Returns whether another one is needed. */
  private render(now: number): boolean {
    const gl = this.gl;
    const s = this.shown;
    if (!gl || !s || this.failed) return false;
    const e = this.T;
    const formed = !this.playing && e >= 1 && !this.preview;
    const settled = formed && !this.reduced;

    // Halo: surges in over 260 ms at landing and stays; fades out when a
    // transport starts (300 ms) or the scrubber pulls the figure apart (220).
    const goal = formed ? 1 : 0;
    if (goal !== this.haloGoal) {
      this.haloFrom = this.haloAt(now);
      this.haloGoal = goal;
      this.haloT0 = now;
      this.haloDur = formed ? 260 : this.playing ? 300 : 220;
    }
    const halo = this.haloLit || formed ? this.haloAt(now) : 0;
    const haloMoving = now - this.haloT0 < this.haloDur;

    let mix = 0;
    if (settled) {
      if (this.ouReset) this.resetDynamics(now);
      // Fixed timestep; a long gap (hidden tab, scrolled away) is not
      // replayed, the clock just restarts.
      if (now - this.lastStep > 250) this.lastStep = now - OU_MS;
      let budget = 2;
      while (now - this.lastStep >= OU_MS && budget-- > 0) {
        this.step(now);
        this.lastStep += OU_MS;
      }
      mix = Math.min(1, Math.max(0, (now - this.lastStep) / OU_MS));
    }
    const prev = 1 - this.cur;
    const pointer = this.pointer.over && settled ? 1 : 0;

    // Trails. In flight: the last `cap` frames of each straight path, which
    // keeps collapsing into the grain for that long after landing.
    const cap = this.phone ? 14 : 24;
    const span = (cap * this.frameMs) / this.duration;
    const clock = this.playing ? e : this.landedAt ? 1 + (now - this.landedAt) / this.duration : -1;
    const flight = !this.reduced && !this.preview && clock >= 0 && clock - span < 1;
    if (!flight) this.landedAt = 0; // the last tail has caught up with its grain
    const anyTrail = flight || settled;

    const place = (p: Program, px: number): void => {
      gl.useProgram(p.prog);
      gl.uniform2f(p.u.uRes, this.W, this.H);
      gl.uniform1f(p.u.uPx, px);
      gl.uniform1f(p.u.uE, e);
      gl.uniform1f(p.u.uSettled, settled ? 1 : 0);
      gl.uniform1f(p.u.uMix, mix);
      gl.uniform3f(p.u.uPointer, this.pointer.x, this.pointer.y, pointer);
    };

    /* ---- halo mask: pool discs, blur, threshold, wider blur. Refreshed
       only while the figure is formed; a fading halo keeps its last shape. */
    if (formed) {
      gl.viewport(0, 0, this.maskW, this.maskH);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.mask[0].fbo);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.blendEquation(gl.MAX);
      place(this.disc, MASK_SCALE);
      gl.uniform2f(this.disc.u.uRadius, 0, POOL_R);
      gl.uniform4fv(this.disc.u.uTint, ONES);
      gl.bindVertexArray(this.vaoPool[prev]);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, Math.ceil(s.n / 4));
      gl.disable(gl.BLEND);
      gl.useProgram(this.blur.prog);
      gl.bindVertexArray(this.vaoScreen);
      gl.activeTexture(gl.TEXTURE0);
      // The aura is narrower on phones, as the lite filter's was.
      const aura = (this.phone ? 6 : 13) * MASK_SCALE;
      const passes: [number, number, number, number, number, number][] = [
        [0, 1, 1 / this.maskW, 0, 3.2 * MASK_SCALE, 0],
        [1, 0, 0, 1 / this.maskH, 3.2 * MASK_SCALE, 0],
        [0, 1, 1 / this.maskW, 0, aura, 1],
        [1, 2, 0, 1 / this.maskH, aura, 0],
      ];
      for (const [src, dst, dx, dy, sigma, cut] of passes) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.mask[dst].fbo);
        gl.bindTexture(gl.TEXTURE_2D, this.mask[src].tex);
        gl.uniform2f(this.blur.u.uDir, dx, dy);
        gl.uniform1f(this.blur.u.uSigma, sigma);
        gl.uniform1f(this.blur.u.uCut, cut);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      gl.enable(gl.BLEND);
      this.haloLit = true;
    }

    /* ---- ribbon coverage, one channel per tier. MAX blending makes each
       tier a union, as a single stroked path was: overlaps do not stack. */
    if (anyTrail) {
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.trail!.fbo);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.blendEquation(gl.MAX);
      place(this.ribbon, this.dpr);
      const tier = (g: number): void => {
        gl.uniform4f(this.ribbon.u.uTier, g === 0 ? 1 : 0, g === 1 ? 1 : 0, g === 2 ? 1 : 0, 1);
        gl.uniform1f(this.ribbon.u.uHalf, TIER_HALF[g]);
        gl.uniform1f(this.ribbon.u.uHalfPx, TIER_HALF[g] * this.dpr);
      };
      if (flight) {
        // Tier boundaries in frames, as the 2D ribbon split its samples.
        const seg = Math.ceil(cap / 3);
        const cuts = [0, (seg - 1) / (cap - 1), (2 * seg - 1) / (cap - 1), 1];
        gl.uniform1i(this.ribbon.u.uMode, 0);
        gl.bindVertexArray(this.vaoFlight);
        for (let g = 0; g < 3; g++) {
          tier(g);
          gl.uniform2f(this.ribbon.u.uSpan, clock - cuts[g] * span, clock - cuts[g + 1] * span);
          gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.rows);
        }
      }
      if (settled) {
        gl.bindVertexArray(this.vaoRest[prev]);
        for (let j = 0; j < HISTORY; j++) {
          tier(j < 3 ? 0 : j < 6 ? 1 : 2);
          gl.uniform1i(this.ribbon.u.uMode, j === 0 ? 1 : 2);
          const slot = (k: number) => this.history[(this.histHead - k + HISTORY * 2) % HISTORY];
          if (j > 0) this.attr(5, slot(j - 1), 2, 0, 0, 1);
          this.attr(6, slot(j), 2, 0, 0, 1);
          gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.rows);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
      }
    }

    /* ---- the frame itself */
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // In flight: a translucent white sheen under the grains, one union.
    if (this.playing) {
      gl.blendEquation(gl.MAX);
      place(this.disc, this.dpr);
      gl.uniform2f(this.disc.u.uRadius, 0, SHEEN_R);
      gl.uniform4fv(this.disc.u.uTint, HALVES);
      gl.bindVertexArray(this.vaoSheen);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, Math.ceil(s.n / 8));
    }
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const ring = s.stats && !this.preview ? (this.darkGround ? 0.12 : 0.07) * e : 0;
    if (halo > 0 || anyTrail || ring > 0) {
      const c = this.compose;
      gl.useProgram(c.prog);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.mask[0].tex);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.mask[2].tex);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, this.trail!.tex);
      gl.uniform1f(c.u.uHalo, halo);
      gl.uniform1f(c.u.uTrailOn, anyTrail ? 1 : 0);
      gl.uniform3f(c.u.uTrailColor, this.tint[4], this.tint[5], this.tint[6]);
      gl.uniform1f(c.u.uPx, this.dpr);
      if (s.stats) {
        gl.uniform4f(c.u.uRing, s.stats.cx * this.dpr, (this.H - s.stats.cy) * this.dpr, s.stats.sigma * this.dpr, 0);
      }
      if (this.darkGround) gl.uniform4f(c.u.uRingColor, 234 / 255, 240 / 255, 246 / 255, ring);
      else gl.uniform4f(c.u.uRingColor, 0, 39 / 255, 76 / 255, ring);
      gl.bindVertexArray(this.vaoScreen);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.activeTexture(gl.TEXTURE0);
    }

    place(this.disc, this.dpr);
    gl.uniform2f(this.disc.u.uRadius, 1, 0);
    gl.uniform4fv(this.disc.u.uTint, this.tint);
    gl.bindVertexArray(this.vaoGrain[prev]);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, s.n);
    gl.bindVertexArray(null);

    return this.playing || settled || haloMoving || flight;
  }

  /* ------------------------------------------------------------- dynamics */

  private feedback(vao: WebGLVertexArrayObject, into: WebGLBuffer, count: number): void {
    const gl = this.gl!;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, into);
    gl.enable(gl.RASTERIZER_DISCARD);
    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, count);
    gl.endTransformFeedback();
    gl.disable(gl.RASTERIZER_DISCARD);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
  }

  private simulate(now: number, reset: boolean, src: number): void {
    const gl = this.gl!;
    const d = now * 0.00045; // slow clock for the drift field
    const tau = Math.PI * 2;
    gl.useProgram(this.sim.prog);
    gl.uniform4f(this.sim.u.uPhase, (1.4 * d) % tau, (-0.9 * d) % tau, (-1.2 * d) % tau, (1.1 * d) % tau);
    gl.uniform1ui(this.sim.u.uEpoch, this.epoch);
    gl.uniform1f(this.sim.u.uReset, reset ? 1 : 0);
    this.feedback(this.vaoSim[src], this.state[1 - src], this.shown!.n);
  }

  private record(): void {
    this.histHead = (this.histHead + 1) % HISTORY;
    this.gl!.useProgram(this.hist.prog);
    this.feedback(this.vaoHist[this.cur], this.history[this.histHead], this.rows);
  }

  /** Zero offsets and seeded velocities, so the shimmer and its ribbons
      start moving at once instead of spinning up from rest. */
  private resetDynamics(now: number): void {
    this.epoch++;
    this.simulate(now, true, 0);
    this.simulate(now, true, 1);
    this.cur = 1;
    for (let i = 0; i < HISTORY; i++) this.record();
    this.steps = 0;
    this.lastStep = now;
    this.ouReset = false;
  }

  private step(now: number): void {
    this.epoch++;
    this.simulate(now, false, this.cur);
    this.cur = 1 - this.cur;
    if (++this.steps % RECORD_EVERY === 0) this.record();
  }

  /** Run every pass once into its offscreen target while the page is still
      settling, so no pipeline is compiled on the frame the M lands. */
  private warmPipelines(): void {
    const keep = { T: this.T, playing: this.playing, preview: this.preview, goal: this.haloGoal };
    this.T = 1;
    this.playing = false;
    this.preview = false;
    const reduced = this.reduced;
    this.reduced = false;
    this.haloGoal = 1;
    this.render(performance.now());
    this.reduced = reduced;
    this.T = keep.T;
    this.playing = keep.playing;
    this.preview = keep.preview;
    this.haloGoal = keep.goal;
    this.haloFrom = 0;
    this.haloT0 = 0;
    this.haloLit = false;
    this.ouReset = true;
    // The warm frame showed the figure landed; it must never reach the screen.
    const gl = this.gl!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  /* -------------------------------------------------------------- failure */

  private onLost = (ev: Event): void => {
    ev.preventDefault();
    this.fail("context lost");
  };

  private fail(reason: string): void {
    if (this.failed || this.destroyed) return;
    this.failed = true;
    this.destroy();
    this.onFail?.(reason);
  }

  destroy(): void {
    this.destroyed = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    window.clearTimeout(this.noiseTimer);
    window.clearTimeout(this.replanTimer);
    this.canvas.removeEventListener("webglcontextlost", this.onLost);
    this.worker?.terminate();
    this.worker = null;
    const gl = this.gl;
    if (gl && !gl.isContextLost()) {
      for (const b of [this.quad, this.planBuf, ...this.state, ...this.history]) gl.deleteBuffer(b);
      for (const t of [...this.mask, this.trail]) {
        if (t) {
          gl.deleteTexture(t.tex);
          gl.deleteFramebuffer(t.fbo);
        }
      }
      for (const p of [this.disc, this.ribbon, this.sim, this.hist, this.blur, this.compose]) {
        gl.deleteProgram(p.prog);
      }
    }
    this.gl = null;
    this.shown = null;
  }
}

const ONES = new Float32Array(16).fill(1);
const HALVES = new Float32Array(16).fill(0.5);
