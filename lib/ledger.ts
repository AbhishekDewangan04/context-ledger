import { randomUUID, timingSafeEqual } from "node:crypto";
import { Redis } from "@upstash/redis";

/**
 * Context Ledger — persistent project memory for AI clients.
 *
 * Every read and write path (MCP tools and REST dashboard routes) goes through
 * this module, so the two surfaces can never drift apart.
 */

export const API_KEY_ENV = "CONTEXT_LEDGER_API_KEY";

const REDIS_URL_ENV_NAMES = ["UPSTASH_REDIS_REST_URL", "KV_REST_API_URL"];
const REDIS_TOKEN_ENV_NAMES = ["UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_TOKEN"];

const PROJECT_KEY_PREFIX = "context-ledger:project:";
const PROJECT_INDEX_KEY = "context-ledger:projects";

/** Upper bound accepted for token counts, to keep stored numbers sane. */
const MAX_TOKEN_COUNT = 100_000_000;

export const LIMITS = {
  name: 120,
  goal: 2000,
  decision: 2000,
  reason: 2000,
  progress: 4000,
  projectId: 200,
  entriesPerProject: 200,
  budgetSnapshotsPerProject: 50,
  projectsListed: 200,
} as const;

export type EntryType = "decision" | "progress" | "issue" | "next";
export type BudgetAction = "continue" | "warn" | "stop_and_summarize";
export type LedgerErrorCode = "invalid_input" | "not_found" | "storage_unavailable";

export const BUDGET_GUIDANCE: Record<BudgetAction, string> = {
  continue: "keep working",
  warn: "wrap up the current step and prepare to hand off",
  stop_and_summarize: "stop now and call get_handoff_summary",
};

export interface LedgerEntry {
  id: string;
  type: EntryType;
  text: string;
  reason?: string;
  timestamp: string;
}

export interface BudgetSnapshot {
  tokens_used: number;
  token_limit: number;
  percent: number;
  action: BudgetAction;
  timestamp: string;
}

export interface ProjectRecord {
  id: string;
  name: string;
  goal: string;
  created_at: string;
  updated_at: string;
  entries: LedgerEntry[];
  budget_snapshots: BudgetSnapshot[];
}

export interface ProjectSummary {
  id: string;
  name: string;
  goal: string;
  created_at: string;
  updated_at: string;
  entry_count: number;
  latest_budget: BudgetSnapshot | null;
}

export interface ProjectDetail {
  project: Pick<ProjectRecord, "id" | "name" | "goal" | "created_at" | "updated_at">;
  entries: LedgerEntry[];
  latest_budget: BudgetSnapshot | null;
  summary: string;
}

export class LedgerError extends Error {
  readonly code: LedgerErrorCode;

  constructor(code: LedgerErrorCode, message: string) {
    super(message);
    this.name = "LedgerError";
    this.code = code;
  }
}

/* -------------------------------------------------------------------------- */
/* Storage                                                                     */
/* -------------------------------------------------------------------------- */

interface LedgerStore {
  get(id: string): Promise<ProjectRecord | null>;
  put(project: ProjectRecord): Promise<void>;
  ids(): Promise<string[]>;
}

interface LedgerGlobal {
  __contextLedgerMemoryStore?: Map<string, ProjectRecord>;
}

const ledgerGlobal = globalThis as unknown as LedgerGlobal;

/** Local-development fallback. Not durable — production requires Redis. */
class MemoryLedgerStore implements LedgerStore {
  private readonly records: Map<string, ProjectRecord>;

  constructor() {
    if (!ledgerGlobal.__contextLedgerMemoryStore) {
      ledgerGlobal.__contextLedgerMemoryStore = new Map();
    }
    this.records = ledgerGlobal.__contextLedgerMemoryStore;
  }

  async get(id: string): Promise<ProjectRecord | null> {
    return this.records.get(id) ?? null;
  }

  async put(project: ProjectRecord): Promise<void> {
    this.records.set(project.id, project);
  }

  async ids(): Promise<string[]> {
    return [...this.records.keys()];
  }
}

class RedisLedgerStore implements LedgerStore {
  constructor(private readonly redis: Redis) {}

  async get(id: string): Promise<ProjectRecord | null> {
    const record = (await this.redis.get(PROJECT_KEY_PREFIX + id)) as ProjectRecord | null;
    return record ?? null;
  }

