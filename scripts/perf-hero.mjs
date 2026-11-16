#!/usr/bin/env node
/**
 * perf-hero: trace-based measurements of the homepage hero figure.
 *
 * Drives a Chrome that is already running with --remote-debugging-port over
 * the DevTools Protocol (no dependencies: Node 22+ ships WebSocket and fetch),
 * loads the page in a fresh isolated context, records a performance trace
 * through the load, the transport and a stretch of rest, and reads every
 * number out of the trace:
 *
 *   frames     presented-frame intervals (compositor DrawFrame) and the
 *              main-thread cost of each animation frame, for the transport
 *              and for rest, median / p95 / max
 *   busy       main-thread and GPU-process busy share in each phase
 *   boot       main-thread time inside the engine's boot functions, from the
 *              trace's CPU profile (inclusive time by function name)
 *   load       long tasks (> 50 ms) before the transport starts
 *
 * The only things injected into the page are an attribute observer that turns
 * the engine's own data-m-forming flips into performance.mark() calls, so the
 * phases can be located on the trace clock (it fires twice per load), and a
 * counter of real mouse moves, so a run the cursor wandered into is redone.
 *
 * Usage:
 *   node scripts/perf-hero.mjs --url http://localhost:4273/ --label gl \
 *        [--runs 3] [--configs desktop-1x,desktop-4x,phone-1x,phone-4x] \
 *        [--out results.json] [--port 9222] [--keep-trace dir]
 *
 * The window it opens must keep producing frames. Chrome stops drawing a
 * window that is covered or in the background, so point this at a Chrome
 * started for the purpose, which also keeps your own tabs out of the trace:
 *
 *   open -g -n -a "Google Chrome" --args --remote-debugging-port=9333 \
 *     --user-data-dir=/tmp/perf-chrome --no-first-run \
 *     --disable-backgrounding-occluded-windows --disable-renderer-backgrounding \
 *     --disable-background-timer-throttling \
 *     --disable-features=CalculateNativeWinOcclusion,MacWebContentsOcclusion
 *   node scripts/perf-hero.mjs --port 9333 ...
 *
 * The script refuses to report numbers from a window that says it is hidden.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { gzipSync } from "node:zlib";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith("--")) acc.push([a.slice(2), all[i + 1]?.startsWith("--") ? "1" : (all[i + 1] ?? "1")]);
    return acc;
  }, []),
);
const URL_ = args.url ?? "http://localhost:4273/";
const LABEL = args.label ?? "run";
const RUNS = Number(args.runs ?? 3);
const PORT = Number(args.port ?? 9222);
const REST_MS = Number(args.rest ?? 5000);
const DURATION = 2800; // engine.duration: the transport's wall-clock length
const GLASS_RELEASE = 700; // data-m-forming goes false this long after landing

const CONFIGS = {
  "desktop-1x": { width: 1440, height: 900, dpr: 2, mobile: false, cpu: 1 },
  "desktop-4x": { width: 1440, height: 900, dpr: 2, mobile: false, cpu: 4 },
  "phone-1x": { width: 390, height: 844, dpr: 3, mobile: true, cpu: 1 },
  "phone-4x": { width: 390, height: 844, dpr: 3, mobile: true, cpu: 4 },
  // Same phone box with an iPhone user agent: the Canvas 2D engine picks its
  // WebKit halo path (in-canvas bloom) from the UA, so this measures the code
  // iOS runs, in Chromium's engine. It is not a measurement of Safari.
  "phone-ios-ua-4x": {
    width: 390, height: 844, dpr: 3, mobile: true, cpu: 4,
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  },
};
const wanted = (args.configs ?? "desktop-1x,desktop-4x,phone-1x,phone-4x").split(",");

/* Functions whose inclusive main-thread time counts as "engine boot": the
   two engines' setup methods, and the mark image's onload handler, where the
   Canvas 2D engine decodes and reads back the Block M. The names are class
   methods and property assignments, so they survive minification. */
