const DEFAULT_BACKEND_URL = "http://localhost:4000";

export function getBackendUrl(): string {
  const configured = process.env.NEXT_PUBLIC_BACKEND_URL;
  return (configured || DEFAULT_BACKEND_URL).replace(/\/+$/, "");
}

export function backendPath(path: string): string {
  return `${getBackendUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