  async put(project: ProjectRecord): Promise<void> {
    await this.redis.set(PROJECT_KEY_PREFIX + project.id, project);
    await this.redis.sadd(PROJECT_INDEX_KEY, project.id);
  }

  async ids(): Promise<string[]> {
    const ids = await this.redis.smembers(PROJECT_INDEX_KEY);
    return Array.isArray(ids) ? ids.map((id) => String(id)) : [];
  }
}

function pickEnv(names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim().length > 0) return value.trim();
  }
  return undefined;
}

function redisFromEnv(): Redis | null {
  const url = pickEnv(REDIS_URL_ENV_NAMES);
  const token = pickEnv(REDIS_TOKEN_ENV_NAMES);
  if (!url || !token) return null;
  return new Redis({ url, token });
}

let store: LedgerStore | null = null;
let warnedAboutMemory = false;

export function getStore(): LedgerStore {
  if (store) return store;

  const redis = redisFromEnv();
  if (redis) {
    store = new RedisLedgerStore(redis);
    return store;
  }

  if (process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview") {
    throw new LedgerError(
      "storage_unavailable",
      "Ledger storage is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL and KV_REST_API_TOKEN) on this deployment.",
    );
  }

  if (!warnedAboutMemory) {
    warnedAboutMemory = true;
    console.warn(
      "[context-ledger] No Redis environment variables found — using in-memory storage. Development only; data is lost on restart.",
    );
  }

  store = new MemoryLedgerStore();
  return store;
}

/* -------------------------------------------------------------------------- */
/* Auth                                                                        */
/* -------------------------------------------------------------------------- */

let warnedAboutMissingKey = false;

export function extractBearerToken(header: string | null | undefined): string | null {
  if (!header) return null;
  const match = /^bearer\s+(.+)$/i.exec(header.trim());
  const token = match?.[1]?.trim();
  return token && token.length > 0 ? token : null;
}

/** Constant-time comparison of the supplied key against CONTEXT_LEDGER_API_KEY. */
export function verifyApiKey(provided: string | null | undefined): boolean {
  const expected = process.env[API_KEY_ENV];

  if (!expected) {
    if (!warnedAboutMissingKey) {
      warnedAboutMissingKey = true;
      console.error(
        `[context-ledger] ${API_KEY_ENV} is not set — every request will be rejected with 401.`,
      );
    }
    return false;
  }

  if (!provided) return false;

  const supplied = Buffer.from(provided, "utf8");
  const reference = Buffer.from(expected, "utf8");

  if (supplied.length !== reference.length) {
    // Compare the reference against itself so the failure path still costs a comparison.
    timingSafeEqual(reference, reference);
    return false;
  }

  return timingSafeEqual(supplied, reference);
}

export function isAuthorizedRequest(request: Request): boolean {
  return verifyApiKey(extractBearerToken(request.headers.get("authorization")));
}

export function unauthorizedResponse(): Response {
  return Response.json(
    { error: "unauthorized", message: "Missing or invalid bearer API key." },
    { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
  );
}

export function ledgerErrorResponse(error: unknown): Response {
  if (error instanceof LedgerError) {
    const status =
      error.code === "not_found" ? 404 : error.code === "invalid_input" ? 400 : 503;
    return Response.json({ error: error.code, message: error.message }, { status });
  }

  console.error("[context-ledger] unexpected failure", error);
  return Response.json(
    { error: "internal_error", message: "The ledger store could not be reached. Try again in a moment." },
    { status: 500 },
  );
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                  */
/* -------------------------------------------------------------------------- */

export function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

function requireText(value: unknown, field: string, maxLength: number): string {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) {
    throw new LedgerError("invalid_input", `${field} is required.`);
  }
  if (text.length > maxLength) {
    throw new LedgerError(
      "invalid_input",
      `${field} must be ${maxLength} characters or fewer (received ${text.length}).`,
    );
  }
  return text;
}

function optionalText(value: unknown, field: string, maxLength: number): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new LedgerError("invalid_input", `${field} must be text.`);
  }
  const text = value.trim();
  if (!text) return undefined;
  if (text.length > maxLength) {
    throw new LedgerError(
      "invalid_input",
      `${field} must be ${maxLength} characters or fewer (received ${text.length}).`,
    );
  }
  return text;
}

