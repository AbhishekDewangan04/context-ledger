import {
  authErrorResponse,
  authenticateRequest,
  getProjectDetail,
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
    const detail = await getProjectDetail(id);
    return Response.json(detail, { headers: { "Cache-Control": "no-store" } });
  });
}