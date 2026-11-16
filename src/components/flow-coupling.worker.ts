/**
 * Worker entry for the hero figure. Everything here runs off the main
 * thread: rasterizing the Block M mark into a point cloud, sampling the
 * clouds, and computing the coupling (see flow-coupling.ts). It hands back
 * one packed buffer per transport. The only state it keeps is the mark's
 * point cloud.
 */
import { makePlan } from "./flow-coupling";
import { MARK_WIDTH, cloudFromPixels, type MarkCloud, type PlanRequest } from "./flow-shared";

type Incoming =
  | { type: "mark"; src: string }
  | { type: "cloud"; cloud: MarkCloud }
  | { type: "plan"; req: PlanRequest };

const scope = self as unknown as {
  onmessage: ((ev: MessageEvent<Incoming>) => void) | null;
  postMessage(message: unknown, transfer?: Transferable[]): void;
};

let cloud: MarkCloud | null = null;

/** Fetch and rasterize the mark here, so the page never decodes or reads it
    back (that first drawImage is the largest single task of the old boot).
    Returns null where a worker cannot do it: no OffscreenCanvas before
    Safari 16.4. The page then rasterizes it itself and sends the cloud. */
async function rasterizeMark(src: string): Promise<MarkCloud | null> {
  if (typeof OffscreenCanvas === "undefined" || typeof createImageBitmap === "undefined") return null;
  const res = await fetch(src);
  if (!res.ok) return null;
  const bmp = await createImageBitmap(await res.blob());
  const w = MARK_WIDTH;
  const h = Math.max(1, Math.round((MARK_WIDTH * bmp.height) / bmp.width));
  const ctx = new OffscreenCanvas(w, h).getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(bmp, 0, 0, w, h);
  return cloudFromPixels(ctx.getImageData(0, 0, w, h).data, w, h);
}

scope.onmessage = (ev) => {
  const msg = ev.data;
  if (msg.type === "mark") {
    rasterizeMark(msg.src)
      .catch(() => null)
      .then((c) => {
        cloud = c ?? cloud;
        scope.postMessage({ type: "mark", ok: c !== null });
      });
    return;
  }
  if (msg.type === "cloud") {
    cloud = msg.cloud;
    return;
  }
  const plan = makePlan(msg.req, cloud);
  scope.postMessage({ type: "plan", plan }, [plan.grains.buffer]);
};
