import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { Redis } from "@upstash/redis";
import { getClientIpInfo } from "../auth/rate-limit";

/**
 * Context Ledger — persistent project memory for AI clients.
 *
 * Every read and write path (MCP tools and REST dashboard routes) goes through
 * this module, so the two surfaces can never drift apart.
 */

export const API_KEY_ENV = "CONTEXT_LEDGER_API_KEY";
export const API_KEYS_ENV = "CONTEXT_LEDGER_API_KEYS";

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
  entriesPerProject: 1000,
  budgetSnapshotsPerProject: 50,
  maxActiveProjects: 200,
  projectsListed: 200,
  handoffEntriesPerSection: 5,
} as const;

export type EntryType = "decision" | "progress" | "issue" | "next";
export type BudgetAction = "continue" | "warn" | "stop_and_summarize";
export type LedgerErrorCode =
  | "invalid_input"
  | "not_found"
  | "storage_unavailable"
  | "service_unavailable"
  | "max_projects_reached"
  | "max_entries_reached";

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
  archived?: boolean;
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
  appendEntries(id: string, entries: LedgerEntry[]): Promise<ProjectRecord>;
  recordBudget(id: string, snapshot: BudgetSnapshot): Promise<ProjectRecord>;
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
    const record = this.records.get(id);
    return record ? normalizeProject(record) : null;
  }

  async put(project: ProjectRecord): Promise<void> {
    this.records.set(project.id, normalizeProject(project));
  }

  async ids(): Promise<string[]> {
    return [...this.records.keys()];
  }

  async appendEntries(id: string, newEntries: LedgerEntry[]): Promise<ProjectRecord> {
    const project = this.records.get(id);
    if (!project) {
      throw new LedgerError("not_found", `No project found with id "${id}". Call create_project first.`);
    }
    if (project.entries.length + newEntries.length > LIMITS.entriesPerProject) {
      throw new LedgerError(
        "max_entries_reached",
        `Project entry limit reached (maximum ${LIMITS.entriesPerProject} entries).`,
      );
    }
    project.entries.push(...newEntries);
    project.updated_at = newEntries[newEntries.length - 1].timestamp;
    return normalizeProject(project);
  }

  async recordBudget(id: string, snapshot: BudgetSnapshot): Promise<ProjectRecord> {
    const project = this.records.get(id);
    if (!project) {
      throw new LedgerError("not_found", `No project found with id "${id}". Call create_project first.`);
    }
    project.budget_snapshots.push(snapshot);
    if (project.budget_snapshots.length > LIMITS.budgetSnapshotsPerProject) {
      project.budget_snapshots = project.budget_snapshots.slice(-LIMITS.budgetSnapshotsPerProject);
    }
    project.updated_at = snapshot.timestamp;
    return normalizeProject(project);
  }
}

class RedisLedgerStore implements LedgerStore {
  constructor(private readonly redis: Redis) {}

  async get(id: string): Promise<ProjectRecord | null> {
    const metaKey = PROJECT_KEY_PREFIX + id;
    const entriesKey = `${metaKey}:entries`;
    const budgetsKey = `${metaKey}:budgets`;

    const [record, rawEntries, rawBudgets] = await Promise.all([
      this.redis.get<ProjectRecord>(metaKey),
      this.redis.lrange<string | LedgerEntry>(entriesKey, 0, -1),
      this.redis.lrange<string | BudgetSnapshot>(budgetsKey, 0, -1),
    ]);

    if (!record) return null;

    const normalized = normalizeProject(record);

    // Read-time fallback: if Redis list has items, use them; otherwise keep old embedded record.entries
    if (rawEntries && rawEntries.length > 0) {
      normalized.entries = rawEntries.map((item) =>
        typeof item === "string" ? JSON.parse(item) : item,
      );
    }

    if (rawBudgets && rawBudgets.length > 0) {
      normalized.budget_snapshots = rawBudgets.map((item) =>
        typeof item === "string" ? JSON.parse(item) : item,
      );
    }

    return normalized;
  }

  async put(project: ProjectRecord): Promise<void> {
    const metaKey = PROJECT_KEY_PREFIX + project.id;
    await this.redis.set(metaKey, project);
    await this.redis.sadd(PROJECT_INDEX_KEY, project.id);
  }

