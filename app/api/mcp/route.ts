import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

import {
  BUDGET_GUIDANCE,
  LIMITS,
  LedgerError,
  createProject,
  formatCount,
  getHandoffSummary,
  isAuthorizedRequest,
  logDecision,
  logProgress,
  recordBudget,
  unauthorizedResponse,
} from "@/lib/ledger";
import { rateLimit } from "@/lib/rate-limit";

import type { CallToolResult } from "@modelcontextprotocol/server";

export const runtime = "nodejs";

const ok = (text: string): CallToolResult => ({ content: [{ type: "text", text }] });

const failed = (error: unknown): CallToolResult => {
  if (error instanceof LedgerError) {
    return {
      content: [{ type: "text", text: `Error (${error.code}): ${error.message}` }],
      isError: true,
    };
  }

  console.error("[context-ledger] tool call failed", error);
  return {
    content: [
      {
        type: "text",
        text: "Error (internal_error): the ledger store could not be reached. Try again in a moment.",
      },
    ],
    isError: true,
  };
};

const projectId = z.string().min(1).max(LIMITS.projectId).describe("Project id returned by create_project.");

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "create_project",
      {
        title: "Create project",
        description:
          "Start a project in the Context Ledger. Call this first — it returns the project_id that every other tool needs.",
        inputSchema: z.object({
          name: z.string().min(1).max(LIMITS.name).describe("Short project name."),
          goal: z.string().min(1).max(LIMITS.goal).describe("What this project is trying to achieve."),
        }),
      },
      async ({ name, goal }) => {
        try {
          const project = await createProject({ name, goal });
          return ok(
            `Created project "${project.name}" (id: ${project.id}).\nGoal: ${project.goal}\nPass this id to log_decision, log_progress, check_budget and get_handoff_summary.`,
          );
        } catch (error) {
          return failed(error);
        }
      },
    );

    server.registerTool(
      "log_decision",
      {
        title: "Log decision",
        description:
          "Record a decision and the reason behind it, so the next session knows why things are the way they are.",
        inputSchema: z.object({
          project_id: projectId,
          decision: z.string().min(1).max(LIMITS.decision).describe("The decision that was made."),
          reason: z.string().min(1).max(LIMITS.reason).describe("Why it was made."),
        }),
      },
      async ({ project_id, decision, reason }) => {
        try {
          const { project, entry } = await logDecision({ project_id, decision, reason });
          return ok(
            `Logged decision for "${project.name}".\nDecision: ${entry.text}\nReason: ${entry.reason}\nEntries recorded: ${project.entries.length}.`,
          );
        } catch (error) {
          return failed(error);
        }
      },
    );

    server.registerTool(
      "log_progress",
      {
        title: "Log progress",
        description:
          "Record what you just built. Add what broke and what should happen next so the handoff stays complete.",
        inputSchema: z.object({
          project_id: projectId,
          built: z.string().min(1).max(LIMITS.progress).describe("What was built or finished."),
          broken: z
            .string()
            .max(LIMITS.progress)
            .optional()
            .describe("Something that is broken or unresolved, if any."),
          next: z.string().max(LIMITS.progress).optional().describe("What should happen next, if known."),
        }),
      },
      async ({ project_id, built, broken, next }) => {
        try {
          const { project, entries } = await logProgress({ project_id, built, broken, next });
          const recorded = entries.map((entry) => `- ${entry.type}: ${entry.text}`).join("\n");
          return ok(
            `Logged progress for "${project.name}".\n${recorded}\nEntries recorded: ${project.entries.length}.`,
          );
        } catch (error) {
          return failed(error);
        }
      },
    );

    server.registerTool(
      "check_budget",
      {
        title: "Check budget",
        description:
          "Check token usage against the project's token limit. Returns the percent used and the action to take: continue below 80%, warn at 80-89%, stop_and_summarize at 90% or more.",
        inputSchema: z.object({
          project_id: projectId,
          tokens_used: z.number().int().min(0).describe("Tokens used so far."),
          token_limit: z.number().int().min(1).describe("The token budget for this project."),
        }),
      },
      async ({ project_id, tokens_used, token_limit }) => {
        try {
          const { project, snapshot } = await recordBudget({ project_id, tokens_used, token_limit });
          return ok(
            `Budget for "${project.name}": ${snapshot.percent}% of ${formatCount(snapshot.token_limit)} tokens (${formatCount(snapshot.tokens_used)} / ${formatCount(snapshot.token_limit)}).\nAction: ${snapshot.action} — ${BUDGET_GUIDANCE[snapshot.action]}.\nThresholds: continue below 80%, warn 80-89%, stop_and_summarize at 90% or more.`,
          );
        } catch (error) {
          return failed(error);
        }
      },
    );

    server.registerTool(
      "get_handoff_summary",
      {
        title: "Get handoff summary",
        description:
          "Get a markdown handoff for the project: what it started with, what was built, decisions, what to fix next, what to build next and the budget status.",
        inputSchema: z.object({
          project_id: projectId,
        }),
      },
      async ({ project_id }) => {
        try {
          const { summary } = await getHandoffSummary(project_id);
          return ok(summary);
        } catch (error) {
          return failed(error);
        }
      },
    );
  },
  { serverInfo: { name: "context-ledger", version: "1.0.0" } },
);

async function handleRequest(request: Request): Promise<Response> {
  const rateLimited = await rateLimit(request, { limit: 60, prefix: "mcp" });
  if (rateLimited) return rateLimited;

  if (!isAuthorizedRequest(request)) return unauthorizedResponse();
  return handler(request);
}

export { handleRequest as GET, handleRequest as POST };