function requireWholeNumber(value: unknown, field: string, min: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new LedgerError("invalid_input", `${field} must be a number.`);
  }
  if (!Number.isInteger(value)) {
    throw new LedgerError("invalid_input", `${field} must be a whole number.`);
  }
  if (value < min) {
    throw new LedgerError(
      "invalid_input",
      min === 0 ? `${field} must be zero or greater.` : `${field} must be greater than zero.`,
    );
  }
  if (value > MAX_TOKEN_COUNT) {
    throw new LedgerError(
      "invalid_input",
      `${field} looks too large — the maximum accepted value is ${formatCount(MAX_TOKEN_COUNT)}.`,
    );
  }
  return value;
}

/* -------------------------------------------------------------------------- */
/* Domain logic                                                                */
/* -------------------------------------------------------------------------- */

function normalizeProject(project: ProjectRecord): ProjectRecord {
  return {
    ...project,
    entries: Array.isArray(project.entries) ? project.entries : [],
    budget_snapshots: Array.isArray(project.budget_snapshots) ? project.budget_snapshots : [],
  };
}

export function latestBudget(project: ProjectRecord): BudgetSnapshot | null {
  const snapshots = project.budget_snapshots;
  return snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
}

/** continue below 80%, warn 80-89%, stop_and_summarize at 90% or more. */
export function evaluateBudget(
  tokensUsed: number,
  tokenLimit: number,
): { percent: number; action: BudgetAction } {
  const percent = Math.round((tokensUsed / tokenLimit) * 100);
  if (percent >= 90) return { percent, action: "stop_and_summarize" };
  if (percent >= 80) return { percent, action: "warn" };
  return { percent, action: "continue" };
}

export async function createProject(input: { name: unknown; goal: unknown }): Promise<ProjectRecord> {
  const name = requireText(input?.name, "name", LIMITS.name);
  const goal = requireText(input?.goal, "goal", LIMITS.goal);

  const now = new Date().toISOString();
  const project: ProjectRecord = {
    id: randomUUID(),
    name,
    goal,
    created_at: now,
    updated_at: now,
    entries: [],
    budget_snapshots: [],
  };

  await getStore().put(project);
  return project;
}

export async function getProject(projectId: unknown): Promise<ProjectRecord> {
  const id = requireText(projectId, "project_id", LIMITS.projectId);
  const project = await getStore().get(id);
  if (!project) {
    throw new LedgerError("not_found", `No project found with id "${id}". Call create_project first.`);
  }
  return normalizeProject(project);
}

interface EntryDraft {
  type: EntryType;
  text: string;
  reason?: string;
}

async function appendEntries(
  projectId: unknown,
  drafts: EntryDraft[],
): Promise<{ project: ProjectRecord; entries: LedgerEntry[] }> {
  const project = await getProject(projectId);
  const timestamp = new Date().toISOString();

  const entries: LedgerEntry[] = drafts.map((draft) => ({
    id: randomUUID(),
    type: draft.type,
    text: draft.text,
    reason: draft.reason,
    timestamp,
  }));

  const updated: ProjectRecord = {
    ...project,
    entries: [...project.entries, ...entries].slice(-LIMITS.entriesPerProject),
    updated_at: timestamp,
  };

  await getStore().put(updated);
  return { project: updated, entries };
}

export async function logDecision(input: {
  project_id: unknown;
  decision: unknown;
  reason: unknown;
}): Promise<{ project: ProjectRecord; entry: LedgerEntry }> {
  const decision = requireText(input?.decision, "decision", LIMITS.decision);
  const reason = requireText(input?.reason, "reason", LIMITS.reason);

  const { project, entries } = await appendEntries(input?.project_id, [
    { type: "decision", text: decision, reason },
  ]);

  return { project, entry: entries[0] };
}

export async function logProgress(input: {
  project_id: unknown;
  built: unknown;
  broken?: unknown;
  next?: unknown;
}): Promise<{ project: ProjectRecord; entries: LedgerEntry[] }> {
  const built = requireText(input?.built, "built", LIMITS.progress);
  const broken = optionalText(input?.broken, "broken", LIMITS.progress);
  const next = optionalText(input?.next, "next", LIMITS.progress);

  const drafts: EntryDraft[] = [{ type: "progress", text: built }];
  if (broken) drafts.push({ type: "issue", text: broken });
  if (next) drafts.push({ type: "next", text: next });

  return appendEntries(input?.project_id, drafts);
}

