import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null = checking, false = not authenticated
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        withCredentials: true
      });
      setUser(response.data);
    } catch (error) {
      setUser(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/api/auth/login`, 
      { email, password },
      { withCredentials: true }
    );
    setUser(response.data);
    return response.data;
  };

  const register = async (name, email, password) => {
    const response = await axios.post(`${API_URL}/api/auth/register`,
      { name, email, password },
      { withCredentials: true }
    );
    setUser(response.data);
    return response.data;
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(false);
  };

  const refreshToken = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true });
      await checkAuth();
    } catch (error) {
      setUser(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      refreshToken,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
