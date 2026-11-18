import { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthContext } from './authContextDef';
import {
  getAuthToken,
  getAuthUser,
  setAuthSession,
  clearAuthSession,
  loginAdmin,
  logoutAdmin,
} from '@/services/apiClient';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getAuthToken());
  const [user, setUser] = useState(() => getAuthUser());
  const [isLoading, setIsLoading] = useState(false);

  // Sync state if unauthorized event is fired
  useEffect(() => {
    const handleUnauthorized = () => {
      setToken('');
      setUser(null);
      clearAuthSession();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      const res = await loginAdmin(email, password);
      if (res?.token && res?.user) {
        setToken(res.token);
        setUser(res.user);
        return res;
      }
      throw new Error('Invalid response from authentication server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await logoutAdmin();
    } finally {
      setToken('');
      setUser(null);
      clearAuthSession();
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      isLoading,
      login,
      logout,
      setSession: (newToken, newUser) => {
        setToken(newToken);
        setUser(newUser);
        setAuthSession(newToken, newUser);
      },
    }),
    [token, user, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
