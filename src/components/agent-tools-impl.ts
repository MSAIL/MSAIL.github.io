import type { SiteData } from "@/lib/agent-index";

/**
 * The WebMCP tools themselves (see agent-tools.tsx). Every tool is read-only
 * and answers from /msail.json, the same generated file agents can fetch
 * directly, so the tools never disagree with the site.
 */

type TextResult = { content: { type: "text"; text: string }[] };

type AgentTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: { readOnlyHint: boolean };
  execute: (input: Record<string, unknown>) => Promise<TextResult>;
};

/** The draft has shipped both shapes: per-tool registration and a whole-context call. */
type ModelContext = {
  registerTool?: (tool: AgentTool) => unknown;
  unregisterTool?: (name: string) => unknown;
  provideContext?: (context: { tools: AgentTool[] }) => unknown;
  clearContext?: () => unknown;
};

let cache: Promise<SiteData> | null = null;
function load(): Promise<SiteData> {
  cache ??= fetch("/msail.json").then((r) => {
    if (!r.ok) throw new Error(`msail.json answered ${r.status}`);
    return r.json() as Promise<SiteData>;
  });
  // A failed fetch must not poison every later call.
  cache.catch(() => {
    cache = null;
  });
  return cache;
}

const reply = (value: unknown): TextResult => ({
  content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
});

const NO_INPUT = { type: "object", properties: {}, additionalProperties: false };
const READ_ONLY = { readOnlyHint: true };

const TOOLS: AgentTool[] = [
  {
    name: "msail_join",
    description:
      "How to join MSAIL, the Michigan Student AI Lab at the University of Michigan: the Slack invite link, the Maize Pages listing, Instagram, LinkedIn and the contact email. Any U-M student can join.",
    inputSchema: NO_INPUT,
    annotations: READ_ONLY,
    execute: async () => {
      const d = await load();
      return reply({ eligibility: d.eligibility, ...d.join });
    },
  },
  {
    name: "msail_initiatives",
    description:
      "This term's MSAIL projects, courses and reading groups: name, level, lead, meeting time, room with a walking-directions link, and related links.",
    inputSchema: NO_INPUT,
    annotations: READ_ONLY,
    execute: async () => reply((await load()).initiatives),
  },
  {
    name: "msail_search_talks",
    description:
      "Search MSAIL's archive of recorded talks (2020 to 2024) by words in the title or speaker name, optionally limited to one year. With no filters it returns every talk.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Words that must all appear in the title or speaker, case-insensitive.",
        },
        year: { type: "integer", description: "Only talks from this year, for example 2021." },
      },
      additionalProperties: false,
    },
    annotations: READ_ONLY,
    execute: async (input) => {
      const { talks } = await load();
      const words =
        typeof input.query === "string" ? input.query.toLowerCase().split(/\s+/).filter(Boolean) : [];
      const year = typeof input.year === "number" ? input.year : null;
      const items = talks.items.filter(
        (t) =>
          (year === null || t.year === year) &&
          words.every((w) => `${t.title} ${t.speaker}`.toLowerCase().includes(w)),
      );
      return reply({ note: talks.note, matches: items.length, items });
    },
  },
  {
    name: "msail_leadership",
    description:
      "MSAIL's current leadership team: names, roles, email addresses, and LinkedIn or personal sites where published.",
    inputSchema: NO_INPUT,
    annotations: READ_ONLY,
    execute: async () => reply((await load()).leadership),
  },
  {
    name: "msail_resources",
    description:
      "MSAIL's recommended courses and guides for learning AI: deep learning, computer vision, natural language processing and reinforcement learning.",
    inputSchema: NO_INPUT,
    annotations: READ_ONLY,
    execute: async () => reply((await load()).resources),
  },
];

/** Registers the tools and returns the matching cleanup. */
export function registerAgentTools(): () => void {
  const mc = (navigator as Navigator & { modelContext?: ModelContext }).modelContext;
  if (!mc) return () => {};

  if (typeof mc.registerTool === "function") {
    const registered: string[] = [];
    for (const tool of TOOLS) {
      try {
        mc.registerTool(tool);
        registered.push(tool.name);
      } catch {
        // Already registered by an earlier mount, or rejected by the agent.
      }
    }
    return () => {
      for (const name of registered) {
        try {
          mc.unregisterTool?.(name);
        } catch {
          // The agent may already have dropped it.
        }
      }
    };
  }

  if (typeof mc.provideContext === "function") {
    mc.provideContext({ tools: TOOLS });
    return () => {
      try {
        mc.clearContext?.();
      } catch {
        // Nothing to clear.
      }
    };
  }

  return () => {};
}