const BOOT_FUNCS = (args.boot ??
  "setDataset,sample,pair,recolor,resetDynamics,buildCSR,computeNoiseStats,loadMark,onload," +
  "initGL,startProgram,finishPrograms,programsReady,applyPlan,receivePlan,requestPlan,whenCompiled," +
  "warmPipelines,allocGrains,allocTargets,currentPositions,targetPoints,markDone,rasterizeMark").split(",");

/* ------------------------------------------------------------------ CDP */
class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.handlers = new Set();
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(`${msg.error.message} ${msg.error.data ?? ""}`));
        else resolve(msg.result);
      } else for (const h of this.handlers) h(msg);
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params, sessionId }));
    });
  }
  on(fn) {
    this.handlers.add(fn);
    return () => this.handlers.delete(fn);
  }
  once(method, sessionId, timeout = 60000) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => { off(); reject(new Error(`timeout waiting for ${method}`)); }, timeout);
      const off = this.on((m) => {
        if (m.method === method && (!sessionId || m.sessionId === sessionId)) {
          clearTimeout(t); off(); resolve(m.params);
        }
      });
    });
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MARKER = `(() => {
  // A real mouse over the window makes either engine draw the cursor repel
  // at full rate; count the moves so such a run can be thrown away.
  window.__heroPointer = 0;
  addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") window.__heroPointer++; }, { capture: true, passive: true });
  const mark = () => performance.mark("hero:forming:" + document.documentElement.dataset.mForming);
  // <html> does not exist yet when this runs, so watch from the document;
  // the attribute filter keeps every other mutation from queueing a record.
  new MutationObserver(mark).observe(document, { attributes: true, subtree: true, attributeFilter: ["data-m-forming"] });
})();`;

const CATEGORIES = [
  "devtools.timeline",
  "disabled-by-default-devtools.timeline",
  "disabled-by-default-devtools.timeline.frame",
  "blink.user_timing",
  "loading",
  "v8.execute",
  "disabled-by-default-v8.cpu_profiler",
  "gpu",
  "toplevel",
];

/* --------------------------------------------------------------- analysis */
const q = (sorted, p) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] : null);
function dist(values) {
  const s = [...values].sort((a, b) => a - b);
  return { n: s.length, median: q(s, 0.5), p95: q(s, 0.95), max: s.length ? s[s.length - 1] : null };
}
const r2 = (x) => (x == null ? null : Math.round(x * 100) / 100);

