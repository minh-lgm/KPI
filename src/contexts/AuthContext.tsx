'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Hardcoded credentials - change these as needed
const VALID_CREDENTIALS = {
  username: 'minhlgm',
  password: '4hchkp9ziu7e'
};

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    // Check localStorage on mount
    const stored = localStorage.getItem('kpi_auth');
    if (stored) {
      try {
        const { username, expiry } = JSON.parse(stored);
        if (expiry > Date.now()) {
          setIsAuthenticated(true);
          setUsername(username);
        } else {
          localStorage.removeItem('kpi_auth');
        }
      } catch {
        localStorage.removeItem('kpi_auth');
      }
    }
  }, []);

  const login = (inputUsername: string, inputPassword: string): boolean => {
    if (inputUsername === VALID_CREDENTIALS.username && inputPassword === VALID_CREDENTIALS.password) {
      setIsAuthenticated(true);
      setUsername(inputUsername);
      // Store with 24h expiry
      localStorage.setItem('kpi_auth', JSON.stringify({
        username: inputUsername,
        expiry: Date.now() + 24 * 60 * 60 * 1000
      }));
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUsername(null);
    localStorage.removeItem('kpi_auth');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
