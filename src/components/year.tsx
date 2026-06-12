"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * Copyright year that can't go stale. The static export bakes in the build-time
 * year (passed as `initial`, used as the server snapshot); after hydration the
 * visitor's own clock takes over — so the footer stays right even if the site
 * isn't rebuilt for a while.
 */
export function Year({ initial }: { initial: number }) {
  const year = useSyncExternalStore(
    subscribe,
    () => new Date().getFullYear(),
    () => initial,
  );
  return <>{year}</>;
}
