
import React, { useState } from 'react';
import { Scroll, Sparkles, Shield, Mail, Lock } from 'lucide-react';
import { login, register } from '../api/auth';

const Auth = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!isLogin && formData.password !== formData.confirmPassword) {
        setError('Passwords do not match, adventurer!');
        setLoading(false);
        return;
      }

      const response = isLogin
        ? await login(formData.email, formData.password)
        : await register(formData.email, formData.password);

      localStorage.setItem('guildquest_token', response.data.accessToken);
      localStorage.setItem('guildquest_refresh_token', response.data.refreshToken);
      localStorage.setItem('guildquest_user', JSON.stringify(response.data.user));

      onAuthSuccess(response.data.user);
    } catch (err) {
      console.error('Auth error:', err);
      setError(
        err.response?.data?.error ||
          (isLogin ? 'Invalid credentials!' : 'Registration failed!')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen relative font-serif bg-my-wood flex items-center justify-center p-6">
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 text-8xl opacity-20 animate-pulse">🏰</div>
      <div className="absolute bottom-10 right-10 text-8xl opacity-20 animate-pulse">⚔️</div>
      <div className="absolute top-1/4 right-1/4 text-6xl opacity-10">🗡️</div>
      <div className="absolute bottom-1/4 left-1/4 text-6xl opacity-10">🛡️</div>

      <div className="w-full max-w-md relative z-10 px-4 sm:px-8">
        {/* Header with logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-4 mb-4">
            <Scroll className="w-16 h-16 text-[#fdf6e3] drop-shadow-2xl animate-bounce" strokeWidth={1.5} />
            <h1 className="text-6xl font-bold tracking-wide text-[#fdf6e3] drop-shadow-2xl" style={{ fontFamily: 'Georgia, serif' }}>
              GuildQuest
            </h1>
          </div>
          <p className="text-xl text-[#fdf6e3] drop-shadow-lg italic">
            {isLogin ? 'Return to your adventures...' : 'Begin your epic journey...'}
          </p>
        </div>

        {/* Main parchment card */}
        <div className="bg-[#fdf6e3] bg-paper-texture rounded-lg shadow-2xl border-4 border-[#8B5A2B] relative p-6 sm:p-8 shadow-inner">
          {/* Wax seal decoration */}
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-gradient-to-br from-red-700 to-red-900 rounded-full shadow-xl border-4 border-red-950 flex items-center justify-center text-3xl">
            {isLogin ? '🔐' : '✨'}
          </div>

          <div className="mt-4">
            <h2 className="text-3xl font-bold mb-6 pb-3 text-[#4a2e19] border-b-2 border-[#8B5A2B] text-center">
              {isLogin ? 'Guild Member Login' : 'Join the Guild'}
            </h2>

            {error && (
              <div className="mb-6 p-4 bg-red-100 border-2 border-red-700 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">⚠️</div>
                  <div>
                    <p className="text-sm font-bold text-red-900 mb-1">
                      Quest Failed!
                    </p>
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-bold mb-2 text-[#6d4423] flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-[#fffbf2] bg-paper-texture border-2 border-[#b9956f] rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] text-[#4a2e19]"
                  placeholder="adventurer@guild.com"
                  disabled={loading}
                />
              </div>

              {/* Password Field */}
              <div className="relative">
                <label className="block text-sm font-bold mb-2 text-[#6d4423] flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-[#fffbf2] bg-paper-texture border-2 border-[#b9956f] rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] text-[#4a2e19]"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-sm text-[#6d4423] hover:text-red-700"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
                {!isLogin && formData.password.length > 0 && formData.password.length < 8 && (
                  <p className="text-xs text-red-700 mt-1 italic">
                    Minimum 8 characters required
                  </p>
                )}
              </div>

              {/* Confirm Password (Register only) */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-bold mb-2 text-[#6d4423] flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 bg-[#fffbf2] bg-paper-texture border-2 border-[#b9956f] rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] text-[#4a2e19]"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-br from-red-700 to-red-900 text-yellow-50 py-4 rounded-lg font-bold shadow-xl hover:from-red-600 hover:to-red-800 transition-all border-2 border-red-950 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5 animate-spin" strokeWidth={2} />
                    {isLogin ? 'Entering Guild...' : 'Joining Guild...'}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {isLogin ? '🗝️ Enter Guild Hall' : '✨ Join the Guild'}
                  </span>
                )}
              </button>
            </form>

            {/* Toggle between Login/Register */}
            <div className="mt-6 pt-6 border-t-2 border-[#8B5A2B] text-center">
              <p className="text-sm text-[#6d4423] mb-3">
                {isLogin ? 'New to the guild?' : 'Already a member?'}
              </p>
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setFormData({ email: '', password: '', confirmPassword: '' });
                }}
                className="w-full bg-gradient-to-br from-[#8B5A2B] to-[#6d4423] text-yellow-50 py-3 rounded-lg font-semibold shadow-lg hover:from-[#6d4423] hover:to-[#5a381a] transition-all border-2 border-[#4a2e19]"
                disabled={loading}
              >
                {isLogin ? '📜 Create New Account' : '🏰 Back to Login'}
              </button>
            </div>

            {/* Decorative bottom text */}
            <div className="mt-6 text-center">
              <p className="text-xs text-[#6d4423] italic opacity-75">
                "May your quests be legendary and your rewards plentiful"
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-[#fdf6e3] drop-shadow-lg">
          <p className="text-sm opacity-75">
            Powered by the ancient magic of the Guild Masters
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;