function analyse(events, frameId) {
  const meta = events.filter((e) => e.ph === "M");
  const threadName = new Map();
  const procName = new Map();
  for (const m of meta) {
    if (m.name === "thread_name") threadName.set(`${m.pid}:${m.tid}`, m.args.name);
    if (m.name === "process_name") procName.set(m.pid, m.args.name);
  }
  // The renderer main thread is wherever our marks were emitted.
  const marks = events.filter((e) => e.cat?.includes("blink.user_timing") && e.name?.startsWith("hero:forming:"));
  const formTrue = marks.find((e) => e.name === "hero:forming:true");
  const formFalse = marks.filter((e) => e.name === "hero:forming:false").pop();
  if (!formTrue || !formFalse) return { error: "transport marks missing (figure never formed?)" };
  const pid = formFalse.pid;
  const tid = formFalse.tid;
  const nav = events
    .filter((e) => e.name === "navigationStart" && e.pid === pid && (!frameId || e.args?.frame === frameId))
    .pop();
  const navTs = nav ? nav.ts : formTrue.ts;

  const landTs = formFalse.ts - GLASS_RELEASE * 1000;
  const phases = {
    transport: [landTs - (DURATION - 100) * 1000, landTs - 100 * 1000],
    rest: [formFalse.ts + 800 * 1000, formFalse.ts + (800 + REST_MS) * 1000],
  };
  const lastTs = events.reduce((m, e) => (e.ts > m ? e.ts : m), 0);
  if (lastTs < phases.rest[1]) return { error: "trace ended before the rest window did" };
  const bootEnd = landTs - DURATION * 1000;

  const inWin = (e, [a, b]) => e.ts >= a && e.ts < b;
  const main = events.filter((e) => e.pid === pid && e.tid === tid && e.ph === "X");
  const tasks = main.filter((e) => e.name === "RunTask");
  const gpuPid = [...procName].find(([, n]) => n === "GPU Process")?.[0];
  const gpuMainTid = [...threadName].find(([k, n]) => k.startsWith(`${gpuPid}:`) && n === "CrGpuMain")?.[0].split(":")[1];
  const gpuTasks = events.filter(
    (e) => e.ph === "X" && e.pid === gpuPid && String(e.tid) === String(gpuMainTid) &&
      (e.name === "RunTask" || e.name === "ThreadControllerImpl::RunTask"),
  );
  const draws = events
    .filter((e) => e.name === "DrawFrame" && e.pid === pid)
    .map((e) => e.ts)
    .sort((a, b) => a - b);
  const dropped = events.filter((e) => e.name === "DroppedFrame" && e.pid === pid);

  const out = { phases: {} };
  for (const [name, win] of Object.entries(phases)) {
    const secs = (win[1] - win[0]) / 1e6;
    const d = draws.filter((t) => t >= win[0] && t < win[1]);
    const intervals = d.slice(1).map((t, i) => (t - d[i]) / 1000);
    const raf = main.filter((e) => e.name === "FireAnimationFrame" && inWin(e, win)).map((e) => e.dur / 1000);
    const busy = tasks.filter((e) => inWin(e, win)).reduce((s, e) => s + e.dur, 0) / 1e6;
    const gpuBusy = gpuTasks.filter((e) => inWin(e, win)).reduce((s, e) => s + e.dur, 0) / 1e6;
    const fi = dist(intervals);
    const rf = dist(raf);
    out.phases[name] = {
      fps: r2(d.length / secs),
      frameIntervalMs: { median: r2(fi.median), p95: r2(fi.p95), max: r2(fi.max) },
      rafCallbackMs: { n: rf.n, median: r2(rf.median), p95: r2(rf.p95), max: r2(rf.max) },
      mainBusyPct: r2((busy / secs) * 100),
      gpuMainBusyPct: r2((gpuBusy / secs) * 100),
      droppedFrames: dropped.filter((e) => inWin(e, win)).length,
    };
  }

  // Long tasks from navigation to the first transport frame, and to landing.
  // Each is named after the largest piece of work inside it.
  const WORK = new Set([
    "EvaluateScript", "FunctionCall", "FireIdleCallback", "FireAnimationFrame", "EventDispatch",
    "TimerFire", "ParseHTML", "Layout", "UpdateLayoutTree", "Paint", "v8.compile", "RunMicrotasks",
  ]);
  const describe = (task) => {
    let best = null;
    for (const e of main) {
      if (e.ts < task.ts || e.ts + e.dur > task.ts + task.dur || !WORK.has(e.name)) continue;
      if (!best || e.dur > best.dur) best = e;
    }
    if (!best) return "other";
    const d = best.args?.data ?? {};
    const what = d.type ?? d.functionName ?? (d.url ? String(d.url).split("/").pop() : "");
    return what ? `${best.name}(${what})` : best.name;
  };
  const lt = (a, b) => {
    const long = tasks.filter((e) => e.ts >= a && e.ts < b && e.dur > 50000);
    return {
      count: long.length,
      maxMs: r2(Math.max(0, ...long.map((e) => e.dur)) / 1000),
      blockingMs: r2(long.reduce((s, e) => s + (e.dur - 50000), 0) / 1000),
      tasks: long.map((e) => `${r2(e.dur / 1000)}ms ${describe(e)}`),
    };
  };
  out.load = {
    navToTransportStartMs: r2((bootEnd - navTs) / 1000),
    longTasksBeforeTransport: lt(navTs, bootEnd),
    longTasksThroughLanding: lt(navTs, landTs + 300000),
  };

  // Boot attribution from the CPU profile (inclusive time per function name).
  const nodes = new Map();
  const samples = [];
  let cursor = 0;
  for (const e of events) {
    if (e.pid !== pid) continue;
    if (e.name === "Profile" && e.tid === tid) cursor = e.args.data.startTime;
  }
  const chunks = events
    .filter((e) => e.name === "ProfileChunk" && e.pid === pid)
    .sort((a, b) => a.ts - b.ts);
  // Only the main thread's profile: its Profile event carries the id.
  const profileIds = new Set(events.filter((e) => e.name === "Profile" && e.pid === pid && e.tid === tid).map((e) => e.id));
  for (const c of chunks) {
    if (profileIds.size && !profileIds.has(c.id)) continue;
    const cp = c.args.data.cpuProfile ?? {};
    for (const n of cp.nodes ?? []) nodes.set(n.id, { name: n.callFrame.functionName, url: n.callFrame.url, parent: n.parent });
    const ids = cp.samples ?? [];
    const deltas = c.args.data.timeDeltas ?? [];
    for (let i = 0; i < ids.length; i++) {
      cursor += deltas[i] ?? 0;
      samples.push([cursor, ids[i]]);
    }
  }
  const incl = Object.fromEntries(BOOT_FUNCS.map((f) => [f, 0]));
  let bootAny = 0;
  const landEnd = landTs;
  for (let i = 0; i + 1 < samples.length; i++) {
    const [ts, id] = samples[i];
    if (ts < navTs || ts >= landEnd) continue;
    const dt = samples[i + 1][0] - ts;
    if (dt > 50000) continue; // idle gap between samples, not CPU time
    const seen = new Set();
    for (let n = nodes.get(id); n; n = nodes.get(n.parent)) {
      const short = n.name.split(".").pop();
      if (short in incl) seen.add(short);
    }
    for (const s of seen) incl[s] += dt;
    if (seen.size) bootAny += dt;
  }
  out.boot = {
    engineBootMs: r2(bootAny / 1000),
    byFunction: Object.fromEntries(Object.entries(incl).filter(([, v]) => v > 0).map(([k, v]) => [k, r2(v / 1000)])),
    profileSamples: samples.length,
  };

  // Worker threads in the page's process: total busy time before landing.
  const workerTids = [...threadName]
    .filter(([k, n]) => k.startsWith(`${pid}:`) && /DedicatedWorker/.test(n))
    .map(([k]) => Number(k.split(":")[1]));
  if (workerTids.length) {
    const wt = events.filter(
      (e) => e.ph === "X" && e.pid === pid && workerTids.includes(e.tid) && e.name === "RunTask" && e.ts < landEnd,
    );
    out.boot.workerBusyMs = r2(wt.reduce((s, e) => s + e.dur, 0) / 1000);
  }
  return out;
}

