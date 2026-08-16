import { apiFetch } from "./apiClient";
import type { LoginForm, UserDTO, User, UserInfo } from "@/types";

/** 用户相关接口（对应 qupingque_be UserController） */
export const userService = {
  /** 发送手机验证码 */
  sendCode: (phone: string) =>
    apiFetch<void>("/user/code", {
      method: "POST",
      params: { phone }
    }),

  /** 登录（验证码或密码），成功返回 token 字符串 */
  login: (form: LoginForm) =>
    apiFetch<string>("/user/login", {
      method: "POST",
      body: form
    }),

  /** 登出 */
  logout: () =>
    apiFetch<void>("/user/logout", {
      method: "POST"
    }),

  /** 查询当前登录用户 */
  me: (skipAuthRedirect = false) =>
    apiFetch<UserDTO>("/user/me", { skipAuthRedirect }),

  /** 查询用户详情（首次查看可能为空） */
  info: (userId: number) => apiFetch<UserInfo | null>(`/user/info/${userId}`),

  /** 按 id 查询用户（other-info 页约定） */
  byId: (userId: number) => apiFetch<User>(`/user/${userId}`),

  /** 更新用户详情（与后端约定的扩展接口） */
  updateInfo: (payload: Partial<UserInfo>) =>
    apiFetch<void>("/user-info", {
      method: "PUT",
      body: payload
    })
};
