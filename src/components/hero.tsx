import { FlowField } from "./flow-field";

/**
 * Homepage hero: the floating island nav, a soft prismatic light field (so
 * the glass has color to bend), and the Block M forming dead center with the
 * MSAIL wordmark beneath it.
 */
export function Hero() {
  return (
    <section className="relative -mt-20 flex h-[92svh] max-h-[1000px] min-h-[560px] flex-col">
      <div className="absolute inset-0">
        <FlowField
          className="h-full w-full"
          fitBox={{ x0: 0.08, y0: 0.09, x1: 0.92, y1: 0.78 }}
        />
      </div>

      {/* The full lockup, tight under the mark: MSAIL in the deco wordmark
          voice, the complete name immediately beneath it. The page's h1. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[4.5%] flex justify-center">
        <h1 className="flex flex-col items-center">
          <span className="wordmark-glass text-[2.75rem] font-black leading-none tracking-[0.02em] sm:text-[3.25rem]">
            MSAIL
          </span>
          <span className="mt-2 text-label font-medium tracking-[0.02em] text-ink-2">
            Michigan Student AI Lab
          </span>
        </h1>
      </div>
    </section>
  );
}