  async ids(): Promise<string[]> {
    const ids = await this.redis.smembers(PROJECT_INDEX_KEY);
    return Array.isArray(ids) ? ids.map((id) => String(id)) : [];
  }

  async appendEntries(id: string, newEntries: LedgerEntry[]): Promise<ProjectRecord> {
    const metaKey = PROJECT_KEY_PREFIX + id;
    const entriesKey = `${metaKey}:entries`;

    const [rawRecord, listLen] = await Promise.all([
      this.redis.get<ProjectRecord>(metaKey),
      this.redis.llen(entriesKey),
    ]);

    if (!rawRecord) {
      throw new LedgerError("not_found", `No project found with id "${id}". Call create_project first.`);
    }

    // Migration fallback: if list is empty but old record has embedded entries, migrate them
    let currentCount = listLen;
    const oldEntries = Array.isArray(rawRecord.entries) ? rawRecord.entries : [];
    if (listLen === 0 && oldEntries.length > 0) {
      const serializedOld = oldEntries.map((e) => JSON.stringify(e));
      await this.redis.rpush(entriesKey, ...serializedOld);
      currentCount = oldEntries.length;
    }

    if (currentCount + newEntries.length > LIMITS.entriesPerProject) {
      throw new LedgerError(
        "max_entries_reached",
        `Project entry limit reached (maximum ${LIMITS.entriesPerProject} entries).`,
      );
    }

    const serializedNew = newEntries.map((e) => JSON.stringify(e));
    await this.redis.rpush(entriesKey, ...serializedNew);

    const timestamp = newEntries[newEntries.length - 1].timestamp;
    rawRecord.updated_at = timestamp;
    await this.redis.set(metaKey, rawRecord);

    const project = await this.get(id);
    return project ?? normalizeProject(rawRecord);
  }

  async recordBudget(id: string, snapshot: BudgetSnapshot): Promise<ProjectRecord> {
    const metaKey = PROJECT_KEY_PREFIX + id;
    const budgetsKey = `${metaKey}:budgets`;

    const [rawRecord, listLen] = await Promise.all([
      this.redis.get<ProjectRecord>(metaKey),
      this.redis.llen(budgetsKey),
    ]);

    if (!rawRecord) {
      throw new LedgerError("not_found", `No project found with id "${id}". Call create_project first.`);
    }

    const oldSnapshots = Array.isArray(rawRecord.budget_snapshots) ? rawRecord.budget_snapshots : [];
    if (listLen === 0 && oldSnapshots.length > 0) {
      const serializedOld = oldSnapshots.map((s) => JSON.stringify(s));
      await this.redis.rpush(budgetsKey, ...serializedOld);
    }

    await this.redis.rpush(budgetsKey, JSON.stringify(snapshot));
    await this.redis.ltrim(budgetsKey, -LIMITS.budgetSnapshotsPerProject, -1);

    rawRecord.updated_at = snapshot.timestamp;
    await this.redis.set(metaKey, rawRecord);

    const project = await this.get(id);
    return project ?? normalizeProject(rawRecord);
  }
}

function pickEnv(names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim().length > 0) return value.trim();
  }
  return undefined;
}

