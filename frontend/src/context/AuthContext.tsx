import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      if (!token) {
        setLoading(false);
        return;
      }
      const userData = await authService.getCurrentUser(token);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      // Token is invalid, clear it
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  // The `try { ... } catch (error) { throw error; }` wrappers that used to be here were
  // removed (eslint no-useless-catch). Rethrowing an error unchanged is exactly what an
  // absent catch does, so behaviour is identical -- and the wrapper was actively worse
  // than nothing: it looked like error handling at a glance while adding none, and it
  // truncated nothing but invited someone to "improve" it into a swallow later. Callers
  // (LoginPage / RegisterPage) still receive the same rejected promise.
  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await authService.register(email, password, name);
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    authService.logout();
    localStorage.removeItem('user');
  };

  useEffect(() => {
    // Check if user is already logged in on mount
    if (token) {
      checkAuth();
    } else {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, checkAuth }}>
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
