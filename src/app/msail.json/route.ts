import { siteData } from "@/lib/agent-index";

// Rendered once at `next build` into out/msail.json by the static export.
// GitHub Pages serves it with Access-Control-Allow-Origin: *, so agents and
// tools on any origin can fetch it.
export const dynamic = "force-static";

export function GET() {
  return new Response(`${JSON.stringify(siteData(), null, 2)}\n`, {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
