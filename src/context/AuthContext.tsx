import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, ApiClientError, setAccessToken, getAccessToken, setUnauthorizedHandler } from '../lib/api';

export type Role = 'student' | 'teacher' | 'school_admin' | 'lab_incharge' | 'super_admin';

export interface StudentProfile {
  class_num: number;
  section: string;
  batch_id: number;
  avatar: string;
  xp: number;
  streak: number;
}

export interface AuthUser {
  id: string;
  role: Role;
  school_id: string | null;
  full_name: string;
  student_profiles: StudentProfile | null;
}

interface LoginResponse {
  accessToken: string;
  role: Role;
  schoolId: string | null;
  fullName: string;
  redirectPath: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<string>; // returns redirectPath
  pinLogin: (schoolCode: string, studentId: string, pin: string) => Promise<string>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      return;
    }
    try {
      const me = await api.get<AuthUser>('/auth/me');
      setUser(me);
    } catch {
      // Token expired/invalid — a lab-period-scoped session naturally does
      // this; just drop back to logged-out rather than surfacing an error.
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // api.ts can't reach into React state directly — it calls this whenever
  // ANY request (not just the once-on-load check above) comes back 401, so a
  // token that dies mid-session drops the user back to logged-out too,
  // instead of leaving whatever page they were on stuck showing a raw error.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.post<LoginResponse>('/auth/login', { email, password }, { skipAuth: true });
    setAccessToken(result.accessToken);
    await refreshUser();
    return result.redirectPath;
  }, [refreshUser]);

  const pinLogin = useCallback(async (schoolCode: string, studentId: string, pin: string) => {
    const result = await api.post<LoginResponse>('/auth/pin-login', { schoolCode, studentId, pin }, { skipAuth: true });
    setAccessToken(result.accessToken);
    await refreshUser();
    return result.redirectPath;
  }, [refreshUser]);

  const logout = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, pinLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export function friendlyAuthError(err: unknown): string {
  if (err instanceof ApiClientError) return err.message;
  return 'Something went wrong — please try again.';
}
