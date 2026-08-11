"use client";

import { useState } from "react";

/**
 * The homepage explainer, folded into a liquid-glass island. Collapsed, it is
 * a single quiet capsule asking the question; clicked, it unfolds into the
 * full three-step walkthrough of the hero's rectified flow. Height and corner
 * radius animate; prefers-reduced-motion collapses the transition to a swap.
 */
export function ExplainerIsland() {
  const [open, setOpen] = useState(false);

  return (
    <section className="container-page flex flex-col items-center py-section-sm sm:py-section">
      {/* Fixed-height slot: the panel expands absolutely, floating over the
          dusk dissolve and the content below instead of shoving the page
          down. The slot height matches the collapsed capsule, so closed and
          open cost the page the same layout. */}
      <div className="relative z-10 h-[3.6rem] w-full max-w-[46rem]">
        <div
          className={`island-panel island-panel-ink absolute inset-x-0 top-0 ${open ? "island-open" : ""}`}
        >
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="island-trigger"
        >
          <span>What&apos;s happening up there?</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className={`island-chevron ${open ? "island-chevron-open" : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        <div className="island-body">
          <div className="island-inner">
            <div className="px-6 pb-7 pt-1 text-left sm:px-9">
              <p className="max-w-prose text-body text-on-navy-muted">
                The M is a live <strong className="text-on-navy">rectified flow</strong>, the
                sampler inside Stable Diffusion 3 and Flux. Random dots are
                matched to spots in the M by optimal transport, then each walks
                its straight line: x_t = (1 − t)·x₀ + t·x₁. The shimmer after
                it lands is Langevin noise keeping the dots alive.
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
