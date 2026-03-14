'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'company' | string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (userData: User, token?: string) => void;
  logout: () => void;
  isHydrated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Load user and token from localStorage after hydration
    const savedUser = localStorage.getItem('currentUser');
    const savedToken = localStorage.getItem('authToken');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    } else if (savedUser && !savedToken) {
      localStorage.removeItem('currentUser');
      setUser(null);
    }
    setIsHydrated(true);

    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = (userData: User, newToken?: string) => {
    setUser(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    if (newToken) {
      setToken(newToken);
      localStorage.setItem('authToken', newToken);
    }
  };

  const logout = async () => {
    try {
      // Import ApiService inside the function if not imported, or since we are in context, wait.
      // Wait, ApiService isn't imported in auth-context.tsx. I need to make sure I add the import.
      // Let's use fetch instead to be safe and simple, or just add the import at the top of the file!
      // Since replace_file_content handles one chunk, I'd need to use multi_replace for adding import. 
      // Actually, the API server just expects the Bearer token. 
      // I'll just clear the local storage and state, because the original code fetched a local logout endpoint.
      if (token) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
      }
    } catch (e) {
      console.error(e);
    }
    setUser(null);
    setToken(null);
    localStorage.clear();
    sessionStorage.clear();
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      login,
      logout,
      isHydrated
    }}>
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
