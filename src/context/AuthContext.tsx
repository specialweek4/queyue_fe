import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { tokenStorage } from "@/services/apiClient";
import { userService } from "@/services/userService";
import type { LoginForm, UserDTO, RegisterForm } from "@/types";

type AuthContextValue = {
  user: UserDTO | null;
  loading: boolean;
  login: (form: LoginForm) => Promise<void>;
  register: (form: RegisterForm) => Promise<void>;
  sendCode: (phone: string, scene?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const probe = async () => {
      if (!tokenStorage.accessToken()) {
        setLoading(false);
        return;
      }
      try {
        const me = await userService.me(true);
        if (!cancelled) setUser(me);
      } catch {
        tokenStorage.clear();
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
      const pair = await userService.login(form);
      tokenStorage.save(pair);
      const me = await userService.me();
      setUser(me);
    },
    []
  );

  const register = useCallback(
    async (form: RegisterForm) => {
      const pair = await userService.register(form);
      tokenStorage.save(pair);
      const me = await userService.me();
      setUser(me);
    },
    []
  );

  const sendCode = useCallback(async (phone: string, scene?: string) => {
    await userService.sendCode(phone, scene);
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = tokenStorage.refreshToken();
      if (refreshToken) {
        await userService.logout(refreshToken);
      }
    } catch {
    } finally {
      tokenStorage.clear();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, sendCode, logout, refreshUser }),
    [user, loading, login, register, sendCode, logout, refreshUser]
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
