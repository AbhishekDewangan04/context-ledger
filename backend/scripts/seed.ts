/**
 * Seeds one demo project so the dashboard has something real to render.
 *
 *   npm run seed
 *
 * Writes through the same lib/ledger store the API uses: with Redis env vars set
 * it lands in Redis, otherwise it only exists in this process (and the script
 * says so).
 */
import {
  createProject,
  logDecision,
  logProgress,
  recordBudget,
  listProjects,
} from "../src/services/ledger";

async function main() {
  console.log("Seeding a demo project…\n");

  const project = await createProject({
    name: "Payments migration",
    goal: "Move billing off the legacy provider and cut over without downtime.",
  });

  await logProgress({
    project_id: project.id,
    built: "Provider adapter behind a feature flag; both providers can charge.",
    next: "Shadow-run invoices against both providers for a week.",
  });

  await logDecision({
    project_id: project.id,
    decision: "Keep the legacy webhook path alive for 30 days",
    reason: "In-flight charges still send retries to the old endpoint.",
  });

  await logProgress({
    project_id: project.id,
    built: "Shadow mode recording both charge results and diffing them nightly.",
    broken: "Refund reconciliation double-counts partial refunds.",
    next: "Fix the reconciliation bug before any cutover.",
  });

  await logDecision({
    project_id: project.id,
    decision: "Cut over per merchant, not per day",
    reason: "A merchant-level rollback is one flag flip; a day-level one moves money we cannot replay.",
  });

  await recordBudget({ project_id: project.id, tokens_used: 79_000, token_limit: 100_000 });
  await recordBudget({ project_id: project.id, tokens_used: 85_000, token_limit: 100_000 });
  await recordBudget({ project_id: project.id, tokens_used: 91_000, token_limit: 100_000 });

  const projects = await listProjects();

  console.log(`Project:  ${project.name}`);
  console.log(`Id:       ${project.id}`);
  console.log(`Budget:   ${projects[0]?.latest_budget?.percent}% (${projects[0]?.latest_budget?.action})`);
  console.log(`Projects: ${projects.length} in the ledger\n`);

  if (!process.env.UPSTASH_REDIS_REST_URL && !process.env.KV_REST_API_URL) {
    console.log(
      "No Redis env vars found, so this seed only lived inside this process.\n" +
        "Set UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (or the KV_REST_API_* pair)\n" +
        "and run `npm run seed` again to persist it for the dashboard.",
    );
  } else {
    console.log("Persisted. Start the app and sign in at /dashboard with CONTEXT_LEDGER_API_KEY.");
  }
}

main().catch((error) => {
  console.error("Seed failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
