import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvKey(): string | undefined {
  const envPaths = [resolve(process.cwd(), ".env"), resolve(process.cwd(), ".env.local"), resolve(process.cwd(), "..", ".env.local")];
  for (const envPath of envPaths) {
    if (!existsSync(envPath)) continue;
    const content = readFileSync(envPath, "utf-8");
    const match = content.match(/CONTEXT_LEDGER_API_KEY\s*=\s*([^\r\n]+)/);
    if (match) return match[1].trim();
  }
  return undefined;
}

const BASE_URL = (
  process.env.BASE_URL ||
  process.argv[2] ||
  "http://localhost:4000"
).replace(/\/+$/, "");

const API_KEY =
  process.env.API_KEY ||
  process.argv[3] ||
  process.env.CONTEXT_LEDGER_API_KEY ||
  loadEnvKey() ||
  "LeA5oX9SrWqHxrGCXxNrdvFWhBfl4avJpP116IOE";

const CLIENT_IP_HEADER = { "x-forwarded-for": "127.0.0.1" };

async function callMcp(
  method: string,
  params: Record<string, unknown> = {},
  key?: string,
): Promise<{ status: number; body: any }> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    ...CLIENT_IP_HEADER,
  };
  if (key) {
    headers["authorization"] = `Bearer ${key}`;
  }

  const res = await fetch(`${BASE_URL}/api/mcp`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Math.floor(Math.random() * 1_000_000) + 1,
      method,
      params,
    }),
  });

  const contentType = res.headers.get("content-type") || "";
  let body: any = null;

  if (contentType.includes("text/event-stream")) {
    const text = await res.text();
    for (const event of text.split(/\r?\n\r?\n/)) {
      const dataLine = event
        .split(/\r?\n/)
        .find((line) => line.startsWith("data:"));
      if (dataLine) {
        const rawJson = dataLine.slice(5).trim();
        try {
          body = JSON.parse(rawJson);
          break;
        } catch {}
      }
    }
  } else {
    const text = await res.text();
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  return { status: res.status, body };
}

async function callTool(
  name: string,
  args: Record<string, unknown>,
  key: string,
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  const { status, body } = await callMcp(
    "tools/call",
    { name, arguments: args },
    key,
  );

  if (status !== 200) {
    throw new Error(`Tool call "${name}" returned HTTP ${status}: ${JSON.stringify(body)}`);
  }
  if (body?.error) {
    throw new Error(`Tool call "${name}" returned MCP error: ${JSON.stringify(body.error)}`);
  }
  const result = body?.result;
  if (!result) {
    throw new Error(`Tool call "${name}" returned no result: ${JSON.stringify(body)}`);
  }
  if (result.isError) {
    const msg = result.content?.map((c: any) => c.text).join("\n") || "Unknown error";
    throw new Error(`Tool call "${name}" failed: ${msg}`);
  }
  return result;
}

