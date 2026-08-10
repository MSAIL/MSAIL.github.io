import { FlowField } from "./flow-field";

/**
 * Homepage hero: the floating island nav, a soft prismatic light field (so
 * the glass has color to bend), and the Block M forming dead center with the
 * MSAIL wordmark beneath it.
 */
export function Hero() {
  return (
    <section className="relative flex h-[92svh] max-h-[1000px] min-h-[560px] flex-col">
      <div className="absolute inset-0">
        <FlowField
          className="h-full w-full"
          fitBox={{ x0: 0.08, y0: 0.09, x1: 0.92, y1: 0.78 }}
          dark
        />
      </div>

      {/* The full lockup, tight under the mark: MSAIL in the deco wordmark
          voice, the complete name immediately beneath it. The page's h1. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[4.5%] flex justify-center">
        <div className="island-bob">
          {/* One line, not a stack: capsules flatter wide short content (the
              nav proves it), so the full name rides beside the wordmark. */}
          <h1 className="glass-island glass-island-ink island-sway flex items-baseline gap-3 rounded-full px-7 py-3 sm:gap-3.5 sm:px-9 sm:py-3.5">
            <span className="wordmark-glass-dark text-[1.75rem] font-black leading-none tracking-[0.02em] sm:text-[2.125rem]">
              MSAIL
            </span>
            <span className="text-label font-medium tracking-[0.02em] text-on-navy-muted">
              Michigan Student AI Lab
            </span>
          </h1>
        </div>
      </div>
    </section>
  );
}
