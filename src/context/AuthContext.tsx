import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { userService } from "@/services/userService";
import type { LoginForm, UserDTO } from "@/types";

type AuthContextValue = {
  /** 当前登录用户（未登录为 null） */
  user: UserDTO | null;
  /** 首次登录态探测是否完成 */
  loading: boolean;
  /** 验证码/密码登录：成功后保存 token 并刷新用户信息 */
  login: (form: LoginForm) => Promise<void>;
  /** 发送登录验证码 */
  sendCode: (phone: string) => Promise<void>;
  /** 登出：调用后端并清理本地 token */
  logout: () => Promise<void>;
  /** 重新拉取当前登录用户 */
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const TOKEN_KEY = "token";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);

  // 应用启动时探测登录态（沿用 hmdp 约定：token 存于 sessionStorage）
  useEffect(() => {
    let cancelled = false;
    const probe = async () => {
      if (!sessionStorage.getItem(TOKEN_KEY)) {
        setLoading(false);
        return;
      }
      try {
        const me = await userService.me(true);
        if (!cancelled) setUser(me);
      } catch {
        sessionStorage.removeItem(TOKEN_KEY);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void probe();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await userService.me();
    setUser(me);
  }, []);

  const login = useCallback(
    async (form: LoginForm) => {
      const token = await userService.login(form);
      if (token) {
        sessionStorage.setItem(TOKEN_KEY, token);
      }
      const me = await userService.me();
      setUser(me);
    },
    []
  );

  const sendCode = useCallback(async (phone: string) => {
    await userService.sendCode(phone);
  }, []);

  const logout = useCallback(async () => {
    try {
      await userService.logout();
    } catch {
      // 后端 logout 暂未实现时也继续本地清理
    } finally {
      sessionStorage.removeItem(TOKEN_KEY);
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, sendCode, logout, refreshUser }),
    [user, loading, login, sendCode, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth 必须在 AuthProvider 内使用");
  }
  return ctx;
}