async function runSmokeTests() {
  console.log(`[smoke] Target: ${BASE_URL}`);
  console.log(`[smoke] API Key configured: ${API_KEY ? "yes (length " + API_KEY.length + ")" : "no"}\n`);

  // Step 1: 401 without key
  process.stdout.write("1. Testing 401 without key... ");
  const noKeyRes = await fetch(`${BASE_URL}/api/projects`, {
    headers: { ...CLIENT_IP_HEADER },
  });
  if (noKeyRes.status !== 401) {
    throw new Error(`Expected 401 without key, got HTTP ${noKeyRes.status}`);
  }
  const noKeyJson = await noKeyRes.json();
  if (noKeyJson.error !== "unauthorized") {
    throw new Error(`Expected error 'unauthorized', got ${JSON.stringify(noKeyJson)}`);
  }
  console.log("OK");

  // Step 2: tools/list = exactly 7
  process.stdout.write("2. Testing tools/list (exactly 7 tools)... ");
  const listToolsRes = await callMcp("tools/list", {}, API_KEY);
  if (listToolsRes.status !== 200) {
    throw new Error(`Expected 200 from tools/list, got ${listToolsRes.status}: ${JSON.stringify(listToolsRes.body)}`);
  }
  const tools = listToolsRes.body?.result?.tools;
  if (!Array.isArray(tools)) {
    throw new Error(`Expected tools array, got: ${JSON.stringify(listToolsRes.body)}`);
  }
  if (tools.length !== 7) {
    throw new Error(`Expected exactly 7 tools, found ${tools.length}: ${tools.map((t: any) => t.name).join(", ")}`);
  }
  console.log(`OK (${tools.map((t: any) => t.name).join(", ")})`);

  // Step 3: create_project
  process.stdout.write("3. Testing create_project... ");
  const projectName = `Smoke Test ${Date.now()}`;
  const createRes = await callTool(
    "create_project",
    { name: projectName, goal: "Verify all features and concurrency" },
    API_KEY,
  );
  const createText = createRes.content[0]?.text ?? "";
  const matchId = createText.match(/id:\s*([0-9a-fA-F-]{36})/i);
  if (!matchId) {
    throw new Error(`Could not parse project id from create_project response: ${createText}`);
  }
  const projectId = matchId[1];
  console.log(`OK (id: ${projectId})`);

  // Step 4: log_decision
  process.stdout.write("4. Testing log_decision... ");
  const decisionRes = await callTool(
    "log_decision",
    {
      project_id: projectId,
      decision: "Use atomic list append",
      reason: "Eliminates read-modify-write race conditions under high concurrency",
    },
    API_KEY,
  );
  if (!decisionRes.content[0]?.text.includes("Logged decision")) {
    throw new Error(`Unexpected log_decision response: ${decisionRes.content[0]?.text}`);
  }
  console.log("OK");

  // Step 5: log_progress
  process.stdout.write("5. Testing log_progress... ");
  const progressRes = await callTool(
    "log_progress",
    {
      project_id: projectId,
      built: "Implemented RPUSH storage and constant-time auth",
      broken: "Nothing",
      next: "Validate concurrency with 20 parallel calls",
    },
    API_KEY,
  );
  if (!progressRes.content[0]?.text.includes("Logged progress")) {
    throw new Error(`Unexpected log_progress response: ${progressRes.content[0]?.text}`);
  }
  console.log("OK");

  // Step 6: check_budget at 79/85/91 = continue/warn/stop_and_summarize
  process.stdout.write("6. Testing check_budget at 79/85/91... ");
  const b79 = await callTool(
    "check_budget",
    { project_id: projectId, tokens_used: 790, token_limit: 1000 },
    API_KEY,
  );
  if (!b79.content[0]?.text.includes("Action: continue")) {
    throw new Error(`Expected 'Action: continue' for 79%, got: ${b79.content[0]?.text}`);
  }

  const b85 = await callTool(
    "check_budget",
    { project_id: projectId, tokens_used: 850, token_limit: 1000 },
    API_KEY,
  );
  if (!b85.content[0]?.text.includes("Action: warn")) {
    throw new Error(`Expected 'Action: warn' for 85%, got: ${b85.content[0]?.text}`);
  }

  const b91 = await callTool(
    "check_budget",
    { project_id: projectId, tokens_used: 910, token_limit: 1000 },
    API_KEY,
  );
  if (!b91.content[0]?.text.includes("Action: stop_and_summarize")) {
    throw new Error(`Expected 'Action: stop_and_summarize' for 91%, got: ${b91.content[0]?.text}`);
  }
  console.log("OK (continue, warn, stop_and_summarize)");

  // Step 7: handoff has all 6 sections
  process.stdout.write("7. Testing handoff summary (all 6 sections)... ");
  const handoffRes = await callTool(
    "get_handoff_summary",
    { project_id: projectId },
    API_KEY,
  );
  const handoffText = handoffRes.content[0]?.text ?? "";
  const requiredSections = [
    "## Started With",
    "## Built",
    "## Decisions",
    "## Fix Next",
    "## Build Next",
    "## Budget Status",
  ];
  for (const section of requiredSections) {
    if (!handoffText.includes(section)) {
      throw new Error(`Handoff summary missing required section "${section}". Text:\n${handoffText}`);
    }
  }
  console.log("OK (all 6 sections present)");

  // Step 8: list_projects shows it
  process.stdout.write("8. Testing list_projects shows project... ");
  const listRes = await callTool("list_projects", {}, API_KEY);
  const listText = listRes.content[0]?.text ?? "";
  if (!listText.includes(projectId)) {
    throw new Error(`Project ${projectId} not found in list_projects: ${listText}`);
  }
  console.log("OK");

  // Step 9: export returns markdown
  process.stdout.write("9. Testing GET /api/projects/[id]/export... ");
  const exportRes = await fetch(`${BASE_URL}/api/projects/${projectId}/export`, {
    headers: {
      authorization: `Bearer ${API_KEY}`,
      ...CLIENT_IP_HEADER,
    },
  });
  if (exportRes.status !== 200) {
    throw new Error(`Expected 200 from export, got ${exportRes.status}`);
  }
  const contentType = exportRes.headers.get("content-type") ?? "";
  if (!contentType.includes("text/markdown")) {
    throw new Error(`Expected content-type text/markdown, got: ${contentType}`);
  }
  const disposition = exportRes.headers.get("content-disposition") ?? "";
  if (!disposition.includes("attachment") || !disposition.includes("filename=")) {
    throw new Error(`Expected attachment content-disposition with filename, got: ${disposition}`);
  }
  const exportMarkdown = await exportRes.text();
  if (!exportMarkdown.includes(`# Handoff — ${projectName}`)) {
    throw new Error(`Export body does not contain expected heading: ${exportMarkdown.slice(0, 100)}`);
  }
  console.log("OK");

  // Step 10: 20 PARALLEL log_decision calls then assert the entry count rose by exactly 20
  process.stdout.write("10. Testing 20 PARALLEL log_decision calls... ");
  const detailBeforeRes = await fetch(`${BASE_URL}/api/projects/${projectId}`, {
    headers: {
      authorization: `Bearer ${API_KEY}`,
      ...CLIENT_IP_HEADER,
    },
  });
  const detailBefore = await detailBeforeRes.json();
  const countBefore = detailBefore.entries.length;

  const parallelPromises = Array.from({ length: 20 }, (_, i) =>
    callTool(
      "log_decision",
      {
        project_id: projectId,
        decision: `Concurrent decision ${i + 1}`,
        reason: `Testing race condition ${i + 1}`,
      },
      API_KEY,
    ),
  );

  await Promise.all(parallelPromises);

  const detailAfterRes = await fetch(`${BASE_URL}/api/projects/${projectId}`, {
    headers: {
      authorization: `Bearer ${API_KEY}`,
      ...CLIENT_IP_HEADER,
    },
  });
  const detailAfter = await detailAfterRes.json();
  const countAfter = detailAfter.entries.length;

  if (countAfter !== countBefore + 20) {
    throw new Error(
      `Entry count did not increase by 20! Before: ${countBefore}, After: ${countAfter} (diff: ${countAfter - countBefore})`,
    );
  }
  console.log(`OK (count rose from ${countBefore} to ${countAfter}, exactly +20)`);

  // Step 11: archive hides it
  process.stdout.write("11. Testing archive_project hides project... ");
  await callTool("archive_project", { project_id: projectId }, API_KEY);
  const listAfterArchive = await callTool("list_projects", {}, API_KEY);
  if (listAfterArchive.content[0]?.text.includes(projectId)) {
    throw new Error(`Archived project ${projectId} still visible in list_projects!`);
  }
  const restProjectsRes = await fetch(`${BASE_URL}/api/projects`, {
    headers: {
      authorization: `Bearer ${API_KEY}`,
      ...CLIENT_IP_HEADER,
    },
  });
  const restProjects = await restProjectsRes.json();
  if (restProjects.projects?.some((p: any) => p.id === projectId)) {
    throw new Error(`Archived project ${projectId} still visible in GET /api/projects!`);
  }
  console.log("OK");

  // Step 12: GET archived = 404
  process.stdout.write("12. Testing GET archived project returns 404... ");
  const archivedDetailRes = await fetch(`${BASE_URL}/api/projects/${projectId}`, {
    headers: {
      authorization: `Bearer ${API_KEY}`,
      ...CLIENT_IP_HEADER,
    },
  });
  if (archivedDetailRes.status !== 404) {
    throw new Error(`Expected 404 for archived project detail, got ${archivedDetailRes.status}`);
  }
  const archivedExportRes = await fetch(
    `${BASE_URL}/api/projects/${projectId}/export`,
    {
      headers: {
        authorization: `Bearer ${API_KEY}`,
        ...CLIENT_IP_HEADER,
      },
    },
  );
  if (archivedExportRes.status !== 404) {
    throw new Error(`Expected 404 for archived project export, got ${archivedExportRes.status}`);
  }
  console.log("OK");

  // Step 13: Health check
  process.stdout.write("13. Testing GET /api/health... ");
  const healthRes = await fetch(`${BASE_URL}/api/health`, {
    headers: { ...CLIENT_IP_HEADER },
  });
  if (healthRes.status !== 200) {
    throw new Error(`Expected 200 from health endpoint, got ${healthRes.status}`);
  }
  const healthJson = await healthRes.json();
  if (healthJson.ok !== true || (healthJson.storage !== "redis" && healthJson.storage !== "memory")) {
    throw new Error(`Unexpected health response: ${JSON.stringify(healthJson)}`);
  }
  if (Object.keys(healthJson).length !== 2) {
    throw new Error(`Health response should only contain ok and storage: ${JSON.stringify(healthJson)}`);
  }
  console.log(`OK (storage: ${healthJson.storage})`);

  console.log("\nPASS: All smoke checks passed successfully.");
}

runSmokeTests().catch((err) => {
  console.error(`\nFAIL: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
