import React, { createContext, useContext, useState, useEffect } from 'react';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' or 'register'
  const [loading, setLoading] = useState(false);

  // Sync token & user state to localStorage
  const saveAuthData = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    if (newToken) {
      localStorage.setItem('token', newToken);
    } else {
      localStorage.removeItem('token');
    }
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('user');
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await request.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
      if (res.success && res.data) {
        saveAuthData(res.data.token, res.data.user);
        toast.success(res.message || `Selamat datang, ${res.data.user.name}!`);
        setAuthModalOpen(false);
        return { success: true, user: res.data.user };
      }
      return { success: false, message: res.message || 'Login gagal' };
    } catch (err) {
      const msg = err.customMessage || err.message || 'Gagal melakukan login. Periksa email & password Anda.';
      toast.error(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ name, email, phone, password }) => {
    setLoading(true);
    try {
      const res = await request.post(API_ENDPOINTS.AUTH.REGISTER, { name, email, phone, password });
      if (res.success && res.data) {
        saveAuthData(res.data.token, res.data.user);
        toast.success(res.message || 'Akun berhasil dibuat!');
        setAuthModalOpen(false);
        return { success: true, user: res.data.user };
      }
      return { success: false, message: res.message || 'Pendaftaran gagal' };
    } catch (err) {
      const msg = err.customMessage || err.message || 'Gagal mendaftarkan akun.';
      toast.error(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    saveAuthData(null, null);
    toast.success('Anda telah berhasil keluar (logout)');
  };

  const openAuthModal = (mode = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'admin',
        loading,
        login,
        register,
        logout,
        authModalOpen,
        authModalMode,
        setAuthModalMode,
        openAuthModal,
        closeAuthModal,
      }}
    >
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
