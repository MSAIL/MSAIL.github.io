import { markdownResponse } from "@/lib/agent-index";

// This page as Markdown at /constitution/index.html.md (the llms.txt convention), written at build time.
export const dynamic = "force-static";

export function GET() {
  return markdownResponse("constitution");
}
