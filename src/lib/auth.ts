import { httpPost } from "./http";

export type Role = "ADMIN" | "USER" | "LEGAL_PRACTITIONER" | "DEAL_MAKER";
export type RegistrationRole = Extract<Role, "LEGAL_PRACTITIONER" | "DEAL_MAKER">;

export interface AuthSession {
  clientId: number;
  email: string;
  fullName: string;
  role: Role;
  token: string;
}

const STORAGE_KEY = "alis.session";
// Standalone token mirror so anything outside React (axios interceptor) can read it.
const TOKEN_KEY = "alis.token";

export function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function storeSession(s: AuthSession | null) {
  if (s) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    localStorage.setItem(TOKEN_KEY, s.token);
  } else {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }
}

export async function login(email: string, password: string): Promise<AuthSession> {
  const data = await httpPost<{
    success?: boolean;
    message?: string;
    clientId: number;
    email: string;
    fullName: string;
    role: Role;
    token: string;
  }>("/api/auth/login", { email, password });
  if (!data.token) throw new Error(data.message || "Login failed");
  return {
    clientId: data.clientId,
    email: data.email,
    fullName: data.fullName,
    role: data.role,
    token: data.token,
  };
}

// src/lib/auth.ts (add or update)

export async function register(input: {
  fullName: string;
  email: string;
  password: string;
  role: RegistrationRole;
  companyName?: string;
  dealSpecialty?: string;
  barNumber?: string;
  lawFirm?: string;
}): Promise<void> {
  await httpPost("/api/auth/register", input);
}

/** Compatibility helper used by older pages — proxies to axios. */
export async function apiFetch<T>(path: string, init: RequestInit & { auth?: boolean } = {}): Promise<T> {
  const { httpGet, httpPost, httpPut, httpDelete } = await import("./http");
  const method = (init.method || "GET").toUpperCase();
  const body = init.body ? JSON.parse(init.body as string) : undefined;
  if (method === "GET") return httpGet<T>(path);
  if (method === "POST") return httpPost<T>(path, body);
  if (method === "PUT") return httpPut<T>(path, body);
  if (method === "DELETE") return httpDelete<T>(path);
  throw new Error(`Unsupported method ${method}`);
}
