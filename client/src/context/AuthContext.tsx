import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { User } from '@shared/types';

interface AuthContextType {
  user: User | null;
  agentId: number | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  agentId: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [agentId, setAgentId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, navigate] = useLocation();

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const storedAgentId = localStorage.getItem('agentId');

      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setAgentId(storedAgentId ? parseInt(storedAgentId) : null);
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      
      // Save user data
      setUser(data.user);
      setAgentId(data.agentId || null);
      
      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.agentId) {
        localStorage.setItem('agentId', data.agentId.toString());
      }
      
      // Redirect to dashboard
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setAgentId(null);
    localStorage.removeItem('user');
    localStorage.removeItem('agentId');
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        agentId,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);