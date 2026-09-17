import React, { createContext, useContext, useState, useEffect } from 'react';
import { ColorPalette, lightColors, darkColors } from './colors';

export type UserRole = 'customer' | 'artisan' | 'admin';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  colors: ColorPalette;
  role: UserRole;
  setRole: (role: UserRole) => void;
  token: string | null;
  user: any | null;
  loginSession: (token: string, user: any) => void;
  logoutSession: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: () => {},
  colors: lightColors,
  role: 'customer',
  setRole: () => {},
  token: null,
  user: null,
  loginSession: () => {},
  logoutSession: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [role, setRole] = useState<UserRole>('customer');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const loginSession = (newToken: string, newUser: any) => {
    setToken(newToken);
    setUser(newUser);
    if (newUser?.role) {
      setRole(newUser.role);
    }
  };

  const logoutSession = () => {
    setToken(null);
    setUser(null);
    setRole('customer');
  };

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{
      isDarkMode,
      toggleTheme,
      colors,
      role,
      setRole,
      token,
      user,
      loginSession,
      logoutSession,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
