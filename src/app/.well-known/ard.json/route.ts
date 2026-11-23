import { ardManifest } from "@/lib/agent-index";

// The Agentic Resource Discovery manifest, written at build time.
export const dynamic = "force-static";

export function GET() {
  return new Response(`${JSON.stringify(ardManifest(), null, 2)}\n`, {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
