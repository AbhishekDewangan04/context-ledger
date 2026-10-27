import {
  LedgerError,
  archiveProject,
  authErrorResponse,
  authenticateRequest,
  buildHandoffSummary,
  getProject,
  getProjectDetail,
  getStorageType,
  ledgerErrorResponse,
  listProjects,
  sanitizeFilename,
  withObservability,
} from "../services/ledger";
import { rateLimit } from "../auth/rate-limit";

export async function healthRoute(request: Request): Promise<Response> {
  return withObservability(request, async () =>
    Response.json({ ok: true, storage: getStorageType() }),
  );
}

export async function projectsRoute(request: Request): Promise<Response> {
  return withObservability(request, async () => {
    const rateLimited = await rateLimit(request, { limit: 120, prefix: "projects" });
    if (rateLimited) return rateLimited;

    const auth = authenticateRequest(request);
    if (!auth.ok) return authErrorResponse(auth);

    const projects = await listProjects();
    return Response.json({ projects }, { headers: { "Cache-Control": "no-store" } });
  });
}

export async function projectDetailRoute(request: Request, id: string): Promise<Response> {
  return withObservability(request, async () => {
    const rateLimited = await rateLimit(request, { limit: 120, prefix: "projects" });
    if (rateLimited) return rateLimited;

    const auth = authenticateRequest(request);
    if (!auth.ok) return authErrorResponse(auth);

    const detail = await getProjectDetail(id);
    return Response.json(detail, { headers: { "Cache-Control": "no-store" } });
  });
}

export async function archiveRoute(request: Request, id: string): Promise<Response> {
  return withObservability(request, async () => {
    const rateLimited = await rateLimit(request, { limit: 120, prefix: "projects" });
    if (rateLimited) return rateLimited;

    const auth = authenticateRequest(request);
    if (!auth.ok) return authErrorResponse(auth);

    const project = await archiveProject(id);
    return Response.json({ ok: true, project }, { headers: { "Cache-Control": "no-store" } });
  });
}

export async function exportRoute(request: Request, id: string): Promise<Response> {
  return withObservability(request, async () => {
    const rateLimited = await rateLimit(request, { limit: 120, prefix: "projects" });
    if (rateLimited) return rateLimited;

    const auth = authenticateRequest(request);
    if (!auth.ok) return authErrorResponse(auth);

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

export function internalErrorResponse(error: unknown): Response {
  return ledgerErrorResponse(error);
}
