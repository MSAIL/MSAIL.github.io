"use client";

import { usePathname } from "next/navigation";

/**
 * Page transition. Re-mounting on pathname change replays the `rise` keyframe
 * (fade + 12px lift, expo-out), so content settles into place on every route
 * change. Chrome (header/footer) lives outside this wrapper and stays anchored.
 * Collapses to an instant swap under prefers-reduced-motion (see globals.css).
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="flex flex-1 flex-col motion-safe:animate-rise">
      {children}
    </div>
  );
}
