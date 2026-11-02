'use client';

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';
import { User, UserRole } from '@/types';
import { AuthService, LoginCredentials, RegisterData } from './auth.service';
import { localStorageAdapter } from '@/lib/storage/local-storage.adapter';
import { STORAGE_KEYS } from '@/lib/storage/storage.keys';
import { initializeSeedData } from '@/data/seed';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [, startTransition] = useTransition();

  const loadActiveUser = () => {
    initializeSeedData(false);
    const user = AuthService.getCurrentUser();
    startTransition(() => {
      setCurrentUser(user);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    loadActiveUser();

    // Listen to session storage changes
    const unsubscribeSession = localStorageAdapter.subscribe(STORAGE_KEYS.SESSION, () => {
      loadActiveUser();
    });

    const unsubscribeUsers = localStorageAdapter.subscribe(STORAGE_KEYS.USERS, () => {
      loadActiveUser();
    });

    return () => {
      unsubscribeSession();
      unsubscribeUsers();
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const res = AuthService.login(credentials);
    if (res.success && res.user) {
      setCurrentUser(res.user);
    }
    return res;
  };

  const register = async (data: RegisterData) => {
    const res = AuthService.register(data);
    if (res.success && res.user) {
      setCurrentUser(res.user);
    }
    return res;
  };

  const logout = () => {
    AuthService.logout();
    setCurrentUser(null);
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!currentUser) return false;
    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.includes(currentUser.role);
  };

  const refreshUser = () => {
    loadActiveUser();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        register,
        logout,
        hasRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

