/**
 * The WebMCP tool names, in one place: the tools are typed against this list
 * (agent-tools-impl.ts) and the agent files advertise it (agent-index.ts).
 * Kept free of imports so the client chunk that registers the tools stays tiny.
 */
export const AGENT_TOOL_NAMES = [
  "msail_join",
  "msail_initiatives",
  "msail_search_talks",
  "msail_leadership",
  "msail_resources",
] as const;

export type AgentToolName = (typeof AGENT_TOOL_NAMES)[number];
