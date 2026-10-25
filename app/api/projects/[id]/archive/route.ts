import {
  archiveProject,
  isAuthorizedRequest,
  ledgerErrorResponse,
  unauthorizedResponse,
} from "@/lib/ledger";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const rateLimited = await rateLimit(request, { limit: 120, prefix: "projects" });
  if (rateLimited) return rateLimited;

  if (!isAuthorizedRequest(request)) return unauthorizedResponse();

  try {
    const { id } = await context.params;
    const project = await archiveProject(id);
    return Response.json({ ok: true, project }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return ledgerErrorResponse(error);
  }
}