/* ------------------------------------------------------------------- run */
async function traceOnce(cdp, session, cfg, url) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: cfg.width, height: cfg.height, deviceScaleFactor: cfg.dpr, mobile: cfg.mobile,
  }, session);
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: cfg.mobile }, session);
  await cdp.send("Emulation.setUserAgentOverride", { userAgent: cfg.ua ?? "" }, session).catch(() => {});
  await cdp.send("Page.navigate", { url: "about:blank" }, session);
  await sleep(300);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: cfg.cpu }, session);

  const events = [];
  const off = cdp.on((m) => {
    if (m.method === "Tracing.dataCollected") for (const e of m.params.value) events.push(e);
  });
  await cdp.send("Tracing.start", {
    transferMode: "ReportEvents",
    traceConfig: { recordMode: "recordAsMuchAsPossible", includedCategories: CATEGORIES },
  });
  const loaded = cdp.once("Page.loadEventFired", session, 60000);
  const { frameId } = await cdp.send("Page.navigate", { url }, session);
  await loaded;

  // Wait for the transport to land and the glass to release, then let the
  // rest window run. One cheap poll per 250 ms, none of it during rest.
  let landed = false;
  for (let i = 0; i < 160 && !landed; i++) {
    await sleep(250);
    const r = await cdp.send("Runtime.evaluate", {
      expression: "performance.getEntriesByName('hero:forming:false').length + '|' + document.visibilityState",
    }, session);
    const [n, vis] = String(r.result.value).split("|");
    if (vis !== "visible") throw new Error("the measurement window is not visible; frames are throttled");
    landed = Number(n) > 0;
  }
  if (!landed) throw new Error("the figure never landed");
  await sleep(800 + REST_MS + 400);

  const moved = await cdp.send("Runtime.evaluate", { expression: "window.__heroPointer" }, session);
  const done = cdp.once("Tracing.tracingComplete", undefined, 120000);
  await cdp.send("Tracing.end");
  await done;
  off();
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 }, session);
  return { events, frameId, pointerMoves: Number(moved.result.value) || 0 };
}