export function getStorageType(): "redis" | "memory" {
  const url = pickEnv(REDIS_URL_ENV_NAMES);
  const token = pickEnv(REDIS_TOKEN_ENV_NAMES);
  return url && token ? "redis" : "memory";
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
/* Auth & Key Rotation                                                         */
/* -------------------------------------------------------------------------- */

let warnedAboutMissingKey = false;

export function getConfiguredApiKeys(): string[] {
  const keys: string[] = [];
  const single = process.env[API_KEY_ENV];
  if (single && single.trim().length > 0) {
    keys.push(single.trim());
  }
  const multi = process.env[API_KEYS_ENV];
  if (multi && multi.trim().length > 0) {
    for (const key of multi.split(",")) {
      const trimmed = key.trim();
      if (trimmed.length > 0) {
        keys.push(trimmed);
      }
    }
  }
  return Array.from(new Set(keys));
}

export function extractBearerToken(header: string | null | undefined): string | null {
  if (!header) return null;
  const match = /^bearer\s+(.+)$/i.exec(header.trim());
  const token = match?.[1]?.trim();
  return token && token.length > 0 ? token : null;
}

/** Constant-time comparison of the supplied key against all candidate keys. */
export function verifyApiKey(provided: string | null | undefined): boolean {
  const keys = getConfiguredApiKeys();

  if (keys.length === 0) {
    if (!warnedAboutMissingKey) {
      warnedAboutMissingKey = true;
      console.error(
        `[context-ledger] Neither ${API_KEY_ENV} nor ${API_KEYS_ENV} is set — every request will be rejected with 503.`,
      );
    }
    return false;
  }

  if (!provided) return false;

  const supplied = Buffer.from(provided, "utf8");
  let matched = false;

  for (const expectedKey of keys) {
    const reference = Buffer.from(expectedKey, "utf8");
    if (supplied.length === reference.length) {
      if (timingSafeEqual(supplied, reference)) {
        matched = true;
      }
    } else {
      timingSafeEqual(reference, reference);
    }
  }

  return matched;
}

export type AuthState =
  | { ok: true }
  | { ok: false; status: 503; code: "service_unavailable"; message: string }
  | { ok: false; status: 401; code: "unauthorized"; message: string };

export function authenticateRequest(request: Request): AuthState {
  const keys = getConfiguredApiKeys();
  if (keys.length === 0) {
    return {
      ok: false,
      status: 503,
      code: "service_unavailable",
      message: "No API key configured on this server. Set CONTEXT_LEDGER_API_KEY or CONTEXT_LEDGER_API_KEYS.",
    };
  }

  const token = extractBearerToken(request.headers.get("authorization"));
  if (!token || !verifyApiKey(token)) {
    return {
      ok: false,
      status: 401,
      code: "unauthorized",
      message: "Missing or invalid bearer API key.",
    };
  }

  return { ok: true };
}

export function isAuthorizedRequest(request: Request): boolean {
  return authenticateRequest(request).ok;
}

export function authErrorResponse(auth: Extract<AuthState, { ok: false }>): Response {
  const headers: Record<string, string> = {};
  if (auth.status === 401) {
    headers["WWW-Authenticate"] = "Bearer";
  }
  return Response.json(
    { error: auth.code, message: auth.message },
    { status: auth.status, headers },
  );
}

export function unauthorizedResponse(): Response {
  const auth = authenticateRequest({ headers: new Headers() } as unknown as Request);
  if (!auth.ok) {
    return authErrorResponse(auth);
  }
  return Response.json(
    { error: "unauthorized", message: "Missing or invalid bearer API key." },
    { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
  );
}

export function isRedisOutageError(error: unknown): boolean {
  if (error instanceof LedgerError && error.code === "storage_unavailable") {
    return true;
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    const name = error.name.toLowerCase();
    return (
      name.includes("upstash") ||
      msg.includes("fetch failed") ||
      msg.includes("econnrefused") ||
      msg.includes("enotfound") ||
      msg.includes("etimedout") ||
      msg.includes("redis")
    );
  }
  return false;
}

export function ledgerErrorResponse(error: unknown): Response {
  if (error instanceof LedgerError) {
    const status =
      error.code === "not_found"
        ? 404
        : error.code === "storage_unavailable" || error.code === "service_unavailable"
          ? 503
          : error.code === "max_projects_reached" ||
            error.code === "max_entries_reached" ||
            error.code === "invalid_input"
            ? 400
            : 500;
    return Response.json({ error: error.code, message: error.message }, { status });
  }

  if (isRedisOutageError(error)) {
    return Response.json(
      {
        error: "storage_unavailable",
        message: "Storage is temporarily unavailable. Please retry your request in a moment.",
      },
      { status: 503 },
    );
  }

  console.error("[context-ledger] unexpected internal failure", error instanceof Error ? error.message : error);
  return Response.json(
    {
      error: "internal_error",
      message: "An unexpected error occurred. Please retry your request in a moment.",
    },
    { status: 500 },
  );
}

/* -------------------------------------------------------------------------- */
/* Observability                                                               */
/* -------------------------------------------------------------------------- */

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

export async function withObservability(
  request: Request,
  handler: () => Promise<Response>,
): Promise<Response> {
  const startTime = performance.now();
  const { ip } = getClientIpInfo(request);
  let response: Response;
  try {
    response = await handler();
  } catch (err) {
    response = ledgerErrorResponse(err);
  }
  const ms = Math.round(performance.now() - startTime);
  const path = new URL(request.url).pathname;
  console.log(
    JSON.stringify({
      method: request.method,
      path,
      status: response.status,
      ms,
      ip_hash: hashIp(ip),
    }),
  );
  return response;
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
    archived: Boolean(project.archived),
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

  // Requirement 3: max 200 active projects
  const activeProjects = await listProjects();
  if (activeProjects.length >= LIMITS.maxActiveProjects) {
    throw new LedgerError(
      "max_projects_reached",
      `Active project limit reached (maximum ${LIMITS.maxActiveProjects}). Archive an inactive project before creating a new one.`,
    );
  }

  const now = new Date().toISOString();
  const project: ProjectRecord = {
    id: randomUUID(),
    name,
    goal,
    created_at: now,
    updated_at: now,
    entries: [],
    budget_snapshots: [],
    archived: false,
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
  const id = requireText(projectId, "project_id", LIMITS.projectId);
  const timestamp = new Date().toISOString();

  const entries: LedgerEntry[] = drafts.map((draft) => ({
    id: randomUUID(),
    type: draft.type,
    text: draft.text,
    reason: draft.reason,
    timestamp,
  }));

  const project = await getStore().appendEntries(id, entries);
  return { project, entries };
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
  const id = requireText(input?.project_id, "project_id", LIMITS.projectId);
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

  const project = await getStore().recordBudget(id, snapshot);
  return { project, snapshot };
}

export async function archiveProject(projectId: unknown): Promise<ProjectRecord> {
  const project = await getProject(projectId);
  const updated: ProjectRecord = {
    ...project,
    archived: true,
    updated_at: new Date().toISOString(),
  };
  await getStore().put(updated);
  return updated;
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const ledger = getStore();
  const ids = (await ledger.ids()).slice(0, LIMITS.projectsListed);
  const records = await Promise.all(ids.map((id) => ledger.get(id)));

  return records
    .filter((record): record is ProjectRecord => Boolean(record && !record.archived))
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
  if (project.archived) {
    throw new LedgerError("not_found", `Project "${project.id}" has been archived.`);
  }
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
/* Handoff summary & Export                                                    */
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

function pushCappedSection(
  lines: string[],
  heading: string,
  body: string[],
  limit: number = LIMITS.handoffEntriesPerSection,
): void {
  lines.push(`## ${heading}`);
  lines.push("");
  if (body.length === 0) {
    lines.push("_Nothing logged yet._");
  } else if (body.length <= limit) {
    lines.push(...body);
  } else {
    const omitted = body.length - limit;
    lines.push(`_(${omitted} older ${omitted === 1 ? "entry" : "entries"} omitted)_`);
    lines.push(...body.slice(-limit));
  }
  lines.push("");
}

export function buildHandoffSummary(
  project: ProjectRecord,
  maxSectionEntries: number = LIMITS.handoffEntriesPerSection,
): string {
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

  pushCappedSection(
    lines,
    "Built",
    entriesOf("progress").map((entry) => `- ${entry.text}`),
    maxSectionEntries,
  );

  pushCappedSection(
    lines,
    "Decisions",
    entriesOf("decision").map((entry) =>
      entry.reason ? `- ${entry.text} — because: ${entry.reason}` : `- ${entry.text}`,
    ),
    maxSectionEntries,
  );

  pushCappedSection(
    lines,
    "Fix Next",
    entriesOf("issue").map((entry) => `- ${entry.text}`),
    maxSectionEntries,
  );

  pushCappedSection(
    lines,
    "Build Next",
    entriesOf("next").map((entry) => `- ${entry.text}`),
    maxSectionEntries,
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
  maxSectionEntries?: number,
): Promise<{ project: ProjectRecord; summary: string }> {
  const project = await getProject(projectId);
  return { project, summary: buildHandoffSummary(project, maxSectionEntries) };
}

export function sanitizeFilename(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "handoff";
}
