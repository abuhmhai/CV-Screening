"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { apiFetch } from "./api-client";
import { AuthUser, LoginResponse } from "./types";

const TOKEN_KEY = "cv_access_token";
const USER_KEY = "cv_user";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  demoLogin: (email: string) => Promise<string | null>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchMe(token: string): Promise<AuthUser | null> {
  const result = await apiFetch<{ user: AuthUser }>("/auth/me", { token });
  return result.ok && result.data?.user ? result.data.user : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const persistSession = useCallback((accessToken: string, authUser: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(authUser));
    setToken(accessToken);
    setUser(authUser);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) return;
    const me = await fetchMe(storedToken);
    if (me) {
      localStorage.setItem(USER_KEY, JSON.stringify(me));
      setUser(me);
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser) as AuthUser);
      void fetchMe(storedToken).then((me) => {
        if (me) {
          localStorage.setItem(USER_KEY, JSON.stringify(me));
          setUser(me);
        } else {
          clearSession();
        }
        setLoading(false);
      });
      return;
    }
    setLoading(false);
  }, [clearSession]);

  const applyTokens = useCallback(
    async (payload: LoginResponse) => {
      const me = await fetchMe(payload.accessToken);
      if (!me) return "Không lấy được thông tin tài khoản";
      persistSession(payload.accessToken, me);
      return null;
    },
    [persistSession]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      if (!result.ok || !result.data) return result.error ?? "Đăng nhập thất bại";
      return applyTokens(result.data);
    },
    [applyTokens]
  );

  const demoLogin = useCallback(
    async (email: string) => {
      const result = await apiFetch<LoginResponse>(
        `/auth/demo-login?email=${encodeURIComponent(email)}`
      );
      if (!result.ok || !result.data) return result.error ?? "Demo login thất bại";
      return applyTokens(result.data);
    },
    [applyTokens]
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({ user, token, loading, login, demoLogin, logout, refreshUser }),
    [user, token, loading, login, demoLogin, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