async function main() {
  const version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
  const ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
  const cdp = new CDP(ws);

  const { browserContextId } = await cdp.send("Target.createBrowserContext", { disposeOnDetach: true });
  const { targetId } = await cdp.send("Target.createTarget", {
    url: "about:blank", browserContextId, newWindow: true, width: 1500, height: 1040,
  });
  const { sessionId: session } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  const results = { label: LABEL, url: URL_, browser: version.Browser, when: new Date().toISOString(), configs: {} };
  try {
    await cdp.send("Page.enable", {}, session);
    await cdp.send("Runtime.enable", {}, session);
    await cdp.send("Network.enable", {}, session);
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true }, session);
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: MARKER }, session);
    await cdp.send("Page.bringToFront", {}, session);

    for (const name of wanted) {
      const cfg = CONFIGS[name];
      if (!cfg) throw new Error(`unknown config ${name}`);
      results.configs[name] = [];
      for (let run = 0, discarded = 0; run < RUNS; run++) {
        const { events, frameId, pointerMoves } = await traceOnce(cdp, session, cfg, URL_);
        if (pointerMoves > 0 && discarded < 4) {
          console.error(`${LABEL} ${name} #${run}: mouse moved over the window (${pointerMoves} events), run discarded`);
          discarded++;
          run--;
          continue;
        }
        const a = analyse(events, frameId);
        results.configs[name].push(a);
        if (args["keep-trace"]) {
          mkdirSync(args["keep-trace"], { recursive: true });
          writeFileSync(`${args["keep-trace"]}/${LABEL}-${name}-${run}.json.gz`, gzipSync(JSON.stringify({ traceEvents: events })));
        }
        const t = a.phases?.transport, r = a.phases?.rest;
        console.error(
          a.error
            ? `${LABEL} ${name} #${run}: ${a.error}`
            : `${LABEL} ${name} #${run}: transport ${t.fps}fps int ${t.frameIntervalMs.median}/${t.frameIntervalMs.p95} raf ${t.rafCallbackMs.median}/${t.rafCallbackMs.p95} | rest ${r.fps}fps int ${r.frameIntervalMs.median}/${r.frameIntervalMs.p95} raf ${r.rafCallbackMs.median}/${r.rafCallbackMs.p95} | boot ${a.boot.engineBootMs}ms | long ${a.load.longTasksBeforeTransport.count} (${a.load.longTasksBeforeTransport.blockingMs}ms blocking)`,
        );
      }
    }
  } finally {
    await cdp.send("Target.closeTarget", { targetId }).catch(() => {});
    await cdp.send("Target.disposeBrowserContext", { browserContextId }).catch(() => {});
    ws.close();
  }
  const json = JSON.stringify(results, null, 2);
  if (args.out) writeFileSync(args.out, json);
  else console.log(json);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
