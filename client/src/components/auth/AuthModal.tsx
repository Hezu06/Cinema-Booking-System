import React, { useState } from 'react';
import { X, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TicketorLogo } from '../layout/TicketorLogo';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalMode, openAuthModal, login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
      }
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFullName('');
      setPhone('');
    } catch (err: any) {
      setError(err.message || 'Authentication error. Please try again.');
    } finally {
      setIsSubmitting(false);
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
                {authModalMode === 'login' ? 'Sign In' : 'Create Your Account'}
              </h2>
              <p className="text-xs text-[#8E8E9E] mt-1">
                {authModalMode === 'login'
                  ? 'Welcome back! Please enter your details'
                  : 'Start your cinematic journey with Sọt phim'}
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 text-xs text-red-400 bg-red-950/30 border border-red-800/40 rounded-xl">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {authModalMode === 'register' && (
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
                className="w-full py-3 rounded-xl bg-[#FCFC65] hover:bg-[#EAEA48] disabled:opacity-50 text-[#08080C] font-bold text-xs shadow-neon transition mt-2"
              >
                {isSubmitting
                  ? 'Please wait...'
                  : authModalMode === 'login'
                  ? 'Sign In'
                  : 'Sign Up'}
              </button>
            </form>

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
              onClick={() => {
                // Pre-fill demo customer for fast evaluation
                setEmail('customer1@example.com');
                setPassword('Customer123!');
              }}
              className="w-full py-2.5 rounded-xl bg-[#161622] hover:bg-[#1E1E2C] border border-[#282838] text-white font-medium text-xs flex items-center justify-center gap-2 transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>Continue with Google (Auto Demo)</span>
            </button>
          </div>

          {/* Switch link */}
          <div className="text-center text-xs text-[#8E8E9E]">
            {authModalMode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setShowPassword(false);
                    setShowConfirmPassword(false);
                    openAuthModal('register');
                  }}
                  className="text-white hover:text-[#FCFC65] font-semibold underline"
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
                    openAuthModal('login');
                  }}
                  className="text-white hover:text-[#FCFC65] font-semibold underline"
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
