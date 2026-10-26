import {
  authErrorResponse,
  authenticateRequest,
  listProjects,
  withObservability,
} from "@/lib/ledger";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return withObservability(request, async () => {
    const rateLimited = await rateLimit(request, { limit: 120, prefix: "projects" });
    if (rateLimited) return rateLimited;

    const auth = authenticateRequest(request);
    if (!auth.ok) return authErrorResponse(auth);

    const projects = await listProjects();
    return Response.json({ projects }, { headers: { "Cache-Control": "no-store" } });
  });
}