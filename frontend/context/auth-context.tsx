'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type UserRole = 'admin' | 'company';

interface AuthContextType {
  role: UserRole | null;
  setRole: (role: UserRole) => void;
  logout: () => void;
  isHydrated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Load role from localStorage after hydration
    const savedRole = localStorage.getItem('userRole') as UserRole | null;
    if (savedRole) {
      setRole(savedRole);
    }
    setIsHydrated(true);
  }, []);

  const handleSetRole = (newRole: UserRole) => {
    setRole(newRole);
    localStorage.setItem('userRole', newRole);
  };

  const logout = () => {
    setRole(null);
    localStorage.removeItem('userRole');
  };

  return (
    <AuthContext.Provider value={{ role, setRole: handleSetRole, logout, isHydrated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
