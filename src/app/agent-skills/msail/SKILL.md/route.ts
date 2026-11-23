import { skillMarkdown } from "@/lib/agent-index";

// The MSAIL Agent Skill, written at build time; listed in /.well-known/ard.json.
export const dynamic = "force-static";

export function GET() {
  return new Response(skillMarkdown(), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
