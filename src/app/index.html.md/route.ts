import { markdownResponse } from "@/lib/agent-index";

// The homepage as Markdown at /index.html.md (the llms.txt convention), written at build time.
export const dynamic = "force-static";

export function GET() {
  return markdownResponse("home");
}
