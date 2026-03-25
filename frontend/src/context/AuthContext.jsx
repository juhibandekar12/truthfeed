import { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('truthfeed_token'));
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user && !!token;
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchUser() {
    try {
      const response = await api.getMe();
      setUser(response.data);
    } catch (err) {
      console.error('Failed to fetch user:', err);
      localStorage.removeItem('truthfeed_token');
      localStorage.removeItem('truthfeed_user');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function loginUser(email, password) {
    const response = await api.login(email, password);
    const { access_token } = response.data;
    localStorage.setItem('truthfeed_token', access_token);
    setToken(access_token);
    const meResponse = await api.getMe();
    setUser(meResponse.data);
    return meResponse.data;
  }

  async function signupUser(username, email, password) {
    const response = await api.signup(username, email, password);
    const { access_token } = response.data;
    localStorage.setItem('truthfeed_token', access_token);
    setToken(access_token);
    const meResponse = await api.getMe();
    setUser(meResponse.data);
    return meResponse.data;
  }

  function logoutUser() {
    localStorage.removeItem('truthfeed_token');
    localStorage.removeItem('truthfeed_user');
    setToken(null);
    setUser(null);
  }

  const value = {
    user,
    token,
    isAuthenticated,
    isAdmin,
    loading,
    login: loginUser,
    signup: signupUser,
    logout: logoutUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
