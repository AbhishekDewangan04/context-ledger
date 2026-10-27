import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { handleApiRequest } from "./routes";

const port = Number(process.env.PORT ?? 4000);

async function toWebRequest(request: IncomingMessage): Promise<Request> {
  const protocol = request.headers["x-forwarded-proto"]?.toString() ?? "http";
  const host = request.headers.host ?? `localhost:${port}`;
  const url = `${protocol}://${host}${request.url ?? "/"}`;
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }

  const method = request.method ?? "GET";
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return new Request(url, { method, headers });
  }

  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return new Request(url, {
    method,
    headers,
    body: chunks.length > 0 ? Buffer.concat(chunks) : undefined,
    duplex: "half",
  } as RequestInit & { duplex: "half" });
}

async function writeWebResponse(response: Response, target: ServerResponse): Promise<void> {
  target.statusCode = response.status;
  response.headers.forEach((value, key) => target.setHeader(key, value));

  if (!response.body) {
    target.end();
    return;
  }

  Readable.fromWeb(response.body as any).pipe(target);
}

const server = createServer(async (request, response) => {
  try {
    const webRequest = await toWebRequest(request);
    const webResponse = await handleApiRequest(webRequest);
    await writeWebResponse(webResponse, response);
  } catch (error) {
    console.error("[context-ledger] backend request failed", error);
    response.statusCode = 500;
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ error: "internal_error", message: "Unexpected server error." }));
  }
});

server.listen(port, () => {
  console.log(`[context-ledger] backend listening on http://localhost:${port}`);
});
