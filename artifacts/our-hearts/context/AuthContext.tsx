import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { register, login, getMe, getCouple } from "@workspace/api-client-react";
import type { User, Couple, RegisterInput, LoginInput } from "@workspace/api-client-react";

interface AuthContextType {
  token: string | null;
  user: User | null;
  couple: Couple | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCouple: boolean;
  loginUser: (input: LoginInput) => Promise<void>;
  registerUser: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshCouple: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "our_hearts_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    setAuthTokenGetter(() => tokenRef.current);
  }, []);

  const refreshCouple = useCallback(async () => {
    if (!tokenRef.current) return;
    try {
      const c = await getCouple();
      setCouple(c);
    } catch {
      setCouple(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!tokenRef.current) return;
    try {
      const u = await getMe();
      setUser(u);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        if (storedToken) {
          tokenRef.current = storedToken;
          setToken(storedToken);
          const u = await getMe();
          setUser(u);
          try {
            const c = await getCouple();
            setCouple(c);
          } catch {
            setCouple(null);
          }
        }
      } catch {
        await AsyncStorage.removeItem(TOKEN_KEY);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const loginUser = useCallback(async (input: LoginInput) => {
    const res = await login({ data: input });
    tokenRef.current = res.token;
    setToken(res.token);
    setUser(res.user);
    await AsyncStorage.setItem(TOKEN_KEY, res.token);
    try {
      const c = await getCouple();
      setCouple(c);
    } catch {
      setCouple(null);
    }
  }, []);

  const registerUser = useCallback(async (input: RegisterInput) => {
    const res = await register({ data: input });
    tokenRef.current = res.token;
    setToken(res.token);
    setUser(res.user);
    await AsyncStorage.setItem(TOKEN_KEY, res.token);
    setCouple(null);
  }, []);

  const logout = useCallback(async () => {
    tokenRef.current = null;
    setToken(null);
    setUser(null);
    setCouple(null);
    await AsyncStorage.removeItem(TOKEN_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{
      token,
      user,
      couple,
      isLoading,
      isAuthenticated: !!token && !!user,
      hasCouple: !!couple,
      loginUser,
      registerUser,
      logout,
      refreshCouple,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
