import type { Result, TokenPair } from "@/types";

const getBaseUrl = () => {
  const envBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return envBase?.replace(/\/$/, "") ?? "/api";
};

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type ApiFetchOptions = {
  method?: string;
  params?: Record<string, string | number | boolean | null | undefined>;
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
  skipAuthRedirect?: boolean;
};

const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";

export const tokenStorage = {
  save(pair: TokenPair) {
    sessionStorage.setItem(ACCESS_KEY, pair.accessToken);
    sessionStorage.setItem(REFRESH_KEY, pair.refreshToken);
  },
  accessToken: () => sessionStorage.getItem(ACCESS_KEY),
  refreshToken: () => sessionStorage.getItem(REFRESH_KEY),
  clear() {
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
  },
};

let refreshPromise: Promise<boolean> | null = null;

function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = tokenStorage.refreshToken();
      if (!refreshToken) return false;
      try {
        const response = await fetch(`${getBaseUrl()}/auth/token/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (!response.ok) return false;
        const payload = (await response.json()) as Result<TokenPair>;
        if (!payload.success || !payload.data) return false;
        tokenStorage.save(payload.data);
        return true;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

export async function apiFetch<TResponse>(path: string, options: ApiFetchOptions = {}): Promise<TResponse> {
  return doFetch(path, options, true);
}

async function doFetch<TResponse>(
  path: string,
  options: ApiFetchOptions,
  allowRetry: boolean
): Promise<TResponse> {
  const baseUrl = getBaseUrl();
  const { method = "GET", params, headers = {}, body, signal, skipAuthRedirect = false } = options;

  const mergedHeaders: Record<string, string> = { ...headers };
  const accessToken = tokenStorage.accessToken();
  if (accessToken) {
    mergedHeaders["authorization"] = `Bearer ${accessToken}`;
  }

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (!isFormData && body !== undefined && !("Content-Type" in mergedHeaders)) {
    mergedHeaders["Content-Type"] = "application/json";
  }

  let query = "";
  if (params) {
    const pairs: string[] = [];
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== undefined && value !== null && value !== "") {
        pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
      }
    });
    if (pairs.length) query = `?${pairs.join("&")}`;
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}${query}`, {
      method,
      headers: mergedHeaders,
      body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
      signal,
      credentials: "include"
    });
  } catch {
    throw new ApiError(0, "服务器异常");
  }

  if (!response.ok) {
    if (response.status === 401) {
      if (allowRetry && (await tryRefresh())) {
        return doFetch(path, options, false);
      }
      tokenStorage.clear();
      if (!skipAuthRedirect) {
        window.setTimeout(() => {
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }, 200);
      }
      throw new ApiError(401, "请先登录");
    }
    throw new ApiError(response.status, "服务器异常");
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return (await response.text()) as unknown as TResponse;
  }

  const payload = (await response.json()) as Result<TResponse>;
  if (!payload.success) {
    throw new ApiError(response.status, payload.errorMsg || "操作失败");
  }
  return payload.data as TResponse;
}
