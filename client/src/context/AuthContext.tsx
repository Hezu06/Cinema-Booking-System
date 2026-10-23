import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { api, getAuthToken, setAuthToken } from '../api/client';

export type AuthModalMode = 'login' | 'register' | 'verify' | 'forgot-password' | 'reset-password';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (payload: { fullName: string; email: string; phone: string; password: string }) => Promise<{ requireVerification?: boolean }>;
  verifyEmail: (payload: { email: string; code: string }) => Promise<void>;
  resendVerification: (email: string, force?: boolean) => Promise<string>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (payload: { email: string; code: string; newPassword: string }) => Promise<string>;
  changePassword: (payload: { currentPassword: string; newPassword: string }) => Promise<string>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
  openAuthModal: (mode?: AuthModalMode, pendingEmail?: string) => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
  authModalMode: AuthModalMode;
  unverifiedEmail: string;
  setUnverifiedEmail: (email: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('login');
  const [unverifiedEmail, setUnverifiedEmail] = useState<string>('');

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    api.getMe()
      .then((res) => {
        if (res.success && res.data) {
          setUser(res.data);
        } else {
          setAuthToken(null);
        }
      })
      .catch(() => {
        setAuthToken(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    try {
      const res = await api.login(credentials);
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Đăng nhập không thành công');
      }
      setAuthToken(res.data.accessToken);
      setUser(res.data.user);
      setIsAuthModalOpen(false);
    } catch (err: any) {
      if (err.message && err.message.includes('chưa được kích hoạt')) {
        setUnverifiedEmail(credentials.email);
      }
      throw err;
    }
  };

  const register = async (payload: { fullName: string; email: string; phone: string; password: string }) => {
    const res = await api.register(payload);
    if (!res.success) {
      throw new Error(res.message || 'Đăng ký không thành công');
    }
    setUnverifiedEmail(payload.email);
    setAuthModalMode('verify');
    return { requireVerification: true };
  };

  const verifyEmail = async (payload: { email: string; code: string }) => {
    const res = await api.verifyEmail(payload);
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Xác thực không thành công');
    }
    setAuthToken(res.data.accessToken);
    setUser(res.data.user);
    setIsAuthModalOpen(false);
  };

  const resendVerification = async (email: string, force?: boolean) => {
    const res = await api.resendVerification({ email, force });
    if (!res.success) {
      throw new Error(res.message || 'Không thể gửi lại mã xác thực');
    }
    return res.message || 'Mã xác thực mới đã được gửi tới email của bạn';
  };

  const forgotPassword = async (email: string) => {
    const res = await api.forgotPassword({ email });
    if (!res.success) {
      throw new Error(res.message || 'Không thể gửi mã đặt lại mật khẩu');
    }
    setUnverifiedEmail(email);
    setAuthModalMode('reset-password');
    return res.message || 'Mã xác thực đã được gửi tới email của bạn';
  };

  const resetPassword = async (payload: { email: string; code: string; newPassword: string }) => {
    const res = await api.resetPassword(payload);
    if (!res.success) {
      throw new Error(res.message || 'Không thể đặt lại mật khẩu');
    }
    setAuthModalMode('login');
    return res.message || 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới';
  };

  const changePassword = async (payload: { currentPassword: string; newPassword: string }) => {
    const res = await api.changePassword(payload);
    if (!res.success) {
      throw new Error(res.message || 'Đổi mật khẩu thất bại');
    }
    return res.message || 'Đổi mật khẩu thành công';
  };

  const loginWithGoogle = async (idToken: string) => {
    const res = await api.googleLogin(idToken);
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Đăng nhập bằng Google không thành công');
    }
    setAuthToken(res.data.accessToken);
    setUser(res.data.user);
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  const openAuthModal = (mode: AuthModalMode = 'login', pendingEmail?: string) => {
    setAuthModalMode(mode);
    if (pendingEmail) {
      setUnverifiedEmail(pendingEmail);
    }
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        verifyEmail,
        resendVerification,
        forgotPassword,
        resetPassword,
        changePassword,
        loginWithGoogle,
        logout,
        openAuthModal,
        closeAuthModal,
        isAuthModalOpen,
        authModalMode,
        unverifiedEmail,
        setUnverifiedEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
