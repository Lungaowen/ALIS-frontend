// Centralized axios instance for ALIS backend.
// - Reads base URL via getApiBaseUrl() on every request (runtime override support)
// - Attaches Bearer JWT from localStorage
// - On 401: clears session and redirects to /login
// - On 403: surfaces an "AlisForbiddenError" so callers can show inline messaging
import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { getApiBaseUrl } from "./api";
import { getStoredSession, storeSession } from "./auth";

export class AlisForbiddenError extends Error {
  status = 403 as const;
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
  }
}

export class AlisApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
  }
}

export const http = axios.create({ timeout: 60_000 });

http.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl().replace(/\/+$/, "");
  const session = getStoredSession();
  if (session?.token && config.headers) {
    config.headers.set("Authorization", `Bearer ${session.token}`);
  }
  return config;
});

function extractMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "message" in (data as Record<string, unknown>)) {
    const m = (data as { message: unknown }).message;
    if (typeof m === "string" && m.length > 0) return m;
  }
  if (typeof data === "string" && data.length > 0 && data.length < 500) return data;
  return fallback;
}

http.interceptors.response.use(
  (r) => r,
  (error: AxiosError) => {
    const status = error.response?.status ?? 0;
    const data = error.response?.data;
    if (status === 401) {
      storeSession(null);
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
      return Promise.reject(new AlisApiError(401, "Your session has expired. Please sign in again."));
    }
    if (status === 403) {
      return Promise.reject(new AlisForbiddenError(extractMessage(data, "You do not have permission for this action.")));
    }
    return Promise.reject(
      new AlisApiError(status, extractMessage(data, error.message || "Request failed"), data)
    );
  }
);

// Convenience helpers (typed)
export async function httpGet<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
  const r = await http.get<T>(path, config);
  return r.data;
}
export async function httpPost<T>(path: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const r = await http.post<T>(path, body, config);
  return r.data;
}
export async function httpPut<T>(path: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const r = await http.put<T>(path, body, config);
  return r.data;
}
export async function httpDelete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
  const r = await http.delete<T>(path, config);
  return r.data;
}
export async function httpPatch<T>(path: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const r = await http.patch<T>(path, body, config);
  return r.data;
}

