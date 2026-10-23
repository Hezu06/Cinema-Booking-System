import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Eye, EyeOff, MailCheck, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TicketorLogo } from '../layout/TicketorLogo';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    openAuthModal,
    login,
    register,
    verifyEmail,
    resendVerification,
    loginWithGoogle,
    unverifiedEmail,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Verification state
  const [otpCode, setOtpCode] = useState('');
  const [resendCountdown, setResendCountdown] = useState(60);
  const [expiresCountdown, setExpiresCountdown] = useState(15 * 60);

  const googleClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '1095220108760-2q38fpnb60jaciqhe5i28co78eupi1ul.apps.googleusercontent.com';

  // Format seconds to mm:ss
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Reset countdowns when entering verify mode
  useEffect(() => {
    if (authModalMode === 'verify') {
      setExpiresCountdown(15 * 60);
      setResendCountdown(60);
      setExpiresCountdown(15 * 60);
    }
  }, [authModalMode]);

  // Countdown timer for 15-minute OTP expiration
  useEffect(() => {
    if (authModalMode !== 'verify' || expiresCountdown <= 0) return;
    const interval = setInterval(() => {
      setExpiresCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [authModalMode, expiresCountdown]);

  // Countdown timer for resending OTP
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const interval = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCountdown]);

  if (!isAuthModalOpen) return null;

  const targetEmail = unverifiedEmail || email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (authModalMode === 'verify') {
      if (otpCode.length !== 6) {
        setError('Vui lòng nhập đủ 6 chữ số mã xác thực.');
        return;
      }
      setIsSubmitting(true);
      try {
        await verifyEmail({ email: targetEmail, code: otpCode });
        setOtpCode('');
      } catch (err: any) {
        setError(err.message || 'Mã xác thực không hợp lệ.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (authModalMode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (authModalMode === 'login') {
        await login({ email, password });
      } else {
        await register({ fullName, email, phone: phone || '0900000000', password });
        setResendCountdown(60);
      setExpiresCountdown(15 * 60);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if ((resendCountdown > 0 && expiresCountdown > 0) || isResending) return;
    setError(null);
    setSuccessMessage(null);
    setIsResending(true);
    try {
      const msg = await resendVerification(targetEmail);
      setSuccessMessage(msg);
      setResendCountdown(60);
      setExpiresCountdown(15 * 60);
    } catch (err: any) {
      setError(err.message || 'Không thể gửi lại mã xác thực.');
    } finally {
      setIsResending(false);
    }
  };

  const handleGoogleClick = () => {
    setError(null);
    const g = (window as any).google;

    if (googleClientId && g?.accounts?.oauth2) {
      try {
        const tokenClient = g.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'openid email profile',
          callback: async (response: { access_token?: string; error?: string }) => {
            if (response.error) {
              setError(`Google Sign-In: ${response.error}`);
              return;
            }
            if (response.access_token) {
              try {
                setIsSubmitting(true);
                setError(null);
                await loginWithGoogle(response.access_token);
              } catch (err: any) {
                setError(err.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.');
              } finally {
                setIsSubmitting(false);
              }
            }
          },
          error_callback: (err: any) => {
            setIsSubmitting(false);
            if (err?.type !== 'popup_closed') {
              setError(err?.message || 'Đăng nhập Google bị gián đoạn.');
            }
          },
        });
        tokenClient.requestAccessToken();
      } catch (err: any) {
        setError(err.message || 'Không thể khởi tạo đăng nhập Google.');
      }
    } else {
      // Fallback for development/testing when Google Client ID is not configured or SDK unavailable
      setIsSubmitting(true);
      loginWithGoogle('demo_google_token')
        .catch((err: any) => {
          setError(err.message || 'Đăng nhập bằng Google thất bại.');
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      {/* Modal Container: Split View (Figma SignUp screen) */}
      <div className="relative w-full max-w-4xl bg-[#101016] border border-[#262636] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        {/* Close Button */}
        <button
          onClick={() => {
            setShowPassword(false);
            setShowConfirmPassword(false);
            setError(null);
            setSuccessMessage(null);
            closeAuthModal();
          }}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-white hover:text-black flex items-center justify-center text-[#8E8E9E] transition"
        >
          <X size={16} />
        </button>

        {/* 1. LEFT HALF: Auth Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-10 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <TicketorLogo size="md" />

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {authModalMode === 'verify'
                  ? 'Verify Your Email'
                  : authModalMode === 'login'
                  ? 'Sign In'
                  : 'Create Your Account'}
              </h2>
              <p className="text-xs text-[#8E8E9E] mt-1">
                {authModalMode === 'verify'
                  ? `Nhập mã xác thực 6 số gửi tới ${targetEmail}`
                  : authModalMode === 'login'
                  ? 'Welcome back! Please enter your details'
                  : 'Start your cinematic journey with Sọt phim'}
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 text-xs text-red-400 bg-red-950/30 border border-red-800/40 rounded-xl">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{error}</span>
                  {error.includes('chưa được kích hoạt') && (
                    <button
                      type="button"
                      onClick={async () => {
                        const target = unverifiedEmail || email;
                        setError(null);
                        setSuccessMessage('Đang tạo và gửi mã xác thực mới đến email...');
                        openAuthModal('verify', target);
                        try {
                          const msg = await resendVerification(target, true);
                          setSuccessMessage(msg);
                          setResendCountdown(60);
                          setExpiresCountdown(15 * 60);
                        } catch (err: any) {
                          setError(err.message || 'Không thể gửi lại mã xác thực.');
                        }
                      }}
                      className="ml-2 underline font-bold text-[#FCFC65] hover:text-white cursor-pointer"
                    >
                      Xác thực ngay
                    </button>
                  )}
                </div>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-2 p-3 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 rounded-xl">
                <MailCheck size={15} className="shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {authModalMode === 'verify' ? (
              /* OTP VERIFICATION FORM */
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <label className="text-[11px] text-[#8E8E9E]">
                      Mã xác thực (OTP Code)
                    </label>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Clock size={12} className={expiresCountdown > 60 ? "text-[#FCFC65]" : "text-red-400 animate-pulse"} />
                      <span className="text-[#8E8E9E]">Mã hết hạn sau:</span>
                      <span className={`font-mono font-bold ${expiresCountdown > 60 ? "text-[#FCFC65]" : "text-red-400"}`}>
                        {formatTime(expiresCountdown)}
                      </span>
                    </div>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full bg-[#181824] border border-[#282838] rounded-xl px-4 py-3 text-center text-2xl font-bold font-mono tracking-[0.4em] text-[#FCFC65] placeholder-[#404050] focus:outline-none focus:border-[#FCFC65]"
                  />
                  {expiresCountdown > 0 ? (
                    <p className="text-[11px] text-[#656578] text-center mt-2">
                      Mã có hiệu lực trong vòng 15 phút. Vui lòng kiểm tra hộp thư (hoặc mục Spam).
                    </p>
                  ) : (
                    <p className="text-[11px] text-red-400 font-medium text-center mt-2 flex items-center justify-center gap-1">
                      <AlertCircle size={13} />
                      Mã xác thực 15 phút đã hết hạn. Vui lòng bấm "Gửi lại mã" bên dưới.
                    </p>
                  )}
                </div>

                {/* Submit OTP */}
                <button
                  type="submit"
                  disabled={isSubmitting || otpCode.length !== 6 || expiresCountdown === 0}
                  className="w-full py-3 rounded-xl bg-[#FCFC65] hover:bg-[#EAEA48] disabled:opacity-50 text-[#08080C] font-bold text-xs shadow-neon transition cursor-pointer"
                >
                  {isSubmitting ? 'Đang xác thực...' : 'Xác thực & Đăng nhập'}
                </button>

                {/* Resend OTP */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isResending || isSubmitting || (resendCountdown > 0 && expiresCountdown > 0)}
                    className="text-xs text-[#8E8E9E] hover:text-white disabled:opacity-50 transition cursor-pointer inline-flex items-center justify-center gap-1.5"
                  >
                    {isResending ? (
                      <span className="text-[#FCFC65] animate-pulse">Đang gửi lại mã mới...</span>
                    ) : resendCountdown > 0 && expiresCountdown > 0 ? (
                      <>
                        <span>Gửi lại mã sau</span>
                        <span className="font-mono text-[#FCFC65] font-semibold">{resendCountdown}s</span>
                      </>
                    ) : (
                      'Không nhận được mã? Gửi lại mã'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* LOGIN & REGISTER FORM */
              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                {authModalMode === 'register' && (
                  <>
                    <div>
                      <label className="block text-[11px] text-[#8E8E9E] mb-1">Username / Full Name</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Luna Caldwell"
                        className="w-full bg-[#181824] border border-[#282838] rounded-xl px-3.5 py-2.5 text-white placeholder-[#505064] focus:outline-none focus:border-[#FCFC65]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#8E8E9E] mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0987654321"
                        className="w-full bg-[#181824] border border-[#282838] rounded-xl px-3.5 py-2.5 text-white placeholder-[#505064] focus:outline-none focus:border-[#FCFC65]"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[11px] text-[#8E8E9E] mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="L.caldwell@gmail.com"
                    className="w-full bg-[#181824] border border-[#282838] rounded-xl px-3.5 py-2.5 text-white placeholder-[#505064] focus:outline-none focus:border-[#FCFC65]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#8E8E9E] mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#181824] border border-[#282838] rounded-xl px-3.5 py-2.5 pr-10 text-white placeholder-[#505064] focus:outline-none focus:border-[#FCFC65]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8E8E9E] hover:text-white transition focus:outline-none"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {authModalMode === 'register' && (
                  <div>
                    <label className="block text-[11px] text-[#8E8E9E] mb-1">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#181824] border border-[#282838] rounded-xl px-3.5 py-2.5 pr-10 text-white placeholder-[#505064] focus:outline-none focus:border-[#FCFC65]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8E8E9E] hover:text-white transition focus:outline-none"
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Remember me & Forgot Password */}
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <label className="flex items-center gap-2 cursor-pointer text-[#8E8E9E]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="accent-[#FCFC65] rounded"
                    />
                    <span>Remember me</span>
                  </label>

                  {authModalMode === 'login' && (
                    <button type="button" className="text-[#8E8E9E] hover:text-white">
                      Forgot your password?
                    </button>
                  )}
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-[#FCFC65] hover:bg-[#EAEA48] disabled:opacity-50 text-[#08080C] font-bold text-xs shadow-neon transition mt-2 cursor-pointer"
                >
                  {isSubmitting
                    ? 'Please wait...'
                    : authModalMode === 'login'
                    ? 'Sign In'
                    : 'Sign Up'}
                </button>
              </form>
            )}

            {authModalMode !== 'verify' && (
              <>
                {/* Divider OR */}
                <div className="relative text-center my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#20202E]" />
                  </div>
                  <span className="relative px-3 bg-[#101016] text-[10px] uppercase font-bold text-[#656578]">
                    OR
                  </span>
                </div>

                {/* Google OAuth Button */}
                <button
                  type="button"
                  onClick={handleGoogleClick}
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-[#161622] hover:bg-[#1E1E2C] border border-[#282838] text-white font-medium text-xs flex items-center justify-center gap-2.5 transition cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
                    />
                  </svg>
                  <span>
                    {isSubmitting
                      ? 'Connecting to Google...'
                      : googleClientId
                      ? 'Continue with Google'
                      : 'Continue with Google (1-Click / Demo)'}
                  </span>
                </button>
              </>
            )}
          </div>

          {/* Switch link */}
          <div className="text-center text-xs text-[#8E8E9E]">
            {authModalMode === 'verify' ? (
              <>
                Muốn đổi tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMessage(null);
                    openAuthModal('login');
                  }}
                  className="text-white hover:text-[#FCFC65] font-semibold underline cursor-pointer"
                >
                  Quay lại đăng nhập
                </button>
              </>
            ) : authModalMode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setShowPassword(false);
                    setShowConfirmPassword(false);
                    setError(null);
                    setSuccessMessage(null);
                    openAuthModal('register');
                  }}
                  className="text-white hover:text-[#FCFC65] font-semibold underline cursor-pointer"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setShowPassword(false);
                    setShowConfirmPassword(false);
                    setError(null);
                    setSuccessMessage(null);
                    openAuthModal('login');
                  }}
                  className="text-white hover:text-[#FCFC65] font-semibold underline cursor-pointer"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>

        {/* 2. RIGHT HALF: Cinematic Popcorn Spectator Image (Figma SignUp) */}
        <div className="hidden md:block md:w-1/2 relative bg-[#0A0A0F] overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1000&auto=format&fit=crop&q=80"
            alt="Cinema spectator"
            className="w-full h-full object-cover brightness-80"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#101016] via-transparent to-transparent" />
        </div>
      </div>
    </div>
  );
};
