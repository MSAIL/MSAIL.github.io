"use client";

import { useEffect } from "react";

/**
 * Offers in-browser AI agents a few read-only tools through WebMCP (the W3C
 * Web Machine Learning community group's draft, github.com/webmachinelearning/webmcp).
 * An agent driving the page can call them instead of scraping the DOM.
 *
 * Chrome exposes the API as document.modelContext (157, behind the
 * enable-webmcp-testing flag); earlier drafts and polyfills put it on
 * navigator. Browsers with neither return on the first line, and the tool
 * code is a separate chunk fetched only when the API exists, so ordinary
 * visitors download nothing extra.
 */
export function AgentTools() {
  useEffect(() => {
    if (!("modelContext" in document) && !("modelContext" in navigator)) return;
    let cancelled = false;
    let dispose: (() => void) | undefined;
    import("./agent-tools-impl").then((m) => {
      if (!cancelled) dispose = m.registerAgentTools();
    });
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);
  return null;
}
