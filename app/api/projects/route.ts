import {
  isAuthorizedRequest,
  ledgerErrorResponse,
  listProjects,
  unauthorizedResponse,
} from "@/lib/ledger";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const rateLimited = await rateLimit(request, { limit: 120, prefix: "projects" });
  if (rateLimited) return rateLimited;

  if (!isAuthorizedRequest(request)) return unauthorizedResponse();

  try {
    const projects = await listProjects();
    return Response.json({ projects }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return ledgerErrorResponse(error);
  }
}