export async function recordBudget(input: {
  project_id: unknown;
  tokens_used: unknown;
  token_limit: unknown;
}): Promise<{ project: ProjectRecord; snapshot: BudgetSnapshot }> {
  const project = await getProject(input?.project_id);
  const tokensUsed = requireWholeNumber(input?.tokens_used, "tokens_used", 0);
  const tokenLimit = requireWholeNumber(input?.token_limit, "token_limit", 1);

  const { percent, action } = evaluateBudget(tokensUsed, tokenLimit);
  const snapshot: BudgetSnapshot = {
    tokens_used: tokensUsed,
    token_limit: tokenLimit,
    percent,
    action,
    timestamp: new Date().toISOString(),
  };

  const updated: ProjectRecord = {
    ...project,
    budget_snapshots: [...project.budget_snapshots, snapshot].slice(-LIMITS.budgetSnapshotsPerProject),
    updated_at: snapshot.timestamp,
  };

  await getStore().put(updated);
  return { project: updated, snapshot };
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const ledger = getStore();
  const ids = (await ledger.ids()).slice(0, LIMITS.projectsListed);
  const records = await Promise.all(ids.map((id) => ledger.get(id)));

  return records
    .filter((record): record is ProjectRecord => Boolean(record))
    .map((record) => {
      const project = normalizeProject(record);
      return {
        id: project.id,
        name: project.name,
        goal: project.goal,
        created_at: project.created_at,
        updated_at: project.updated_at,
        entry_count: project.entries.length,
        latest_budget: latestBudget(project),
      };
    })
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function getProjectDetail(projectId: unknown): Promise<ProjectDetail> {
  const project = await getProject(projectId);
  return {
    project: {
      id: project.id,
      name: project.name,
      goal: project.goal,
      created_at: project.created_at,
      updated_at: project.updated_at,
    },
    entries: project.entries,
    latest_budget: latestBudget(project),
    summary: buildHandoffSummary(project),
  };
}

/* -------------------------------------------------------------------------- */
/* Handoff summary                                                             */
/* -------------------------------------------------------------------------- */

function pushSection(lines: string[], heading: string, body: string[]): void {
  lines.push(`## ${heading}`);
  lines.push("");
  if (body.length === 0) {
    lines.push("_Nothing logged yet._");
  } else {
    lines.push(...body);
  }
  lines.push("");
}

export function buildHandoffSummary(project: ProjectRecord): string {
  const entriesOf = (type: EntryType) => project.entries.filter((entry) => entry.type === type);
  const latest = latestBudget(project);
  const lines: string[] = [];

  lines.push(`# Handoff — ${project.name}`);
  lines.push("");
  lines.push(`- Project id: ${project.id}`);
  lines.push(`- Created: ${project.created_at}`);
  lines.push(`- Last updated: ${project.updated_at}`);
  lines.push(`- Entries recorded: ${project.entries.length}`);
  lines.push("");

  pushSection(lines, "Started With", [`Goal: ${project.goal}`, "", `Project opened ${project.created_at}.`]);

  pushSection(
    lines,
    "Built",
    entriesOf("progress").map((entry) => `- ${entry.text}`),
  );

  pushSection(
    lines,
    "Decisions",
    entriesOf("decision").map((entry) =>
      entry.reason ? `- ${entry.text} — because: ${entry.reason}` : `- ${entry.text}`,
    ),
  );

  pushSection(
    lines,
    "Fix Next",
    entriesOf("issue").map((entry) => `- ${entry.text}`),
  );

  pushSection(
    lines,
    "Build Next",
    entriesOf("next").map((entry) => `- ${entry.text}`),
  );

  pushSection(
    lines,
    "Budget Status",
    latest
      ? [
          `Tokens used: ${formatCount(latest.tokens_used)} of ${formatCount(latest.token_limit)} (${latest.percent}%).`,
          `Action: ${latest.action} — ${BUDGET_GUIDANCE[latest.action]}.`,
          `Checked: ${latest.timestamp}.`,
        ]
      : ["No budget check recorded yet. Call check_budget with tokens_used and token_limit."],
  );

  return lines.join("\n");
}

export async function getHandoffSummary(
  projectId: unknown,
): Promise<{ project: ProjectRecord; summary: string }> {
  const project = await getProject(projectId);
  return { project, summary: buildHandoffSummary(project) };
}