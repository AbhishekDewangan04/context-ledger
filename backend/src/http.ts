function allowedOrigins(): string[] {
  return [process.env.FRONTEND_ORIGIN, process.env.CORS_ALLOWED_ORIGINS]
    .filter(Boolean)
    .flatMap((value) => value!.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

export function corsResponse(request: Request, response: Response): Response {
  const origin = request.headers.get("origin");
  const allowed = origin && allowedOrigins().includes(origin) ? origin : null;
  const headers = new Headers(response.headers);

  if (allowed) {
    headers.set("Access-Control-Allow-Origin", allowed);
    headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept");
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set("Vary", "Origin");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function corsOptions(request: Request): Response {
  return corsResponse(request, new Response(null, { status: 204 }));
}

export function jsonNotFound(request: Request): Response {
  return corsResponse(
    request,
    Response.json({ error: "not_found", message: "Route not found." }, { status: 404 }),
  );
}
