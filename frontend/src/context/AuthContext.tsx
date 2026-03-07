import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../api/auth';
import { usersApi } from '../api/users';
import { User, LoginCredentials } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          // Decode JWT to get user email/id
          const payload = JSON.parse(atob(token.split('.')[1]));
          const userData = await usersApi.getByIdentifier(payload.email || payload.sub);
          setUser(userData);
        } catch (error) {
          console.error('Failed to restore auth:', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const tokens = await authApi.login(credentials);
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    
    // Decode JWT to get user info
    const payload = JSON.parse(atob(tokens.access_token.split('.')[1]));
    const userData = await usersApi.getByIdentifier(payload.email || payload.sub);
    setUser(userData);
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
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
