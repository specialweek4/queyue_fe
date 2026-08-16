import type { Result } from "@/types";

/**
 * 趣评雀 API 客户端
 *
 * 沿用 hmdp 前端（nginx/html/hmdp/js/common.js）的调用约定：
 * - 基地址 /api（生产环境经 nginx 转发到 8081，开发环境由 Vite 代理）
 * - token 保存在 sessionStorage("token")，以 authorization 请求头携带
 * - 后端统一返回 Result{success, errorMsg, data, total}：
 *   success=false 时以 errorMsg 作为错误信息 reject；
 *   success=true 时直接 resolve data 字段
 * - 401 视为未登录：清除 token 并跳转登录页
 * - 查询参数序列化时跳过空值（hmdp 的 paramsSerializer 约定）
 */

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
  /** 查询参数，序列化时跳过空值 */
  params?: Record<string, string | number | boolean | null | undefined>;
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
  /** 401 时是否跳过“跳转登录页”处理（用于静默探测登录态） */
  skipAuthRedirect?: boolean;
};

export async function apiFetch<TResponse>(path: string, options: ApiFetchOptions = {}): Promise<TResponse> {
  const baseUrl = getBaseUrl();
  const { method = "GET", params, headers = {}, body, signal, skipAuthRedirect = false } = options;

  // token 注入请求头（hmdp 约定：config.headers['authorization'] = token）
  const mergedHeaders: Record<string, string> = { ...headers };
  if (typeof window !== "undefined") {
    const token = sessionStorage.getItem("token");
    if (token) mergedHeaders["authorization"] = token;
  }

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (!isFormData && body !== undefined && !("Content-Type" in mergedHeaders)) {
    mergedHeaders["Content-Type"] = "application/json";
  }

  // 序列化查询参数：跳过空值（hmdp paramsSerializer 约定）
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
      sessionStorage.removeItem("token");
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
