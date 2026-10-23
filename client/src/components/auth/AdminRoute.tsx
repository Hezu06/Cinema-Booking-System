import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-10 h-10 border-4 border-[#FCFC65] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-[#8E8E9E]">Đang kiểm tra quyền quản trị viên...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 shadow-xl">
          <Lock size={32} />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Yêu Cầu Đăng Nhập</h2>
        <p className="text-sm text-[#8E8E9E] max-w-md mb-6">
          Khu vực này yêu cầu đăng nhập tài khoản Quản trị viên (ADMIN) để truy cập và vận hành hệ thống.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FCFC65] hover:bg-[#EAEA48] text-[#08080C] font-bold text-xs shadow-neon transition"
        >
          <Home size={16} />
          <span>Về trang chủ</span>
        </Link>
      </div>
    );
  }

  if (user.role !== 'ADMIN') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-6 shadow-xl">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Truy Cập Bị Từ Chối (403)</h2>
        <p className="text-sm text-[#8E8E9E] max-w-md mb-6">
          Tài khoản <strong>{user.email}</strong> không có vai trò Quản trị viên (ADMIN). Vui lòng đăng nhập bằng tài khoản Quản trị cấp cao để tiếp tục.
        </p>
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#2E2E3E] text-xs font-semibold text-gray-300 hover:text-white hover:bg-[#1A1A26] transition"
          >
            <ArrowLeft size={14} />
            <span>Quay lại</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FCFC65] hover:bg-[#EAEA48] text-[#08080C] font-bold text-xs shadow-neon transition"
          >
            <Home size={14} />
            <span>Về trang chủ</span>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
