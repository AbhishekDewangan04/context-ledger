import {
  LedgerError,
  authErrorResponse,
  authenticateRequest,
  buildHandoffSummary,
  getProject,
  sanitizeFilename,
  withObservability,
} from "@/lib/ledger";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  return withObservability(request, async () => {
    const rateLimited = await rateLimit(request, { limit: 120, prefix: "projects" });
    if (rateLimited) return rateLimited;

    const auth = authenticateRequest(request);
    if (!auth.ok) return authErrorResponse(auth);

    const { id } = await context.params;
    const project = await getProject(id);
    if (project.archived) {
      throw new LedgerError("not_found", `Project "${project.id}" has been archived.`);
    }

    const markdown = buildHandoffSummary(project);
    const filename = `${sanitizeFilename(project.name)}.md`;

    return new Response(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  });
}
