import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('ats_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('ats_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      if (token) {
        try {
          const res = await axiosClient.get('/auth/me');
          setUser(res.data.user);
          localStorage.setItem('ats_user', JSON.stringify(res.data.user));
        } catch (err) {
          console.error('Token verification failed:', err);
          logout();
        }
      }
      setLoading(false);
    };
    verifyAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await axiosClient.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = res.data;
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('ats_token', newToken);
    localStorage.setItem('ats_user', JSON.stringify(userData));
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await axiosClient.post('/auth/register', { name, email, password });
    const { token: newToken, user: userData } = res.data;
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('ats_token', newToken);
    localStorage.setItem('ats_user', JSON.stringify(userData));
    return res.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ats_token');
    localStorage.removeItem('ats_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated: !!token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
