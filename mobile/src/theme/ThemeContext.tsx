import React, { createContext, useContext, useRef, useState } from 'react';
import { ColorPalette, darkColors } from './colors';

export type UserRole = 'customer' | 'artisan' | 'admin';

interface ThemeContextType {
  /** Always true. The app is dark-only; kept so legacy components compile. */
  isDarkMode: boolean;
  /** No-op. Kept so legacy components compile; there is no light palette. */
  toggleTheme: () => void;
  colors: ColorPalette;
  role: UserRole;
  setRole: (role: UserRole) => void;
  token: string | null;
  user: any | null;
  loginSession: (token: string, user: any) => void;
  logoutSession: () => void;
  /** Whether the sign-in / sign-up modal is showing. */
  authVisible: boolean;
  openAuth: () => void;
  closeAuth: () => void;
  /**
   * Gate for anything that needs an account. Signed in: runs `action` now.
   * Signed out: opens sign-in and runs `action` once the user has logged in.
   * `action` must not close over `token` — it is still null when captured.
   * It is dropped if they dismiss sign-in or log in under a different role.
   */
  requireAuth: (action?: () => void) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: true,
  toggleTheme: () => {},
  colors: darkColors,
  role: 'customer',
  setRole: () => {},
  token: null,
  user: null,
  loginSession: () => {},
  logoutSession: () => {},
  authVisible: false,
  openAuth: () => {},
  closeAuth: () => {},
  requireAuth: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('customer');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [authVisible, setAuthVisible] = useState(false);
  const pendingAuthAction = useRef<{ role: UserRole; run: () => void } | null>(null);

  const toggleTheme = () => {
    // Dark-only for now. No light branch.
  };

  const loginSession = (newToken: string, newUser: any) => {
    setToken(newToken);
    setUser(newUser);
    if (newUser?.role) {
      setRole(newUser.role);
    }
    const pending = pendingAuthAction.current;
    pendingAuthAction.current = null;
    if (pending && (newUser?.role ?? role) === pending.role) {
      pending.run();
    }
  };

  const openAuth = () => setAuthVisible(true);

  const closeAuth = () => {
    pendingAuthAction.current = null;
    setAuthVisible(false);
  };

  const requireAuth = (action?: () => void) => {
    if (token) {
      action?.();
      return;
    }
    pendingAuthAction.current = action ? { role, run: action } : null;
    setAuthVisible(true);
  };

  const logoutSession = () => {
    setToken(null);
    setUser(null);
    setRole('customer');
  };

  const colors = darkColors;

  return (
    <ThemeContext.Provider value={{
      isDarkMode: true,
      toggleTheme,
      colors,
      role,
      setRole,
      token,
      user,
      loginSession,
      logoutSession,
      authVisible,
      openAuth,
      closeAuth,
      requireAuth,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
