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
      <div className={`island-panel ${open ? "island-open" : ""}`}>
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
              <p className="max-w-prose text-body text-ink-2">
                The M is a live <strong>rectified flow</strong>, the core trick
                behind modern image generators. Three steps:
              </p>
              <ol className="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-3">
                <li className="border-t border-border pt-4">
                  <h3 className="text-h4 text-navy">1. Start with static.</h3>
                  <p className="mt-2 text-body text-ink-2">
                    Every dot is dropped at random. Pure noise: no pattern, no M.
                  </p>
                  <p className="mt-3 text-meta text-ink-3">x₀ ~ N(0, I)</p>
                </li>
                <li className="border-t border-border pt-4">
                  <h3 className="text-h4 text-navy">2. Give each dot an address.</h3>
                  <p className="mt-2 text-body text-ink-2">
                    The M is just a cloud of points. Each noise dot gets matched
                    to one. Nearby dots get nearby addresses, so the paths
                    don&apos;t tangle.
                  </p>
                  <p className="mt-3 text-meta text-ink-3">coupling: optimal transport</p>
                </li>
                <li className="border-t border-border pt-4">
                  <h3 className="text-h4 text-navy">3. Walk straight there.</h3>
                  <p className="mt-2 text-body text-ink-2">
                    Slide t from 0 to 1 and every dot walks a straight line to
                    its address. Noise becomes the M.
                  </p>
                  <p className="mt-3 text-meta text-ink-3">x_t = (1 − t)·x₀ + t·x₁</p>
                </li>
              </ol>
              <p className="mt-8 max-w-prose text-body text-ink-2">
                Image generators like Stable Diffusion 3 and Flux run exactly
                this recipe, with billions of dimensions instead of two and
                &quot;a photo of a dog&quot; instead of the M. Once the M
                settles, the gentle jiggling is Langevin dynamics: tiny random
                kicks that keep the dots distributed like the real thing
                instead of frozen in place.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
