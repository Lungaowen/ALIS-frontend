// Central API base URL configuration with runtime override.
// Resolution order:
//   1. localStorage["alis.apiBaseUrl"]   (set via the in-app dialog)
//   2. import.meta.env.VITE_API_BASE_URL (build-time)
//   3. "http://localhost:8081"           (fallback)

const STORAGE_KEY = "alis.apiBaseUrl";
const ENV_DEFAULT =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8081";

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const override = window.localStorage.getItem(STORAGE_KEY);
    if (override) return override;
  }
  return ENV_DEFAULT;
}

export function setApiBaseUrl(url: string | null) {
  if (typeof window === "undefined") return;
  if (!url) window.localStorage.removeItem(STORAGE_KEY);
  else window.localStorage.setItem(STORAGE_KEY, url.replace(/\/+$/, ""));
}

export const API_BASE_URL = getApiBaseUrl();

/**
 * Build a full API URL from a path. Reads the current base URL on every call
 * so runtime overrides take effect without a reload.
 */
export function apiUrl(path: string): string {
  const base = getApiBaseUrl().replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}
