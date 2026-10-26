import { getStorageType, withObservability } from "@/lib/ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return withObservability(request, async () => {
    return Response.json({
      ok: true,
      storage: getStorageType(),
    });
  });
}
