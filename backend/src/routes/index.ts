import { corsOptions, corsResponse, jsonNotFound } from "../http";
import { handleMcpRequest } from "../mcp/server";
import {
  archiveRoute,
  exportRoute,
  healthRoute,
  internalErrorResponse,
  projectDetailRoute,
  projectsRoute,
} from "./api";

function projectPath(pathname: string): { id: string; action?: "archive" | "export" } | null {
  const match = /^\/api\/projects\/([^/]+)(?:\/(archive|export))?$/.exec(pathname);
  if (!match) return null;
  return {
    id: decodeURIComponent(match[1]),
    action: match[2] as "archive" | "export" | undefined,
  };
}

export async function handleApiRequest(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return corsOptions(request);

  try {
    const pathname = new URL(request.url).pathname;

    if (pathname === "/api/health" && request.method === "GET") {
      return corsResponse(request, await healthRoute(request));
    }

    if (pathname === "/api/projects" && request.method === "GET") {
      return corsResponse(request, await projectsRoute(request));
    }

    if (pathname === "/api/mcp" && (request.method === "GET" || request.method === "POST")) {
      return corsResponse(request, await handleMcpRequest(request));
    }

    const project = projectPath(pathname);
    if (project) {
      if (!project.action && request.method === "GET") {
        return corsResponse(request, await projectDetailRoute(request, project.id));
      }
      if (project.action === "archive" && request.method === "POST") {
        return corsResponse(request, await archiveRoute(request, project.id));
      }
      if (project.action === "export" && request.method === "GET") {
        return corsResponse(request, await exportRoute(request, project.id));
      }
    }

    return jsonNotFound(request);
  } catch (error) {
    return corsResponse(request, internalErrorResponse(error));
  }
}
