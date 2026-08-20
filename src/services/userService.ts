import { apiFetch } from "./apiClient";
import type { LoginForm, UserDTO, User, UserInfo, SignCount, TokenPair, RegisterForm, ResetPasswordForm } from "@/types";

export const userService = {
  sendCode: (phone: string, scene = "login") =>
    apiFetch<void>("/user/code", {
      method: "POST",
      params: { phone, scene }
    }),

  login: (form: LoginForm) =>
    apiFetch<TokenPair>("/auth/login", {
      method: "POST",
      body: form
    }),

  register: (form: RegisterForm) =>
    apiFetch<TokenPair>("/auth/register", {
      method: "POST",
      body: form
    }),

  resetPassword: (form: ResetPasswordForm) =>
    apiFetch<void>("/auth/password/reset", {
      method: "POST",
      body: form
    }),

  logout: (refreshToken: string) =>
    apiFetch<void>("/auth/logout", {
      method: "POST",
      body: { refreshToken }
    }),

  me: (skipAuthRedirect = false) =>
    apiFetch<UserDTO>("/auth/me", { skipAuthRedirect }),

  info: (userId: number) => apiFetch<UserInfo | null>(`/user/info/${userId}`),

  byId: (userId: number) => apiFetch<User>(`/user/${userId}`),

  sign: () =>
    apiFetch<void>("/user/sign", {
      method: "PUT"
    }),

  signCount: () => apiFetch<SignCount>("/user/sign/count"),

  updateInfo: (payload: Partial<UserInfo>) =>
    apiFetch<void>("/user-info", {
      method: "PUT",
      body: payload
    })
};
